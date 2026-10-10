"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import type { FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AIDE_FICHIERS,
  ChampFichier,
} from "@/components/candidature/ChampFichier";
import {
  attributsErreur,
  CLASSE_ARIA_INACTIF,
  Champ,
  MessageErreur,
} from "@/components/candidature/champs";
import { EnvoiDocuments } from "@/components/candidature/EnvoiDocuments";
import { Reprise } from "@/components/candidature/Reprise";
import { useEnvoiDocuments } from "@/components/candidature/useEnvoiDocuments";
import { IndicateurEtapes } from "@/components/candidature/IndicateurEtapes";
import {
  ecrireBrouillon,
  ecrireDossierCree,
  effacerBrouillon,
  effacerDossierCree,
  lireBrouillon,
  lireDossierCree,
} from "@/components/candidature/brouillon";
import { EtatErreur } from "@/components/EtatErreur";
import {
  CLASSE_BOUTON_PRINCIPAL,
  CLASSE_BOUTON_SECONDAIRE,
  CLASSE_CHAMP,
  CLASSE_LIBELLE,
  CLASSE_LIEN,
} from "@/components/styles";
import { Carte, Chargement, EnTete, formaterDate } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { ApiError } from "@/lib/api";
import { creerCandidature, listerFormations } from "@/modules/candidature/api";
import {
  candidatureSchema,
  DERNIERE_ETAPE,
  DOCUMENTS,
  ETAPES,
  formationDansListeSchema,
  versCorps,
  type Candidature,
  type CandidatureCreee,
  type CandidatureSaisie,
  type NomDeChamp,
} from "@/modules/candidature/schemas";
import {
  LIBELLE_SEXE,
  LIBELLE_TYPE_DOCUMENT,
  SEXES,
  type TypeDocument,
} from "@/modules/commun/schemas";

const DELAI_ANTI_DOUBLE_CLIC_MS = 600;
const ETAPE_FORMATION = 2;

// Champs de données (hors fichiers) : ceux dont le serveur peut refuser la valeur.
const CHAMPS_DONNEES: string[] = ETAPES.slice(0, ETAPE_FORMATION + 1).flatMap(
  (etape) => etape.champs,
);

const LIBELLE_DOCUMENT_FORMULAIRE: Record<(typeof DOCUMENTS)[number]["champ"], string> = {
  pieceIdentite: LIBELLE_TYPE_DOCUMENT.CNI,
  dernierDiplome: LIBELLE_TYPE_DOCUMENT.DIPLOME,
  photoIdentite: `${LIBELLE_TYPE_DOCUMENT.PHOTO} (facultatif)`,
};

const unFichier = (valeur: unknown): File | null => (valeur instanceof File ? valeur : null);

const sansAbonnement = () => () => {};

export default function Vue() {
  // Le brouillon se lit dans le navigateur : le formulaire n'est rendu qu'après
  // l'hydratation pour que le HTML du serveur et du navigateur concordent.
  const monte = useSyncExternalStore(
    sansAbonnement,
    () => true,
    () => false,
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <EnTete
        titre="Dossier de candidature"
        texte="Cinq étapes pour déposer votre candidature. Vous pouvez revenir en arrière à tout moment avant l'envoi."
      />
      <Carte className="p-5 sm:p-6">{monte ? <Contenu /> : <Chargement />}</Carte>
    </div>
  );
}

// Si un dossier a déjà été créé (rechargement pendant un échec partiel),
// on propose de reprendre l'envoi des documents au lieu d'un formulaire vierge.
function Contenu() {
  const [dossierCree] = useState(lireDossierCree);
  return dossierCree ? <Reprise dossier={dossierCree} /> : <Formulaire />;
}

function Formulaire() {
  const router = useRouter();
  const [brouillon] = useState(lireBrouillon);
  // Les fichiers ne sont pas conservés : on ne reprend jamais après les documents.
  const [etape, setEtape] = useState(Math.min(brouillon?.etape ?? 0, DERNIERE_ETAPE - 1));
  const [sens, setSens] = useState(1);
  // Dossier créé côté serveur : conservé pour ne jamais le recréer.
  const [dossier, setDossier] = useState<CandidatureCreee | null>(null);
  const {
    etats: etatsDocuments,
    envoi,
    estActif,
    initialiser,
    exclusif,
    televerser,
  } = useEnvoiDocuments();
  const [termine, setTermine] = useState(false);
  const [erreurEnvoi, setErreurEnvoi] = useState<unknown>(null);
  const titreEtape = useRef<HTMLHeadingElement>(null);
  const premierAffichage = useRef(true);
  const validationEnCours = useRef(false);
  const titreEnvoi = useRef<HTMLHeadingElement>(null);
  const arriveeAuRecapitulatif = useRef(0);

  const { donnees: formations, erreur: erreurFormations, chargement, recharger } = useApi(
    listerFormations,
    "formations",
  );

  const {
    register: enregistrerChamp,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    setError,
    control,
    formState: { errors },
  } = useForm<CandidatureSaisie, unknown, Candidature>({
    resolver: zodResolver(candidatureSchema),
    defaultValues: {
      nom: brouillon?.valeurs.nom ?? "",
      prenom: brouillon?.valeurs.prenom ?? "",
      dateNaissance: brouillon?.valeurs.dateNaissance ?? "",
      sexe: brouillon?.valeurs.sexe,
      telephone: brouillon?.valeurs.telephone ?? "",
      email: brouillon?.valeurs.email ?? "",
      adresse: brouillon?.valeurs.adresse ?? "",
      programId: brouillon?.valeurs.programId ?? "",
      pieceIdentite: null,
      dernierDiplome: null,
      photoIdentite: null,
    },
  });
  const valeurs = useWatch({ control });

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

  // Brouillon : écrit à chaque saisie tant que le dossier n'existe pas.
  useEffect(() => {
    if (!dossier) ecrireBrouillon(etape, valeurs);
  }, [etape, dossier, valeurs]);

  // Dès la création du dossier, le titre de la section d'envoi prend le focus.
  useEffect(() => {
    if (dossier) titreEnvoi.current?.focus();
  }, [dossier]);

  const verrouille = dossier !== null;
  const formationsPretes = formations !== null && formations.length > 0;
  const aEchoue = Object.values(etatsDocuments).some((d) => d.etat === "echec");
  const bloque = envoi || termine;
  // Dès que l'envoi commence (envoi en cours ou dossier créé), plus aucune
  // navigation entre les étapes.
  const navigationBloquee = bloque || verrouille;
  // Boutons inactifs par aria-disabled (le focus est conservé) : chaque action
  // vérifie ce drapeau elle-même.
  const soumissionInactive =
    bloque || (etape === ETAPE_FORMATION && !formationsPretes) || (dossier !== null && !aEchoue);

  function changerEtape(cible: number) {
    setErreurEnvoi(null);
    setSens(cible < etape ? -1 : 1);
    setEtape(cible);
  }

  function allerA(cible: number) {
    if (navigationBloquee) return;
    changerEtape(cible);
  }

  // Appelée avant la création du dossier (erreurs de validation locales ou
  // refusées par le serveur) : le retour à l'étape fautive reste permis.
  function allerAuPremierChampEnErreur(noms: string[]) {
    const cible = ETAPES.findIndex((e) => e.champs.some((champ) => noms.includes(champ)));
    if (cible >= 0) changerEtape(cible);
  }

  async function avancer() {
    if (validationEnCours.current) return;
    validationEnCours.current = true;
    try {
      const estValide = await trigger(ETAPES[etape].champs, { shouldFocus: true });
      if (!estValide) return;
      if (etape === ETAPE_FORMATION) {
        // La liste vient du serveur : un brouillon peut citer une formation retirée.
        const lecture = formationDansListeSchema((formations ?? []).map((f) => f.id)).safeParse(
          getValues("programId"),
        );
        if (!lecture.success) {
          setError("programId", { message: lecture.error.issues[0]?.message });
          return;
        }
      }
      allerA(etape + 1);
    } finally {
      validationEnCours.current = false;
    }
  }

  function choisirFichier(champ: (typeof DOCUMENTS)[number]["champ"], fichier: File | null) {
    setValue(champ, fichier, { shouldDirty: true, shouldValidate: Boolean(errors[champ]) });
  }

  function terminer(creee: CandidatureCreee) {
    effacerBrouillon();
    effacerDossierCree();
    // Page quittée entre-temps : ni navigation ni état.
    if (!estActif()) return;
    setTermine(true);
    router.push(`/candidature/confirmation?numero=${encodeURIComponent(creee.numeroDossier)}`);
  }

  // Envoie les documents choisis (ou un seul), un par un. Redirige quand tous
  // les documents choisis sont envoyés.
  async function televerserChoisis(creee: CandidatureCreee, seulement?: TypeDocument) {
    const choisis = DOCUMENTS.flatMap((d) => {
      const fichier = unFichier(getValues(d.champ));
      return fichier ? [{ type: d.type, fichier }] : [];
    });
    const aEnvoyer = seulement ? choisis.filter((d) => d.type === seulement) : choisis;
    const complet = await televerser(
      creee.id,
      aEnvoyer,
      choisis.map((d) => d.type),
    );
    if (complet) terminer(creee);
  }

  // Erreurs champ par champ du serveur : rattachées aux champs, puis retour à
  // l'étape du premier champ en erreur. Les données saisies sont conservées.
  function traiterErreurCreation(erreur: unknown) {
    if (erreur instanceof ApiError && erreur.nature === "validation") {
      const noms = Object.keys(erreur.champs).filter((nom) => CHAMPS_DONNEES.includes(nom));
      for (const nom of noms) {
        setError(nom as NomDeChamp, { type: "serveur", message: erreur.champs[nom] });
      }
      if (noms.length > 0) {
        allerAuPremierChampEnErreur(noms);
        return;
      }
    }
    setErreurEnvoi(erreur);
  }

  function envoyer(saisie: Candidature) {
    return exclusif(async () => {
      setErreurEnvoi(null);
      let creee = dossier;
      if (!creee) {
        try {
          creee = await creerCandidature(versCorps(saisie));
        } catch (erreur) {
          if (estActif()) traiterErreurCreation(erreur);
          return;
        }
        // Le dossier existe : on garde son numéro (clé distincte du brouillon)
        // pour qu'un rechargement ne ramène pas à un formulaire vierge.
        ecrireDossierCree(creee);
        effacerBrouillon();
        if (!estActif()) return;
        setDossier(creee);
        initialiser(
          DOCUMENTS.filter((d) => unFichier(getValues(d.champ))).map((d) => d.type),
        );
      }
      await televerserChoisis(creee);
    });
  }

  function reessayerDocument(type: TypeDocument) {
    if (!dossier || bloque) return;
    void exclusif(() => televerserChoisis(dossier, type)).then(() => {
      // Le bouton « Réessayer » a pu disparaître : le focus revient au titre.
      if (estActif()) titreEnvoi.current?.focus();
    });
  }

  function soumettre(evenement: FormEvent<HTMLFormElement>) {
    if (soumissionInactive) {
      evenement.preventDefault();
      return;
    }
    if (etape < DERNIERE_ETAPE) {
      evenement.preventDefault();
      arriveeAuRecapitulatif.current = evenement.timeStamp;
      void avancer();
      return;
    }
    // Un double-clic sur « Suivant » ne doit pas envoyer le dossier avant
    // que le récapitulatif ait pu être relu.
    if (evenement.timeStamp - arriveeAuRecapitulatif.current < DELAI_ANTI_DOUBLE_CLIC_MS) {
      evenement.preventDefault();
      return;
    }
    void handleSubmit(envoyer, (invalides) =>
      allerAuPremierChampEnErreur(Object.keys(invalides)),
    )(evenement);
  }

  const classeEtape = "etape-entree mt-6 flex flex-col gap-5";
  const nomFormation = formations?.find((f) => f.id === valeurs.programId);

  const recapitulatif: [string, string][][] = [
    [
      ["Nom", valeurs.nom?.trim() ?? ""],
      ["Prénom", valeurs.prenom?.trim() ?? ""],
      ["Date de naissance", valeurs.dateNaissance ? formaterDate(valeurs.dateNaissance, { calendaire: true }) : ""],
      ["Sexe", valeurs.sexe ? LIBELLE_SEXE[valeurs.sexe] : ""],
    ],
    [
      ["Téléphone", valeurs.telephone?.trim() ?? ""],
      ["E-mail", valeurs.email?.trim() ?? ""],
      ["Adresse", valeurs.adresse?.trim() ?? ""],
    ],
    [["Formation", nomFormation ? `${nomFormation.nom} — ${nomFormation.niveau}` : "—"]],
    DOCUMENTS.map((d) => [
      LIBELLE_TYPE_DOCUMENT[d.type],
      unFichier(valeurs[d.champ])?.name ?? "Non fourni",
    ]),
  ];

  return (
    <div className="flex flex-col gap-6">
      <IndicateurEtapes
        titres={ETAPES.map((e) => e.titre)}
        courante={etape}
        bloque={navigationBloquee}
        onAller={allerA}
      />

      <form
        onSubmit={soumettre}
        noValidate
        style={{ "--sens": sens } as CSSProperties}
      >
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
        <div hidden={etape !== 0} className={classeEtape}>
          <div className="grid gap-5 sm:grid-cols-2">
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
          </div>

          <Champ id="dateNaissance" libelle="Date de naissance" erreur={errors.dateNaissance}>
            <input
              id="dateNaissance"
              type="date"
              autoComplete="bday"
              className={`${CLASSE_CHAMP} sm:max-w-60`}
              {...attributsErreur("dateNaissance", errors.dateNaissance)}
              {...register("dateNaissance")}
            />
          </Champ>

          <fieldset
            className="flex min-w-0 flex-col gap-1.5"
            aria-describedby={errors.sexe ? "sexe-erreur" : undefined}
          >
            <legend className={CLASSE_LIBELLE}>Sexe</legend>
            <div className="mt-1.5 flex flex-wrap gap-3">
              {SEXES.map((sexe) => (
                <label key={sexe} className="cursor-pointer">
                  <input
                    type="radio"
                    value={sexe}
                    className="peer sr-only"
                    {...register("sexe")}
                  />
                  <span className="block rounded-md border border-field bg-surface px-5 py-2.5 text-sm font-semibold text-ink transition-[background-color,border-color,color,box-shadow] duration-150 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary peer-hover:border-ink peer-focus-visible:ring-3 peer-focus-visible:ring-primary/30">
                    {LIBELLE_SEXE[sexe]}
                  </span>
                </label>
              ))}
            </div>
            <MessageErreur id="sexe" erreur={errors.sexe} />
          </fieldset>
        </div>

        <div hidden={etape !== 1} className={classeEtape}>
          <div className="grid gap-5 sm:grid-cols-2">
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
          </div>

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

        <div hidden={etape !== ETAPE_FORMATION} className={classeEtape}>
          {chargement && !formations && <Chargement texte="Chargement des formations…" />}
          {erreurFormations !== null && (
            <>
              <EtatErreur
                erreur={erreurFormations}
                onReessayer={recharger}
                sujet="La liste des formations"
              />
              <p className="text-sm text-muted">
                Vous pourrez passer à l&apos;étape suivante dès que la liste des formations
                sera affichée.
              </p>
            </>
          )}
          {formations && formations.length === 0 && (
            <p role="status" className="text-sm text-muted">
              Aucune formation n&apos;est ouverte aux candidatures pour le moment.
            </p>
          )}
          {formationsPretes && (
            <Champ id="programId" libelle="Formation" erreur={errors.programId}>
              <select
                id="programId"
                className={CLASSE_CHAMP}
                {...attributsErreur("programId", errors.programId)}
                {...register("programId")}
              >
                <option value="" disabled>
                  Choisir une formation
                </option>
                {formations.map((formation) => (
                  <option key={formation.id} value={formation.id}>
                    {formation.nom} — {formation.niveau}
                  </option>
                ))}
              </select>
            </Champ>
          )}
        </div>

        <div hidden={etape !== 3} className={classeEtape}>
          <p className="text-sm text-muted">{AIDE_FICHIERS}</p>
          {DOCUMENTS.map(({ champ }) => (
            <ChampFichier
              key={champ}
              id={champ}
              libelle={LIBELLE_DOCUMENT_FORMULAIRE[champ]}
              erreur={errors[champ] as FieldError | undefined}
              fichier={unFichier(valeurs[champ])}
              onChoisir={(fichier) => choisirFichier(champ, fichier)}
            />
          ))}
        </div>

        {etape === DERNIERE_ETAPE && (
          <div className="etape-entree mt-6 flex flex-col gap-6">
            <p className="text-sm text-muted">
              Vérifiez vos informations avant d&apos;envoyer votre candidature.
            </p>
            {recapitulatif.map((lignes, index) => (
              <section key={ETAPES[index].titre}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-base font-semibold text-ink">
                    {ETAPES[index].titre}
                  </h3>
                  {!navigationBloquee && (
                    <button type="button" onClick={() => allerA(index)} className={CLASSE_LIEN}>
                      Modifier
                      <span className="sr-only"> : {ETAPES[index].titre}</span>
                    </button>
                  )}
                </div>
                <dl className="mt-2 divide-y divide-line rounded-md border border-line bg-surface text-sm">
                  {lignes.map(([libelle, valeur]) => (
                    <div
                      key={libelle}
                      className="flex flex-col gap-0.5 px-3.5 py-2.5 sm:flex-row sm:gap-4"
                    >
                      <dt className="text-muted sm:w-44 sm:shrink-0">{libelle}</dt>
                      <dd className="min-w-0 font-medium break-words whitespace-pre-line text-ink">
                        {valeur || "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}

          </div>
        )}

        {dossier && (
          <div className="mt-6">
            <EnvoiDocuments
              numero={dossier.numeroDossier}
              etats={etatsDocuments}
              bloque={bloque}
              onReessayer={reessayerDocument}
              titreRef={titreEnvoi}
            />
          </div>
        )}

        <div role="status" className="mt-6 text-sm text-muted">
          {envoi && !dossier && "Envoi de votre dossier en cours…"}
          {termine && "Envoi terminé. Redirection vers la confirmation…"}
        </div>

        {erreurEnvoi !== null && (
          <div className="mt-4">
            <EtatErreur erreur={erreurEnvoi} sujet="L'envoi de la candidature" />
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          {etape > 0 && !verrouille ? (
            <button
              type="button"
              aria-disabled={bloque}
              onClick={() => allerA(etape - 1)}
              className={`${CLASSE_BOUTON_SECONDAIRE} ${CLASSE_ARIA_INACTIF}`}
            >
              Précédent
            </button>
          ) : (
            <span />
          )}

          <div className="flex flex-wrap justify-end gap-3">
            {dossier && aEchoue && (
              <button
                type="button"
                aria-disabled={bloque}
                onClick={() => {
                  if (!bloque) terminer(dossier);
                }}
                className={`${CLASSE_BOUTON_SECONDAIRE} ${CLASSE_ARIA_INACTIF}`}
              >
                Continuer vers la confirmation
              </button>
            )}
            <button
              type="submit"
              aria-disabled={soumissionInactive}
              className={`${CLASSE_BOUTON_PRINCIPAL} ${CLASSE_ARIA_INACTIF}`}
            >
              {etape < DERNIERE_ETAPE
                ? "Suivant"
                : dossier
                  ? "Réessayer les documents en échec"
                  : envoi
                    ? "Envoi en cours…"
                    : "Envoyer ma candidature"}
            </button>
          </div>
        </div>
        {dossier && aEchoue && (
          <p className="mt-3 text-sm text-muted">
            Si vous continuez sans réessayer, votre dossier sera marqué incomplet par la
            scolarité jusqu&apos;à la réception des documents manquants.
          </p>
        )}
      </form>

      <p className="text-sm text-muted">
        Vos réponses sont conservées dans ce navigateur le temps de la session. Les fichiers ne
        peuvent pas l&apos;être : si vous rechargez la page, vous devrez les choisir à nouveau.
      </p>
    </div>
  );
}
