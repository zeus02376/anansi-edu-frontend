import { estIndisponible, messageDe } from "@/lib/api";
import { Erreur } from "@/components/ui";

// Affiche l'échec d'un appel d'API :
//  - route qui n'existe pas encore côté serveur : un avis « Service
//    indisponible » calme (jamais de faux résultats à la place) ;
//  - toute autre erreur : message en français, avec « Réessayer » si l'on
//    sait recharger.
export function EtatErreur({
  erreur,
  onReessayer,
  sujet,
}: {
  erreur: unknown;
  onReessayer?: () => void;
  // Ce qui ne peut pas s'afficher, ex. « La liste des dossiers ».
  sujet?: string;
}) {
  if (estIndisponible(erreur)) {
    return (
      <div
        role="status"
        className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-ink"
      >
        <p className="font-semibold">
          Service indisponible{sujet ? ` : ${sujet.toLowerCase()}` : ""}.
        </p>
        <p className="mt-1 text-muted">
          Cette fonction n&apos;est pas encore disponible sur le serveur. Elle
          apparaîtra dès que l&apos;équipe backend l&apos;aura mise en place.
        </p>
      </div>
    );
  }
  return <Erreur message={messageDe(erreur)} onReessayer={onReessayer} />;
}
