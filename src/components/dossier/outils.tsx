import {
  LIBELLE_STATUT_DOCUMENT,
  LIBELLE_STATUT_DOSSIER,
  type StatutDocument,
  type StatutDossier,
} from "@/modules/commun/schemas";

// Éléments communs aux blocs du détail d'un dossier.

const CLASSE_BADGE =
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap";

const CLASSE_STATUT_DOSSIER: Record<StatutDossier, string> = {
  SOUMIS: "border-primary/30 bg-primary/10 text-primary",
  INCOMPLET: "border-amber-600/40 bg-amber-500/10 text-amber-800",
  EN_EXAMEN: "border-slate-400 bg-slate-100 text-slate-700",
  ACCEPTE: "border-green-700/40 bg-green-700/10 text-green-800",
  REJETE: "border-red-600/40 bg-red-600/10 text-red-800",
};

const CLASSE_STATUT_DOCUMENT: Record<StatutDocument, string> = {
  A_VERIFIER: "border-amber-600/40 bg-amber-500/10 text-amber-800",
  VALIDE: "border-green-700/40 bg-green-700/10 text-green-800",
  REFUSE: "border-red-600/40 bg-red-600/10 text-red-800",
};

export function BadgeStatutDossier({ statut }: { statut: StatutDossier }) {
  return (
    <span className={`${CLASSE_BADGE} ${CLASSE_STATUT_DOSSIER[statut]}`}>
      {LIBELLE_STATUT_DOSSIER[statut]}
    </span>
  );
}

export function BadgeStatutDocument({ statut }: { statut: StatutDocument }) {
  return (
    <span className={`${CLASSE_BADGE} ${CLASSE_STATUT_DOCUMENT[statut]}`}>
      {LIBELLE_STATUT_DOCUMENT[statut]}
    </span>
  );
}

export function BadgeDoublon() {
  return (
    <span className={`${CLASSE_BADGE} border-amber-600/40 bg-amber-500/10 text-amber-800`}>
      Doublon possible
    </span>
  );
}

// Date et heure à l'heure locale du navigateur.
export function formaterDateHeure(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}
