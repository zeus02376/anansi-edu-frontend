"use client";

import {
  EtatEnseignant,
  LIBELLE_TYPE,
  totaux,
} from "@/components/enseignant/outils";
import { CLASSE_LIEN } from "@/components/styles";
import { Carte, EnTete } from "@/components/ui";
import { useEnseignantConnecte } from "@/hooks/useEnseignantConnecte";
import { useAuthStore } from "@/stores/authStore";
import type { Affectation, Enseignant } from "@/types";

// N'accepte que les liens http(s) : jamais de javascript: ni de data:.
function adresseWeb(valeur: string | null): string | null {
  if (!valeur) return null;
  try {
    const url = new URL(valeur);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function Contenu({
  enseignant,
  affectations,
}: {
  enseignant: Enseignant;
  affectations: Affectation[];
}) {
  const session = useAuthStore((etat) => etat.user);
  const prenom = enseignant.user?.prenom ?? session?.prenom ?? "";
  const nom = enseignant.user?.nom ?? session?.nom ?? "";
  const nomComplet = `${prenom} ${nom}`.trim() || "Enseignant";
  const email = enseignant.user?.email ?? session?.email;
  const initiales =
    `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase() ||
    nomComplet.charAt(0).toUpperCase();
  const cv = adresseWeb(enseignant.cvUrl);
  const total = totaux(affectations);

  const activite = [
    ["Matières", `${total.matieres}`],
    ["Années académiques", `${total.annees}`],
    ["Heures prévues", `${total.prevues} h`],
    ["Heures effectuées", `${total.effectuees} h`],
  ];

  return (
    <>
      <Carte>
        <div className="flex flex-wrap items-start gap-5 p-5">
          <span
            aria-hidden="true"
            className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary font-display text-xl font-semibold text-on-primary"
          >
            {initiales}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="font-display text-xl font-semibold text-ink">
                {nomComplet}
              </h2>
              <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-primary">
                {LIBELLE_TYPE[enseignant.type] ?? enseignant.type}
              </span>
            </div>
            <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-muted">Adresse e-mail</dt>
                <dd className="font-medium break-words text-ink">
                  {email ?? "Non renseignée"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Spécialité</dt>
                <dd className="font-medium text-ink">
                  {enseignant.specialite || "Non renseignée"}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-sm">
              {cv ? (
                <a
                  href={cv}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={CLASSE_LIEN}
                >
                  Consulter mon CV
                  <span className="sr-only"> (s&apos;ouvre dans un nouvel onglet)</span>
                </a>
              ) : (
                <span className="text-muted">Aucun CV enregistré.</span>
              )}
            </p>
          </div>
        </div>
      </Carte>

      <Carte className="mt-6">
        <h2 className="border-b border-line px-5 py-4 font-display text-lg font-semibold text-ink">
          Mon activité
        </h2>
        <dl className="grid grid-cols-2 gap-4 px-5 py-4 lg:grid-cols-4">
          {activite.map(([terme, valeur]) => (
            <div key={terme}>
              <dt className="text-sm text-muted">{terme}</dt>
              <dd className="font-display text-2xl font-semibold text-primary tabular-nums">
                {valeur}
              </dd>
            </div>
          ))}
        </dl>
        <p className="border-t border-line px-5 py-4 text-sm text-muted">
          Pour modifier vos informations (nom, e-mail, spécialité, CV),
          adressez-vous au service de scolarité : vous ne pouvez pas les
          modifier vous-même pour le moment.
        </p>
      </Carte>
    </>
  );
}

export default function EnseignantProfilPage() {
  const etat = useEnseignantConnecte();

  return (
    <div>
      <EnTete
        titre="Mon profil"
        texte="Vos informations d'enseignant et un résumé de votre activité."
      />
      <div className="mt-6">
        <EtatEnseignant etat={etat} sujet="Votre profil">
          {(enseignant, affectations) => (
            <Contenu enseignant={enseignant} affectations={affectations} />
          )}
        </EtatEnseignant>
      </div>
    </div>
  );
}
