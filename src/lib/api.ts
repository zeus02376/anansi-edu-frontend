import type { ZodType, z } from "zod";

// Client d'API unique de l'application : fetch typé, session par cookie,
// erreurs traduites en français. Les pages ne parlent jamais directement à
// fetch.

const DELAI_MS = 15_000;

export type NatureErreur =
  | "reseau" // serveur injoignable, ne répond pas
  | "session" // 401 : pas de session valide
  | "interdit" // 403
  | "indisponible" // la route n'existe pas (encore) côté serveur
  | "introuvable" // 404 sur un élément précis
  | "validation" // 400 / 422 : champs refusés
  | "conflit" // 409
  | "serveur"; // 5xx, 429, réponse inattendue

export const MESSAGES: Record<NatureErreur, string> = {
  reseau: "Le serveur est injoignable. Vérifiez votre connexion puis réessayez.",
  session: "Votre session a expiré. Reconnectez-vous.",
  interdit: "Accès refusé : votre compte n'a pas le droit de faire cette action.",
  indisponible:
    "Service indisponible : cette fonction n'est pas encore disponible sur le serveur.",
  introuvable: "L'élément demandé est introuvable.",
  validation: "Certains champs sont invalides. Vérifiez-les puis réessayez.",
  conflit: "Cette action entre en conflit avec l'état actuel du dossier.",
  serveur: "Le serveur rencontre un problème. Réessayez dans quelques instants.",
};

export class ApiError extends Error {
  readonly nature: NatureErreur;
  readonly statut: number | null;
  // Erreurs champ par champ renvoyées par le serveur, quand il en renvoie.
  readonly champs: Record<string, string>;

  constructor(
    nature: NatureErreur,
    message: string = MESSAGES[nature],
    statut: number | null = null,
    champs: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.nature = nature;
    this.statut = statut;
    this.champs = champs;
  }
}

export function estIndisponible(erreur: unknown): boolean {
  return erreur instanceof ApiError && erreur.nature === "indisponible";
}

// Message affichable pour n'importe quelle erreur attrapée.
export function messageDe(erreur: unknown): string {
  if (erreur instanceof ApiError) return erreur.message;
  return "Une erreur inattendue s'est produite. Réessayez.";
}

// Appelée sur une réponse 401 (sauf demande contraire) : la session n'est
// plus valable. Enregistrée par le store d'authentification.
let surSessionExpiree: (() => void) | null = null;
export function gererSessionExpiree(gestionnaire: (() => void) | null) {
  surSessionExpiree = gestionnaire;
}

type Parametres = Record<string, string | number | boolean | null | undefined>;

export type Options<S extends ZodType | undefined = undefined> = {
  params?: Parametres;
  // Objet envoyé en JSON, ou FormData (envoi de fichiers).
  corps?: unknown;
  // Schéma de la réponse : une réponse qui ne le respecte pas est refusée.
  schema?: S;
  signal?: AbortSignal;
  // Pour /auth/login et /auth/me, où un 401 est une réponse normale.
  ignorer401?: boolean;
};

type Resultat<S extends ZodType | undefined> = S extends ZodType
  ? z.output<S>
  : undefined;

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
}

function construireUrl(chemin: string, params?: Parametres): string {
  const url = new URL(`${baseUrl()}${chemin}`, "http://base.invalide");
  for (const [cle, valeur] of Object.entries(params ?? {})) {
    if (valeur === null || valeur === undefined || valeur === "") continue;
    url.searchParams.set(cle, String(valeur));
  }
  const relatif = `${url.pathname}${url.search}`;
  return baseUrl() ? `${baseUrl()}${relatif}` : relatif;
}

async function lireJson(reponse: Response): Promise<unknown> {
  try {
    return await reponse.json();
  } catch {
    return null;
  }
}

// « Cannot GET /chemin » : réponse par défaut de Nest pour une route qui
// n'existe pas.
function estRouteInconnue(donnees: unknown): boolean {
  if (typeof donnees !== "object" || donnees === null) return false;
  const { message } = donnees as { message?: unknown };
  return typeof message === "string" && /^Cannot [A-Z]+ \//.test(message);
}

// Format attendu des erreurs de validation : { errors: { champ: "message" } }.
// TODO backend : à confirmer avec l'équipe backend.
function lireChamps(donnees: unknown): Record<string, string> {
  if (typeof donnees !== "object" || donnees === null) return {};
  const { errors } = donnees as { errors?: unknown };
  if (typeof errors !== "object" || errors === null || Array.isArray(errors)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(errors).filter(
      (entree): entree is [string, string] => typeof entree[1] === "string",
    ),
  );
}

function messageServeur(donnees: unknown): string | null {
  if (typeof donnees !== "object" || donnees === null) return null;
  const { message } = donnees as { message?: unknown };
  return typeof message === "string" && message.trim() ? message : null;
}

function erreurDeReponse(statut: number, donnees: unknown): ApiError {
  if (statut === 401) return new ApiError("session", undefined, statut);
  if (statut === 403) return new ApiError("interdit", undefined, statut);
  if (statut === 405 || statut === 501 || estRouteInconnue(donnees)) {
    return new ApiError("indisponible", undefined, statut);
  }
  if (statut === 404) return new ApiError("introuvable", undefined, statut);
  if (statut === 400 || statut === 422) {
    return new ApiError("validation", undefined, statut, lireChamps(donnees));
  }
  if (statut === 409) {
    // Le backend écrit ses messages de conflit en français.
    return new ApiError("conflit", messageServeur(donnees) ?? MESSAGES.conflit, statut);
  }
  return new ApiError("serveur", undefined, statut);
}

async function requete<S extends ZodType | undefined = undefined>(
  methode: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  chemin: string,
  options: Options<S> = {},
): Promise<Resultat<S>> {
  const delai = AbortSignal.timeout(DELAI_MS);
  const signal = options.signal ? AbortSignal.any([options.signal, delai]) : delai;
  const enFormulaire = options.corps instanceof FormData;

  let reponse: Response;
  try {
    reponse = await fetch(construireUrl(chemin, options.params), {
      method: methode,
      credentials: "include",
      signal,
      headers: {
        Accept: "application/json",
        ...(options.corps !== undefined && !enFormulaire
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body:
        options.corps === undefined
          ? undefined
          : enFormulaire
            ? (options.corps as FormData)
            : JSON.stringify(options.corps),
    });
  } catch (erreur) {
    // Annulation volontaire de l'appelant : ce n'est pas une erreur à afficher.
    if (options.signal?.aborted) throw erreur;
    throw new ApiError("reseau");
  }

  if (!reponse.ok) {
    const erreur = erreurDeReponse(reponse.status, await lireJson(reponse));
    if (erreur.nature === "session" && !options.ignorer401) surSessionExpiree?.();
    throw erreur;
  }

  if (reponse.status === 204) return undefined as Resultat<S>;
  const donnees = await lireJson(reponse);
  if (!options.schema) return undefined as Resultat<S>;

  const lecture = options.schema.safeParse(donnees);
  if (!lecture.success) {
    throw new ApiError("serveur", "Le serveur a renvoyé une réponse inattendue.", reponse.status);
  }
  return lecture.data as Resultat<S>;
}

export const api = {
  get: <S extends ZodType | undefined = undefined>(chemin: string, options?: Options<S>) =>
    requete("GET", chemin, options),
  post: <S extends ZodType | undefined = undefined>(chemin: string, options?: Options<S>) =>
    requete("POST", chemin, options),
  patch: <S extends ZodType | undefined = undefined>(chemin: string, options?: Options<S>) =>
    requete("PATCH", chemin, options),
  put: <S extends ZodType | undefined = undefined>(chemin: string, options?: Options<S>) =>
    requete("PUT", chemin, options),
  delete: <S extends ZodType | undefined = undefined>(chemin: string, options?: Options<S>) =>
    requete("DELETE", chemin, options),
};
