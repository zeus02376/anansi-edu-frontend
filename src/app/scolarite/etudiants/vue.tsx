"use client";

import { useState } from "react";
import { CLASSE_CHAMP, CLASSE_LIBELLE } from "@/components/styles";
import {
  BadgeInscription,
  Carte,
  Chargement,
  CLASSE_TABLEAU,
  CLASSE_TABLEAU_DEFILANT,
  CLASSE_TD,
  CLASSE_TH,
  EnTete,
  Erreur,
  formaterDate,
  Vide,
} from "@/components/ui";
import { useRessource } from "@/hooks/useRessource";
import type { Etudiant, Inscription } from "@/types";

// Minuscules et sans accents : « Élodie » se trouve en tapant « elodie ».
function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function nomComplet(etudiant: Etudiant): string {
  if (!etudiant.user) return "—";
  return `${etudiant.user.prenom} ${etudiant.user.nom}`;
}

function derniereInscription(etudiant: Etudiant): Inscription | null {
  const inscriptions = etudiant.inscriptions ?? [];
  if (inscriptions.length === 0) return null;
  return inscriptions.reduce((recente, inscription) =>
    inscription.dateInscription > recente.dateInscription
      ? inscription
      : recente,
  );
}

export default function ScolariteEtudiantsPage() {
  const { donnees, erreur, chargement, recharger } =
    useRessource<Etudiant[]>("/etudiants");
  const [recherche, setRecherche] = useState("");

  const etudiants = donnees ?? [];
  const terme = normaliser(recherche);
  const resultats = terme
    ? etudiants.filter((etudiant) =>
        normaliser(
          `${nomComplet(etudiant)} ${etudiant.user?.email ?? ""} ${etudiant.matricule}`,
        ).includes(terme),
      )
    : etudiants;

  return (
    <div>
      <EnTete
        titre="Étudiants"
        texte="Les étudiants de l'établissement et l'état de leur dernière inscription."
      />

      <Carte className="mt-6">
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1.5 sm:w-80">
            <label htmlFor="recherche" className={CLASSE_LIBELLE}>
              Rechercher un étudiant
            </label>
            <input
              id="recherche"
              type="search"
              value={recherche}
              onChange={(evenement) => setRecherche(evenement.target.value)}
              placeholder="Nom, e-mail ou matricule"
              autoComplete="off"
              className={`${CLASSE_CHAMP} w-full`}
            />
          </div>
          {donnees && (
            <p role="status" className="text-sm text-muted">
              {resultats.length} étudiant{resultats.length > 1 ? "s" : ""}
              {terme && ` sur ${etudiants.length}`}
            </p>
          )}
        </div>

        {chargement ? (
          <Chargement texte="Chargement des étudiants…" />
        ) : erreur ? (
          <div className="p-5">
            <Erreur message={erreur} onReessayer={recharger} />
          </div>
        ) : etudiants.length === 0 ? (
          <Vide>
            Aucun étudiant pour le moment. Un étudiant est créé à partir
            d&apos;une candidature acceptée.
          </Vide>
        ) : resultats.length === 0 ? (
          <Vide>Aucun étudiant ne correspond à « {recherche.trim()} ».</Vide>
        ) : (
          <div className={CLASSE_TABLEAU_DEFILANT}>
            <table className={CLASSE_TABLEAU}>
              <caption className="sr-only">Liste des étudiants</caption>
              <thead>
                <tr>
                  <th scope="col" className={CLASSE_TH}>
                    Matricule
                  </th>
                  <th scope="col" className={CLASSE_TH}>
                    Nom complet
                  </th>
                  <th scope="col" className={CLASSE_TH}>
                    E-mail
                  </th>
                  <th scope="col" className={CLASSE_TH}>
                    Nationalité
                  </th>
                  <th scope="col" className={CLASSE_TH}>
                    Date de naissance
                  </th>
                  <th scope="col" className={`${CLASSE_TH} text-right`}>
                    Inscriptions
                  </th>
                  <th scope="col" className={CLASSE_TH}>
                    Dernière inscription
                  </th>
                </tr>
              </thead>
              <tbody>
                {resultats.map((etudiant) => {
                  const derniere = derniereInscription(etudiant);
                  return (
                    <tr key={etudiant.id}>
                      <td className={`${CLASSE_TD} font-mono whitespace-nowrap`}>
                        {etudiant.matricule}
                      </td>
                      <td className={`${CLASSE_TD} font-semibold`}>
                        {nomComplet(etudiant)}
                      </td>
                      <td className={CLASSE_TD}>
                        {etudiant.user?.email ?? "—"}
                      </td>
                      <td className={CLASSE_TD}>{etudiant.nationalite}</td>
                      <td className={`${CLASSE_TD} whitespace-nowrap`}>
                        {formaterDate(etudiant.dateNaissance, { calendaire: true })}
                      </td>
                      <td className={`${CLASSE_TD} text-right tabular-nums`}>
                        {etudiant.inscriptions?.length ?? 0}
                      </td>
                      <td className={CLASSE_TD}>
                        {derniere ? (
                          <BadgeInscription statut={derniere.statut} />
                        ) : (
                          <span className="text-muted">Aucune inscription</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Carte>
    </div>
  );
}
