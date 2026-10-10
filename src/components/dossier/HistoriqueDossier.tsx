import { EtatErreur } from "@/components/EtatErreur";
import { Carte, Chargement, Vide } from "@/components/ui";
import type { Evenement } from "@/modules/dossier/schemas";
import { formaterDateHeure } from "./outils";

// Historique du dossier, du plus ancien au plus récent (ordre du serveur).
// Il a son propre état : son échec ne bloque pas le reste de la page.
export function HistoriqueDossier({
  evenements,
  chargement,
  erreur,
  onReessayer,
}: {
  evenements: Evenement[] | null;
  chargement: boolean;
  erreur: unknown;
  onReessayer: () => void;
}) {
  return (
    <Carte>
      <h2 className="border-b border-line px-5 py-4 font-display text-lg font-semibold text-ink">
        Historique
      </h2>
      {erreur ? (
        <div className="p-5">
          <EtatErreur erreur={erreur} onReessayer={onReessayer} sujet="L'historique" />
        </div>
      ) : !evenements ? (
        chargement && <Chargement texte="Chargement de l'historique…" />
      ) : evenements.length === 0 ? (
        <Vide>Aucun événement pour le moment.</Vide>
      ) : (
        <ol className="divide-y divide-line">
          {evenements.map((evenement) => (
            <li key={evenement.id} className="px-5 py-4">
              <p className="font-semibold break-words text-ink">{evenement.action}</p>
              <p className="text-sm text-muted">
                {evenement.auteur}
                {" · "}
                <time dateTime={evenement.date}>{formaterDateHeure(evenement.date)}</time>
              </p>
              {evenement.detail && (
                <p className="mt-1 text-sm break-words text-ink">{evenement.detail}</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </Carte>
  );
}
