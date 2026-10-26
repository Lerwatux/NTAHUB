/**
 * Configuration Firebase de NTAHUB.
 *
 * 👉 Remplace les valeurs "A_REMPLACER" par celles de ton projet Firebase
 *    (Console Firebase → ⚙️ Paramètres du projet → Vos applications → Configuration).
 *    Le guide pas à pas se trouve dans le fichier FIREBASE_SETUP.md.
 *
 * Ces valeurs ne sont pas des mots de passe : Google les prévoit pour être
 * visibles dans une appli web. Ce qui protège vos données, ce sont les règles
 * de sécurité (fichier firestore.rules) qui n'autorisent que vos deux comptes.
 *
 * Tant que les valeurs ne sont pas remplies, l'appli fonctionne comme avant :
 * les données restent uniquement sur l'appareil, sans synchronisation.
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyDZiSBasiyW6QXHPtaPtVZCT2-I7URy2_A',
  authDomain: 'ntahub.firebaseapp.com',
  projectId: 'ntahub',
  storageBucket: 'ntahub.firebasestorage.app',
  messagingSenderId: '746307013458',
  appId: '1:746307013458:web:79e9e8e9b1570d9c14c88b',
};
