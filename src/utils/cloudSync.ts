/**
 * Synchronisation des données familiales avec Firestore.
 *
 * Principe (volontairement simple) :
 *  - chaque type de données (événements, notes, plannings…) est un document
 *    families/ntahub/data/{clé} qui contient le même JSON que le localStorage ;
 *  - le localStorage sert de cache : l'appli démarre instantanément, même hors ligne ;
 *  - chaque sauvegarde est envoyée au cloud, et les modifications faites sur
 *    l'autre téléphone arrivent en temps réel via onSnapshot.
 */
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, Unsubscribe } from 'firebase/firestore';
import { auth, db, FAMILY_ID } from '../firebase';
import {
  AppSettings,
  PncDayDuty,
  IreneDayOverride,
  ChildActivity,
  FamilyEvent,
  AppNotification,
  QuickNote,
} from '../types';
import {
  SharedDataKey,
  SHARED_STORAGE_KEYS,
  SAMPLE_ITEM_IDS,
  parseSettings,
  parseMap,
  parseQuickNotes,
  getSamplePncDuties,
  getSampleIreneOverrides,
} from './storage';

// Mémorise, pour cet appareil, que ses anciennes données locales ont déjà été envoyées dans le cloud.
const STORAGE_KEY_MIGRATED = 'ntahub_cloud_migrated_v1';

// Fonction (et non constante) : storage.ts et ce fichier s'importent mutuellement.
const sharedKeys = () => Object.keys(SHARED_STORAGE_KEYS) as SharedDataKey[];

let cloudActive = false;

function sharedDocRef(key: SharedDataKey) {
  return doc(db!, 'families', FAMILY_ID, 'data', key);
}

export function pushSharedData(key: SharedDataKey, json: string): void {
  if (!cloudActive || !db) return;
  setDoc(sharedDocRef(key), {
    json,
    updatedAt: serverTimestamp(),
    updatedBy: auth?.currentUser?.email ?? null,
  }).catch((err) => console.error(`[NTAHUB] Échec de l'envoi de "${key}" vers le cloud`, err));
}

// Le mode sombre reste un choix propre à chaque téléphone.
function keepLocalDarkMode(remoteJson: string): string {
  const localRaw = localStorage.getItem(SHARED_STORAGE_KEYS.settings);
  if (!localRaw) return remoteJson;
  try {
    const localDark = (JSON.parse(localRaw) as AppSettings).darkMode;
    return JSON.stringify({ ...JSON.parse(remoteJson), darkMode: localDark });
  } catch {
    return remoteJson;
  }
}

function mergeLists(localJson: string, remoteJson: string): string {
  const remote: { id: string }[] = JSON.parse(remoteJson);
  const local: { id: string }[] = JSON.parse(localJson);
  const remoteIds = new Set(remote.map((item) => item.id));
  const extras = local.filter((item) => !SAMPLE_ITEM_IDS.has(item.id) && !remoteIds.has(item.id));
  return JSON.stringify([...remote, ...extras]);
}

function mergeMaps(localJson: string, remoteJson: string, sample: Map<string, unknown>): string {
  const remote: Record<string, unknown> = JSON.parse(remoteJson);
  const local: Record<string, unknown> = JSON.parse(localJson);
  const isSample = (date: string, value: unknown) =>
    sample.has(date) && JSON.stringify(sample.get(date)) === JSON.stringify(value);

  const merged = { ...remote };
  for (const [date, value] of Object.entries(local)) {
    if (isSample(date, value)) continue;
    if (!(date in remote) || isSample(date, remote[date])) merged[date] = value;
  }
  return JSON.stringify(merged);
}

// Fusionne les données d'avant la synchronisation avec celles déjà présentes dans le cloud.
// Les données du cloud sont prioritaires ; les exemples fournis avec l'appli sont ignorés.
export function mergeLocalIntoRemote(key: SharedDataKey, localJson: string, remoteJson: string): string {
  switch (key) {
    case 'settings':
      return remoteJson;
    case 'pncDuties':
      return mergeMaps(localJson, remoteJson, getSamplePncDuties());
    case 'ireneOverrides':
      return mergeMaps(localJson, remoteJson, getSampleIreneOverrides());
    default:
      return mergeLists(localJson, remoteJson);
  }
}

export class NotAuthorizedError extends Error {}

/**
 * À appeler juste après la connexion, avant d'afficher l'appli :
 * récupère les données du cloud dans le localStorage et, au premier lancement
 * sur cet appareil, envoie les données locales existantes dans le cloud.
 */
export async function syncLocalDataWithCloud(): Promise<void> {
  if (!db) return;
  const alreadyMigrated = localStorage.getItem(STORAGE_KEY_MIGRATED) === 'yes';
  cloudActive = true;

  try {
    await Promise.all(
      sharedKeys().map(async (key) => {
        const storageKey = SHARED_STORAGE_KEYS[key];
        const localJson = localStorage.getItem(storageKey);
        const snap = await getDoc(sharedDocRef(key));

        if (!snap.exists()) {
          // Premier appareil connecté : ses données deviennent les données de la famille.
          if (localJson) pushSharedData(key, localJson);
          return;
        }

        const remoteJson: string = snap.data().json;
        let finalJson = remoteJson;
        if (!alreadyMigrated && localJson) {
          finalJson = mergeLocalIntoRemote(key, localJson, remoteJson);
          if (finalJson !== remoteJson) {
            pushSharedData(key, finalJson);
          }
        }
        localStorage.setItem(storageKey, key === 'settings' ? keepLocalDarkMode(finalJson) : finalJson);
      })
    );
    localStorage.setItem(STORAGE_KEY_MIGRATED, 'yes');
  } catch (err: any) {
    if (err?.code === 'permission-denied') {
      cloudActive = false;
      throw new NotAuthorizedError();
    }
    // Hors ligne au démarrage : on continue avec les données de l'appareil,
    // Firestore enverra les modifications dès le retour du réseau.
    console.warn('[NTAHUB] Synchronisation initiale impossible, utilisation des données locales', err);
  }
}

export function stopCloudSync(): void {
  cloudActive = false;
}

export interface SharedDataHandlers {
  onSettings: (settings: AppSettings) => void;
  onPncDuties: (duties: Map<string, PncDayDuty>) => void;
  onIreneOverrides: (overrides: Map<string, IreneDayOverride>) => void;
  onChildActivities: (activities: ChildActivity[]) => void;
  onFamilyEvents: (events: FamilyEvent[]) => void;
  onNotifications: (notifs: AppNotification[]) => void;
  onQuickNotes: (notes: QuickNote[]) => void;
}

/**
 * Écoute en temps réel les modifications faites sur l'autre téléphone.
 * Renvoie une fonction pour arrêter l'écoute.
 */
export function subscribeToSharedData(handlers: SharedDataHandlers): Unsubscribe {
  if (!db || !cloudActive) return () => {};

  const apply: Record<SharedDataKey, (json: string) => void> = {
    settings: (json) => handlers.onSettings(parseSettings(json)),
    pncDuties: (json) => handlers.onPncDuties(parseMap<PncDayDuty>(json)),
    ireneOverrides: (json) => handlers.onIreneOverrides(parseMap<IreneDayOverride>(json)),
    childActivities: (json) => handlers.onChildActivities(JSON.parse(json)),
    familyEvents: (json) => handlers.onFamilyEvents(JSON.parse(json)),
    notifications: (json) => handlers.onNotifications(JSON.parse(json)),
    quickNotes: (json) => handlers.onQuickNotes(parseQuickNotes(json)),
  };

  const unsubscribers = sharedKeys().map((key) =>
    onSnapshot(
      sharedDocRef(key),
      (snap) => {
        // Ignore l'écho de nos propres sauvegardes pas encore confirmées par le serveur.
        if (!snap.exists() || snap.metadata.hasPendingWrites) return;
        const storageKey = SHARED_STORAGE_KEYS[key];
        let json: string = snap.data().json;
        if (key === 'settings') json = keepLocalDarkMode(json);
        if (json === localStorage.getItem(storageKey)) return;
        localStorage.setItem(storageKey, json);
        try {
          apply[key](json);
        } catch (err) {
          console.error(`[NTAHUB] Données "${key}" reçues illisibles`, err);
        }
      },
      (err) => console.error(`[NTAHUB] Écoute de "${key}" interrompue`, err)
    )
  );

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}
