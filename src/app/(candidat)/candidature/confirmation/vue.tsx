"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CLASSE_BOUTON_PRINCIPAL, CLASSE_BOUTON_SECONDAIRE } from "@/components/styles";
import { Carte, Chargement, EnTete } from "@/components/ui";
import { numeroUrlSchema } from "@/modules/candidature/schemas";

type Copie = "aucune" | "reussie" | "impossible";

function Contenu() {
  const parametres = useSearchParams();
  // Valeur de l'URL : nettoyée, limitée en longueur, affichée comme simple texte.
  const lecture = numeroUrlSchema.safeParse(parametres.get("numero") ?? "");
  const numero = lecture.success ? lecture.data : null;
  const [copie, setCopie] = useState<Copie>("aucune");

  async function copier() {
    if (!numero) return;
    try {
      await navigator.clipboard.writeText(numero);
      setCopie("reussie");
    } catch {
      // Presse-papiers indisponible ou refusé : on invite à recopier à la main.
      setCopie("impossible");
    }
  }

  if (!numero) {
    return (
      <Carte className="flex flex-col items-start gap-4 p-5 sm:p-6">
        <p className="font-semibold text-ink">Aucun numéro de dossier à afficher</p>
        <p className="text-sm text-muted">
          Ce numéro vous est donné après l&apos;envoi d&apos;une candidature.
        </p>
        <Link href="/candidature" className={CLASSE_BOUTON_PRINCIPAL}>
          Déposer une candidature
        </Link>
      </Carte>
    );
  }

  return (
    <Carte className="flex flex-col gap-5 p-5 sm:p-6">
      <div>
        <p className="text-sm font-semibold text-muted">Numéro de dossier</p>
        <p className="mt-1 font-mono text-2xl font-semibold break-all text-ink sm:text-3xl">
          {numero}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => void copier()} className={CLASSE_BOUTON_SECONDAIRE}>
          Copier le numéro
        </button>
        {/* Toujours monté pour que l'annonce soit lue quand le message apparaît. */}
        <p role="status" aria-live="polite" className="text-sm font-semibold text-ink">
          {copie === "reussie" && "Numéro copié"}
          {copie === "impossible" && "Copie impossible : recopiez le numéro à la main."}
        </p>
      </div>

      <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-ink">
        <p className="font-semibold">Conservez ce numéro.</p>
        <p className="mt-1 text-muted">
          Il vous servira, avec la même adresse e-mail que celle de votre candidature, à suivre
          l&apos;avancement de votre dossier.
        </p>
      </div>

      <div>
        <Link href="/suivi" className={CLASSE_BOUTON_PRINCIPAL}>
          Suivre mon dossier
        </Link>
      </div>
    </Carte>
  );
}

export default function Vue() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <EnTete titre="Confirmation de candidature" />
      <Suspense fallback={<Carte><Chargement /></Carte>}>
        <Contenu />
      </Suspense>
    </div>
  );
}
