import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ACCUEIL_PAR_ROLE,
  cheminNormalise,
  espaceDuChemin,
  lireRole,
  ROLES_PAR_ESPACE,
} from "@/lib/roles";

// Contrôle d'accès avant l'affichage d'une page (« middleware » : il
// s'appelle proxy depuis Next 16).
//  - pas de session valide : redirection vers /login ;
//  - session valide mais rôle non autorisé dans cet espace : redirection vers
//    l'accueil du rôle (ex. un candidat n'entre pas dans /scolarite).
// La session est vérifiée auprès du backend (GET /auth/me) avec le cookie de
// la requête. C'est un contrôle de confort : le backend refuse de toute façon
// les appels non autorisés.
// TODO backend : GET /auth/me doit répondre 200 avec le rôle, ou 401.

const DELAI_MS = 4_000;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const vers = (chemin: string, raison?: string) => {
    const url = new URL(chemin, request.url);
    if (raison) url.searchParams.set("raison", raison);
    return NextResponse.redirect(url);
  };

  const chemin = cheminNormalise(pathname);
  if (chemin === null) return vers("/login");

  const api = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
  if (!api) return vers("/login", "configuration");

  const cookie = request.headers.get("cookie");
  if (!cookie) return vers("/login");

  let reponse: Response;
  try {
    reponse = await fetch(`${api}/auth/me`, {
      headers: { cookie, accept: "application/json" },
      signal: AbortSignal.timeout(DELAI_MS),
      cache: "no-store",
    });
  } catch {
    // Impossible de vérifier : on ne laisse entrer personne.
    return vers("/login", "serveur");
  }
  if (reponse.status === 401 || reponse.status === 403) {
    return vers("/login", "session");
  }
  if (!reponse.ok) return vers("/login", "serveur");

  const donnees: unknown = await reponse.json().catch(() => null);
  const role = lireRole((donnees as { role?: unknown } | null)?.role);
  if (!role) return vers("/login", "session");

  const espace = espaceDuChemin(chemin);
  if (espace && !ROLES_PAR_ESPACE[espace].includes(role)) {
    return vers(ACCUEIL_PAR_ROLE[role]);
  }
  return NextResponse.next();
}

export const config = {
  // Tout, sauf la page de connexion et les fichiers statiques de Next.
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
};
