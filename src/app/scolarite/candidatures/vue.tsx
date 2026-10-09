"use client";

import { useState, useSyncExternalStore } from "react";
import {
  compterParStatut,
  nomCandidat,
  useCandidatures,
} from "@/components/candidatures/useCandidatures";
import {
  CLASSE_BOUTON_PRINCIPAL,
  CLASSE_CHAMP,
  CLASSE_ERREUR,
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

type Filtre = StatutCandidature | "TOUS";

// Le backend ne donne pas de niveau pour une candidature : on affiche le
// cycle de la filière visée (licence, master…).
const LIBELLE_CYCLE: Record<string, string> = {
  BTS: "BTS",
  HND: "HND",
  LICENCE: "Licence",
  MASTER: "Master",
  INGENIEUR: "Ingénieur",
};

function cycleDeLaFiliere(candidature: Candidature): string | null {
  const cycle = candidature.filiere?.cycle;
  return cycle ? (LIBELLE_CYCLE[cycle] ?? cycle) : null;
}

// Tableau à partir de 768 px, cartes en dessous. Un seul des deux est
// affiché à la fois : les champs de statut ne sont jamais en double.
function useEcranLarge(): boolean {
  return useSyncExternalStore(
    (notifier) => {
      const requete = window.matchMedia("(min-width: 48rem)");
      requete.addEventListener("change", notifier);
      return () => requete.removeEventListener("change", notifier);
    },
    () => window.matchMedia("(min-width: 48rem)").matches,
    () => true,
  );
}

const CLASSE_FILTRE =
  "rounded-full border border-field px-3.5 py-1.5 text-sm font-semibold text-ink transition-colors duration-150 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-on-primary";

const COLONNES = [
  "Numéro de dossier",
  "Candidat",
  "Filière et cycle",
  "Date de dépôt",
  "Statut",
  "Changer le statut",
];

// Le nouveau statut se choisit dans la liste puis se confirme avec
// « Enregistrer » : parcourir la liste au clavier n'enregistre rien.
function ChangementDeStatut({
  candidature,
  cible,
  echec,
  onEnregistrer,
}: {
  candidature: Candidature;
  // Statut en cours d'enregistrement, s'il y en a un.
  cible?: StatutCandidature;
  echec?: string;
  onEnregistrer: (statut: StatutCandidature) => Promise<boolean>;
}) {
  const [choix, setChoix] = useState(candidature.statut);
  const nom = nomCandidat(candidature);
  const idChamp = `statut-${candidature.id}`;
  const idErreur = `erreur-${candidature.id}`;
  const enCours = cible !== undefined;

  return (
    <>
      <div className="flex items-center gap-2">
        <label htmlFor={idChamp} className="sr-only">
          Nouveau statut de la candidature de {nom}
        </label>
        <select
          id={idChamp}
          value={cible ?? choix}
          disabled={enCours}
          aria-invalid={echec ? true : undefined}
          aria-describedby={echec ? idErreur : undefined}
          className={`${CLASSE_CHAMP} py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-60`}
          onChange={(evenement) =>
            setChoix(evenement.target.value as StatutCandidature)
          }
        >
          {STATUTS_CANDIDATURE.map((statut) => (
            <option key={statut} value={statut}>
              {LIBELLE_STATUT_CANDIDATURE[statut]}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={enCours || choix === candidature.statut}
          className={`${CLASSE_BOUTON_PRINCIPAL} px-3 py-1.5`}
          onClick={() =>
            // Si l'enregistrement échoue, la liste revient à l'ancien statut.
            void onEnregistrer(choix).then((enregistre) => {
              if (!enregistre) setChoix(candidature.statut);
            })
          }
        >
          {enCours ? "Envoi…" : "Enregistrer"}
          <span className="sr-only"> le statut de la candidature de {nom}</span>
        </button>
      </div>
      {echec && (
        <p
          id={idErreur}
          role="alert"
          className={`${CLASSE_ERREUR} mt-2 min-w-48`}
        >
          {echec}
        </p>
      )}
    </>
  );
}

export default function ScolariteCandidaturesPage() {
  const {
    candidatures,
    erreur,
    chargement,
    recharger,
    enCours,
    erreurs,
    changerStatut,
  } = useCandidatures();
  const [filtre, setFiltre] = useState<Filtre>("TOUS");
  const ecranLarge = useEcranLarge();

  const compteurs = candidatures && compterParStatut(candidatures);
  const visibles =
    filtre === "TOUS"
      ? candidatures
      : candidatures?.filter((candidature) => candidature.statut === filtre);

  return (
    <div>
      <EnTete
        titre="Candidatures"
        texte="Tous les dossiers reçus. Choisissez un nouveau statut dans la ligne du dossier, puis enregistrez."
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

      {candidatures && compteurs && visibles && (
        <Carte className="mt-6">
          <div className="border-b border-line px-5 py-4">
            <div
              role="group"
              aria-label="Filtrer par statut"
              className="flex flex-wrap gap-2"
            >
              <button
                type="button"
                aria-pressed={filtre === "TOUS"}
                className={CLASSE_FILTRE}
                onClick={() => setFiltre("TOUS")}
              >
                Tous ({candidatures.length})
              </button>
              {STATUTS_CANDIDATURE.map((statut) => (
                <button
                  key={statut}
                  type="button"
                  aria-pressed={filtre === statut}
                  className={CLASSE_FILTRE}
                  onClick={() => setFiltre(statut)}
                >
                  {LIBELLE_STATUT_CANDIDATURE[statut]} ({compteurs[statut]})
                </button>
              ))}
            </div>
            <p aria-live="polite" className="mt-3 text-sm text-muted">
              {visibles.length}{" "}
              {visibles.length > 1
                ? "candidatures affichées"
                : "candidature affichée"}
            </p>
          </div>

          {visibles.length === 0 ? (
            <Vide>
              {candidatures.length === 0
                ? "Aucune candidature reçue pour le moment."
                : "Aucune candidature avec ce statut."}
            </Vide>
          ) : (
            ecranLarge ? (
            <div className={CLASSE_TABLEAU_DEFILANT}>
              <table className={CLASSE_TABLEAU}>
                <caption className="sr-only">Liste des candidatures</caption>
                <thead>
                  <tr>
                    {COLONNES.map((colonne) => (
                      <th key={colonne} scope="col" className={CLASSE_TH}>
                        {colonne}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((candidature) => {
                    const nom = nomCandidat(candidature);
                    return (
                      <tr key={candidature.id}>
                        <td className={`${CLASSE_TD} whitespace-nowrap`}>
                          {candidature.numeroDossier}
                        </td>
                        <td className={CLASSE_TD}>
                          <span className="block font-semibold whitespace-nowrap">
                            {nom}
                          </span>
                          <span className="block text-muted">
                            {candidature.email}
                          </span>
                        </td>
                        <td className={CLASSE_TD}>
                          <span className="block">
                            {candidature.filiere?.nom ?? "—"}
                          </span>
                          <span className="block whitespace-nowrap text-muted">
                            {[
                              cycleDeLaFiliere(candidature),
                              candidature.anneeAcademique?.libelle,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </td>
                        <td className={`${CLASSE_TD} whitespace-nowrap`}>
                          {formaterDate(candidature.createdAt)}
                        </td>
                        <td className={CLASSE_TD}>
                          <BadgeCandidature statut={candidature.statut} />
                        </td>
                        <td className={CLASSE_TD}>
                          <ChangementDeStatut
                            candidature={candidature}
                            cible={enCours[candidature.id]}
                            echec={erreurs[candidature.id]}
                            onEnregistrer={(statut) =>
                              changerStatut(candidature.id, statut)
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            ) : (
            <ul className="divide-y divide-line">
              {visibles.map((candidature) => (
                <li key={candidature.id} className="flex flex-col gap-3 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">
                        {nomCandidat(candidature)}
                      </p>
                      <p className="truncate text-sm text-muted">
                        {candidature.email}
                      </p>
                    </div>
                    <BadgeCandidature statut={candidature.statut} />
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-muted">Dossier</dt>
                      <dd className="font-medium text-ink">
                        {candidature.numeroDossier}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Date de dépôt</dt>
                      <dd className="font-medium text-ink">
                        {formaterDate(candidature.createdAt)}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-muted">Filière et cycle</dt>
                      <dd className="font-medium text-ink">
                        {candidature.filiere?.nom ?? "—"}
                        {" · "}
                        {[
                          cycleDeLaFiliere(candidature),
                          candidature.anneeAcademique?.libelle,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </dd>
                    </div>
                  </dl>
                  <ChangementDeStatut
                    candidature={candidature}
                    cible={enCours[candidature.id]}
                    echec={erreurs[candidature.id]}
                    onEnregistrer={(statut) =>
                      changerStatut(candidature.id, statut)
                    }
                  />
                </li>
              ))}
            </ul>
            )
          )}
        </Carte>
      )}
    </div>
  );
}
