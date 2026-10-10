"use client";

import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError, messageDe } from "@/lib/api";
import {
  CLASSE_BOUTON_PRINCIPAL,
  CLASSE_CHAMP,
  CLASSE_ERREUR,
  CLASSE_LIBELLE,
} from "@/components/styles";
import { Carte, Vide } from "@/components/ui";
import { ajouterCommentaire } from "@/modules/dossier/api";
import {
  commentaireSaisieSchema,
  type Commentaire,
  type CommentaireSaisie,
} from "@/modules/dossier/schemas";
import { formaterDateHeure } from "./outils";

export function CommentairesDossier({
  idDossier,
  commentaires,
  onChange,
}: {
  idDossier: string;
  commentaires: Commentaire[];
  // Recharge le dossier et l'historique depuis le serveur.
  onChange: () => void;
}) {
  const idChamp = useId();
  const idErreur = `${idChamp}-erreur`;
  // Annonce pour les lecteurs d'écran, vidée avant chaque envoi.
  const [annonce, setAnnonce] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommentaireSaisie>({
    resolver: zodResolver(commentaireSaisieSchema),
    defaultValues: { contenu: "" },
  });

  async function envoyer({ contenu }: CommentaireSaisie) {
    // aria-disabled ne bloque pas le clic : le garde évite un double envoi.
    if (isSubmitting) return;
    setAnnonce("");
    try {
      await ajouterCommentaire(idDossier, contenu);
      // Vidé seulement en cas de succès.
      reset({ contenu: "" });
      setAnnonce("Commentaire ajouté.");
      onChange();
    } catch (e) {
      if (e instanceof ApiError && e.champs.contenu) {
        setError("contenu", { message: e.champs.contenu });
      } else {
        setError("root.server", { message: messageDe(e) });
      }
    }
  }

  const erreurChamp = errors.contenu?.message ?? errors.root?.server?.message;

  return (
    <Carte>
      <h2 className="border-b border-line px-5 py-4 font-display text-lg font-semibold text-ink">
        Commentaires internes
      </h2>
      {commentaires.length === 0 ? (
        <Vide>Aucun commentaire pour le moment.</Vide>
      ) : (
        <ul className="divide-y divide-line">
          {commentaires.map((commentaire) => (
            <li key={commentaire.id} className="px-5 py-4">
              <p className="text-sm text-muted">
                <span className="font-semibold text-ink">{commentaire.auteur}</span>
                {" · "}
                <time dateTime={commentaire.date}>{formaterDateHeure(commentaire.date)}</time>
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words text-ink">{commentaire.contenu}</p>
            </li>
          ))}
        </ul>
      )}
      <form
        noValidate
        onSubmit={(e) => void handleSubmit(envoyer)(e)}
        className="flex flex-col gap-2 border-t border-line px-5 py-4"
      >
        <label htmlFor={`${idChamp}-saisie`} className={CLASSE_LIBELLE}>
          Ajouter un commentaire
        </label>
        <textarea
          id={`${idChamp}-saisie`}
          rows={3}
          disabled={isSubmitting}
          aria-invalid={erreurChamp ? true : undefined}
          aria-describedby={erreurChamp ? idErreur : undefined}
          className={`${CLASSE_CHAMP} w-full`}
          {...register("contenu")}
        />
        {erreurChamp && (
          <p id={idErreur} role="alert" className={CLASSE_ERREUR}>
            {erreurChamp}
          </p>
        )}
        <div>
          <button
            type="submit"
            aria-disabled={isSubmitting ? "true" : undefined}
            className={`${CLASSE_BOUTON_PRINCIPAL} aria-disabled:cursor-not-allowed aria-disabled:opacity-60`}
          >
            {isSubmitting ? "Envoi…" : "Ajouter le commentaire"}
          </button>
        </div>
        <p role="status" className="sr-only">
          {annonce}
        </p>
      </form>
    </Carte>
  );
}
