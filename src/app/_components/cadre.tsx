import type { ReactNode } from "react";

const RAYONS = [0, 37, 78, 121, 158, 201, 239, 282, 322];
const ANNEAUX = [34, 66, 100, 136, 174, 214];
const LONGUEUR_RAYON = 240;

function point(angleEnDegres: number, distance: number): string {
  const angle = (angleEnDegres * Math.PI) / 180;
  const x = (Math.cos(angle) * distance).toFixed(1);
  const y = (Math.sin(angle) * distance).toFixed(1);
  return `${x} ${y}`;
}

// Chaque anneau relie les rayons par des arcs qui s'affaissent vers le
// centre, comme les fils d'une vraie toile.
function anneau(distance: number): string {
  const segments = RAYONS.map((angle, index) => {
    const suivant = RAYONS[(index + 1) % RAYONS.length];
    const fin = suivant > angle ? suivant : suivant + 360;
    const milieu = (angle + fin) / 2;
    return `Q ${point(milieu, distance * 0.8)} ${point(fin, distance)}`;
  });
  return `M ${point(RAYONS[0], distance)} ${segments.join(" ")}`;
}

function Toile({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="-240 -240 480 480"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      className={className}
    >
      {RAYONS.map((angle) => (
        <path key={angle} d={`M 0 0 L ${point(angle, LONGUEUR_RAYON)}`} />
      ))}
      {ANNEAUX.map((distance) => (
        <path key={distance} d={anneau(distance)} />
      ))}
    </svg>
  );
}

export function Cadre({
  texte,
  fil,
  children,
}: {
  texte: string;
  fil?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <aside className="relative overflow-hidden bg-panel px-6 py-6 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[38%] lg:max-w-md lg:flex-col lg:px-10 lg:py-12">
        <Toile className="pointer-events-none absolute -top-28 -right-28 size-72 text-gold/45 lg:top-auto lg:-right-40 lg:-bottom-40 lg:size-[34rem]" />

        <div className="relative">
          <p className="font-display text-xl font-bold tracking-wide">
            ANANSI EDU
          </p>
          <p className="mt-2 max-w-[28ch] text-sm leading-relaxed text-white/75 lg:mt-4 lg:text-base">
            {texte}
          </p>
        </div>

        {fil && <div className="relative mt-6 lg:mt-14">{fil}</div>}
      </aside>

      <main className="flex-1 px-6 py-10 lg:px-16 lg:py-16">
        <div className="w-full max-w-lg">{children}</div>
      </main>
    </div>
  );
}
