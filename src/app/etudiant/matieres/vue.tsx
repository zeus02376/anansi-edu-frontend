"use client";

import { Fragment, useState } from "react";
import { EchecDeChargement } from "@/components/AccesLimite";
import { etatDuDossier } from "@/components/etudiant/commun";
import { Progression } from "@/components/Progression";
import { CLASSE_CHAMP, CLASSE_LIBELLE } from "@/components/styles";
import {
  Carte,
  Chargement,
  CLASSE_TABLEAU,
  CLASSE_TABLEAU_DEFILANT,
  CLASSE_TD,
  CLASSE_TH,
  EnTete,
  Vide,
} from "@/components/ui";
import { useEcranLarge } from "@/hooks/useEcranLarge";
import { useEtudiantConnecte } from "@/hooks/useEtudiantConnecte";
import type { Matiere } from "@/types";

const COLONNES = [
  "Matière",
  "Crédits",
  "CM",
  "TD",
  "TP",
  "Coefficient",
  "Volume horaire",
];

const CLASSE_BASCULE =
  "rounded-sm text-sm font-semibold text-ink underline decoration-primary decoration-2 underline-offset-4 hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

// Recherche sans tenir compte des accents ni de la casse.
function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function volume(matiere: Matiere): number {
  return matiere.heuresCm + matiere.heuresTd + matiere.heuresTp;
}

function Detail({ matiere }: { matiere: Matiere }) {
  const total = volume(matiere);
  const parts = [
    ["Cours magistraux (CM)", matiere.heuresCm],
    ["Travaux dirigés (TD)", matiere.heuresTd],
    ["Travaux pratiques (TP)", matiere.heuresTp],
  ] as const;
  return (
    <ul className="grid gap-4 sm:grid-cols-3">
      {parts.map(([libelle, heures]) => (
        <li key={libelle}>
          <p className="flex justify-between gap-2 text-sm text-ink">
            <span>{libelle}</span>
            <span className="font-semibold tabular-nums">{heures} h</span>
          </p>
          <Progression
            valeur={heures}
            max={total}
            libelle={`${libelle} de ${matiere.nom} sur le volume horaire total`}
            className="mt-1.5"
          />
        </li>
      ))}
    </ul>
  );
}

function Bascule({
  matiere,
  ouvert,
  onBasculer,
}: {
  matiere: Matiere;
  ouvert: boolean;
  onBasculer: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={ouvert}
      aria-controls={`detail-${matiere.id}`}
      onClick={onBasculer}
      className={CLASSE_BASCULE}
    >
      {ouvert ? "Masquer le détail" : "Détail"}
      <span className="sr-only"> de {matiere.nom}</span>
    </button>
  );
}

export default function EtudiantMatieresPage() {
  const etat = useEtudiantConnecte();
  const { etudiant, inscriptionCourante, matieres } = etat;
  const ecranLarge = useEcranLarge();
  const [recherche, setRecherche] = useState("");
  const [ouvertes, setOuvertes] = useState<string[]>([]);

  const niveau = inscriptionCourante?.niveau?.nom;
  const annee = inscriptionCourante?.anneeAcademique?.libelle;
  const entete = (
    <EnTete
      titre="Mes matières"
      texte={
        inscriptionCourante
          ? `Programme de ${niveau ?? "votre niveau"}${annee ? `, année ${annee}` : ""}.`
          : "Les matières de votre niveau."
      }
    />
  );
  const bloquant = etatDuDossier(etat, "Vos matières");
  if (bloquant || !etudiant) {
    return (
      <>
        {entete}
        {bloquant}
      </>
    );
  }

  function contenu() {
    if (!inscriptionCourante) {
      return (
        <Vide>
          Aucune inscription : les matières de votre niveau apparaîtront ici.
        </Vide>
      );
    }
    if (matieres.erreur) {
      return (
        <div className="p-5">
          <EchecDeChargement
            message={matieres.erreur}
            sujet="La liste de vos matières"
            profil="étudiant"
            onReessayer={etat.recharger}
          />
        </div>
      );
    }
    if (!matieres.donnees) {
      return <Chargement texte="Chargement de vos matières…" />;
    }
    if (matieres.donnees.length === 0) {
      return (
        <Vide>Aucune matière n&apos;est encore programmée pour votre niveau.</Vide>
      );
    }

    const critere = normaliser(recherche.trim());
    const visibles = matieres.donnees.filter(
      (m) =>
        !critere ||
        normaliser(m.nom).includes(critere) ||
        normaliser(m.code).includes(critere),
    );
    const somme = (lire: (m: Matiere) => number) =>
      visibles.reduce((total, m) => total + lire(m), 0);
    const basculer = (id: string) =>
      setOuvertes((liste) =>
        liste.includes(id) ? liste.filter((i) => i !== id) : [...liste, id],
      );

    return (
      <>
        <div className="border-b border-line px-5 py-4">
          <label htmlFor="recherche-matiere" className={CLASSE_LIBELLE}>
            Rechercher une matière
          </label>
          <input
            id="recherche-matiere"
            type="search"
            value={recherche}
            placeholder="Nom ou code"
            autoComplete="off"
            onChange={(evenement) => setRecherche(evenement.target.value)}
            className={`${CLASSE_CHAMP} mt-1.5 w-full sm:max-w-sm`}
          />
          <p aria-live="polite" className="mt-3 text-sm text-muted">
            {visibles.length} sur {matieres.donnees.length}{" "}
            {matieres.donnees.length > 1
              ? "matières affichées"
              : "matière affichée"}
          </p>
        </div>

        {visibles.length === 0 ? (
          <Vide>Aucune matière ne correspond à votre recherche.</Vide>
        ) : (
          <>
            {ecranLarge ? (
              <div className={CLASSE_TABLEAU_DEFILANT}>
                <table className={CLASSE_TABLEAU}>
                  <caption className="sr-only">
                    Matières de votre niveau
                  </caption>
                  <thead>
                    <tr>
                      {COLONNES.map((colonne) => (
                        <th key={colonne} scope="col" className={CLASSE_TH}>
                          {colonne}
                        </th>
                      ))}
                      <th scope="col" className={CLASSE_TH}>
                        <span className="sr-only">Détail</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibles.map((m) => {
                      const ouvert = ouvertes.includes(m.id);
                      return (
                        <Fragment key={m.id}>
                          <tr>
                            <th
                              scope="row"
                              className={`${CLASSE_TD} text-left font-normal`}
                            >
                              <span className="block font-semibold">{m.nom}</span>
                              <span className="block font-mono text-muted">
                                {m.code}
                              </span>
                            </th>
                            <td className={CLASSE_TD}>{m.credits}</td>
                            <td className={CLASSE_TD}>{m.heuresCm} h</td>
                            <td className={CLASSE_TD}>{m.heuresTd} h</td>
                            <td className={CLASSE_TD}>{m.heuresTp} h</td>
                            <td className={CLASSE_TD}>{m.coefficient}</td>
                            <td className={`${CLASSE_TD} whitespace-nowrap`}>
                              {volume(m)} h
                            </td>
                            <td className={CLASSE_TD}>
                              <Bascule
                                matiere={m}
                                ouvert={ouvert}
                                onBasculer={() => basculer(m.id)}
                              />
                            </td>
                          </tr>
                          {ouvert && (
                            <tr id={`detail-${m.id}`}>
                              <td
                                colSpan={COLONNES.length + 1}
                                className="border-b border-line bg-wash px-5 py-4"
                              >
                                <Detail matiere={m} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {visibles.map((m) => {
                  const ouvert = ouvertes.includes(m.id);
                  return (
                    <li key={m.id} className="flex flex-col gap-3 px-4 py-4">
                      <div>
                        <p className="font-semibold break-words text-ink">
                          {m.nom}
                        </p>
                        <p className="font-mono text-sm text-muted">{m.code}</p>
                      </div>
                      <dl className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
                        {[
                          ["Crédits", `${m.credits}`],
                          ["Coefficient", `${m.coefficient}`],
                          ["Volume", `${volume(m)} h`],
                        ].map(([libelle, valeur]) => (
                          <div key={libelle}>
                            <dt className="text-muted">{libelle}</dt>
                            <dd className="font-medium text-ink">{valeur}</dd>
                          </div>
                        ))}
                      </dl>
                      <div>
                        <Bascule
                          matiere={m}
                          ouvert={ouvert}
                          onBasculer={() => basculer(m.id)}
                        />
                      </div>
                      {ouvert && (
                        <div id={`detail-${m.id}`} className="rounded-md bg-wash p-4">
                          <Detail matiere={m} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="border-t border-line px-5 py-4 text-sm font-semibold text-ink">
              Total affiché : {somme((m) => m.credits)} crédits ·{" "}
              {somme((m) => m.heuresCm)} h de CM · {somme((m) => m.heuresTd)} h
              de TD · {somme((m) => m.heuresTp)} h de TP · {somme(volume)} h au
              total
            </p>
          </>
        )}
      </>
    );
  }

  return (
    <>
      {entete}
      <Carte className="mt-6">{contenu()}</Carte>
    </>
  );
}
