"use client";

import {
  Carte,
  Chargement,
  CLASSE_TABLEAU,
  CLASSE_TABLEAU_DEFILANT,
  CLASSE_TD,
  CLASSE_TH,
  EnTete,
  Erreur,
  Vide,
} from "@/components/ui";
import { useRessource } from "@/hooks/useRessource";
import { MESSAGE_ACCES_REFUSE } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import type { Affectation, Enseignant } from "@/types";

const LIBELLE_TYPE: Record<Enseignant["type"], string> = {
  PERMANENT: "Permanent",
  VACATAIRE: "Vacataire",
};

// Le backend réserve aujourd'hui /enseignants aux profils administration et
// scolarité : un enseignant reçoit un 403 en demandant ses propres données.
function AvisAccesLimite() {
  return (
    <div
      role="status"
      className="m-5 rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-ink"
    >
      <p className="font-semibold">
        Vos enseignements ne sont pas encore consultables ici.
      </p>
      <p className="mt-1 text-muted">
        Le serveur n&apos;autorise pas encore le profil enseignant à lire ses
        propres matières et affectations. En attendant, le service de scolarité
        de votre établissement peut vous les communiquer.
      </p>
    </div>
  );
}

function Echec({
  message,
  onReessayer,
}: {
  message: string;
  onReessayer: () => void;
}) {
  if (message === MESSAGE_ACCES_REFUSE) return <AvisAccesLimite />;
  return (
    <div className="p-5">
      <Erreur message={message} onReessayer={onReessayer} />
    </div>
  );
}

function TableauAffectations({ affectations }: { affectations: Affectation[] }) {
  const total = affectations.reduce(
    (somme, affectation) => ({
      credits: somme.credits + (affectation.matiere?.credits ?? 0),
      prevues: somme.prevues + affectation.heuresPrevues,
      effectuees: somme.effectuees + affectation.heuresEffectuees,
    }),
    { credits: 0, prevues: 0, effectuees: 0 },
  );

  return (
    <div className={CLASSE_TABLEAU_DEFILANT}>
      <table className={CLASSE_TABLEAU}>
        <caption className="sr-only">Mes matières et affectations</caption>
        <thead>
          <tr>
            <th scope="col" className={CLASSE_TH}>
              Matière
            </th>
            <th scope="col" className={CLASSE_TH}>
              Année académique
            </th>
            <th scope="col" className={`${CLASSE_TH} text-right`}>
              Crédits
            </th>
            <th scope="col" className={`${CLASSE_TH} text-right`}>
              Heures prévues
            </th>
            <th scope="col" className={`${CLASSE_TH} text-right`}>
              Heures effectuées
            </th>
          </tr>
        </thead>
        <tbody>
          {affectations.map((affectation) => (
            <tr key={affectation.id}>
              <td className={CLASSE_TD}>
                <span className="font-semibold">
                  {affectation.matiere?.nom ?? "Matière inconnue"}
                </span>
                {affectation.matiere && (
                  <span className="block font-mono text-xs text-muted">
                    {affectation.matiere.code}
                  </span>
                )}
              </td>
              <td className={`${CLASSE_TD} whitespace-nowrap`}>
                {affectation.anneeAcademique?.libelle ?? "—"}
              </td>
              <td className={`${CLASSE_TD} text-right tabular-nums`}>
                {affectation.matiere?.credits ?? "—"}
              </td>
              <td className={`${CLASSE_TD} text-right tabular-nums`}>
                {affectation.heuresPrevues} h
              </td>
              <td className={`${CLASSE_TD} text-right tabular-nums`}>
                {affectation.heuresEffectuees} h
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold">
            <th scope="row" colSpan={2} className="px-5 py-3 text-left text-ink">
              Total ({affectations.length} affectation
              {affectations.length > 1 ? "s" : ""})
            </th>
            <td className="px-5 py-3 text-right text-ink tabular-nums">
              {total.credits}
            </td>
            <td className="px-5 py-3 text-right text-ink tabular-nums">
              {total.prevues} h
            </td>
            <td className="px-5 py-3 text-right text-ink tabular-nums">
              {total.effectuees} h
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function EnseignantDashboardPage() {
  const user = useAuthStore((etat) => etat.user);
  const enseignants = useRessource<Enseignant[]>("/enseignants");
  const enseignant =
    enseignants.donnees?.find((candidat) => candidat.userId === user?.id) ??
    null;
  // Second appel en attente tant que la fiche enseignant n'est pas connue.
  const affectations = useRessource<Affectation[]>(
    enseignant ? `/enseignants/${enseignant.id}/affectations` : null,
  );

  const prenom = user?.prenom ?? enseignant?.user?.prenom;

  function contenu() {
    if (enseignants.chargement) {
      return <Chargement texte="Chargement de vos enseignements…" />;
    }
    if (enseignants.erreur) {
      return (
        <Echec message={enseignants.erreur} onReessayer={enseignants.recharger} />
      );
    }
    if (!enseignant) {
      return (
        <Vide>
          Aucune fiche enseignant n&apos;est rattachée à votre compte. Le
          service de scolarité peut la créer.
        </Vide>
      );
    }
    if (affectations.erreur) {
      return (
        <Echec
          message={affectations.erreur}
          onReessayer={affectations.recharger}
        />
      );
    }
    if (!affectations.donnees) {
      return <Chargement texte="Chargement de vos affectations…" />;
    }
    if (affectations.donnees.length === 0) {
      return <Vide>Aucune matière ne vous est affectée pour le moment.</Vide>;
    }
    return <TableauAffectations affectations={affectations.donnees} />;
  }

  return (
    <div>
      <EnTete
        titre="Tableau de bord"
        texte={
          prenom
            ? `Bonjour ${prenom}, voici vos matières et vos heures d'enseignement.`
            : "Vos matières et vos heures d'enseignement."
        }
      />

      <Carte className="mt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-ink">
            Mes matières et affectations
          </h2>
          {enseignant && (
            <p className="text-sm text-muted">
              {LIBELLE_TYPE[enseignant.type] ?? enseignant.type}
              {enseignant.specialite && ` · ${enseignant.specialite}`}
            </p>
          )}
        </div>
        {contenu()}
      </Carte>
    </div>
  );
}
