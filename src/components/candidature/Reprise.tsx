"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { FieldError } from "react-hook-form";
import { CLASSE_BOUTON_PRINCIPAL, CLASSE_BOUTON_SECONDAIRE } from "@/components/styles";
import { DOCUMENTS, fichierSchema, type CandidatureCreee } from "@/modules/candidature/schemas";
import { LIBELLE_TYPE_DOCUMENT, type TypeDocument } from "@/modules/commun/schemas";
import { AIDE_FICHIERS, ChampFichier } from "./ChampFichier";
import { CLASSE_ARIA_INACTIF } from "./champs";
import { effacerDossierCree } from "./brouillon";
import { EnvoiDocuments } from "./EnvoiDocuments";
import { useEnvoiDocuments, type DocumentAEnvoyer } from "./useEnvoiDocuments";

type Champ = (typeof DOCUMENTS)[number]["champ"];

// Écran de reprise : le dossier existe déjà côté serveur (rechargement après
// une création suivie d'un échec partiel). Il ne propose jamais de recréer le
// dossier : seulement de renvoyer des documents vers ce dossier.
export function Reprise({ dossier }: { dossier: CandidatureCreee }) {
  const router = useRouter();
  const { etats, envoi, estActif, exclusif, televerser } = useEnvoiDocuments();
  const [fichiers, setFichiers] = useState<Record<Champ, File | null>>({
    pieceIdentite: null,
    dernierDiplome: null,
    photoIdentite: null,
  });
  const [erreurs, setErreurs] = useState<Partial<Record<Champ, string>>>({});
  const [aucunChoix, setAucunChoix] = useState(false);
  const [termine, setTermine] = useState(false);
  const titreEnvoi = useRef<HTMLHeadingElement>(null);

  const bloque = envoi || termine;
  const aEchoue = Object.values(etats).some((d) => d.etat === "echec");

  function choisir(champ: Champ, fichier: File | null) {
    setFichiers((precedents) => ({ ...precedents, [champ]: fichier }));
    setAucunChoix(false);
    const lecture = fichierSchema({ requis: false }).safeParse(fichier);
    setErreurs((precedentes) => ({
      ...precedentes,
      [champ]: lecture.success ? undefined : lecture.error.issues[0]?.message,
    }));
  }

  function continuer() {
    effacerDossierCree();
    if (!estActif()) return;
    setTermine(true);
    router.push(`/candidature/confirmation?numero=${encodeURIComponent(dossier.numeroDossier)}`);
  }

  function choisis(seulement?: TypeDocument): DocumentAEnvoyer[] {
    return DOCUMENTS.flatMap((d) => {
      const fichier = fichiers[d.champ];
      return fichier && (!seulement || seulement === d.type) ? [{ type: d.type, fichier }] : [];
    });
  }

  async function envoyer(seulement?: TypeDocument) {
    const aEnvoyer = choisis(seulement);
    if (aEnvoyer.length === 0) {
      setAucunChoix(true);
      return;
    }
    const complet = await televerser(
      dossier.id,
      aEnvoyer,
      choisis().map((d) => d.type),
    );
    if (complet) continuer();
  }

  function soumettre() {
    if (bloque) return;
    if (Object.values(erreurs).some(Boolean)) return;
    void exclusif(() => envoyer());
  }

  function reessayer(type: TypeDocument) {
    if (bloque) return;
    void exclusif(() => envoyer(type)).then(() => {
      if (estActif()) titreEnvoi.current?.focus();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-semibold text-ink">
        Reprise de votre candidature
      </h2>
      <EnvoiDocuments
        numero={dossier.numeroDossier}
        etats={etats}
        bloque={bloque}
        onReessayer={reessayer}
        titreRef={titreEnvoi}
      >
        <p className="text-sm text-muted">
          La page a été rechargée avant la fin de l&apos;envoi. Votre dossier existe déjà : il ne
          sera pas créé une seconde fois. Vos fichiers n&apos;ont pas été conservés : choisissez à
          nouveau ceux qui n&apos;ont pas été envoyés, puis envoyez-les, ou continuez sans
          eux.
        </p>
        <p className="text-sm text-muted">{AIDE_FICHIERS}</p>
        {DOCUMENTS.map(({ champ, type }) => (
          <ChampFichier
            key={champ}
            id={champ}
            libelle={LIBELLE_TYPE_DOCUMENT[type]}
            erreur={
              erreurs[champ]
                ? ({ type: "custom", message: erreurs[champ] } satisfies FieldError)
                : undefined
            }
            fichier={fichiers[champ]}
            onChoisir={(fichier) => choisir(champ, fichier)}
          />
        ))}
      </EnvoiDocuments>

      <div role="status" className="text-sm text-muted">
        {envoi && "Envoi des documents en cours…"}
        {termine && "Redirection vers la confirmation…"}
        {aucunChoix && !envoi && (
          <span className="font-semibold text-red-700">Choisissez au moins un fichier à envoyer.</span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line pt-6">
        <button
          type="button"
          aria-disabled={bloque}
          onClick={() => {
            if (!bloque) continuer();
          }}
          className={`${CLASSE_BOUTON_SECONDAIRE} ${CLASSE_ARIA_INACTIF}`}
        >
          Continuer vers la confirmation
        </button>
        <button
          type="button"
          aria-disabled={bloque}
          onClick={soumettre}
          className={`${CLASSE_BOUTON_PRINCIPAL} ${CLASSE_ARIA_INACTIF}`}
        >
          {envoi ? "Envoi en cours…" : "Envoyer les documents"}
        </button>
      </div>
      <p className="text-sm text-muted">
        {aEchoue
          ? "Si vous continuez sans réessayer, votre dossier sera marqué incomplet par la scolarité jusqu'à la réception des documents manquants."
          : "Si vous continuez sans envoyer les documents manquants, votre dossier sera marqué incomplet par la scolarité jusqu'à leur réception."}
      </p>
    </div>
  );
}
