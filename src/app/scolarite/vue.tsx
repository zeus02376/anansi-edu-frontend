"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  BadgeDoublon,
  BadgeStatutDossier,
} from "@/components/scolarite/BadgesDossier";
import { EtatErreur } from "@/components/EtatErreur";
import {
  CLASSE_BOUTON_SECONDAIRE,
  CLASSE_CHAMP,
  CLASSE_LIBELLE,
} from "@/components/styles";
import {
  Carte,
  Chargement,
  CLASSE_TABLEAU,
  CLASSE_TABLEAU_DEFILANT,
  CLASSE_TD,
  CLASSE_TH,
  EnTete,
  formaterDate,
  Vide,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { useEcranLarge } from "@/hooks/useEcranLarge";
import { listerDossiers, listerFormations } from "@/modules/scolarite/api";
import {
  LIBELLE_TRI,
  TRIS,
  criteresSchema,
  rechercheSchema,
  type Criteres,
  type DossierResume,
  type PageDossiers,
} from "@/modules/scolarite/schemas";
import {
  LIBELLE_STATUT_DOSSIER,
  STATUTS_DOSSIER,
  statutDossierSchema,
} from "@/modules/commun/schemas";

const DELAI_RECHERCHE_MS = 400;
const CRITERES_PAR_DEFAUT = criteresSchema.parse({});

const COLONNES = [
  "Numéro de dossier",
  "Candidat",
  "Formation",
  "Date de soumission",
  "Statut",
  "Action",
];

// Boutons de pagination en aria-disabled : ils gardent le focus clavier.
const CLASSE_INACTIF =
  "aria-disabled:cursor-not-allowed aria-disabled:opacity-60 aria-disabled:hover:border-field";

const nomComplet = (d: DossierResume) => `${d.prenom} ${d.nom}`;

function Ouvrir({ dossier }: { dossier: DossierResume }) {
  return (
    <Link
      href={`/scolarite/dossiers/${encodeURIComponent(dossier.id)}`}
      className={`${CLASSE_BOUTON_SECONDAIRE} px-3 py-1.5`}
    >
      Ouvrir
      <span className="sr-only"> le dossier {dossier.numeroDossier}</span>
    </Link>
  );
}

function Statuts({ dossier }: { dossier: DossierResume }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <BadgeStatutDossier statut={dossier.statut} />
      {dossier.doublonPossible && <BadgeDoublon />}
    </div>
  );
}

export default function ScolariteDossiersPage() {
  const [criteres, setCriteres] = useState<Criteres>(CRITERES_PAR_DEFAUT);
  // Ce qui est tapé dans le champ ; `criteres.q` n'est mis à jour qu'après
  // 400 ms sans frappe.
  const [saisie, setSaisie] = useState("");
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  const champRecherche = useRef<HTMLInputElement>(null);
  // Dernière page reçue : reste affichée pendant le chargement de la suivante.
  const [derniere, setDerniere] = useState<PageDossiers | null>(null);
  const ecranLarge = useEcranLarge();

  useEffect(
    () => () => {
      if (minuteur.current) clearTimeout(minuteur.current);
    },
    [],
  );

  const dossiers = useApi(async (signal) => {
    try {
      const reponse = await listerDossiers(criteres, signal);
      if (!signal.aborted) setDerniere(reponse);
      return reponse;
    } catch (erreur) {
      if (!signal.aborted) setDerniere(null);
      throw erreur;
    }
  }, JSON.stringify(criteres));
  const formations = useApi(listerFormations, "formations");

  const page = dossiers.donnees ?? derniere;
  const pagesTotal = page ? Math.max(1, Math.ceil(page.total / page.pageSize)) : 1;
  const filtreActif =
    criteres.q !== "" || criteres.programId !== "" || criteres.statut !== "";

  // Tout changement de critère ramène à la page 1.
  function changer(changement: Partial<Criteres>) {
    setCriteres((precedents) => ({ ...precedents, ...changement, page: 1 }));
  }

  function surRecherche(valeur: string) {
    setSaisie(valeur);
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => {
      const nettoyee = rechercheSchema.safeParse(valeur);
      changer({ q: nettoyee.success ? nettoyee.data : "" });
    }, DELAI_RECHERCHE_MS);
  }

  function reinitialiser() {
    if (minuteur.current) clearTimeout(minuteur.current);
    setSaisie("");
    setCriteres((precedents) => ({ ...CRITERES_PAR_DEFAUT, tri: precedents.tri }));
    // Le bouton disparaît : le focus revient au champ de recherche.
    champRecherche.current?.focus();
  }

  function aller(numero: number) {
    setCriteres((precedents) => ({ ...precedents, page: numero }));
  }

  return (
    <div>
      <EnTete
        titre="Dossiers de candidature"
        texte="Tous les dossiers déposés. Recherchez, filtrez puis ouvrez un dossier pour l'examiner."
      />

      <Carte className="mt-6">
        <form
          role="search"
          aria-label="Rechercher et filtrer les dossiers"
          className="grid gap-4 border-b border-line px-4 py-4 sm:grid-cols-2 sm:px-5 lg:grid-cols-4"
          onSubmit={(evenement) => evenement.preventDefault()}
        >
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="recherche" className={CLASSE_LIBELLE}>
              Nom ou numéro de dossier
            </label>
            <input
              id="recherche"
              ref={champRecherche}
              type="search"
              value={saisie}
              maxLength={100}
              autoComplete="off"
              className={`${CLASSE_CHAMP} w-full`}
              onChange={(evenement) => surRecherche(evenement.target.value)}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="filtre-formation" className={CLASSE_LIBELLE}>
              Formation
            </label>
            <select
              id="filtre-formation"
              value={criteres.programId}
              disabled={!formations.donnees}
              className={`${CLASSE_CHAMP} w-full disabled:cursor-not-allowed disabled:opacity-60`}
              onChange={(evenement) => changer({ programId: evenement.target.value })}
            >
              <option value="">
                {formations.chargement ? "Chargement…" : "Toutes les formations"}
              </option>
              {formations.donnees?.map((formation) => (
                <option key={formation.id} value={formation.id}>
                  {formation.nom} ({formation.niveau})
                </option>
              ))}
            </select>
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="filtre-statut" className={CLASSE_LIBELLE}>
              Statut
            </label>
            <select
              id="filtre-statut"
              value={criteres.statut}
              className={`${CLASSE_CHAMP} w-full`}
              onChange={(evenement) => {
                const statut = statutDossierSchema.safeParse(evenement.target.value);
                changer({ statut: statut.success ? statut.data : "" });
              }}
            >
              <option value="">Tous</option>
              {STATUTS_DOSSIER.map((statut) => (
                <option key={statut} value={statut}>
                  {LIBELLE_STATUT_DOSSIER[statut]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="tri" className={CLASSE_LIBELLE}>
              Date de soumission
            </label>
            <select
              id="tri"
              value={criteres.tri}
              className={`${CLASSE_CHAMP} w-full`}
              onChange={(evenement) => {
                const tri = evenement.target.value;
                changer({ tri: TRIS.find((t) => t === tri) ?? "date_desc" });
              }}
            >
              {TRIS.map((tri) => (
                <option key={tri} value={tri}>
                  {LIBELLE_TRI[tri]}
                </option>
              ))}
            </select>
          </div>

          {formations.erreur !== null && (
            <div className="sm:col-span-2 lg:col-span-4">
              <EtatErreur
                erreur={formations.erreur}
                onReessayer={formations.recharger}
                sujet="Le filtre par formation"
              />
            </div>
          )}

          {filtreActif && (
            <div className="sm:col-span-2 lg:col-span-4">
              <button
                type="button"
                className={`${CLASSE_BOUTON_SECONDAIRE} px-3 py-1.5`}
                onClick={reinitialiser}
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </form>

        {dossiers.erreur !== null ? (
          <div className="p-4 sm:p-5">
            <EtatErreur
              erreur={dossiers.erreur}
              onReessayer={dossiers.recharger}
              sujet="La liste des dossiers"
            />
          </div>
        ) : !page ? (
          <Chargement texte="Chargement des dossiers…" />
        ) : (
          <>
            <p
              aria-live="polite"
              className="flex flex-wrap items-center gap-x-3 px-4 pt-4 text-sm text-muted sm:px-5"
            >
              <span>
                {page.total} {page.total > 1 ? "dossiers" : "dossier"}
                {page.total > 0 && ` · Page ${page.page} sur ${pagesTotal}`}
              </span>
              {dossiers.chargement && <span>Mise à jour…</span>}
            </p>

            <div
              aria-busy={dossiers.chargement}
              className={`transition-opacity duration-150 ${dossiers.chargement ? "opacity-60" : ""}`}
            >
              {page.items.length === 0 ? (
                <Vide>
                  {filtreActif
                    ? "Aucun dossier ne correspond à ces critères."
                    : "Aucun dossier n'a encore été déposé."}
                </Vide>
              ) : ecranLarge ? (
                <div className={CLASSE_TABLEAU_DEFILANT}>
                  <table className={CLASSE_TABLEAU}>
                    <caption className="sr-only">Liste des dossiers de candidature</caption>
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
                      {page.items.map((dossier) => (
                        <tr key={dossier.id}>
                          <td className={`${CLASSE_TD} whitespace-nowrap`}>
                            {dossier.numeroDossier}
                          </td>
                          <td className={`${CLASSE_TD} font-semibold`}>
                            {nomComplet(dossier)}
                          </td>
                          <td className={CLASSE_TD}>{dossier.programme.nom}</td>
                          <td className={`${CLASSE_TD} whitespace-nowrap`}>
                            {formaterDate(dossier.soumisLe)}
                          </td>
                          <td className={CLASSE_TD}>
                            <Statuts dossier={dossier} />
                          </td>
                          <td className={CLASSE_TD}>
                            <Ouvrir dossier={dossier} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {page.items.map((dossier) => (
                    <li key={dossier.id} className="flex flex-col gap-3 px-4 py-4">
                      <div className="min-w-0">
                        <p className="font-semibold break-words text-ink">
                          {nomComplet(dossier)}
                        </p>
                        <p className="text-sm break-words text-muted">
                          {dossier.programme.nom}
                        </p>
                      </div>
                      <Statuts dossier={dossier} />
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="min-w-0">
                          <dt className="text-muted">Dossier</dt>
                          <dd className="font-medium break-words text-ink">
                            {dossier.numeroDossier}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted">Date de soumission</dt>
                          <dd className="font-medium text-ink">
                            {formaterDate(dossier.soumisLe)}
                          </dd>
                        </div>
                      </dl>
                      <div>
                        <Ouvrir dossier={dossier} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {page.total > 0 && (
              <nav
                aria-label="Pagination des dossiers"
                className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-4 sm:px-5"
              >
                <button
                  type="button"
                  aria-disabled={page.page <= 1 ? "true" : undefined}
                  className={`${CLASSE_BOUTON_SECONDAIRE} ${CLASSE_INACTIF}`}
                  onClick={() => {
                    if (page.page > 1) aller(page.page - 1);
                  }}
                >
                  Précédent
                </button>
                <span className="text-sm text-muted">
                  Page {page.page} sur {pagesTotal}
                </span>
                <button
                  type="button"
                  aria-disabled={page.page >= pagesTotal ? "true" : undefined}
                  className={`${CLASSE_BOUTON_SECONDAIRE} ${CLASSE_INACTIF}`}
                  onClick={() => {
                    if (page.page < pagesTotal) aller(page.page + 1);
                  }}
                >
                  Suivant
                </button>
              </nav>
            )}
          </>
        )}
      </Carte>
    </div>
  );
}
