import type { ReactNode } from "react";
import { Erreur } from "@/components/ui";
import { MESSAGE_ACCES_REFUSE } from "@/services/api";

// Le backend réserve aujourd'hui /enseignants, /etudiants, /inscriptions et
// /matieres aux profils administration et scolarité : un enseignant ou un
// étudiant reçoit un 403 en demandant ses propres données. On l'explique
// calmement au lieu d'afficher une erreur.
export function AvisAccesLimite({
  sujet,
  profil,
}: {
  sujet: string;
  profil: "enseignant" | "étudiant";
}) {
  // « Vos matières ne sont pas… » mais « Votre dossier n'est pas… ».
  const pluriel = /^(vos|mes|les) /i.test(sujet);
  return (
    <div
      role="status"
      className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-ink"
    >
      <p className="font-semibold">
        {sujet}{" "}
        {pluriel ? "ne sont pas encore consultables" : "n'est pas encore consultable"}{" "}
        ici.
      </p>
      <p className="mt-1 text-muted">
        Le serveur n&apos;autorise pas encore le profil {profil} à lire ses
        propres données. En attendant, le service de scolarité de votre
        établissement peut vous les communiquer.
      </p>
    </div>
  );
}

// Affiche l'échec d'un chargement : avis calme pour un accès refusé, erreur
// avec « Réessayer » dans les autres cas.
export function EchecDeChargement({
  message,
  sujet,
  profil,
  onReessayer,
}: {
  message: string;
  sujet: string;
  profil: "enseignant" | "étudiant";
  onReessayer: () => void;
}): ReactNode {
  if (message === MESSAGE_ACCES_REFUSE) {
    return <AvisAccesLimite sujet={sujet} profil={profil} />;
  }
  return <Erreur message={message} onReessayer={onReessayer} />;
}
