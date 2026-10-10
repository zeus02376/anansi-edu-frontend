import { Carte, formaterDate } from "@/components/ui";
import {
  LIBELLE_STATUT_DOSSIER,
  type StatutDossier,
} from "@/modules/commun/schemas";
import type { SuiviDossier } from "@/modules/suivi/schemas";

// Texte fixe par statut : rien n'est calculé, le statut vient du serveur.
const EXPLICATION_STATUT: Record<StatutDossier, string> = {
  SOUMIS: "Votre dossier a bien été reçu. Il sera examiné prochainement.",
  INCOMPLET:
    "Votre dossier n'est pas complet. Consultez les demandes de correction ci-dessous.",
  EN_EXAMEN:
    "Votre dossier est en cours d'examen. Aucune action n'est attendue de votre part.",
  ACCEPTE: "Félicitations, votre candidature est acceptée.",
  REJETE: "Votre candidature n'a pas été retenue.",
};

const CLASSE_STATUT: Record<StatutDossier, string> = {
  SOUMIS: "border-primary/30 bg-primary/10 text-primary",
  INCOMPLET: "border-amber-600/40 bg-amber-500/10 text-amber-800",
  EN_EXAMEN: "border-slate-400 bg-slate-100 text-slate-700",
  ACCEPTE: "border-green-700/40 bg-green-700/10 text-green-800",
  REJETE: "border-red-600/40 bg-red-600/10 text-red-800",
};

const LIBELLE_DECISION = {
  ACCEPTE: "Dossier accepté",
  REJETE: "Dossier refusé",
} as const;

export function ResultatSuivi({ suivi }: { suivi: SuiviDossier }) {
  const { statut, corrections, decision } = suivi;
  return (
    <div className="flex flex-col gap-6">
      <Carte className="p-5">
        <p className="text-sm text-muted">
          Dossier{" "}
          <span className="font-semibold break-words text-ink">
            {suivi.numeroDossier}
          </span>
        </p>
        <h2 className="mt-2 flex flex-wrap items-center gap-3 font-display text-lg font-semibold text-ink">
          Statut
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${CLASSE_STATUT[statut]}`}
          >
            {LIBELLE_STATUT_DOSSIER[statut]}
          </span>
        </h2>
        <p className="mt-2 text-ink">{EXPLICATION_STATUT[statut]}</p>
      </Carte>

      <Carte className="p-5">
        <h2 className="font-display text-lg font-semibold text-ink">
          Demandes de correction
        </h2>
        {corrections.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Aucune demande de correction</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {corrections.map((correction) => (
              <li
                key={correction.id}
                className="rounded-md border border-line bg-wash px-3.5 py-3 text-sm"
              >
                <p className="text-muted">{formaterDate(correction.date)}</p>
                <p className="mt-0.5 break-words whitespace-pre-line text-ink">
                  {correction.motif}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Carte>

      <Carte className="p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Décision</h2>
        {decision ? (
          <div className="mt-2 text-sm">
            <p className="font-semibold text-ink">
              {LIBELLE_DECISION[decision.resultat]}
              <span className="font-normal text-muted">
                {" "}
                · {formaterDate(decision.date)}
              </span>
            </p>
            {decision.motif && (
              <p className="mt-1 break-words whitespace-pre-line text-ink">
                Motif : {decision.motif}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Aucune décision pour le moment
          </p>
        )}
      </Carte>
    </div>
  );
}
