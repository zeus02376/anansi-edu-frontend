import { Coche } from "./champs";

// Liste numérotée des étapes, horizontale et lisible dès 320 px : les pastilles
// seules sur mobile, avec leur nom dès `sm`. Les étapes terminées sont des
// boutons pour revenir en arrière (sauf si `bloque`).
export function IndicateurEtapes({
  titres,
  courante,
  bloque,
  onAller,
}: {
  titres: string[];
  courante: number;
  bloque: boolean;
  onAller: (etape: number) => void;
}) {
  return (
    <nav aria-label="Étapes de la candidature">
      <ol className="flex">
        {titres.map((titre, index) => {
          const faite = index < courante;
          const active = index === courante;
          const pastille = (
            <span
              aria-hidden="true"
              className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-[background-color,box-shadow,color] duration-300 ${
                faite
                  ? "bg-primary text-on-primary"
                  : active
                    ? "bg-primary text-on-primary ring-4 ring-primary/25"
                    : "border-2 border-field bg-surface text-muted"
              }`}
            >
              {faite ? <Coche className="size-4" /> : index + 1}
            </span>
          );
          const nom = (
            <span
              className={`sr-only sm:not-sr-only sm:text-center sm:text-xs sm:break-words ${
                active ? "font-semibold text-ink" : faite ? "text-ink" : "text-muted"
              }`}
            >
              {titre}
            </span>
          );
          return (
            <li
              key={titre}
              aria-current={active ? "step" : undefined}
              className="relative flex min-w-0 flex-1 justify-center"
            >
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={`absolute top-4 right-1/2 left-[-50%] h-0.5 -translate-y-1/2 ${
                    index <= courante ? "bg-primary" : "bg-line"
                  }`}
                />
              )}
              {faite && !bloque ? (
                <button
                  type="button"
                  onClick={() => onAller(index)}
                  className="group relative flex min-w-0 flex-col items-center gap-1.5 rounded-md px-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  {pastille}
                  <span className="sr-only">Revenir à l&apos;étape {index + 1} : </span>
                  <span className="group-hover:underline">{nom}</span>
                </button>
              ) : (
                <div className="relative flex min-w-0 flex-col items-center gap-1.5 px-1">
                  {pastille}
                  <span className="sr-only">
                    {faite ? "Étape terminée : " : active ? "Étape en cours : " : "Étape à venir : "}
                  </span>
                  {nom}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
