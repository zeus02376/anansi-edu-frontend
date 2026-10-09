import type { ReactNode } from "react";

export function Cadre({
  texte,
  fil,
  accroche,
  pied,
  children,
}: {
  texte: string;
  fil?: ReactNode;
  accroche?: string;
  pied?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <aside className="bg-panel px-6 py-6 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[38%] lg:max-w-md lg:flex-col lg:px-10 lg:py-12">
        <div>
          <p className="flex items-center gap-2.5 font-display text-xl font-bold tracking-wide">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-accent" />
            ANANSI EDU
          </p>
          <p className="mt-2 max-w-[30ch] text-sm leading-relaxed text-white/75 lg:mt-4 lg:text-base">
            {texte}
          </p>
        </div>

        {fil && <div className="mt-6 lg:mt-14">{fil}</div>}

        {(accroche || pied) && (
          <div className="mt-auto hidden lg:block">
            {accroche && (
              <p className="font-display text-5xl leading-[1.05] font-semibold tracking-tight text-balance">
                {accroche}
              </p>
            )}
            {pied && (
              <div className="border-t border-white/15 pt-5 text-sm leading-relaxed text-white/75">
                {pied}
              </div>
            )}
          </div>
        )}
      </aside>

      <main className="flex-1 px-6 py-10 lg:px-16 lg:py-16">
        <div className="w-full max-w-lg">{children}</div>
      </main>
    </div>
  );
}
