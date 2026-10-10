"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import type { FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EtatErreur } from "@/components/EtatErreur";
import { ResultatSuivi } from "@/components/suivi/ResultatSuivi";
import {
  CLASSE_BOUTON_PRINCIPAL,
  CLASSE_BOUTON_SECONDAIRE,
  CLASSE_CHAMP,
  CLASSE_ERREUR,
  CLASSE_LIBELLE,
} from "@/components/styles";
import { Carte, EnTete } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { suivreDossier } from "@/modules/suivi/api";
import {
  suiviSchema,
  type SuiviDossier,
  type SuiviRecherche,
  type SuiviSaisie,
} from "@/modules/suivi/schemas";

const MESSAGE_INTROUVABLE =
  "Aucun dossier ne correspond à ce numéro et à cette adresse e-mail.";

type NomDeChamp = keyof SuiviSaisie;

function Champ({
  id,
  libelle,
  erreur,
  children,
}: {
  id: string;
  libelle: string;
  erreur: FieldError | undefined;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={CLASSE_LIBELLE}>
        {libelle}
      </label>
      {children}
      {erreur?.message && (
        <p id={`${id}-erreur`} role="alert" className={CLASSE_ERREUR}>
          {erreur.message}
        </p>
      )}
    </div>
  );
}

export default function Vue() {
  const [suivi, setSuivi] = useState<SuiviDossier | null>(null);
  const [introuvable, setIntrouvable] = useState(false);
  const [echec, setEchec] = useState<{
    erreur: unknown;
    recherche: SuiviRecherche;
  } | null>(null);
  const [chargement, setChargement] = useState(false);
  const appel = useRef<AbortController | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<SuiviSaisie, unknown, SuiviRecherche>({
    resolver: zodResolver(suiviSchema),
    defaultValues: { numero: "", email: "" },
  });

  // Quitter la page annule l'appel en cours.
  useEffect(() => () => appel.current?.abort(), []);

  async function chercher(recherche: SuiviRecherche) {
    // Bouton en aria-disabled : on ignore un second envoi pendant la recherche.
    if (chargement) return;
    // Relancer la recherche annule la précédente.
    appel.current?.abort();
    const annulation = new AbortController();
    appel.current = annulation;
    setChargement(true);
    setEchec(null);
    setIntrouvable(false);
    setSuivi(null);
    try {
      const resultat = await suivreDossier(recherche, annulation.signal);
      if (annulation.signal.aborted) return;
      setSuivi(resultat);
    } catch (erreur) {
      if (annulation.signal.aborted) return;
      if (erreur instanceof ApiError && erreur.nature === "introuvable") {
        setIntrouvable(true);
        return;
      }
      // Erreurs champ par champ renvoyées par le serveur.
      const champs =
        erreur instanceof ApiError && erreur.nature === "validation"
          ? Object.entries(erreur.champs).filter(
              ([nom]) => nom === "numero" || nom === "email",
            )
          : [];
      if (champs.length > 0) {
        for (const [nom, message] of champs) {
          setError(nom as NomDeChamp, { message });
        }
        return;
      }
      setEchec({ erreur, recherche });
    } finally {
      if (!annulation.signal.aborted) setChargement(false);
    }
  }

  function nouvelleRecherche() {
    appel.current?.abort();
    setSuivi(null);
    setIntrouvable(false);
    setEchec(null);
    setChargement(false);
    reset();
    setFocus("numero");
  }

  function attributs(nom: NomDeChamp) {
    return {
      "aria-invalid": errors[nom] ? (true as const) : undefined,
      "aria-describedby": errors[nom] ? `${nom}-erreur` : undefined,
    };
  }

  return (
    <div className="flex flex-col gap-6">
      <EnTete
        titre="Suivi de ma candidature"
        texte="Saisissez le numéro de dossier reçu lors du dépôt et l'adresse e-mail utilisée."
      />

      <Carte className="p-5">
        <form
          onSubmit={(evenement) => void handleSubmit(chercher)(evenement)}
          noValidate
          className="flex flex-col gap-5"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Champ id="numero" libelle="Numéro de dossier" erreur={errors.numero}>
              <input
                id="numero"
                type="text"
                autoComplete="off"
                className={CLASSE_CHAMP}
                {...attributs("numero")}
                {...register("numero")}
              />
            </Champ>
            <Champ id="email" libelle="Adresse e-mail" erreur={errors.email}>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={CLASSE_CHAMP}
                {...attributs("email")}
                {...register("email")}
              />
            </Champ>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              aria-disabled={chargement ? "true" : undefined}
              aria-busy={chargement}
              className={`${CLASSE_BOUTON_PRINCIPAL} aria-disabled:cursor-not-allowed aria-disabled:opacity-60`}
            >
              {chargement && (
                <span
                  aria-hidden="true"
                  className="size-4 animate-spin rounded-full border-2 border-on-primary border-r-transparent motion-reduce:animate-none"
                />
              )}
              {chargement ? "Recherche en cours…" : "Suivre mon dossier"}
            </button>
            {(suivi || introuvable || echec) && (
              <button
                type="button"
                onClick={nouvelleRecherche}
                className={CLASSE_BOUTON_SECONDAIRE}
              >
                Nouvelle recherche
              </button>
            )}
          </div>
        </form>
      </Carte>

      {/* Toujours monté pour que le résultat soit annoncé à son apparition. */}
      <div aria-live="polite">
        {introuvable && (
          <p
            role="alert"
            className="rounded-md border border-amber-600/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900"
          >
            {MESSAGE_INTROUVABLE}
          </p>
        )}
        {echec && (
          <EtatErreur
            erreur={echec.erreur}
            sujet="Le suivi du dossier"
            onReessayer={() => void chercher(echec.recherche)}
          />
        )}
        {suivi && <ResultatSuivi suivi={suivi} />}
      </div>
    </div>
  );
}
