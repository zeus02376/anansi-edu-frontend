import {
  LIBELLE_STATUT_DOSSIER,
  type StatutDossier,
} from "@/modules/commun/schemas";

const CLASSE_BADGE =
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap";

const CLASSE_STATUT: Record<StatutDossier, string> = {
  SOUMIS: "border-primary/30 bg-primary/10 text-primary",
  INCOMPLET: "border-amber-600/40 bg-amber-500/10 text-amber-800",
  EN_EXAMEN: "border-slate-400 bg-slate-100 text-slate-700",
  ACCEPTE: "border-green-700/40 bg-green-700/10 text-green-800",
  REJETE: "border-red-600/40 bg-red-600/10 text-red-800",
};

export function BadgeStatutDossier({ statut }: { statut: StatutDossier }) {
  return (
    <span className={`${CLASSE_BADGE} ${CLASSE_STATUT[statut]}`}>
      {LIBELLE_STATUT_DOSSIER[statut]}
    </span>
  );
}

// Le sens passe par le texte, pas seulement par la couleur.
export function BadgeDoublon() {
  return (
    <span
      className={`${CLASSE_BADGE} border-amber-600/40 bg-amber-500/10 text-amber-800`}
    >
      Doublon possible
    </span>
  );
}
