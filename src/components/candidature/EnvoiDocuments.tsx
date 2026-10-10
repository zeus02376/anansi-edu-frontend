import type { ReactNode, RefObject } from "react";
import { CLASSE_BOUTON_SECONDAIRE } from "@/components/styles";
import { DOCUMENTS } from "@/modules/candidature/schemas";
import { LIBELLE_TYPE_DOCUMENT, type TypeDocument } from "@/modules/commun/schemas";
import { CLASSE_ARIA_INACTIF } from "./champs";
import { NumeroDossier } from "./NumeroDossier";
import type { EtatDocument } from "./useEnvoiDocuments";

const LIBELLE_ETAT: Record<EtatDocument["etat"], string> = {
  attente: "En attente",
  cours: "Envoi en cours…",
  envoye: "Envoyé",
  echec: "Échec de l'envoi",
};

// Section « Envoi des documents » : numéro du dossier et état de chaque
// document, avec « Réessayer » pour ceux qui ont échoué. Le titre reçoit le
// focus quand le contrôle qui l'avait disparaît.
export function EnvoiDocuments({
  numero,
  etats,
  bloque,
  onReessayer,
  titreRef,
  children,
}: {
  numero: string;
  etats: Record<string, EtatDocument>;
  bloque: boolean;
  onReessayer: (type: TypeDocument) => void;
  titreRef: RefObject<HTMLHeadingElement | null>;
  children?: ReactNode;
}) {
  return (
    <section aria-labelledby="envoi-documents" className="flex flex-col gap-3">
      <h3
        id="envoi-documents"
        ref={titreRef}
        tabIndex={-1}
        className="font-display text-base font-semibold text-ink outline-hidden"
      >
        Envoi des documents
      </h3>
      <p className="text-sm text-muted">
        Votre dossier est enregistré. Les documents sont envoyés un par un.
      </p>
      <NumeroDossier numero={numero} />
      {children}
      <ul
        aria-live="polite"
        className="divide-y divide-line rounded-md border border-line bg-surface text-sm"
      >
        {DOCUMENTS.filter((d) => etats[d.type]).map((d) => {
          const { etat, message } = etats[d.type];
          return (
            <li key={d.type} className="flex flex-col gap-1 px-3.5 py-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="min-w-0 font-medium break-words text-ink">
                  {LIBELLE_TYPE_DOCUMENT[d.type]}
                </span>
                <span className={etat === "echec" ? "font-semibold text-red-700" : "text-muted"}>
                  {LIBELLE_ETAT[etat]}
                </span>
              </div>
              {etat === "echec" && (
                <>
                  {message && <p className="break-words text-red-700">{message}</p>}
                  <button
                    type="button"
                    aria-disabled={bloque}
                    onClick={() => {
                      if (!bloque) onReessayer(d.type);
                    }}
                    className={`${CLASSE_BOUTON_SECONDAIRE} ${CLASSE_ARIA_INACTIF} self-start px-3 py-1.5`}
                  >
                    Réessayer ce document
                    <span className="sr-only"> : {LIBELLE_TYPE_DOCUMENT[d.type]}</span>
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
