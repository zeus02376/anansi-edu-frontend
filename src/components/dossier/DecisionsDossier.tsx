"use client";

import { useEffect, useId, useRef, useState } from "react";
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
import { Carte } from "@/components/ui";
import { decider } from "@/modules/dossier/api";
import {
  ACTIONS_DECISION,
  decisionSchema,
  type ActionDecision,
  type DecisionSaisie,
} from "@/modules/dossier/schemas";

// Libellés de chaque action : bouton, phrase de confirmation, et champ
// obligatoire éventuel. Le serveur décide si l'action est permise.
const ACTIONS: Record<
  ActionDecision,
  { bouton: string; phrase: string; champ?: string }
> = {
  EN_EXAMEN: {
    bouton: "Passer en examen",
    phrase: "Vous allez passer ce dossier en examen.",
  },
  DEMANDER_CORRECTION: {
    bouton: "Demander une correction",
    phrase: "Vous allez demander une correction au candidat.",
    champ: "Message de correction",
  },
  ACCEPTER: { bouton: "Accepter", phrase: "Vous allez accepter ce dossier." },
  REFUSER: {
    bouton: "Refuser",
    phrase: "Vous allez refuser ce dossier.",
    champ: "Motif du refus",
  },
};

// Boîte de confirmation : <dialog> natif ouvert avec showModal (focus piégé,
// Échap pour fermer). Rien n'est envoyé avant le clic sur « Confirmer ».
function DialogueDecision({
  idDossier,
  numero,
  action,
  onFermer,
  onSucces,
}: {
  idDossier: string;
  numero: string;
  action: ActionDecision;
  onFermer: () => void;
  onSucces: () => void;
}) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const idChamp = useId();
  const { bouton, phrase, champ } = ACTIONS[action];
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DecisionSaisie>({
    resolver: zodResolver(decisionSchema),
    defaultValues: { action, message: "" },
  });

  useEffect(() => {
    const element = dialogue.current;
    if (element && !element.open) element.showModal();
  }, []);

  async function confirmer({ message }: DecisionSaisie) {
    // aria-disabled ne bloque pas le clic : le garde évite un double envoi.
    if (isSubmitting) return;
    try {
      await decider(idDossier, action, message);
      onSucces();
      dialogue.current?.close();
    } catch (e) {
      if (e instanceof ApiError && (e.champs.message ?? e.champs.motif)) {
        setError("message", { message: e.champs.message ?? e.champs.motif });
      } else {
        // Ex. 409 : le message du serveur s'affiche sans fermer la boîte.
        setError("root.server", { message: messageDe(e) });
      }
    }
  }

  const idErreurChamp = `${idChamp}-message`;
  const erreurServeur = errors.root?.server?.message;

  return (
    <dialog
      ref={dialogue}
      aria-labelledby={`${idChamp}-titre`}
      onClose={onFermer}
      // Pas de fermeture par Échap pendant l'envoi.
      onCancel={(e) => isSubmitting && e.preventDefault()}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border border-line bg-surface p-0 text-ink shadow-xl backdrop:bg-ink/50"
    >
      <form
        noValidate
        onSubmit={(e) => void handleSubmit(confirmer)(e)}
        className="flex flex-col gap-3 p-5"
      >
        <h2 id={`${idChamp}-titre`} className="font-display text-lg font-semibold">
          {bouton}
        </h2>
        <p className="break-words text-sm">
          {phrase} <span className="text-muted">Dossier {numero}.</span>
        </p>
        {champ && (
          <div className="flex flex-col gap-2">
            <label htmlFor={`${idChamp}-saisie`} className={CLASSE_LIBELLE}>
              {champ}
            </label>
            <textarea
              id={`${idChamp}-saisie`}
              rows={4}
              disabled={isSubmitting}
              aria-invalid={errors.message ? true : undefined}
              aria-describedby={errors.message ? idErreurChamp : undefined}
              className={`${CLASSE_CHAMP} w-full`}
              {...register("message")}
            />
            {errors.message && (
              <p id={idErreurChamp} role="alert" className={CLASSE_ERREUR}>
                {errors.message.message}
              </p>
            )}
          </div>
        )}
        {erreurServeur && (
          <p role="alert" className={CLASSE_ERREUR}>
            {erreurServeur}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => dialogue.current?.close()}
            className={CLASSE_BOUTON_SECONDAIRE}
          >
            Annuler
          </button>
          <button
            type="submit"
            aria-disabled={isSubmitting ? "true" : undefined}
            className={`${CLASSE_BOUTON_PRINCIPAL} aria-disabled:cursor-not-allowed aria-disabled:opacity-60`}
          >
            {isSubmitting ? "Envoi…" : "Confirmer"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export function DecisionsDossier({
  idDossier,
  numero,
  onDecision,
}: {
  idDossier: string;
  numero: string;
  // Recharge le dossier et l'historique depuis le serveur.
  onDecision: () => void;
}) {
  const [ouverte, setOuverte] = useState<ActionDecision | null>(null);
  const [annonce, setAnnonce] = useState("");
  const boutons = useRef<Partial<Record<ActionDecision, HTMLButtonElement | null>>>({});

  return (
    <Carte>
      <h2 className="border-b border-line px-5 py-4 font-display text-lg font-semibold text-ink">
        Décision
      </h2>
      <div className="flex flex-wrap gap-2 px-5 py-4">
        {ACTIONS_DECISION.map((action) => (
          <button
            key={action}
            ref={(element) => {
              boutons.current[action] = element;
            }}
            type="button"
            onClick={() => {
              setAnnonce("");
              setOuverte(action);
            }}
            className={action === "ACCEPTER" ? CLASSE_BOUTON_PRINCIPAL : CLASSE_BOUTON_SECONDAIRE}
          >
            {ACTIONS[action].bouton}
          </button>
        ))}
      </div>
      <p role="status" aria-live="polite" className="px-5 pb-4 text-sm font-semibold text-ink empty:hidden">
        {annonce}
      </p>
      {ouverte && (
        <DialogueDecision
          key={ouverte}
          idDossier={idDossier}
          numero={numero}
          action={ouverte}
          onFermer={() => {
            // Le focus revient sur le bouton d'origine.
            boutons.current[ouverte]?.focus();
            setOuverte(null);
          }}
          onSucces={() => {
            setAnnonce("Décision enregistrée.");
            onDecision();
          }}
        />
      )}
    </Carte>
  );
}
