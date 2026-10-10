import { SEXES } from "@/modules/commun/schemas";
import {
  brouillonSchema,
  candidatureCreeeSchema,
  type Brouillon,
  type CandidatureCreee,
} from "@/modules/candidature/schemas";

// Brouillon du formulaire dans sessionStorage (effacé à la fermeture de
// l'onglet) : étape et champs de texte, jamais les fichiers. Tout est
// enveloppé dans try/catch : le stockage peut être absent ou refusé.

const CLE = "anansi.candidature.brouillon";

export function lireBrouillon(): Brouillon | null {
  try {
    const brut = sessionStorage.getItem(CLE);
    if (!brut) return null;
    const lecture = brouillonSchema.safeParse(JSON.parse(brut));
    return lecture.success ? lecture.data : null;
  } catch {
    return null;
  }
}

const texte = (valeur: unknown) => (typeof valeur === "string" ? valeur : undefined);

export function ecrireBrouillon(etape: number, valeurs: Record<string, unknown>) {
  try {
    const brouillon: Brouillon = {
      etape,
      valeurs: {
        nom: texte(valeurs.nom),
        prenom: texte(valeurs.prenom),
        dateNaissance: texte(valeurs.dateNaissance),
        sexe: SEXES.find((sexe) => sexe === valeurs.sexe),
        telephone: texte(valeurs.telephone),
        email: texte(valeurs.email),
        adresse: texte(valeurs.adresse),
        programId: texte(valeurs.programId),
      },
    };
    sessionStorage.setItem(CLE, JSON.stringify(brouillon));
  } catch {
    // Stockage indisponible : le formulaire fonctionne sans brouillon.
  }
}

export function effacerBrouillon() {
  try {
    sessionStorage.removeItem(CLE);
  } catch {
    // Rien à effacer.
  }
}

// Dossier déjà créé côté serveur : clé distincte du brouillon (qui, lui, est
// effacé à la création). Conservé tant que les documents ne sont pas tous
// envoyés, pour qu'un rechargement ne ramène pas à un formulaire vierge (et
// donc à un doublon). Seuls l'identifiant et le numéro sont gardés.
const CLE_DOSSIER = "anansi.candidature.dossier-cree";

export function lireDossierCree(): CandidatureCreee | null {
  try {
    const brut = sessionStorage.getItem(CLE_DOSSIER);
    if (!brut) return null;
    const lecture = candidatureCreeeSchema.safeParse(JSON.parse(brut));
    return lecture.success ? lecture.data : null;
  } catch {
    return null;
  }
}

export function ecrireDossierCree(dossier: CandidatureCreee) {
  try {
    const { id, numeroDossier } = dossier;
    sessionStorage.setItem(CLE_DOSSIER, JSON.stringify({ id, numeroDossier }));
  } catch {
    // Stockage indisponible : pas de reprise possible après un rechargement.
  }
}

export function effacerDossierCree() {
  try {
    sessionStorage.removeItem(CLE_DOSSIER);
  } catch {
    // Rien à effacer.
  }
}
