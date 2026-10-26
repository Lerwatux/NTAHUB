# Partager NTAHUB entre deux téléphones (Firebase)

Avant ce changement, chaque téléphone gardait ses propres données. Désormais, le
planning est enregistré dans **Firebase**, un service gratuit de Google. Les deux
téléphones voient donc les mêmes événements, notes, activités et plannings, et
une modification faite sur l'un apparaît sur l'autre en quelques secondes.

Tant que Firebase n'est pas configuré, l'appli fonctionne comme avant, avec des
données propres à chaque appareil. Tu peux donc suivre ce guide quand tu veux.

Compte environ 15 minutes. Tout se fait dans ton navigateur, sans rien installer.

---

## Pourquoi Firebase ?

- **Gratuit** pour une famille : la formule « Spark » suffit largement, et aucune carte bancaire n'est demandée.
- **Pas de serveur à entretenir** : Google s'occupe de tout.
- **Temps réel** et **hors connexion** : l'appli reste utilisable sans réseau et envoie les modifications dès que le réseau revient.
- **Connexion par e-mail et mot de passe** : c'est ce qui marche le mieux pour une appli installée sur l'écran d'accueil d'un iPhone ou d'un Android.

---

## Étape 1 : créer le projet Firebase

1. Va sur <https://console.firebase.google.com> et connecte-toi avec ton compte Google.
2. Clique sur **« Créer un projet »** (ou « Ajouter un projet »).
3. Nom : `ntahub` (ou ce que tu veux), puis **Continuer**.
4. Google Analytics : **désactive-le**, ça ne sert à rien ici. Clique ensuite sur **Créer le projet**.

## Étape 2 : relier l'appli au projet

1. Sur la page d'accueil du projet, clique sur l'icône **`</>`** (« Web »).
2. Surnom de l'appli : `NTAHUB`. **Ne coche pas** « Firebase Hosting », car l'appli est déjà sur Vercel.
3. Clique sur **Enregistrer l'appli**. Firebase affiche un bloc de code qui ressemble à ceci :
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "ntahub-xxxx.firebaseapp.com",
     projectId: "ntahub-xxxx",
     storageBucket: "ntahub-xxxx.firebasestorage.app",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef"
   };
   ```
4. Ouvre le fichier **`src/firebaseConfig.ts`** du projet et remplace chaque `'A_REMPLACER'`
   par la valeur correspondante, en gardant les guillemets.

   > Ces valeurs ne sont **pas secrètes**. Google les a prévues pour être visibles dans une
   > appli web, et tu peux les envoyer sur GitHub sans risque. Ce qui protège vos données,
   > ce sont les règles de sécurité de l'étape 5.

   Tu retrouveras ce bloc plus tard dans ⚙️ **Paramètres du projet**, rubrique **Vos applications**.

## Étape 3 : créer vos deux comptes

1. Dans le menu de gauche : **Créer** → **Authentication**, puis **Commencer**.
2. Onglet **Mode de connexion** : choisis **Adresse e-mail/Mot de passe**, active le premier interrupteur, puis clique sur **Enregistrer**.
3. Onglet **Utilisateurs** : clique sur **Ajouter un utilisateur**.
   - Saisis l'e-mail de Clément et un mot de passe d'au moins 6 caractères.
   - Recommence pour Irène.
4. **Important** : onglet **Paramètres**, rubrique **Actions des utilisateurs**, **décoche**
   « Activer la création (inscription) », puis enregistre. Ainsi, personne d'autre ne
   peut se créer un compte.

> Mot de passe oublié ? L'écran de connexion de l'appli a un lien « Mot de passe oublié ? »
> qui envoie un e-mail pour en choisir un nouveau.

## Étape 4 : créer la base de données

1. Menu de gauche : **Créer** → **Firestore Database**, puis **Créer une base de données**.
2. Emplacement : choisis un emplacement en Europe, par exemple **`eur3 (europe-west)`**.
   Ce choix est définitif.
3. Choisis **Démarrer en mode production**, puis **Créer**.

## Étape 5 : n'autoriser que vous deux (règles de sécurité)

1. Toujours dans **Firestore Database**, ouvre l'onglet **Règles**.
2. Ouvre le fichier **`firestore.rules`** du projet et remplace les deux adresses
   d'exemple par **vos deux vraies adresses e-mail, en minuscules**. Ce sont les adresses des comptes créés à l'étape 3.
3. Copie tout le contenu du fichier, colle-le à la place du texte affiché dans la console, puis clique sur **Publier**.

Avec ces règles, toute personne qui n'est pas connectée avec l'un de vos deux comptes
se voit refuser l'accès aux données.

## Étape 6 : essayer sur l'ordinateur

1. Dans le dossier du projet, lance :
   ```bash
   npm run dev
   ```
2. Ouvre <http://localhost:3000> dans **Chrome**, puis dans **Safari** ou une **fenêtre de navigation privée**.
3. Connecte-toi avec le compte de Clément dans la première fenêtre, et avec celui d'Irène dans la seconde.
4. Ajoute un événement dans une fenêtre : il apparaît tout seul dans l'autre, en quelques secondes.

## Étape 7 : mettre en ligne et installer sur les téléphones

1. Dans **GitHub Desktop**, fais un *commit* des changements (avec ton `firebaseConfig.ts` rempli), puis clique sur **Push origin**.
   Vercel republie l'appli automatiquement.
2. **Commence par le téléphone qui contient les vraies données** (celui de Clément en principe) :
   ouvre l'appli et connecte-toi. Ses données actuelles sont envoyées dans le cloud.
3. Ensuite, sur le téléphone d'Irène : ouvre l'appli et connecte-toi. Elle récupère le planning
   commun. Les événements, notes et activités qu'elle avait ajoutés de son côté sont **ajoutés**
   au planning commun, sans rien écraser.

La connexion n'est demandée qu'une fois par téléphone : l'appli s'en souvient ensuite.

---

## Bon à savoir

- **Ce qui est partagé** : événements, notes rapides (post-it), notifications, activités des
  enfants, planning PNC de Clément, statuts d'Irène et réglages horaires.
- **Ce qui reste propre à chaque téléphone** : le mode sombre et le profil affiché
  (Clément ou Irène, via le bouton en haut de l'écran).
- **Sans réseau**, l'appli marche quand même. Les modifications partent dès que le réseau revient.
- **Si vous modifiez la même liste au même moment**, par exemple chacun ajoute un événement
  dans la même seconde, la dernière modification enregistrée l'emporte. C'est rare, mais si un
  ajout disparaît, il suffit de le refaire.
- Le bouton **« Réinitialiser »** de l'onglet PNC ne remet plus le planning d'exemple : il
  recharge simplement les données partagées depuis le cloud.
- En bas de la page, **« Se déconnecter »** permet de changer de compte.
- Pour **ajouter ou changer une adresse autorisée**, modifie la liste dans `firestore.rules`,
  recolle-la dans l'onglet **Règles** et publie. Pense aussi à créer le compte à l'étape 3.
- Pour **voir les données brutes** : Console Firebase → Firestore Database → onglet **Données** →
  `families` → `ntahub` → `data`.
