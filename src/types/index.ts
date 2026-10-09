// Formes des données renvoyées par le backend ANANSI (schéma Prisma).
// Les dates arrivent sous forme de chaînes ISO.

import type { Role } from "@/lib/roles";

export const STATUTS_CANDIDATURE = [
  "SOUMIS",
  "INCOMPLET",
  "EN_EXAMEN",
  "ACCEPTE",
  "REJETE",
] as const;
export type StatutCandidature = (typeof STATUTS_CANDIDATURE)[number];

export type StatutInscription = "EN_ATTENTE" | "VALIDE" | "REJETE" | "SUSPENDU";

// Après un rechargement de page, seuls id, tenantId et role sont connus :
// ils sont relus dans le jeton, le reste n'est jamais stocké.
export type Utilisateur = {
  id: string;
  tenantId: string;
  role: Role;
  nom?: string;
  prenom?: string;
  email?: string;
};

export type ReponseConnexion = {
  access_token: string;
  user: Required<Utilisateur>;
};

export type Tenant = {
  id: string;
  nom: string;
  slug: string;
  pays: string;
  ville: string;
  createdAt: string;
};

export type Ecole = {
  id: string;
  tenantId: string;
  nom: string;
  code: string;
  description: string | null;
};

export type Filiere = {
  id: string;
  ecoleId: string;
  nom: string;
  code: string;
  cycle: string;
  regime: string;
  langue: string;
  dureeAnnees: number;
  tutelle: string;
};

export type Niveau = {
  id: string;
  filiereId: string;
  nom: string;
  code: string;
  ordre: number;
};

export type AnneeAcademique = {
  id: string;
  tenantId: string;
  libelle: string;
  dateDebut: string;
  dateFin: string;
  active: boolean;
};

export type Matiere = {
  id: string;
  niveauId: string;
  anneeAcademiqueId: string;
  nom: string;
  code: string;
  credits: number;
  heuresCm: number;
  heuresTd: number;
  heuresTp: number;
  coefficient: number;
};

export type HistoriqueCandidature = {
  id: string;
  candidatureId: string;
  userId: string;
  action: string;
  commentaire: string | null;
  createdAt: string;
};

// GET /candidatures inclut filiere, anneeAcademique et historiques.
export type Candidature = {
  id: string;
  tenantId: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: string;
  filiereId: string;
  anneeAcademiqueId: string;
  statut: StatutCandidature;
  numeroDossier: string;
  createdAt: string;
  filiere?: Filiere;
  anneeAcademique?: AnneeAcademique;
  historiques?: HistoriqueCandidature[];
};

type UtilisateurLie = {
  id?: string;
  nom: string;
  prenom: string;
  email: string;
};

export type Inscription = {
  id: string;
  etudiantId: string;
  niveauId: string;
  anneeAcademiqueId: string;
  statut: StatutInscription;
  dateInscription: string;
  fraisPayes: boolean;
  createdBy: string;
  // Présents dans GET /inscriptions, absents de etudiant.inscriptions.
  niveau?: Niveau;
  anneeAcademique?: AnneeAcademique;
  etudiant?: Etudiant;
};

// GET /etudiants inclut user et inscriptions.
export type Etudiant = {
  id: string;
  userId: string;
  tenantId: string;
  matricule: string;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: string;
  photoUrl: string | null;
  user?: UtilisateurLie;
  inscriptions?: Inscription[];
};

// GET /enseignants/:id/affectations inclut matiere et anneeAcademique.
export type Affectation = {
  id: string;
  enseignantId: string;
  matiereId: string;
  anneeAcademiqueId: string;
  heuresPrevues: number;
  heuresEffectuees: number;
  matiere?: Matiere;
  anneeAcademique?: AnneeAcademique;
};

// GET /enseignants inclut user et affectations (sans matiere).
export type Enseignant = {
  id: string;
  userId: string;
  tenantId: string;
  type: "PERMANENT" | "VACATAIRE";
  specialite: string | null;
  cvUrl: string | null;
  user?: UtilisateurLie;
  affectations?: Affectation[];
};
