"use client";

import { useState } from "react";
import {
  CLASSE_TITRE_CARTE,
  Champ,
  etatDuDossier,
  initiales,
  nomComplet,
  urlPhotoValide,
} from "@/components/etudiant/commun";
import { CLASSE_BOUTON_PRINCIPAL } from "@/components/styles";
import {
  BadgeInscription,
  Carte,
  EnTete,
  formaterDate,
  Vide,
} from "@/components/ui";
import { useEtudiantConnecte } from "@/hooks/useEtudiantConnecte";
import { useAuthStore } from "@/stores/authStore";

const CLASSE_FICHE = "grid gap-x-8 gap-y-4 px-5 py-5 sm:grid-cols-2";

// Photo de l'étudiant ; ses initiales si elle manque ou ne se charge pas.
function Avatar({ nom, photo }: { nom: string; photo: string | null }) {
  const [enEchec, setEnEchec] = useState(false);

  if (photo && !enEchec) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL externe quelconque
      <img
        src={photo}
        alt={`Photo de ${nom}`}
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
        onError={() => setEnEchec(true)}
        className="size-20 shrink-0 rounded-full border border-line object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary font-display text-2xl font-semibold text-on-primary print:border print:border-ink print:bg-white print:text-ink"
    >
      {initiales(nom)}
    </span>
  );
}

export default function EtudiantDossierPage() {
  const user = useAuthStore((etat) => etat.user);
  const etat = useEtudiantConnecte();
  const { etudiant, inscriptionCourante } = etat;

  const entete = (
    <EnTete
      titre="Mon dossier"
      texte="Vos informations d'identité et votre inscription en cours."
      actions={
        etudiant && (
          <button
            type="button"
            onClick={() => window.print()}
            className={`${CLASSE_BOUTON_PRINCIPAL} print:hidden`}
          >
            Imprimer ma fiche
          </button>
        )
      }
    />
  );
  const bloquant = etatDuDossier(etat, "Votre dossier");
  if (bloquant || !etudiant) {
    return (
      <>
        {entete}
        {bloquant}
      </>
    );
  }

  const nom = nomComplet(etudiant, user ?? undefined);
  const photo = urlPhotoValide(etudiant.photoUrl);

  return (
    <>
      <p className="hidden font-display text-xl font-semibold text-ink print:block">
        Fiche étudiant — ANANSI
        <span className="block text-sm font-normal text-muted">
          Éditée le {formaterDate(new Date().toISOString())}
        </span>
      </p>
      {entete}

      <Carte className="mt-6">
        <h2 className={CLASSE_TITRE_CARTE}>Identité</h2>
        <div className="flex flex-col gap-5 px-5 pt-5 sm:flex-row sm:items-center">
          <Avatar nom={nom} photo={photo} />
          <p className="font-display text-xl font-semibold break-words text-ink">
            {nom}
          </p>
        </div>
        <dl className={CLASSE_FICHE}>
          <Champ libelle="Matricule">
            <span className="font-mono">{etudiant.matricule}</span>
          </Champ>
          <Champ libelle="Nom complet">{nom}</Champ>
          <Champ libelle="E-mail">
            {etudiant.user?.email ?? user?.email ?? "—"}
          </Champ>
          <Champ libelle="Date de naissance">
            {formaterDate(etudiant.dateNaissance, { calendaire: true })}
          </Champ>
          <Champ libelle="Lieu de naissance">{etudiant.lieuNaissance}</Champ>
          <Champ libelle="Nationalité">{etudiant.nationalite}</Champ>
        </dl>
      </Carte>

      <Carte className="mt-6">
        <h2 className={CLASSE_TITRE_CARTE}>Inscription en cours</h2>
        {inscriptionCourante ? (
          <dl className={CLASSE_FICHE}>
            <Champ libelle="Niveau">
              {inscriptionCourante.niveau?.nom ?? "—"}
            </Champ>
            <Champ libelle="Année académique">
              {inscriptionCourante.anneeAcademique?.libelle ?? "—"}
            </Champ>
            <Champ libelle="Date d'inscription">
              {formaterDate(inscriptionCourante.dateInscription)}
            </Champ>
            <Champ libelle="Statut">
              <BadgeInscription statut={inscriptionCourante.statut} />
            </Champ>
            <Champ libelle="Frais payés">
              {inscriptionCourante.fraisPayes ? "Oui" : "Non"}
            </Champ>
          </dl>
        ) : (
          <Vide>Vous n&apos;avez pas encore d&apos;inscription.</Vide>
        )}
      </Carte>
    </>
  );
}
