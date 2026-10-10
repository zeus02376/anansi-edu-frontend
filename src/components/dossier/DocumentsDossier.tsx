"use client";

import { useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError, messageDe } from "@/lib/api";
import {
  CLASSE_BOUTON_PRINCIPAL,
  CLASSE_BOUTON_SECONDAIRE,
  CLASSE_CHAMP,
  CLASSE_ERREUR,
  CLASSE_LIBELLE,
} from "@/components/styles";
import { Carte, Vide } from "@/components/ui";
import { LIBELLE_TYPE_DOCUMENT } from "@/modules/commun/schemas";
import { refuserDocument, validerDocument } from "@/modules/dossier/api";
import {
  refusDocumentSchema,
  type DocumentDossier,
  type RefusDocumentSaisie,
} from "@/modules/dossier/schemas";
import { BadgeStatutDocument } from "./outils";

// Un document : chaque ligne a son propre état d'envoi et sa propre erreur.
function LigneDocument({
  idDossier,
  document,
  onChange,
}: {
  idDossier: string;
  document: DocumentDossier;
  // Recharge le dossier et l'historique depuis le serveur.
  onChange: () => void;
}) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [refus, setRefus] = useState(false);
  // Annonce pour les lecteurs d'écran, vidée avant chaque action.
  const [annonce, setAnnonce] = useState("");
  const boutonRefuser = useRef<HTMLButtonElement>(null);
  const idChamp = useId();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<RefusDocumentSaisie>({
    resolver: zodResolver(refusDocumentSchema),
    defaultValues: { motif: "" },
  });
  const nom = LIBELLE_TYPE_DOCUMENT[document.type];
  const idErreurMotif = `${idChamp}-motif`;

  async function valider() {
    // aria-disabled ne bloque pas le clic : le garde évite un double envoi.
    if (enCours) return;
    setEnCours(true);
    setErreur(null);
    setAnnonce("");
    try {
      await validerDocument(idDossier, document.id);
      setRefus(false);
      setAnnonce("Document validé.");
      onChange();
    } catch (e) {
      setErreur(messageDe(e));
    } finally {
      setEnCours(false);
    }
  }

  async function refuser({ motif }: RefusDocumentSaisie) {
    if (enCours) return;
    setEnCours(true);
    setErreur(null);
    setAnnonce("");
    try {
      await refuserDocument(idDossier, document.id, motif);
      setRefus(false);
      reset();
      setAnnonce("Refus enregistré.");
      // Le formulaire se ferme : le focus revient sur « Refuser ».
      boutonRefuser.current?.focus();
      onChange();
    } catch (e) {
      if (e instanceof ApiError && e.champs.motif) {
        setError("motif", { message: e.champs.motif });
      } else {
        setErreur(messageDe(e));
      }
    } finally {
      setEnCours(false);
    }
  }

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-ink">{nom}</p>
          <p className="text-sm break-words text-muted">{document.nomFichier}</p>
          <p className="mt-2">
            <BadgeStatutDocument statut={document.statut} />
          </p>
          {document.motif && (
            <p className="mt-2 text-sm break-words text-ink">
              <span className="font-semibold">Motif du refus : </span>
              {document.motif}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-disabled={enCours ? "true" : undefined}
            onClick={() => void valider()}
            className={`${CLASSE_BOUTON_PRINCIPAL} px-3 py-1.5 aria-disabled:cursor-not-allowed aria-disabled:opacity-60`}
          >
            Valider<span className="sr-only"> : {nom}</span>
          </button>
          <button
            ref={boutonRefuser}
            type="button"
            aria-disabled={enCours ? "true" : undefined}
            aria-expanded={refus}
            onClick={() => {
              if (!enCours) setRefus((ouvert) => !ouvert);
            }}
            className={`${CLASSE_BOUTON_SECONDAIRE} px-3 py-1.5 aria-disabled:cursor-not-allowed aria-disabled:opacity-60`}
          >
            Refuser<span className="sr-only"> : {nom}</span>
          </button>
        </div>
      </div>

      {refus && (
        <form
          noValidate
          onSubmit={(e) => void handleSubmit(refuser)(e)}
          className="mt-4 flex flex-col gap-2"
        >
          <label htmlFor={`${idChamp}-saisie`} className={CLASSE_LIBELLE}>
            Motif du refus ({nom})
          </label>
          <textarea
            id={`${idChamp}-saisie`}
            rows={3}
            disabled={enCours}
            aria-invalid={errors.motif ? true : undefined}
            aria-describedby={errors.motif ? idErreurMotif : undefined}
            className={`${CLASSE_CHAMP} w-full`}
            {...register("motif")}
          />
          {errors.motif && (
            <p id={idErreurMotif} role="alert" className={CLASSE_ERREUR}>
              {errors.motif.message}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              aria-disabled={enCours ? "true" : undefined}
              className={`${CLASSE_BOUTON_PRINCIPAL} px-3 py-1.5 aria-disabled:cursor-not-allowed aria-disabled:opacity-60`}
            >
              {enCours ? "Envoi…" : "Envoyer le refus"}
            </button>
            <button
              type="button"
              disabled={enCours}
              onClick={() => {
                setRefus(false);
                boutonRefuser.current?.focus();
              }}
              className={`${CLASSE_BOUTON_SECONDAIRE} px-3 py-1.5`}
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <p role="status" className="sr-only">
        {annonce}
      </p>

      {erreur && (
        <p role="alert" className={`${CLASSE_ERREUR} mt-3`}>
          {erreur}
        </p>
      )}
    </li>
  );
}

export function DocumentsDossier({
  idDossier,
  documents,
  onChange,
}: {
  idDossier: string;
  documents: DocumentDossier[];
  // Recharge le dossier et l'historique depuis le serveur.
  onChange: () => void;
}) {
  return (
    <Carte>
      <h2 className="border-b border-line px-5 py-4 font-display text-lg font-semibold text-ink">
        Documents
      </h2>
      {documents.length === 0 ? (
        <Vide>Aucun document n&apos;a été déposé pour ce dossier.</Vide>
      ) : (
        <ul className="divide-y divide-line">
          {documents.map((document) => (
            <LigneDocument
              key={document.id}
              idDossier={idDossier}
              document={document}
              onChange={onChange}
            />
          ))}
        </ul>
      )}
    </Carte>
  );
}
