"use client";

import Link from "next/link";
import { EchecDeChargement } from "@/components/AccesLimite";
import {
  CLASSE_TITRE_CARTE,
  etatDuDossier,
  nomComplet,
  type EtatEtudiant,
} from "@/components/etudiant/commun";
import { Inclinable } from "@/components/Inclinable";
import { Logo } from "@/components/Logo";
import { Nombre } from "@/components/Nombre";
import { CLASSE_LIEN } from "@/components/styles";
import {
  Carte,
  Chargement,
  EnTete,
  LIBELLE_STATUT_INSCRIPTION,
  Vide,
} from "@/components/ui";
import { useEtudiantConnecte } from "@/hooks/useEtudiantConnecte";
import { useAuthStore } from "@/stores/authStore";
import type { Etudiant, Inscription, StatutInscription } from "@/types";

const MESSAGE_STATUT: Record<StatutInscription, string> = {
  EN_ATTENTE: "Votre inscription est en attente de validation par la scolarité.",
  VALIDE: "Votre inscription est validée.",
  REJETE:
    "Votre inscription a été rejetée. Rapprochez-vous de la scolarité pour en connaître la raison.",
  SUSPENDU:
    "Votre inscription est suspendue. Rapprochez-vous de la scolarité pour la régulariser.",
};

const CLASSE_STATUT: Record<StatutInscription, string> = {
  EN_ATTENTE: "border-amber-600/40 bg-amber-500/10 text-amber-900",
  VALIDE: "border-primary/30 bg-primary/5 text-ink",
  REJETE: "border-red-600/40 bg-red-600/10 text-red-800",
  SUSPENDU: "border-red-600/40 bg-red-600/10 text-red-800",
};

const CLASSE_CARTE_STAT =
  "flex h-full min-h-36 flex-col gap-2 rounded-xl border border-line bg-surface px-5 py-5 shadow-[0_1px_2px_rgb(15_23_42/0.04),0_14px_32px_-18px_rgb(15_23_42/0.14)]";

function CarteEtudiant({
  etudiant,
  nom,
  inscription,
}: {
  etudiant: Etudiant;
  nom: string;
  inscription: Inscription | null;
}) {
  return (
    <Inclinable className="rounded-2xl bg-primary p-6 text-on-primary shadow-[0_18px_40px_-20px_rgb(30_64_175/0.7)] sm:p-7">
      <section aria-label="Carte d'étudiant">
        <div className="flex items-start justify-between gap-4">
          <Logo className="text-lg" />
          <span className="rounded-full border border-white/50 px-3 py-0.5 text-xs font-semibold">
            {inscription
              ? LIBELLE_STATUT_INSCRIPTION[inscription.statut]
              : "Sans inscription"}
          </span>
        </div>
        <p className="mt-8 font-mono text-sm tracking-widest">
          {etudiant.matricule}
        </p>
        <p className="mt-1 font-display text-2xl font-semibold break-words">
          {nom}
        </p>
        <p className="mt-2 text-sm text-on-primary/90">
          {inscription
            ? [inscription.niveau?.nom, inscription.anneeAcademique?.libelle]
                .filter(Boolean)
                .join(" · ") || "—"
            : "Aucun niveau pour le moment"}
        </p>
      </section>
    </Inclinable>
  );
}

function Statut({ inscription }: { inscription: Inscription | null }) {
  if (!inscription) {
    return (
      <div
        role="status"
        className="rounded-md border border-line bg-wash px-4 py-3 text-sm text-ink"
      >
        Vous n&apos;avez pas encore d&apos;inscription.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div
        role="status"
        className={`rounded-md border px-4 py-3 text-sm font-semibold ${CLASSE_STATUT[inscription.statut]}`}
      >
        {MESSAGE_STATUT[inscription.statut]}
      </div>
      {!inscription.fraisPayes && (
        <div
          role="status"
          className="rounded-md border border-amber-600/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900"
        >
          Les frais de scolarité ne sont pas encore réglés. Rapprochez-vous de
          la scolarité.
        </div>
      )}
    </div>
  );
}

function Chiffre({
  libelle,
  valeur,
  attente,
}: {
  libelle: string;
  // null : donnée indisponible, affichée comme un tiret.
  valeur: number | null;
  attente?: boolean;
}) {
  return (
    <li>
      <Inclinable className={CLASSE_CARTE_STAT}>
        <p className="text-sm font-semibold text-muted">{libelle}</p>
        <p className="font-display text-4xl font-semibold tracking-tight text-primary tabular-nums">
          {valeur !== null ? (
            <Nombre valeur={valeur} />
          ) : attente ? (
            <>
              <span aria-hidden="true" className="text-muted">
                …
              </span>
              <span className="sr-only">Chargement…</span>
            </>
          ) : (
            <>
              <span aria-hidden="true">—</span>
              <span className="sr-only">Non disponible</span>
            </>
          )}
        </p>
      </Inclinable>
    </li>
  );
}

function ApercuMatieres({ matieres, recharger }: Pick<EtatEtudiant, "matieres" | "recharger">) {
  const { donnees, chargement, erreur } = matieres;
  if (erreur) {
    return (
      <div className="p-5">
        <EchecDeChargement
          message={erreur}
          sujet="La liste de vos matières"
          profil="étudiant"
          onReessayer={recharger}
        />
      </div>
    );
  }
  if (chargement && !donnees) {
    return <Chargement texte="Chargement de vos matières…" />;
  }
  if (!donnees) {
    return (
      <Vide>
        Aucune inscription : les matières de votre niveau apparaîtront ici.
      </Vide>
    );
  }
  if (donnees.length === 0) {
    return <Vide>Aucune matière n&apos;est encore programmée pour votre niveau.</Vide>;
  }
  return (
    <ul className="divide-y divide-line">
      {donnees.slice(0, 4).map((matiere) => (
        <li
          key={matiere.id}
          className="flex items-center justify-between gap-4 px-5 py-3"
        >
          <div className="min-w-0">
            <p className="font-semibold break-words text-ink">{matiere.nom}</p>
            <p className="font-mono text-sm text-muted">{matiere.code}</p>
          </div>
          <p className="shrink-0 text-sm font-semibold text-ink">
            {matiere.credits} crédit{matiere.credits > 1 ? "s" : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default function EtudiantDashboardPage() {
  const user = useAuthStore((etat) => etat.user);
  const etat = useEtudiantConnecte();
  const { etudiant, inscriptions, inscriptionCourante, matieres } = etat;
  const prenom = user?.prenom;

  const entete = (
    <EnTete
      titre={prenom ? `Bonjour ${prenom}` : "Tableau de bord"}
      texte="Votre carte, votre inscription et vos matières en un coup d'œil."
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
  const donneesMatieres = matieres.erreur ? null : matieres.donnees;
  const attente = matieres.chargement && !matieres.donnees;

  return (
    <>
      {entete}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <CarteEtudiant
          etudiant={etudiant}
          nom={nom}
          inscription={inscriptionCourante}
        />
        <Statut inscription={inscriptionCourante} />
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-3">
        <Chiffre
          libelle="Matières de mon niveau"
          valeur={donneesMatieres ? donneesMatieres.length : null}
          attente={attente}
        />
        <Chiffre
          libelle="Crédits à valider"
          valeur={
            donneesMatieres
              ? donneesMatieres.reduce((somme, m) => somme + m.credits, 0)
              : null
          }
          attente={attente}
        />
        <Chiffre libelle="Inscriptions" valeur={inscriptions.length} />
      </ul>

      <Carte className="mt-6">
        <h2 className={CLASSE_TITRE_CARTE}>Mes matières</h2>
        <ApercuMatieres matieres={matieres} recharger={etat.recharger} />
        <nav
          aria-label="Accès rapides"
          className="flex flex-wrap gap-x-6 gap-y-3 border-t border-line px-5 py-4"
        >
          <Link href="/etudiant/matieres" className={CLASSE_LIEN}>
            Voir toutes mes matières
          </Link>
          <Link href="/etudiant/dossier" className={CLASSE_LIEN}>
            Mon dossier
          </Link>
          <Link href="/etudiant/inscriptions" className={CLASSE_LIEN}>
            Mes inscriptions
          </Link>
        </nav>
      </Carte>
    </>
  );
}
