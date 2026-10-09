"use client";

import { useState } from "react";
import {
  ChipAvancement,
  EtatEnseignant,
  heuresRestantes,
  totaux,
} from "@/components/enseignant/outils";
import { Progression } from "@/components/Progression";
import { CLASSE_BOUTON_SECONDAIRE, CLASSE_CHAMP, CLASSE_LIBELLE } from "@/components/styles";
import {
  Carte,
  CLASSE_TABLEAU,
  CLASSE_TABLEAU_DEFILANT,
  CLASSE_TD,
  CLASSE_TH,
  EnTete,
  Vide,
} from "@/components/ui";
import { useEcranLarge } from "@/hooks/useEcranLarge";
import { useEnseignantConnecte } from "@/hooks/useEnseignantConnecte";
import type { Affectation } from "@/types";

const TOUTES = "";

const CLASSE_FILTRE =
  "rounded-full border border-field px-3.5 py-1.5 text-sm font-semibold text-ink transition-colors duration-150 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-on-primary";

// Sans accents ni majuscules, pour une recherche tolérante.
function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

const volume = (a: Affectation) =>
  (a.matiere?.heuresCm ?? 0) +
  (a.matiere?.heuresTd ?? 0) +
  (a.matiere?.heuresTp ?? 0);

// Les nombres s'écrivent à la française (virgule décimale) pour que le
// tableur les reconnaisse. Une cellule de texte commençant par = + - @ ou une
// tabulation serait interprétée comme une formule : on la neutralise.
function cellule(valeur: string | number): string {
  const texte =
    typeof valeur === "number"
      ? String(valeur).replace(".", ",")
      : valeur.replace(/^([=+\-@\t\r])/, "'$1");
  return /[";\n\r]/.test(texte) ? `"${texte.replaceAll('"', '""')}"` : texte;
}

function exporterCsv(affectations: Affectation[]) {
  const lignes = [
    [
      "Matière",
      "Code",
      "Année",
      "Crédits",
      "Heures CM",
      "Heures TD",
      "Heures TP",
      "Coefficient",
      "Heures prévues",
      "Heures effectuées",
    ],
    ...affectations.map((a) => [
      a.matiere?.nom ?? "",
      a.matiere?.code ?? "",
      a.anneeAcademique?.libelle ?? "",
      a.matiere?.credits ?? "",
      a.matiere?.heuresCm ?? "",
      a.matiere?.heuresTd ?? "",
      a.matiere?.heuresTp ?? "",
      a.matiere?.coefficient ?? "",
      a.heuresPrevues,
      a.heuresEffectuees,
    ]),
  ];
  const contenu = lignes.map((ligne) => ligne.map(cellule).join(";")).join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["﻿" + contenu], { type: "text/csv;charset=utf-8" }),
  );
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = "mes-matieres.csv";
  document.body.append(lien);
  lien.click();
  lien.remove();
  URL.revokeObjectURL(url);
}

function Detail({ id, affectation: a }: { id: string; affectation: Affectation }) {
  const m = a.matiere;
  const elements = [
    ["Cours magistraux (CM)", m ? `${m.heuresCm} h` : "—"],
    ["Travaux dirigés (TD)", m ? `${m.heuresTd} h` : "—"],
    ["Travaux pratiques (TP)", m ? `${m.heuresTp} h` : "—"],
    ["Crédits", m?.credits ?? "—"],
    ["Coefficient", m?.coefficient ?? "—"],
    ["Heures restantes", `${heuresRestantes(a)} h`],
  ];
  return (
    <dl
      id={id}
      className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-6"
    >
      {elements.map(([terme, valeur]) => (
        <div key={terme}>
          <dt className="text-muted">{terme}</dt>
          <dd className="font-medium text-ink tabular-nums">{valeur}</dd>
        </div>
      ))}
    </dl>
  );
}

function Avancement({ affectation: a }: { affectation: Affectation }) {
  const nom = a.matiere?.nom ?? "Matière inconnue";
  return (
    <>
      <p className="text-sm text-ink tabular-nums">
        {a.heuresEffectuees} h sur {a.heuresPrevues} h
      </p>
      <Progression
        className="mt-1 min-w-24"
        valeur={a.heuresEffectuees}
        max={a.heuresPrevues}
        libelle={`Heures effectuées de ${nom}`}
      />
    </>
  );
}

function Bascule({
  ouvert,
  controle,
  nom,
  onClick,
}: {
  ouvert: boolean;
  controle: string;
  nom: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={ouvert}
      aria-controls={controle}
      onClick={onClick}
      className={`${CLASSE_BOUTON_SECONDAIRE} px-3 py-1.5`}
    >
      Détail<span className="sr-only"> de {nom}</span>
    </button>
  );
}

function Contenu({ affectations }: { affectations: Affectation[] }) {
  const ecranLarge = useEcranLarge();
  const [annee, setAnnee] = useState(TOUTES);
  const [recherche, setRecherche] = useState("");
  const [ouverts, setOuverts] = useState<Record<string, boolean>>({});

  const annees = [
    ...new Set(
      affectations.flatMap((a) =>
        a.anneeAcademique ? [a.anneeAcademique.libelle] : [],
      ),
    ),
  ];
  const requete = normaliser(recherche.trim());
  const visibles = affectations.filter(
    (a) =>
      (annee === TOUTES || a.anneeAcademique?.libelle === annee) &&
      (requete === "" ||
        normaliser(`${a.matiere?.nom ?? ""} ${a.matiere?.code ?? ""}`).includes(
          requete,
        )),
  );
  const total = totaux(visibles);
  const basculer = (id: string) =>
    setOuverts((courant) => ({ ...courant, [id]: !courant[id] }));

  if (affectations.length === 0) {
    return (
      <Carte>
        <Vide>Aucune matière ne vous est affectée pour le moment.</Vide>
      </Carte>
    );
  }

  return (
    <Carte>
      <div className="space-y-4 border-b border-line px-5 py-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="w-full sm:max-w-xs">
            <label htmlFor="recherche-matiere" className={`${CLASSE_LIBELLE} block`}>
              Rechercher une matière
            </label>
            <input
              id="recherche-matiere"
              type="search"
              value={recherche}
              placeholder="Nom ou code"
              onChange={(evenement) => setRecherche(evenement.target.value)}
              className={`${CLASSE_CHAMP} mt-1.5 w-full`}
            />
          </div>
          <button
            type="button"
            onClick={() => exporterCsv(visibles)}
            disabled={visibles.length === 0}
            className={CLASSE_BOUTON_SECONDAIRE}
          >
            Exporter en CSV
          </button>
        </div>
        <div role="group" aria-label="Filtrer par année" className="flex flex-wrap gap-2">
          {[TOUTES, ...annees].map((libelle) => (
            <button
              key={libelle}
              type="button"
              aria-pressed={annee === libelle}
              onClick={() => setAnnee(libelle)}
              className={CLASSE_FILTRE}
            >
              {libelle === TOUTES ? "Toutes les années" : libelle}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="text-sm text-muted">
          {visibles.length} {visibles.length > 1 ? "matières affichées" : "matière affichée"}
        </p>
      </div>

      {visibles.length === 0 ? (
        <Vide>Aucune matière ne correspond à votre recherche.</Vide>
      ) : ecranLarge ? (
        <div className={CLASSE_TABLEAU_DEFILANT}>
          <table className={CLASSE_TABLEAU}>
            <caption className="sr-only">Mes matières</caption>
            <thead>
              <tr>
                <th scope="col" className={CLASSE_TH}>Matière</th>
                <th scope="col" className={CLASSE_TH}>Année</th>
                <th scope="col" className={`${CLASSE_TH} text-right`}>Crédits</th>
                <th scope="col" className={`${CLASSE_TH} text-right`}>Coefficient</th>
                <th scope="col" className={`${CLASSE_TH} text-right`}>Volume</th>
                <th scope="col" className={CLASSE_TH}>Avancement</th>
                <th scope="col" className={CLASSE_TH}>
                  <span className="sr-only">Détail</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((a) => {
                const idDetail = `detail-${a.id}`;
                const ouvert = ouverts[a.id] === true;
                const nom = a.matiere?.nom ?? "Matière inconnue";
                return [
                  <tr key={a.id}>
                    <td className={CLASSE_TD}>
                      <span className="font-semibold">{nom}</span>
                      {a.matiere && (
                        <span className="block font-mono text-xs text-muted">
                          {a.matiere.code}
                        </span>
                      )}
                    </td>
                    <td className={`${CLASSE_TD} whitespace-nowrap`}>
                      {a.anneeAcademique?.libelle ?? "—"}
                    </td>
                    <td className={`${CLASSE_TD} text-right tabular-nums`}>
                      {a.matiere?.credits ?? "—"}
                    </td>
                    <td className={`${CLASSE_TD} text-right tabular-nums`}>
                      {a.matiere?.coefficient ?? "—"}
                    </td>
                    <td className={`${CLASSE_TD} text-right whitespace-nowrap tabular-nums`}>
                      {a.matiere ? `${volume(a)} h` : "—"}
                    </td>
                    <td className={CLASSE_TD}>
                      <Avancement affectation={a} />
                    </td>
                    <td className={CLASSE_TD}>
                      <Bascule
                        ouvert={ouvert}
                        controle={idDetail}
                        nom={nom}
                        onClick={() => basculer(a.id)}
                      />
                    </td>
                  </tr>,
                  ouvert && (
                    <tr key={`${a.id}-detail`}>
                      <td colSpan={7} className="border-b border-line bg-wash px-5 py-4">
                        <Detail id={idDetail} affectation={a} />
                      </td>
                    </tr>
                  ),
                ];
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {visibles.map((a) => {
            const idDetail = `detail-${a.id}`;
            const ouvert = ouverts[a.id] === true;
            const nom = a.matiere?.nom ?? "Matière inconnue";
            return (
              <li key={a.id} className="flex flex-col gap-3 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{nom}</p>
                    {a.matiere && (
                      <p className="font-mono text-xs text-muted">{a.matiere.code}</p>
                    )}
                  </div>
                  <ChipAvancement affectation={a} />
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-muted">Année</dt>
                    <dd className="font-medium text-ink">
                      {a.anneeAcademique?.libelle ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Volume</dt>
                    <dd className="font-medium text-ink tabular-nums">
                      {a.matiere ? `${volume(a)} h` : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Crédits</dt>
                    <dd className="font-medium text-ink tabular-nums">
                      {a.matiere?.credits ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Coefficient</dt>
                    <dd className="font-medium text-ink tabular-nums">
                      {a.matiere?.coefficient ?? "—"}
                    </dd>
                  </div>
                </dl>
                <div>
                  <Avancement affectation={a} />
                </div>
                <div>
                  <Bascule
                    ouvert={ouvert}
                    controle={idDetail}
                    nom={nom}
                    onClick={() => basculer(a.id)}
                  />
                </div>
                {ouvert && <Detail id={idDetail} affectation={a} />}
              </li>
            );
          })}
        </ul>
      )}

      {visibles.length > 0 && (
        <p className="border-t border-line px-5 py-3 text-sm font-semibold text-ink tabular-nums">
          Total : {total.credits} crédits · {total.prevues} h prévues ·{" "}
          {total.effectuees} h effectuées
        </p>
      )}
    </Carte>
  );
}

export default function EnseignantMatieresPage() {
  const etat = useEnseignantConnecte();

  return (
    <div>
      <EnTete
        titre="Mes matières"
        texte="Les matières qui vous sont affectées, avec leur volume horaire et l'avancement."
      />
      <div className="mt-6">
        <EtatEnseignant etat={etat} sujet="Vos matières">
          {(_enseignant, affectations) => <Contenu affectations={affectations} />}
        </EtatEnseignant>
      </div>
    </div>
  );
}
