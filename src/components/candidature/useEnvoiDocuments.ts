import { useEffect, useRef, useState } from "react";
import { messageDe } from "@/lib/api";
import { envoyerDocument } from "@/modules/candidature/api";
import type { TypeDocument } from "@/modules/commun/schemas";

// Envoi des documents d'un dossier déjà créé, un par un. Partagé entre le
// formulaire (juste après la création) et l'écran de reprise.

export type EtatDocument = { etat: "attente" | "cours" | "envoye" | "echec"; message?: string };

export type DocumentAEnvoyer = { type: TypeDocument; fichier: File };

export function useEnvoiDocuments() {
  const [etats, setEtats] = useState<Record<string, EtatDocument>>({});
  const [envoi, setEnvoi] = useState(false);
  // Faux dès que la page est quittée : plus de setState ni de navigation, et
  // les envois en cours sont annulés.
  const actif = useRef(false);
  const controleur = useRef<AbortController | null>(null);
  const envoyes = useRef(new Set<string>());
  const enCours = useRef(false);

  useEffect(() => {
    actif.current = true;
    return () => {
      actif.current = false;
      controleur.current?.abort();
    };
  }, []);

  const estActif = () => actif.current;

  function majEtat(type: TypeDocument, etat: EtatDocument) {
    if (!actif.current) return;
    setEtats((precedents) => ({ ...precedents, [type]: etat }));
  }

  function initialiser(types: TypeDocument[]) {
    setEtats(Object.fromEntries(types.map((type) => [type, { etat: "attente" } as EtatDocument])));
  }

  // Un seul envoi à la fois, même en cas de double clic.
  async function exclusif(action: () => Promise<void>) {
    if (enCours.current) return;
    enCours.current = true;
    setEnvoi(true);
    try {
      await action();
    } finally {
      enCours.current = false;
      if (actif.current) setEnvoi(false);
    }
  }

  // Envoie les documents donnés (ceux déjà envoyés sont sautés) et dit si tous
  // les documents `attendus` sont maintenant envoyés.
  async function televerser(
    id: string,
    aEnvoyer: DocumentAEnvoyer[],
    attendus: TypeDocument[],
  ): Promise<boolean> {
    const annulation = new AbortController();
    controleur.current = annulation;
    for (const { type, fichier } of aEnvoyer) {
      if (envoyes.current.has(type)) continue;
      if (!actif.current) return false;
      majEtat(type, { etat: "cours" });
      try {
        await envoyerDocument(id, type, fichier, annulation.signal);
        envoyes.current.add(type);
        majEtat(type, { etat: "envoye" });
      } catch (erreur) {
        if (!actif.current) return false;
        majEtat(type, { etat: "echec", message: messageDe(erreur) });
      }
    }
    return attendus.every((type) => envoyes.current.has(type));
  }

  return { etats, envoi, estActif, initialiser, exclusif, televerser };
}
