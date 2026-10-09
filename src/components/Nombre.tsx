"use client";

import { useEffect, useState } from "react";

const DUREE_MS = 700;

// Affiche un nombre qui « compte » jusqu'à sa valeur quand elle change.
// Les lecteurs d'écran lisent directement la valeur finale.
export function Nombre({ valeur }: { valeur: number }) {
  const [affiche, setAffiche] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const image = requestAnimationFrame(() => setAffiche(valeur));
      return () => cancelAnimationFrame(image);
    }

    let image = 0;
    let debut: number | null = null;
    let depart: number | null = null;
    function etape(instant: number) {
      debut ??= instant;
      const avancement = Math.min(1, (instant - debut) / DUREE_MS);
      // Ralentit en arrivant sur la valeur.
      const adouci = 1 - (1 - avancement) ** 3;
      setAffiche((courant) => {
        depart ??= courant;
        return Math.round(depart + (valeur - depart) * adouci);
      });
      if (avancement < 1) image = requestAnimationFrame(etape);
    }
    image = requestAnimationFrame(etape);
    return () => cancelAnimationFrame(image);
  }, [valeur]);

  return (
    <>
      <span aria-hidden="true">{affiche.toLocaleString("fr-FR")}</span>
      <span className="sr-only">{valeur.toLocaleString("fr-FR")}</span>
    </>
  );
}
