# IUC Campus — interface web

Application React/Vite du portail académique IUC Campus.

## Configuration

Copiez `.env.example` dans `.env` et renseignez l’URL du backend :

```env
VITE_API_URL=http://localhost:3000
```

Pour cibler explicitement un établissement sur le catalogue public, définissez
également `VITE_TENANT_SLUG` (par exemple `iuc`). Le fichier `.env` ne doit pas être
commité.

## Développement

```sh
npm install
npm run dev
```

## Fonctionnalités disponibles

| Espace | Routes | Fonctions |
| --- | --- | --- |
| Public | `/`, `/filieres`, `/filieres/:id` | Accueil et catalogue des formations |
| Candidats | `/candidature`, `/suivi` | Dépôt de candidature et suivi du dossier |
| Administration | `/admin`, `/admin/comptes`, `/admin/etudiants` | Tableau de bord, comptes du personnel et répertoire étudiant. L’administration accède aussi aux écrans de la scolarité. |
| Scolarité | `/scolarite`, `/scolarite/candidatures`, `/scolarite/etudiants`, `/scolarite/inscriptions` | Admissions, suivi des étudiants et gestion des inscriptions |
| Scolarité — notes | `/scolarite/notes`, `/scolarite/evaluations/:id`, `/scolarite/notes/releve` | Évaluations de l’établissement, grille des notes, corrections, publication et dépublication, relevé d’un étudiant |
| Enseignants | `/enseignant`, `/enseignant/matieres` | Profil et matières affectées |
| Enseignants — notes | `/enseignant/evaluations/:id` | Création des évaluations d’une matière, saisie des notes, publication |
| Étudiants | `/etudiant`, `/etudiant/dossier` | Tableau de bord, profil, candidature d’origine et inscriptions |
| Étudiants — notes | `/etudiant/notes` | Notes publiées et moyennes par matière et par année |

Les pages de gestion sont protégées par authentification et contrôle de rôle.
Les comptes étudiants sont créés à partir d’une candidature acceptée.

### Inscriptions et étudiants (scolarité, administration)

- **Étudiants** : répertoire avec recherche (nom, e-mail, matricule, nationalité) et
  dossier de chaque étudiant (identité, historique des inscriptions avec niveau et année).
- **Inscriptions** : création et modification (niveau, année académique, statut, frais).
  Les niveaux sont affichés avec leur filière (« Licence 1 (L1) — Informatique »).
  Le serveur refuse de modifier l’étudiant, le niveau, l’année ou le statut d’une
  inscription qui porte déjà des notes (409) : l’écran l’explique et propose de
  rétablir les valeurs d’origine pour n’enregistrer que les frais.

### Notes

Le module notes repose sur les évaluations d’une matière (devoir, TP, examen…), chacune
avec un coefficient et un barème (sur 20 par défaut).

- **Enseignant** : crée les évaluations de ses matières, saisit les notes (note, absent ou
  dispensé) et les publie. Une évaluation publiée est verrouillée pour l’enseignant. En
  cas de modification concurrente (conflit), la grille est relue sans perdre les saisies.
- **Scolarité et administration** : consultent les évaluations publiées et en brouillon,
  corrigent une note (motif obligatoire, historique conservé), dépublient une évaluation
  (motif obligatoire) et peuvent la republier, et consultent le relevé complet d’un étudiant.
- **Étudiant** : voit uniquement ses notes publiées, avec ses moyennes par matière et par
  année. Les moyennes sont toujours présentées comme **provisoires** : ce ne sont pas des
  résultats définitifs. Un absent compte 0, un dispensé n’est pas compté.

Les moyennes sont calculées par le serveur à partir des seules évaluations publiées ; le
relevé de la scolarité et celui de l’étudiant partagent le même affichage.

## Vérifications

```sh
npm test
npm run lint
npm run build
```
