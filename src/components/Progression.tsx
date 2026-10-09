// Barre de progression accessible : « valeur » sur « max », en pourcentage.
export function Progression({
  valeur,
  max,
  libelle,
  className = "",
}: {
  valeur: number;
  max: number;
  // Lu par les lecteurs d'écran, ex. « Heures effectuées de Cryptographie ».
  libelle: string;
  className?: string;
}) {
  const borne = Math.min(Math.max(valeur, 0), Math.max(max, 0));
  const pourcentage = max > 0 ? Math.round((borne / max) * 100) : 0;

  return (
    <div
      role="progressbar"
      aria-label={libelle}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={borne}
      aria-valuetext={`${pourcentage} %`}
      className={`h-2 overflow-hidden rounded-full bg-line ${className}`}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out motion-reduce:transition-none"
        style={{ width: `${pourcentage}%` }}
      />
    </div>
  );
}
