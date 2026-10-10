"use client";

import Link from "next/link";
import { ApiError } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { EtatErreur } from "@/components/EtatErreur";
import { CLASSE_LIEN } from "@/components/styles";
import { Carte, Chargement, EnTete, formaterDate } from "@/components/ui";
import { CommentairesDossier } from "@/components/dossier/CommentairesDossier";
import { DecisionsDossier } from "@/components/dossier/DecisionsDossier";
import { DocumentsDossier } from "@/components/dossier/DocumentsDossier";
import { HistoriqueDossier } from "@/components/dossier/HistoriqueDossier";
import { BadgeDoublon, BadgeStatutDossier } from "@/components/dossier/outils";
import { LIBELLE_SEXE } from "@/modules/commun/schemas";
import { lireDossier, lireHistorique } from "@/modules/dossier/api";
import { idDossierSchema, type Dossier } from "@/modules/dossier/schemas";

const LIEN_RETOUR = (
  <Link href="/scolarite" className={CLASSE_LIEN}>
    Retour à la liste
  </Link>
);

function Introuvable() {
  return (
    <div className="flex flex-col gap-6">
      <EnTete titre="Dossier" actions={LIEN_RETOUR} />
      <Carte className="px-5 py-8">
        <p role="alert" className="text-ink">
          Ce dossier est introuvable.
        </p>
      </Carte>
    </div>
  );
}

function Champ({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-muted">{libelle}</dt>
      <dd className="break-words text-ink">{valeur}</dd>
    </div>
  );
}

function Resume({ dossier }: { dossier: Dossier }) {
  const { candidat, programme } = dossier;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Carte>
        <h2 className="border-b border-line px-5 py-4 font-display text-lg font-semibold text-ink">
          Candidat
        </h2>
        <dl className="grid gap-4 px-5 py-4 sm:grid-cols-2">
          <Champ libelle="Nom" valeur={candidat.nom} />
          <Champ libelle="Prénom" valeur={candidat.prenom} />
          <Champ libelle="E-mail" valeur={candidat.email} />
          <Champ libelle="Téléphone" valeur={candidat.telephone} />
          <Champ
            libelle="Date de naissance"
            valeur={formaterDate(candidat.dateNaissance, { calendaire: true })}
          />
          <Champ libelle="Sexe" valeur={LIBELLE_SEXE[candidat.sexe]} />
          <div className="sm:col-span-2">
            <Champ libelle="Adresse" valeur={candidat.adresse} />
          </div>
        </dl>
      </Carte>
      <Carte>
        <h2 className="border-b border-line px-5 py-4 font-display text-lg font-semibold text-ink">
          Formation
        </h2>
        <dl className="grid gap-4 px-5 py-4 sm:grid-cols-2">
          <Champ libelle="Programme" valeur={programme.nom} />
          <Champ libelle="Niveau" valeur={programme.niveau} />
        </dl>
      </Carte>
    </div>
  );
}

export default function DossierVue({ id }: { id: string }) {
  // L'identifiant de l'URL est vérifié avant tout appel au serveur.
  const lecture = idDossierSchema.safeParse(id);
  const idValide = lecture.success ? lecture.data : null;
  // Deux appels indépendants : chacun a son état.
  const dossier = useApi(
    idValide ? (signal) => lireDossier(idValide, signal) : null,
    `dossier-${idValide}`,
  );
  const historique = useApi(
    idValide ? (signal) => lireHistorique(idValide, signal) : null,
    `historique-${idValide}`,
  );

  if (!idValide) return <Introuvable />;
  const { donnees } = dossier;

  if (dossier.erreur) {
    if (dossier.erreur instanceof ApiError && dossier.erreur.nature === "introuvable") {
      return <Introuvable />;
    }
    return (
      <div className="flex flex-col gap-6">
        <EnTete titre="Dossier" actions={LIEN_RETOUR} />
        <EtatErreur erreur={dossier.erreur} onReessayer={dossier.recharger} sujet="Le dossier" />
      </div>
    );
  }
  if (!donnees) {
    return (
      <div className="flex flex-col gap-6">
        <EnTete titre="Dossier" actions={LIEN_RETOUR} />
        <Carte>
          <Chargement texte="Chargement du dossier…" />
        </Carte>
      </div>
    );
  }

  // Après une écriture, tout revient du serveur : rien n'est calculé ici.
  const rechargerTout = () => {
    dossier.recharger();
    historique.recharger();
  };

  return (
    <div className="flex flex-col gap-6">
      <EnTete titre={`Dossier ${donnees.numeroDossier}`} actions={LIEN_RETOUR} />
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
        <BadgeStatutDossier statut={donnees.statut} />
        {donnees.doublonPossible && <BadgeDoublon />}
        <span>
          Soumis le{" "}
          <time dateTime={donnees.soumisLe}>{formaterDate(donnees.soumisLe)}</time>
        </span>
      </div>
      <Resume dossier={donnees} />
      <DocumentsDossier
        idDossier={donnees.id}
        documents={donnees.documents}
        onChange={rechargerTout}
      />
      <CommentairesDossier
        idDossier={donnees.id}
        commentaires={donnees.commentaires}
        onChange={rechargerTout}
      />
      <DecisionsDossier
        idDossier={donnees.id}
        numero={donnees.numeroDossier}
        onDecision={rechargerTout}
      />
      <HistoriqueDossier
        evenements={historique.donnees}
        chargement={historique.chargement}
        erreur={historique.erreur}
        onReessayer={historique.recharger}
      />
    </div>
  );
}
