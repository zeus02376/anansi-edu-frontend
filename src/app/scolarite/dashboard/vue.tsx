"use client";

import { useState } from "react";
import Link from "next/link";
import {
  compterParStatut,
  nomCandidat,
  useCandidatures,
} from "@/components/candidatures/useCandidatures";
import { Inclinable } from "@/components/Inclinable";
import { Nombre } from "@/components/Nombre";
import {
  CLASSE_BOUTON_PRINCIPAL,
  CLASSE_BOUTON_SECONDAIRE,
  CLASSE_ERREUR,
  CLASSE_LIEN,
} from "@/components/styles";
import {
  BadgeCandidature,
  Carte,
  Chargement,
  CLASSE_TABLEAU,
  CLASSE_TABLEAU_DEFILANT,
  CLASSE_TD,
  CLASSE_TH,
  EnTete,
  Erreur,
  formaterDate,
  LIBELLE_STATUT_CANDIDATURE,
  Vide,
} from "@/components/ui";
import {
  STATUTS_CANDIDATURE,
  type Candidature,
  type StatutCandidature,
} from "@/types";

const STATUTS_A_TRAITER: StatutCandidature[] = [
  "SOUMIS",
  "INCOMPLET",
  "EN_EXAMEN",
];

const CLASSE_ACTION = "px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-60";

function LigneATraiter({
  candidature,
  enCours,
  erreur,
  onChanger,
}: {
  candidature: Candidature;
  enCours: boolean;
  erreur?: string;
  onChanger: (statut: StatutCandidature) => void;
}) {
  // Le refus demande une confirmation, affichée dans la ligne.
  const [confirmation, setConfirmation] = useState(false);
  const nom = nomCandidat(candidature);

  return (
    <tr>
      <td className={`${CLASSE_TD} whitespace-nowrap`}>
        {candidature.numeroDossier}
      </td>
      <td className={CLASSE_TD}>{nom}</td>
      <td className={CLASSE_TD}>{candidature.filiere?.nom ?? "—"}</td>
      <td className={`${CLASSE_TD} whitespace-nowrap`}>
        {formaterDate(candidature.createdAt)}
      </td>
      <td className={CLASSE_TD}>
        <BadgeCandidature statut={candidature.statut} />
      </td>
      <td className={CLASSE_TD}>
        {confirmation ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">Refuser ce dossier ?</span>
            <button
              type="button"
              className={`${CLASSE_BOUTON_PRINCIPAL} ${CLASSE_ACTION}`}
              onClick={() => {
                setConfirmation(false);
                onChanger("REJETE");
              }}
            >
              Confirmer le refus
              <span className="sr-only"> de la candidature de {nom}</span>
            </button>
            <button
              type="button"
              autoFocus
              className={`${CLASSE_BOUTON_SECONDAIRE} ${CLASSE_ACTION}`}
              onClick={() => setConfirmation(false)}
            >
              Annuler
              <span className="sr-only">
                {" "}
                le refus de la candidature de {nom}
              </span>
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={enCours}
              className={`${CLASSE_BOUTON_PRINCIPAL} ${CLASSE_ACTION}`}
              onClick={() => onChanger("ACCEPTE")}
            >
              Valider
              <span className="sr-only"> la candidature de {nom}</span>
            </button>
            <button
              type="button"
              disabled={enCours}
              className={`${CLASSE_BOUTON_SECONDAIRE} ${CLASSE_ACTION}`}
              onClick={() => setConfirmation(true)}
            >
              Refuser
              <span className="sr-only"> la candidature de {nom}</span>
            </button>
            {enCours && (
              <span role="status" className="text-sm text-muted">
                Enregistrement…
              </span>
            )}
          </div>
        )}
        {erreur && (
          <p role="alert" className={`${CLASSE_ERREUR} mt-2`}>
            {erreur}
          </p>
        )}
      </td>
    </tr>
  );
}

export default function ScolariteDashboardPage() {
  const {
    candidatures,
    erreur,
    chargement,
    recharger,
    enCours,
    erreurs,
    changerStatut,
  } = useCandidatures();

  const compteurs = candidatures && compterParStatut(candidatures);
  const aTraiter = candidatures?.filter((candidature) =>
    STATUTS_A_TRAITER.includes(candidature.statut),
  );

  return (
    <div>
      <EnTete
        titre="Tableau de bord"
        texte="Les candidatures reçues et celles qui attendent une décision."
      />

      {chargement && !candidatures && (
        <Carte className="mt-6">
          <Chargement texte="Chargement des candidatures…" />
        </Carte>
      )}

      {erreur && (
        <div className="mt-6">
          <Erreur message={erreur} onReessayer={recharger} />
        </div>
      )}

      {compteurs && aTraiter && (
        <>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {STATUTS_CANDIDATURE.map((statut) => (
              <Inclinable
                key={statut}
                className="flex flex-col-reverse rounded-xl border border-line bg-surface px-4 py-3.5 shadow-[0_1px_2px_rgb(15_23_42/0.04),0_14px_32px_-18px_rgb(15_23_42/0.14)]"
              >
                <dt className="text-sm text-muted">
                  {LIBELLE_STATUT_CANDIDATURE[statut]}
                </dt>
                <dd className="font-display text-3xl font-semibold text-primary tabular-nums">
                  <Nombre valeur={compteurs[statut]} />
                </dd>
              </Inclinable>
            ))}
          </dl>

          <Carte className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
              <h2 className="font-display text-lg font-semibold text-ink">
                Candidatures à traiter ({aTraiter.length})
              </h2>
              <Link href="/scolarite/candidatures" className={CLASSE_LIEN}>
                Voir toutes les candidatures
              </Link>
            </div>
            {aTraiter.length === 0 ? (
              <Vide>Aucune candidature en attente de décision.</Vide>
            ) : (
              <div className={CLASSE_TABLEAU_DEFILANT}>
                <table className={CLASSE_TABLEAU}>
                  <caption className="sr-only">Candidatures à traiter</caption>
                  <thead>
                    <tr>
                      <th scope="col" className={CLASSE_TH}>
                        Numéro de dossier
                      </th>
                      <th scope="col" className={CLASSE_TH}>
                        Candidat
                      </th>
                      <th scope="col" className={CLASSE_TH}>
                        Filière
                      </th>
                      <th scope="col" className={CLASSE_TH}>
                        Date de dépôt
                      </th>
                      <th scope="col" className={CLASSE_TH}>
                        Statut
                      </th>
                      <th scope="col" className={CLASSE_TH}>
                        Décision
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {aTraiter.map((candidature) => (
                      <LigneATraiter
                        key={candidature.id}
                        candidature={candidature}
                        enCours={candidature.id in enCours}
                        erreur={erreurs[candidature.id]}
                        onChanger={(statut) =>
                          changerStatut(candidature.id, statut)
                        }
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Carte>
        </>
      )}
    </div>
  );
}
