"use client";

import type { PointerEvent, ReactNode } from "react";

const INCLINAISON_MAX = 7; // degrés

// Carte qui s'incline en 3D vers le pointeur, avec un reflet qui le suit.
// Les styles sont dans globals.css (.inclinable) ; sans souris ou avec les
// animations réduites, la carte reste à plat.
export function Inclinable({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  function surDeplacement(evenement: PointerEvent<HTMLDivElement>) {
    if (evenement.pointerType !== "mouse") return;
    const carte = evenement.currentTarget;
    const cadre = carte.getBoundingClientRect();
    const x = (evenement.clientX - cadre.left) / cadre.width;
    const y = (evenement.clientY - cadre.top) / cadre.height;
    carte.style.setProperty("--ry", `${(x - 0.5) * 2 * INCLINAISON_MAX}deg`);
    carte.style.setProperty("--rx", `${(0.5 - y) * 2 * INCLINAISON_MAX}deg`);
    carte.style.setProperty("--reflet-x", `${x * 100}%`);
    carte.style.setProperty("--reflet-y", `${y * 100}%`);
  }

  function surSortie(evenement: PointerEvent<HTMLDivElement>) {
    const carte = evenement.currentTarget;
    carte.style.setProperty("--rx", "0deg");
    carte.style.setProperty("--ry", "0deg");
  }

  return (
    <div className="[perspective:900px]">
      <div
        onPointerMove={surDeplacement}
        onPointerLeave={surSortie}
        className={`inclinable ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
