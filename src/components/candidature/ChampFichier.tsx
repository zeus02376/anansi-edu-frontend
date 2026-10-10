"use client";

import { useRef, useState } from "react";
import type { FieldError } from "react-hook-form";
import { CLASSE_LIBELLE, CLASSE_LIEN } from "@/components/styles";
import { attributsErreur, Coche, MessageErreur } from "./champs";

const ACCEPT_FICHIER = ".pdf,.jpg,.jpeg,.png";

function formaterTaille(octets: number): string {
  if (octets < 1024 * 1024) {
    return `${Math.max(1, Math.round(octets / 1024))} Ko`;
  }
  return `${(octets / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}

// Zone de dépôt : le champ de fichier natif, invisible, recouvre toute la
// zone. Le clic, le clavier et le glisser-déposer restent donc ceux du
// navigateur ; on ne fait qu'habiller le résultat. Le fichier est tenu par le
// formulaire (`fichier`, `onChoisir`) ; la validation est celle du schéma.
export function ChampFichier({
  id,
  libelle,
  erreur,
  fichier,
  onChoisir,
  desactive = false,
}: {
  id: string;
  libelle: string;
  erreur: FieldError | undefined;
  fichier: File | null;
  onChoisir: (fichier: File | null) => void;
  desactive?: boolean;
}) {
  const entree = useRef<HTMLInputElement | null>(null);
  const [survol, setSurvol] = useState(false);

  function retirer() {
    if (entree.current) {
      entree.current.value = "";
      entree.current.focus();
    }
    onChoisir(null);
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className={CLASSE_LIBELLE}>
        {libelle}
      </label>
      <div
        onDragEnter={() => setSurvol(true)}
        onDragLeave={() => setSurvol(false)}
        onDrop={() => setSurvol(false)}
        className={`relative flex min-h-16 items-center gap-3 rounded-md border px-3.5 py-3 transition-[border-color,background-color,box-shadow] duration-150 has-[:focus-visible]:border-primary has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-primary/25 has-[[aria-invalid=true]]:border-red-700 ${
          fichier
            ? "border-field bg-surface"
            : "border-dashed border-field bg-surface/60 hover:border-ink hover:bg-surface"
        } ${survol ? "border-primary bg-primary/5" : ""}`}
      >
        <input
          ref={entree}
          id={id}
          type="file"
          accept={ACCEPT_FICHIER}
          disabled={desactive}
          className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          {...attributsErreur(id, erreur)}
          onChange={(evenement) => onChoisir(evenement.target.files?.[0] ?? null)}
        />

        {fichier ? (
          <>
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <Coche className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold break-words text-ink">
                {fichier.name}
              </span>
              <span className="block text-sm text-muted">
                {formaterTaille(fichier.size)}
              </span>
            </span>
            {!desactive && (
              <button type="button" onClick={retirer} className={`${CLASSE_LIEN} relative`}>
                Retirer
                <span className="sr-only"> : {libelle}</span>
              </button>
            )}
          </>
        ) : (
          <span className="text-sm text-muted">
            <span className="font-semibold text-ink">Choisir un fichier</span> ou le
            glisser ici
          </span>
        )}
      </div>
      <MessageErreur id={id} erreur={erreur} />
    </div>
  );
}

// Aide à afficher au-dessus des champs : formats et taille acceptés.
export const AIDE_FICHIERS =
  "Formats acceptés : PDF, JPG ou PNG, 5 Mo maximum par fichier.";
