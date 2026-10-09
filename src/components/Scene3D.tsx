"use client";

import { useEffect, useRef } from "react";

const INCLINAISON_MAX = 10; // degrés

// Décor de la page de connexion : des éléments d'interface (un dossier, un
// graphique, une validation) posés à des profondeurs différentes. La scène
// pivote légèrement pour suivre le pointeur. Purement décoratif.
export function Scene3D() {
  const scene = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = scene.current;
    if (!element) return;
    // Pas de suivi sur écran tactile ni si les animations sont réduites.
    if (
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let image = 0;
    function surPointeur(evenement: PointerEvent) {
      cancelAnimationFrame(image);
      image = requestAnimationFrame(() => {
        const x = evenement.clientX / window.innerWidth - 0.5;
        const y = evenement.clientY / window.innerHeight - 0.5;
        element?.style.setProperty("--ry", `${x * 2 * INCLINAISON_MAX}deg`);
        element?.style.setProperty("--rx", `${-y * 2 * INCLINAISON_MAX}deg`);
      });
    }
    window.addEventListener("pointermove", surPointeur);
    return () => {
      cancelAnimationFrame(image);
      window.removeEventListener("pointermove", surPointeur);
    };
  }, []);

  return (
    <div aria-hidden="true" className="scene3d mx-auto h-72 w-72">
      <div ref={scene} className="scene3d-plateau relative size-full">
        {/* Fond : une grille, loin derrière */}
        <div className="scene3d-couche inset-x-0 top-6 h-56 [--z:-70px]">
          <div className="scene3d-grille size-full rounded-2xl border border-white/20 bg-white/5" />
        </div>

        {/* Dossier de candidature */}
        <div className="scene3d-couche top-12 left-2 w-52 [--z:0px]">
          <div className="flottement rounded-xl bg-white p-4 shadow-[0_30px_50px_-18px_rgb(8_20_80/0.65)]">
            <div className="flex items-center gap-3">
              <span className="size-9 rounded-full bg-primary/15" />
              <span className="flex flex-1 flex-col gap-1.5">
                <span className="h-2 w-24 rounded-full bg-slate-300" />
                <span className="h-2 w-16 rounded-full bg-slate-200" />
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <span className="h-2 rounded-full bg-slate-200" />
              <span className="h-2 w-10/12 rounded-full bg-slate-200" />
              <span className="h-2 w-7/12 rounded-full bg-slate-200" />
            </div>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              Accepté
            </span>
          </div>
        </div>

        {/* Graphique, plus près */}
        <div className="scene3d-couche right-0 bottom-6 w-32 [--z:70px]">
          <div className="flottement rounded-xl bg-white p-3.5 shadow-[0_30px_50px_-18px_rgb(8_20_80/0.7)] [animation-delay:-2.2s]">
            <span className="block h-2 w-14 rounded-full bg-slate-300" />
            <div className="mt-3 flex h-14 items-end gap-1.5">
              <span className="h-5 flex-1 rounded-sm bg-primary/30" />
              <span className="h-9 flex-1 rounded-sm bg-primary/50" />
              <span className="h-7 flex-1 rounded-sm bg-primary/40" />
              <span className="h-14 flex-1 rounded-sm bg-primary" />
              <span className="h-11 flex-1 rounded-sm bg-primary/70" />
            </div>
          </div>
        </div>

        {/* Pastille de validation, au premier plan */}
        <div className="scene3d-couche top-2 right-6 [--z:120px]">
          <div className="flottement flex size-14 items-center justify-center rounded-full bg-white text-primary shadow-[0_24px_40px_-12px_rgb(8_20_80/0.75)] [animation-delay:-4s]">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-6"
            >
              <path d="M3.5 8.5l3 3 6-7" />
            </svg>
          </div>
        </div>

        {/* Anneau de progression */}
        <div className="scene3d-couche bottom-0 left-8 [--z:40px]">
          <div className="flottement flex items-center gap-2.5 rounded-xl border border-white/25 bg-white/15 px-3 py-2.5 shadow-[0_20px_40px_-16px_rgb(8_20_80/0.6)] backdrop-blur-sm [animation-delay:-1s]">
            <span className="scene3d-anneau size-8 rounded-full" />
            <span className="flex flex-col gap-1.5">
              <span className="h-1.5 w-12 rounded-full bg-white/80" />
              <span className="h-1.5 w-8 rounded-full bg-white/50" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
