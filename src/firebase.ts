import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

// Identifiant du "dossier familial" dans Firestore : toutes les données partagées
// sont rangées sous families/ntahub/data/...
export const FAMILY_ID = 'ntahub';

export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => typeof value === 'string' && value.length > 0 && value !== 'A_REMPLACER'
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  // Cache local persistant : l'appli reste utilisable hors connexion
  // et renvoie les modifications dès que le réseau revient.
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} else {
  console.info('[NTAHUB] Firebase non configuré : données enregistrées sur cet appareil uniquement.');
}

export { app, auth, db };
