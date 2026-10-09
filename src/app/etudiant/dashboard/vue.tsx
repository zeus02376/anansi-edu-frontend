"use client";

import type { ReactNode } from "react";
import {
  BadgeInscription,
  Carte,
  Chargement,
  EnTete,
  Erreur,
  formaterDate,
  Vide,
} from "@/components/ui";
import { useRessource } from "@/hooks/useRessource";
import { MESSAGE_ACCES_REFUSE } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import type { Etudiant, Inscription } from "@/types";

const CLASSE_TITRE_CARTE =
  "border-b border-line px-5 py-4 font-display text-lg font-semibold text-ink";
const CLASSE_FICHE = "grid gap-x-8 gap-y-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3";

// Le backend réserve aujourd'hui /etudiants et /inscriptions aux profils
// administration et scolarité : un étudiant reçoit un 403 en demandant ses
// propres données.
function AvisAccesLimite({ sujet }: { sujet: string }) {
  return (
    <div
      role="status"
      className="m-5 rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-ink"
    >
      <p className="font-semibold">{sujet} n&apos;est pas encore consultable ici.</p>
      <p className="mt-1 text-muted">
        Le serveur n&apos;autorise pas encore le profil étudiant à lire ses
        propres données. En attendant, le service de scolarité de votre
        établissement peut vous les communiquer.
      </p>
    </div>
  );
}

function Echec({
  message,
  sujet,
  onReessayer,
}: {
  message: string;
  sujet: string;
  onReessayer: () => void;
}) {
  if (message === MESSAGE_ACCES_REFUSE) return <AvisAccesLimite sujet={sujet} />;
  return (
    <div className="p-5">
      <Erreur message={message} onReessayer={onReessayer} />
    </div>
  );
}

function Champ({ libelle, children }: { libelle: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-muted">{libelle}</dt>
      <dd className="mt-0.5 font-semibold break-words text-ink">{children}</dd>
    </div>
  );
}

export default function EtudiantDashboardPage() {
  const user = useAuthStore((etat) => etat.user);
  const etudiants = useRessource<Etudiant[]>("/etudiants");
  const etudiant =
    etudiants.donnees?.find((candidat) => candidat.userId === user?.id) ?? null;
  // Second appel en attente tant que le dossier étudiant n'est pas connu.
  const inscriptions = useRessource<Inscription[]>(
    etudiant ? "/inscriptions" : null,
  );
  // Le backend renvoie les inscriptions de la plus récente à la plus ancienne.
  const mesInscriptions = inscriptions.donnees?.filter(
    (inscription) => inscription.etudiantId === etudiant?.id,
  );

  const prenom = user?.prenom ?? etudiant?.user?.prenom;

  function dossier() {
    if (etudiants.chargement) {
      return <Chargement texte="Chargement de votre dossier…" />;
    }
    if (etudiants.erreur) {
      return (
        <Echec
          message={etudiants.erreur}
          sujet="Votre dossier"
          onReessayer={etudiants.recharger}
        />
      );
    }
    if (!etudiant) {
      return (
        <Vide>
          Aucun dossier étudiant n&apos;est rattaché à votre compte. Le service
          de scolarité peut vérifier votre situation.
        </Vide>
      );
    }
    return (
      <dl className={CLASSE_FICHE}>
        <Champ libelle="Matricule">
          <span className="font-mono">{etudiant.matricule}</span>
        </Champ>
        <Champ libelle="Nom">
          {etudiant.user
            ? `${etudiant.user.prenom} ${etudiant.user.nom}`
            : "—"}
        </Champ>
        <Champ libelle="E-mail">{etudiant.user?.email ?? "—"}</Champ>
        <Champ libelle="Date de naissance">
          {formaterDate(etudiant.dateNaissance, { calendaire: true })}
        </Champ>
        <Champ libelle="Lieu de naissance">{etudiant.lieuNaissance}</Champ>
        <Champ libelle="Nationalité">{etudiant.nationalite}</Champ>
      </dl>
    );
  }

  function inscription() {
    if (inscriptions.erreur) {
      return (
        <Echec
          message={inscriptions.erreur}
          sujet="Votre inscription"
          onReessayer={inscriptions.recharger}
        />
      );
    }
    if (!mesInscriptions) {
      return <Chargement texte="Chargement de votre inscription…" />;
    }
    if (mesInscriptions.length === 0) {
      return (
        <Vide>
          Vous n&apos;avez pas encore d&apos;inscription enregistrée. Le service
          de scolarité l&apos;ajoutera à votre dossier.
        </Vide>
      );
    }
    return (
      <ul className="divide-y divide-line">
        {mesInscriptions.map((element) => (
          <li key={element.id}>
            <dl className={CLASSE_FICHE}>
              <Champ libelle="Niveau">{element.niveau?.nom ?? "—"}</Champ>
              <Champ libelle="Année académique">
                {element.anneeAcademique?.libelle ?? "—"}
              </Champ>
              <Champ libelle="Date d'inscription">
                {formaterDate(element.dateInscription)}
              </Champ>
              <Champ libelle="Statut">
                <BadgeInscription statut={element.statut} />
              </Champ>
              <Champ libelle="Frais payés">
                {element.fraisPayes ? "Oui" : "Non"}
              </Champ>
            </dl>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div>
      <EnTete
        titre="Tableau de bord"
        texte={
          prenom
            ? `Bonjour ${prenom}, voici votre dossier et votre inscription.`
            : "Votre dossier et votre inscription."
        }
      />

      <Carte className="mt-6">
        <h2 className={CLASSE_TITRE_CARTE}>Mon dossier</h2>
        {dossier()}
      </Carte>

      {/* Sans dossier, il n'y a pas d'inscription à chercher. */}
      {etudiant && (
        <Carte className="mt-6">
          <h2 className={CLASSE_TITRE_CARTE}>
            {mesInscriptions && mesInscriptions.length > 1
              ? "Mes inscriptions"
              : "Mon inscription"}
          </h2>
          {inscription()}
        </Carte>
      )}
    </div>
  );
}
