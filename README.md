# ANANSI — frontend

Interface web d'ANANSI, une plateforme SaaS de gestion académique pour les universités africaines : candidatures, inscriptions, écoles, enseignements.

Ce dépôt contient le frontend. Le backend (API NestJS) est dans [anansi-edu-backend](https://github.com/zeus02376/anansi-edu-backend).

## Fonctionnalités

- **Connexion** par e-mail et mot de passe, avec redirection vers l'espace du rôle connecté.
- **Quatre espaces protégés par rôle** :
  - Administrateur : tableau de bord (établissements, écoles, étudiants, enseignants), gestion des établissements et des écoles.
  - Scolarité : tableau de bord des candidatures à traiter (valider, refuser), liste complète avec filtre par statut et changement de statut, liste des étudiants.
  - Enseignant : ses matières et affectations.
  - Étudiant : son dossier et son inscription.
- **Formulaire de candidature public** en cinq étapes (identité, coordonnées, formation, documents, récapitulatif). L'envoi au serveur n'est pas encore branché.
- Messages d'erreur en français pour chaque échec d'appel (serveur injoignable, identifiants refusés, accès refusé, session expirée).
- Interface responsive, bleu `#1E40AF` et blanc.

## Technologies

- [Next.js 16](https://nextjs.org) (App Router) et React 19, en TypeScript
- Tailwind CSS 4
- React Hook Form et Zod pour les formulaires
- Zustand pour l'état d'authentification
- Axios pour les appels à l'API

## Démarrage

Prérequis : Node.js 20 ou plus récent, et le backend ANANSI lancé sur le port 4000.

```bash
git clone https://github.com/zeus02376/anansi-edu-frontend.git
cd anansi-edu-frontend
npm install
```

Créer un fichier `.env.local` à la racine (il n'est jamais commité) :

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Puis lancer le serveur de développement :

```bash
npm run dev
```

L'application est disponible sur http://localhost:3000.

### Côté backend

Pour que le navigateur puisse appeler l'API depuis `localhost:3000`, le backend doit :

- écouter sur le port 4000 (`PORT=4000` dans son `.env`, le port 3000 étant pris par Next.js) ;
- autoriser les requêtes d'une autre origine (`app.enableCors()` dans `main.ts`).

## Commandes

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Lance le build de production |
| `npm run lint` | Vérification ESLint |

## Organisation du code

```
src/
├── app/
│   ├── login/            Page de connexion
│   ├── candidature/      Formulaire de candidature public
│   ├── admin/            dashboard, tenants, ecoles
│   ├── scolarite/        dashboard, candidatures, etudiants
│   ├── enseignant/       dashboard
│   └── etudiant/         dashboard
├── components/           Navbar, Sidebar, ProtectedRoute et composants partagés
├── hooks/                useRessource (chargement d'une ressource de l'API)
├── lib/                  Rôles et pages d'accueil par rôle
├── services/api.ts       Instance Axios, jeton, gestion du 401, messages d'erreur
├── stores/authStore.ts   Session (Zustand)
└── types/                Types des données renvoyées par le backend
```

Dans les espaces protégés, chaque page est en deux fichiers : `page.tsx` (enveloppe serveur) et `vue.tsx` (contenu interactif).

## Authentification et accès

- La connexion appelle `POST /auth/login` avec `{ email, motDePasse }` ; le backend répond avec un jeton JWT et l'utilisateur.
- Le jeton est envoyé à chaque requête dans l'en-tête `Authorization: Bearer <jeton>`.
- Seul le jeton est enregistré dans le navigateur (`localStorage`) ; aucune autre donnée personnelle n'y est stockée.
- Une réponse 401 déconnecte la personne et la renvoie vers `/login`.

| Espace | Rôles autorisés |
| --- | --- |
| `/admin/*` | ADMIN |
| `/scolarite/*` | SCOLARITE, ADMIN |
| `/enseignant/*` | ENSEIGNANT |
| `/etudiant/*` | ETUDIANT |

Le contrôle côté frontend est un confort d'affichage : c'est le backend qui vérifie le jeton et le rôle à chaque requête.

## Limites connues

- Les tableaux de bord enseignant et étudiant affichent une explication à la place des données tant que le backend réserve `/enseignants`, `/etudiants` et `/inscriptions` aux rôles ADMIN et SCOLARITE.
- La création d'un établissement ne fonctionne que pour le tout premier : `POST /tenants` répond ensuite par une erreur.
- Le formulaire de candidature public n'envoie encore rien au serveur.
