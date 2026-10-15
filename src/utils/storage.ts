import {
  PncDayDuty,
  IreneDayOverride,
  ChildActivity,
  FamilyEvent,
  AppNotification,
  UserProfile,
  AppSettings,
  DEFAULT_SETTINGS,
  QuickNote,
} from '../types';
import { parseIcsString, processPncEvents, generateSamplePncIcs } from './icsParser';
import { pushSharedData } from './cloudSync';

const STORAGE_KEY_PNC = 'ntahub_pnc_duties_v1';
const STORAGE_KEY_IRENE = 'ntahub_irene_overrides_v1';
const STORAGE_KEY_ACTIVITIES = 'ntahub_child_activities_v1';
const STORAGE_KEY_EVENTS = 'ntahub_family_events_v1';
const STORAGE_KEY_NOTIFS = 'ntahub_notifications_v1';
const STORAGE_KEY_USER = 'ntahub_active_user_v1';
const STORAGE_KEY_SETTINGS = 'ntahub_settings_v1';
const STORAGE_KEY_QUICK_NOTES = 'ntahub_quick_notes_v1';

/**
 * Données partagées entre les deux téléphones (synchronisées via Firebase).
 * Le profil actif (Clément / Irène) reste propre à chaque appareil.
 */
export type SharedDataKey =
  | 'settings'
  | 'pncDuties'
  | 'ireneOverrides'
  | 'childActivities'
  | 'familyEvents'
  | 'notifications'
  | 'quickNotes';

export const SHARED_STORAGE_KEYS: Record<SharedDataKey, string> = {
  settings: STORAGE_KEY_SETTINGS,
  pncDuties: STORAGE_KEY_PNC,
  ireneOverrides: STORAGE_KEY_IRENE,
  childActivities: STORAGE_KEY_ACTIVITIES,
  familyEvents: STORAGE_KEY_EVENTS,
  notifications: STORAGE_KEY_NOTIFS,
  quickNotes: STORAGE_KEY_QUICK_NOTES,
};

// Enregistre dans le localStorage (cache de l'appareil) puis envoie au cloud si la synchro est active.
function persist(key: SharedDataKey, value: unknown): void {
  const json = JSON.stringify(value);
  localStorage.setItem(SHARED_STORAGE_KEYS[key], json);
  pushSharedData(key, json);
}

export function parseSettings(raw: string): AppSettings {
  return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
}

export function parseMap<T>(raw: string): Map<string, T> {
  return new Map(Object.entries(JSON.parse(raw)));
}

export function parseQuickNotes(raw: string): QuickNote[] {
  const parsed: QuickNote[] = JSON.parse(raw);
  return parsed.map((n) => ({
    ...n,
    likes: Array.isArray(n.likes) ? n.likes : [],
  }));
}

// Identifiants des données d'exemple : ignorés lors de la fusion des données locales avec le cloud.
export const SAMPLE_ITEM_IDS = new Set([
  'evt-1',
  'evt-2',
  'evt-3',
  'notif-1',
  'notif-2',
  'notif-3',
  'note-1',
  'note-2',
  'note-3',
  'act-imanzi-judo',
  'act-imanzi-musique',
  'act-ishema-danse',
  'act-ishema-natation',
]);

export function getSamplePncDuties(): Map<string, PncDayDuty> {
  return processPncEvents(parseIcsString(generateSamplePncIcs()));
}

export function getSampleIreneOverrides(): Map<string, IreneDayOverride> {
  const initial = new Map<string, IreneDayOverride>();
  initial.set('2026-10-13', { date: '2026-10-13', status: 'tt', notes: 'Télétravail à la maison' });
  initial.set('2026-10-15', { date: '2026-10-15', status: 'tt', notes: 'Télétravail réunion visio' });
  initial.set('2026-10-19', { date: '2026-10-19', status: 'rtt', notes: 'Journée RTT posée' });
  initial.set('2026-10-27', { date: '2026-10-27', status: 'cp', notes: 'Congé d’automne' });
  return initial;
}

export function getInitialSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      return parseSettings(raw);
    }
  } catch (err) {
    console.error('Failed to parse settings', err);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    persist('settings', settings);
  } catch (err) {
    console.error('Failed to save settings', err);
  }
}

export function getInitialActiveUser(): UserProfile {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    if (saved === 'Irène') return 'Irène';
    return 'Clément';
  } catch {
    return 'Clément';
  }
}

export function saveActiveUser(user: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY_USER, user);
  } catch (err) {
    console.error('Storage error', err);
  }
}

export function getInitialPncDuties(): Map<string, PncDayDuty> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PNC);
    if (raw) {
      return parseMap<PncDayDuty>(raw);
    }
  } catch (err) {
    console.error('Failed to parse stored PNC duties', err);
  }

  // Fallback to sample roster
  const duties = getSamplePncDuties();
  savePncDuties(duties);
  return duties;
}

export function savePncDuties(duties: Map<string, PncDayDuty>): void {
  try {
    persist('pncDuties', Object.fromEntries(duties.entries()));
  } catch (err) {
    console.error('Failed to save PNC duties', err);
  }
}

export function getInitialIreneOverrides(): Map<string, IreneDayOverride> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_IRENE);
    if (raw) {
      return parseMap<IreneDayOverride>(raw);
    }
  } catch (err) {
    console.error('Failed to parse Irene overrides', err);
  }

  // Preload a few sample days for Irène (e.g. TT on Tuesday, CP on Friday)
  const initial = getSampleIreneOverrides();
  saveIreneOverrides(initial);
  return initial;
}

export function saveIreneOverrides(overrides: Map<string, IreneDayOverride>): void {
  try {
    persist('ireneOverrides', Object.fromEntries(overrides.entries()));
  } catch (err) {
    console.error('Failed to save Irene overrides', err);
  }
}

export function getInitialChildActivities(): ChildActivity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to parse child activities', err);
  }

  const initialActivities: ChildActivity[] = [
    {
      id: 'act-imanzi-judo',
      childName: 'Imanzi',
      activityName: 'Judo & Éveil sportif',
      dayOfWeek: 3, // Mercredi
      startTime: '14:00',
      endTime: '15:30',
      color: '#E11D48', // Rose vif
      location: 'Dojo Municipal',
      notes: 'Prévoir le kimono et la gourde.',
    },
    {
      id: 'act-imanzi-musique',
      childName: 'Imanzi',
      activityName: 'Musique & Solfège',
      dayOfWeek: 6, // Samedi
      startTime: '10:00',
      endTime: '11:15',
      color: '#E11D48',
      location: 'Conservatoire',
      notes: 'Cahier de partitions.',
    },
    {
      id: 'act-ishema-danse',
      childName: 'Ishema',
      activityName: 'Danse & Expression corporelle',
      dayOfWeek: 3, // Mercredi
      startTime: '15:45',
      endTime: '17:00',
      color: '#7C3AED', // Violet
      location: 'Salle Polyvalente',
      notes: 'Justaucorps et chaussons.',
    },
    {
      id: 'act-ishema-natation',
      childName: 'Ishema',
      activityName: 'Natation enfants',
      dayOfWeek: 5, // Vendredi
      startTime: '17:15',
      endTime: '18:30',
      color: '#7C3AED',
      location: 'Centre Aquatique',
      notes: 'Bonnet obligatoire. Attention : vendredi fin d’après-midi !',
    },
  ];

  saveChildActivities(initialActivities);
  return initialActivities;
}

export function saveChildActivities(activities: ChildActivity[]): void {
  try {
    persist('childActivities', activities);
  } catch (err) {
    console.error('Failed to save child activities', err);
  }
}

export function getInitialFamilyEvents(): FamilyEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EVENTS);
    if (raw) {
      const parsed: FamilyEvent[] = JSON.parse(raw);
      // Migrate initial events if needed
      return parsed.map((e) => {
        if (!e.assignedTo) {
          if (e.id === 'evt-1') return { ...e, assignedTo: 'Irène' };
          if (e.id === 'evt-2') return { ...e, assignedTo: 'Les deux' };
          if (e.id === 'evt-3') return { ...e, assignedTo: 'Clément' };
        }
        return e;
      });
    }
  } catch (err) {
    console.error('Failed to parse family events', err);
  }

  const initialEvents: FamilyEvent[] = [
    {
      id: 'evt-1',
      category: 'rdv médical',
      target: 'Imanzi',
      customTitle: 'Visite pédiatre & vaccins',
      date: '2026-10-14',
      startTime: '17:30',
      endTime: '18:15',
      assignedTo: 'Irène',
      notifySpouse: true,
      reminderMinutes: 30,
      createdBy: 'Irène',
      createdAt: '2026-10-10T10:00:00Z',
      notes: 'Carnet de santé dans le sac bleu.',
    },
    {
      id: 'evt-2',
      category: 'invités',
      target: 'toute la famille',
      customTitle: 'Dîner parrains & amis',
      date: '2026-10-17',
      startTime: '19:30',
      endTime: '23:00',
      assignedTo: 'Les deux',
      notifySpouse: true,
      reminderMinutes: 60,
      createdBy: 'Clément',
      createdAt: '2026-10-11T12:00:00Z',
      notes: 'Clément sera rentré le matin à 10h00.',
    },
    {
      id: 'evt-3',
      category: 'courses',
      target: 'toute la famille',
      customTitle: 'Grosses courses de la semaine',
      date: '2026-10-18',
      startTime: '10:30',
      endTime: '12:00',
      assignedTo: 'Clément',
      notifySpouse: false,
      reminderMinutes: 15,
      createdBy: 'Clément',
      createdAt: '2026-10-11T13:00:00Z',
      notes: 'Bio c’bon + marché frais.',
    },
  ];

  saveFamilyEvents(initialEvents);
  return initialEvents;
}

export function saveFamilyEvents(events: FamilyEvent[]): void {
  try {
    persist('familyEvents', events);
  } catch (err) {
    console.error('Failed to save family events', err);
  }
}

export function getInitialNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to parse notifications', err);
  }

  const initialNotifs: AppNotification[] = [
    {
      id: 'notif-1',
      sender: 'Clément',
      recipient: 'Irène',
      title: 'Planning PNC d’Octobre synchronisé',
      message: 'J’ai importé mon fichier ICS avec les vols ORY, le découcher FDF et le cours au sol CS_CSS.',
      timestamp: '2026-10-11 14:30',
      isRead: false,
      relatedDate: '2026-10-12',
    },
    {
      id: 'notif-2',
      sender: 'Irène',
      recipient: 'Clément',
      title: 'RDV Médical Imanzi ajouté',
      message: 'RDV Pédiatre calé le 14 octobre à 17h30. Tu seras en vol aller pour les Antilles, je m’en occupe.',
      timestamp: '2026-10-11 16:15',
      isRead: false,
      relatedDate: '2026-10-14',
    },
    {
      id: 'notif-3',
      sender: 'Clément',
      recipient: 'Irène',
      title: 'Alerte Relais Enfants Vendredi 23',
      message: 'Activité piscine d’Ishema à 17h15 : je suis en vol Rome et toi en trajet bureau ! Un relais est requis ❓',
      timestamp: '2026-10-11 17:00',
      isRead: false,
      relatedDate: '2026-10-23',
    },
  ];

  saveNotifications(initialNotifs);
  return initialNotifs;
}

export function saveNotifications(notifs: AppNotification[]): void {
  try {
    persist('notifications', notifs);
  } catch (err) {
    console.error('Failed to save notifications', err);
  }
}

export function getInitialQuickNotes(): QuickNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUICK_NOTES);
    if (raw) {
      return parseQuickNotes(raw);
    }
  } catch (err) {
    console.error('Failed to parse quick notes', err);
  }

  const initialNotes: QuickNote[] = [
    {
      id: 'note-1',
      author: 'Clément',
      content: 'Sac de judo d’Imanzi prêt dans le coffre pour mercredi ! Décollage ORY à 07h10 demain matin ✈️',
      color: 'yellow',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      pinned: true,
      likes: ['Irène'],
    },
    {
      id: 'note-2',
      author: 'Irène',
      content: 'Courses faites ! Les compotes et goûters sont dans le placard du haut. Je serai en télétravail jeudi 💻',
      color: 'pink',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      pinned: true,
      likes: ['Clément'],
    },
    {
      id: 'note-3',
      author: 'Clément',
      content: 'Pense à signer le carnet de liaison d’Ishema avant vendredi svp ❤️',
      color: 'blue',
      createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      pinned: false,
      likes: [],
    },
  ];

  saveQuickNotes(initialNotes);
  return initialNotes;
}

export function saveQuickNotes(notes: QuickNote[]): void {
  try {
    persist('quickNotes', notes);
  } catch (err) {
    console.error('Failed to save quick notes', err);
  }
}
