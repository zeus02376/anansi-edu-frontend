"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import { useForm } from "react-hook-form";
import type { FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Cadre } from "../_components/cadre";
import {
  CLASSE_BOUTON_PRINCIPAL,
  CLASSE_BOUTON_SECONDAIRE,
  CLASSE_CHAMP,
  CLASSE_ERREUR,
  CLASSE_FICHIER,
  CLASSE_LIBELLE,
  CLASSE_TITRE,
} from "../_components/styles";

// Listes en dur pour l'instant : elles viendront du backend plus tard.
const FILIERES = [
  "Cybersécurité",
  "Développement web et mobile",
  "Réseaux et systèmes",
  "Intelligence artificielle et données",
  "Design UI/UX",
] as const;

const NIVEAUX = [
  "Licence 1",
  "Licence 2",
  "Licence 3",
  "Master 1",
  "Master 2",
] as const;

const SEXES = ["Féminin", "Masculin"] as const;

const TAILLE_MAX_FICHIER = 5 * 1024 * 1024;
const TYPES_FICHIER = ["application/pdf", "image/jpeg", "image/png"];
const ACCEPT_FICHIER = ".pdf,.jpg,.jpeg,.png";

function aujourdhui(): string {
  const date = new Date();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mois}-${jour}`;
}

function estUneDateValide(valeur: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valeur)) return false;
  const date = new Date(`${valeur}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(valeur);
}

function fichier({ requis }: { requis: boolean }) {
  return z.custom<FileList | undefined>().superRefine((fichiers, ctx) => {
    const document = fichiers?.[0];
    if (!document) {
      if (requis) {
        ctx.addIssue({ code: "custom", message: "Ce document est obligatoire." });
      }
      return;
    }
    if (!TYPES_FICHIER.includes(document.type)) {
      ctx.addIssue({
        code: "custom",
        message: "Format non accepté : utilisez un fichier PDF, JPG ou PNG.",
      });
      return;
    }
    if (document.size > TAILLE_MAX_FICHIER) {
      ctx.addIssue({
        code: "custom",
        message: "Le fichier est trop lourd (5 Mo maximum).",
      });
    }
  });
}

const candidatureSchema = z.object({
  // Étape 1 : identité
  nom: z.string().trim().min(1, "Le nom est obligatoire."),
  prenom: z.string().trim().min(1, "Le prénom est obligatoire."),
  dateNaissance: z
    .string()
    .min(1, "La date de naissance est obligatoire.")
    .refine(estUneDateValide, "La date de naissance n'est pas valide.")
    .refine(
      (valeur) => !estUneDateValide(valeur) || valeur >= "1900-01-01",
      "La date de naissance n'est pas valide.",
    )
    .refine(
      (valeur) => !estUneDateValide(valeur) || valeur < aujourdhui(),
      "La date de naissance doit être dans le passé.",
    ),
  sexe: z.enum(SEXES, { error: "Sélectionnez le sexe." }),
  // Étape 2 : coordonnées
  telephone: z
    .string()
    .trim()
    .min(1, "Le numéro de téléphone est obligatoire.")
    .refine(
      (valeur) => /^\+?\d{8,15}$/.test(valeur.replace(/[\s.()-]/g, "")),
      "Le numéro de téléphone n'est pas valide (8 à 15 chiffres).",
    ),
  email: z
    .string()
    .trim()
    .min(1, "L'adresse e-mail est obligatoire.")
    .pipe(z.email("L'adresse e-mail n'est pas valide.")),
  adresse: z
    .string()
    .trim()
    .min(1, "L'adresse est obligatoire.")
    .min(5, "L'adresse est trop courte."),
  // Étape 3 : formation souhaitée
  filiere: z.enum(FILIERES, { error: "Choisissez une filière." }),
  niveau: z.enum(NIVEAUX, { error: "Choisissez un niveau." }),
  // Étape 4 : documents
  pieceIdentite: fichier({ requis: true }),
  dernierDiplome: fichier({ requis: true }),
  photoIdentite: fichier({ requis: false }),
});

type CandidatureSaisie = z.input<typeof candidatureSchema>;
type Candidature = z.output<typeof candidatureSchema>;
type NomDeChamp = keyof CandidatureSaisie;

const ETAPES: { titre: string; champs: NomDeChamp[] }[] = [
  { titre: "Identité", champs: ["nom", "prenom", "dateNaissance", "sexe"] },
  { titre: "Coordonnées", champs: ["telephone", "email", "adresse"] },
  { titre: "Formation souhaitée", champs: ["filiere", "niveau"] },
  {
    titre: "Documents",
    champs: ["pieceIdentite", "dernierDiplome", "photoIdentite"],
  },
  { titre: "Récapitulatif", champs: [] },
];

const DERNIERE_ETAPE = ETAPES.length - 1;
const DELAI_ANTI_DOUBLE_CLIC_MS = 600;

function attributsErreur(id: string, erreur: FieldError | undefined) {
  return {
    "aria-invalid": erreur ? (true as const) : undefined,
    "aria-describedby": erreur ? `${id}-erreur` : undefined,
  };
}

function MessageErreur({
  id,
  erreur,
}: {
  id: string;
  erreur: FieldError | undefined;
}) {
  if (!erreur?.message) return null;
  return (
    <p id={`${id}-erreur`} role="alert" className={CLASSE_ERREUR}>
      {erreur.message}
    </p>
  );
}

function Champ({
  id,
  libelle,
  erreur,
  aide,
  children,
}: {
  id: string;
  libelle: string;
  erreur: FieldError | undefined;
  aide?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={CLASSE_LIBELLE}>
        {libelle}
      </label>
      {children}
      {aide && <p className="text-sm text-muted">{aide}</p>}
      <MessageErreur id={id} erreur={erreur} />
    </div>
  );
}

function formaterDate(valeur: string): string {
  const [annee, mois, jour] = valeur.split("-");
  return `${jour}/${mois}/${annee}`;
}

function nomDuFichier(fichiers: FileList | undefined): string {
  return fichiers?.[0]?.name ?? "Non fourni";
}

function lignesDuRecapitulatif(valeurs: CandidatureSaisie) {
  return [
    {
      titre: "Identité",
      lignes: [
        ["Nom", valeurs.nom.trim()],
        ["Prénom", valeurs.prenom.trim()],
        ["Date de naissance", formaterDate(valeurs.dateNaissance)],
        ["Sexe", valeurs.sexe],
      ],
    },
    {
      titre: "Coordonnées",
      lignes: [
        ["Téléphone", valeurs.telephone.trim()],
        ["E-mail", valeurs.email.trim()],
        ["Adresse", valeurs.adresse.trim()],
      ],
    },
    {
      titre: "Formation souhaitée",
      lignes: [
        ["Filière", valeurs.filiere],
        ["Niveau", valeurs.niveau],
      ],
    },
    {
      titre: "Documents",
      lignes: [
        ["Pièce d'identité", nomDuFichier(valeurs.pieceIdentite)],
        ["Dernier diplôme", nomDuFichier(valeurs.dernierDiplome)],
        ["Photo d'identité", nomDuFichier(valeurs.photoIdentite)],
      ],
    },
  ];
}

type Recapitulatif = ReturnType<typeof lignesDuRecapitulatif>;

export default function CandidaturePage() {
  const [etape, setEtape] = useState(0);
  const [recapitulatif, setRecapitulatif] = useState<Recapitulatif | null>(
    null,
  );
  const [dossierPret, setDossierPret] = useState(false);
  const titreEtape = useRef<HTMLHeadingElement>(null);
  const premierAffichage = useRef(true);
  const validationEnCours = useRef(false);
  const arriveeAuRecapitulatif = useRef(0);

  const {
    register: enregistrerChamp,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<CandidatureSaisie, unknown, Candidature>({
    resolver: zodResolver(candidatureSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      dateNaissance: "",
      telephone: "",
      email: "",
      adresse: "",
    },
  });

  // Tant que le formulaire n'a pas été soumis, React Hook Form ne revalide
  // pas les champs : on le fait nous-mêmes pour qu'une erreur affichée
  // disparaisse dès que le champ est corrigé.
  function register(nom: NomDeChamp) {
    return enregistrerChamp(nom, {
      onChange: () => {
        if (errors[nom]) void trigger(nom);
      },
    });
  }

  // À chaque changement d'étape, on place le focus sur son titre pour que
  // le clavier et les lecteurs d'écran repartent du début de l'étape.
  useEffect(() => {
    if (premierAffichage.current) {
      premierAffichage.current = false;
      return;
    }
    titreEtape.current?.focus();
  }, [etape]);

  async function allerALEtapeSuivante() {
    if (validationEnCours.current) return;
    validationEnCours.current = true;
    try {
      const estValide = await trigger(ETAPES[etape].champs, {
        shouldFocus: true,
      });
      if (!estValide) return;

      const suivante = etape + 1;
      if (suivante === DERNIERE_ETAPE) {
        setRecapitulatif(lignesDuRecapitulatif(getValues()));
        arriveeAuRecapitulatif.current = performance.now();
      }
      setEtape(suivante);
    } finally {
      validationEnCours.current = false;
    }
  }

  function allerALEtapePrecedente() {
    setDossierPret(false);
    setEtape(etape - 1);
  }

  function soumettre(evenement: FormEvent<HTMLFormElement>) {
    if (etape < DERNIERE_ETAPE) {
      evenement.preventDefault();
      void allerALEtapeSuivante();
      return;
    }
    // Un double-clic sur « Suivant » ne doit pas soumettre le dossier avant
    // que le récapitulatif ait pu être relu.
    const depuisLArrivee = performance.now() - arriveeAuRecapitulatif.current;
    if (depuisLArrivee < DELAI_ANTI_DOUBLE_CLIC_MS) {
      evenement.preventDefault();
      return;
    }
    // L'envoi au serveur n'est pas encore branché : on confirme seulement
    // que le dossier est complet et valide.
    void handleSubmit(() => setDossierPret(true))(evenement);
  }

  return (
    <Cadre
      texte="Cinq étapes pour préparer votre dossier. Vous pouvez revenir en arrière à tout moment."
      fil={
        <ol
          className="relative flex justify-between lg:flex-col lg:justify-start"
          style={{ "--avancement": etape / DERNIERE_ETAPE } as CSSProperties}
        >
          <li
            aria-hidden="true"
            className="absolute top-1/2 right-1.5 left-1.5 h-px -translate-y-1/2 bg-white/25 lg:top-5 lg:right-auto lg:bottom-5 lg:left-[5.5px] lg:h-auto lg:w-px lg:translate-y-0"
          >
            <span className="fil-avancement block size-full bg-gold" />
          </li>
          {ETAPES.map(({ titre }, index) => (
            <li
              key={titre}
              aria-current={index === etape ? "step" : undefined}
              className="relative flex items-center gap-4 lg:h-10"
            >
              <span
                aria-hidden="true"
                className={
                  index < etape
                    ? "size-3 rounded-full bg-gold"
                    : index === etape
                      ? "size-3 rounded-full bg-gold ring-4 ring-gold/30"
                      : "size-3 rounded-full border border-white/50 bg-panel"
                }
              />
              <span
                className={
                  index === etape
                    ? "sr-only font-semibold text-white lg:not-sr-only"
                    : index < etape
                      ? "sr-only text-white/90 lg:not-sr-only"
                      : "sr-only text-white/60 lg:not-sr-only"
                }
              >
                {index + 1}. {titre}
              </span>
            </li>
          ))}
        </ol>
      }
    >
      <h1 className={CLASSE_TITRE}>Dossier de candidature</h1>

      <form onSubmit={soumettre} noValidate className="mt-8">
        <p className="text-sm font-medium text-muted">
          Étape {etape + 1} sur {ETAPES.length}
        </p>
        <h2
          ref={titreEtape}
          tabIndex={-1}
          className="mt-1 font-display text-xl font-semibold text-ink outline-hidden"
        >
          {ETAPES[etape].titre}
        </h2>

          {/* Les étapes restent montées (seulement masquées) pour conserver
              les fichiers déjà choisis quand on revient en arrière. */}
          <div hidden={etape !== 0} className="mt-6 flex flex-col gap-5">
            <Champ id="nom" libelle="Nom" erreur={errors.nom}>
              <input
                id="nom"
                type="text"
                autoComplete="family-name"
                className={CLASSE_CHAMP}
                {...attributsErreur("nom", errors.nom)}
                {...register("nom")}
              />
            </Champ>

            <Champ id="prenom" libelle="Prénom" erreur={errors.prenom}>
              <input
                id="prenom"
                type="text"
                autoComplete="given-name"
                className={CLASSE_CHAMP}
                {...attributsErreur("prenom", errors.prenom)}
                {...register("prenom")}
              />
            </Champ>

            <Champ
              id="dateNaissance"
              libelle="Date de naissance"
              erreur={errors.dateNaissance}
            >
              <input
                id="dateNaissance"
                type="date"
                autoComplete="bday"
                className={CLASSE_CHAMP}
                {...attributsErreur("dateNaissance", errors.dateNaissance)}
                {...register("dateNaissance")}
              />
            </Champ>

            <fieldset
              className="flex flex-col gap-1.5"
              aria-describedby={errors.sexe ? "sexe-erreur" : undefined}
            >
              <legend className={CLASSE_LIBELLE}>Sexe</legend>
              <div className="mt-1.5 flex gap-6">
                {SEXES.map((sexe) => (
                  <label key={sexe} className="flex items-center gap-2 text-base">
                    <input
                      type="radio"
                      className="size-4 accent-primary"
                      value={sexe}
                      {...register("sexe")}
                    />
                    {sexe}
                  </label>
                ))}
              </div>
              <MessageErreur id="sexe" erreur={errors.sexe} />
            </fieldset>
          </div>

          <div hidden={etape !== 1} className="mt-6 flex flex-col gap-5">
            <Champ id="telephone" libelle="Téléphone" erreur={errors.telephone}>
              <input
                id="telephone"
                type="tel"
                autoComplete="tel"
                className={CLASSE_CHAMP}
                {...attributsErreur("telephone", errors.telephone)}
                {...register("telephone")}
              />
            </Champ>

            <Champ id="email" libelle="Adresse e-mail" erreur={errors.email}>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={CLASSE_CHAMP}
                {...attributsErreur("email", errors.email)}
                {...register("email")}
              />
            </Champ>

            <Champ id="adresse" libelle="Adresse" erreur={errors.adresse}>
              <textarea
                id="adresse"
                rows={3}
                autoComplete="street-address"
                className={CLASSE_CHAMP}
                {...attributsErreur("adresse", errors.adresse)}
                {...register("adresse")}
              />
            </Champ>
          </div>

          <div hidden={etape !== 2} className="mt-6 flex flex-col gap-5">
            <Champ id="filiere" libelle="Filière" erreur={errors.filiere}>
              <select
                id="filiere"
                defaultValue=""
                className={CLASSE_CHAMP}
                {...attributsErreur("filiere", errors.filiere)}
                {...register("filiere")}
              >
                <option value="" disabled>
                  Choisir une filière
                </option>
                {FILIERES.map((filiere) => (
                  <option key={filiere} value={filiere}>
                    {filiere}
                  </option>
                ))}
              </select>
            </Champ>

            <Champ id="niveau" libelle="Niveau" erreur={errors.niveau}>
              <select
                id="niveau"
                defaultValue=""
                className={CLASSE_CHAMP}
                {...attributsErreur("niveau", errors.niveau)}
                {...register("niveau")}
              >
                <option value="" disabled>
                  Choisir un niveau
                </option>
                {NIVEAUX.map((niveau) => (
                  <option key={niveau} value={niveau}>
                    {niveau}
                  </option>
                ))}
              </select>
            </Champ>
          </div>

          <div hidden={etape !== 3} className="mt-6 flex flex-col gap-5">
            <p className="text-sm text-muted">
              Formats acceptés : PDF, JPG ou PNG, 5 Mo maximum par fichier.
            </p>

            <Champ
              id="pieceIdentite"
              libelle="Pièce d'identité"
              erreur={errors.pieceIdentite}
            >
              <input
                id="pieceIdentite"
                type="file"
                accept={ACCEPT_FICHIER}
                className={CLASSE_FICHIER}
                {...attributsErreur("pieceIdentite", errors.pieceIdentite)}
                {...register("pieceIdentite")}
              />
            </Champ>

            <Champ
              id="dernierDiplome"
              libelle="Dernier diplôme ou relevé de notes"
              erreur={errors.dernierDiplome}
            >
              <input
                id="dernierDiplome"
                type="file"
                accept={ACCEPT_FICHIER}
                className={CLASSE_FICHIER}
                {...attributsErreur("dernierDiplome", errors.dernierDiplome)}
                {...register("dernierDiplome")}
              />
            </Champ>

            <Champ
              id="photoIdentite"
              libelle="Photo d'identité (facultatif)"
              erreur={errors.photoIdentite}
            >
              <input
                id="photoIdentite"
                type="file"
                accept={ACCEPT_FICHIER}
                className={CLASSE_FICHIER}
                {...attributsErreur("photoIdentite", errors.photoIdentite)}
                {...register("photoIdentite")}
              />
            </Champ>
          </div>

          {etape === DERNIERE_ETAPE && recapitulatif && (
            <div className="mt-6 flex flex-col gap-6">
              <p className="text-sm text-muted">
                Vérifiez vos informations avant de soumettre le dossier.
              </p>
              {recapitulatif.map(({ titre, lignes }) => (
                <section key={titre}>
                  <h3 className="font-display text-base font-semibold text-ink">
                    {titre}
                  </h3>
                  <dl className="mt-2 divide-y divide-line rounded-md border border-line bg-surface text-sm">
                    {lignes.map(([libelle, valeur]) => (
                      <div
                        key={libelle}
                        className="flex flex-col gap-0.5 px-3 py-2 sm:flex-row sm:gap-4"
                      >
                        <dt className="text-muted sm:w-44 sm:shrink-0">
                          {libelle}
                        </dt>
                        <dd className="break-words whitespace-pre-line">
                          {valeur}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          )}

          {/* Toujours monté pour que l'annonce soit lue quand le message apparaît. */}
          <div role="status" className="mt-6">
            {dossierPret && (
              <p className="rounded-md border border-green-700/40 bg-green-700/10 px-3.5 py-2.5 text-sm font-medium text-green-800 dark:text-green-300">
                Dossier prêt (envoi non branché)
              </p>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between gap-4 border-t border-line pt-6">
            {etape > 0 ? (
              <button
                type="button"
                onClick={allerALEtapePrecedente}
                className={CLASSE_BOUTON_SECONDAIRE}
              >
                Précédent
              </button>
            ) : (
              <span />
            )}

            <button
              type="submit"
              className={CLASSE_BOUTON_PRINCIPAL}
            >
              {etape < DERNIERE_ETAPE ? "Suivant" : "Soumettre le dossier"}
            </button>
          </div>
        </form>
    </Cadre>
  );
}
