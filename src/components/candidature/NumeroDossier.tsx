"use client";

import { useState } from "react";
import { CLASSE_BOUTON_SECONDAIRE } from "@/components/styles";

type Copie = "aucune" | "reussie" | "impossible";

// Numéro de dossier avec un bouton pour le copier.
export function NumeroDossier({ numero }: { numero: string }) {
  const [copie, setCopie] = useState<Copie>("aucune");

  async function copier() {
    try {
      await navigator.clipboard.writeText(numero);
      setCopie("reussie");
    } catch {
      // Presse-papiers indisponible ou refusé : on invite à recopier à la main.
      setCopie("impossible");
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold text-muted">Numéro de dossier</p>
      <p className="mt-1 font-mono text-xl font-semibold break-all text-ink">{numero}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void copier()}
          className={`${CLASSE_BOUTON_SECONDAIRE} px-3 py-1.5`}
        >
          Copier le numéro
        </button>
        {/* Toujours monté pour que l'annonce soit lue quand le message apparaît. */}
        <p role="status" aria-live="polite" className="text-sm font-semibold text-ink">
          {copie === "reussie" && "Numéro copié"}
          {copie === "impossible" && "Copie impossible : recopiez le numéro à la main."}
        </p>
      </div>
    </div>
  );
}
