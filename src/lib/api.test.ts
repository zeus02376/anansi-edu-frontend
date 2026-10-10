import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  ApiError,
  api,
  estIndisponible,
  gererSessionExpiree,
  messageDe,
} from "./api";

function reponse(statut: number, corps?: unknown): Response {
  return new Response(corps === undefined ? null : JSON.stringify(corps), {
    status: statut,
    headers: { "Content-Type": "application/json" },
  });
}

function simuler(resultat: Response | Error) {
  const fetchMock = vi.fn<typeof fetch>(() =>
    resultat instanceof Error
      ? Promise.reject(resultat)
      : Promise.resolve(resultat),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  gererSessionExpiree(null);
});

describe("client d'API", () => {
  it("envoie les cookies de session et lit la réponse validée", async () => {
    const fetchMock = simuler(reponse(200, { id: "1" }));
    const donnees = await api.get("/x", {
      schema: z.object({ id: z.string() }),
    });
    expect(donnees).toEqual({ id: "1" });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      credentials: "include",
      method: "GET",
    });
  });

  it("construit la chaîne de requête sans les valeurs vides", async () => {
    const fetchMock = simuler(reponse(200, []));
    await api.get("/x", {
      params: { page: 2, q: "", statut: undefined, tri: "date_desc" },
    });
    expect(String(fetchMock.mock.calls[0][0])).toBe("/x?page=2&tri=date_desc");
  });

  it("envoie un objet en JSON et un FormData tel quel", async () => {
    const json = simuler(reponse(201, { ok: true }));
    await api.post("/x", { corps: { a: 1 } });
    expect(json.mock.calls[0][1]).toMatchObject({ body: '{"a":1}' });
    expect((json.mock.calls[0][1] as RequestInit).headers).toMatchObject({
      "Content-Type": "application/json",
    });

    const formulaire = new FormData();
    formulaire.set("type", "CNI");
    const envoi = simuler(reponse(201, {}));
    await api.post("/x", { corps: formulaire });
    expect((envoi.mock.calls[0][1] as RequestInit).body).toBe(formulaire);
    expect((envoi.mock.calls[0][1] as RequestInit).headers).not.toHaveProperty(
      "Content-Type",
    );
  });

  it("refuse une réponse qui ne respecte pas le schéma", async () => {
    simuler(reponse(200, { id: 12 }));
    await expect(
      api.get("/x", { schema: z.object({ id: z.string() }) }),
    ).rejects.toMatchObject({
      nature: "serveur",
      message: "Le serveur a renvoyé une réponse inattendue.",
    });
  });

  it("traduit un serveur injoignable", async () => {
    simuler(new TypeError("Failed to fetch"));
    await expect(api.get("/x")).rejects.toMatchObject({ nature: "reseau" });
  });

  it.each([
    [401, "session"],
    [403, "interdit"],
    [404, "introuvable"],
    [405, "indisponible"],
    [501, "indisponible"],
    [409, "conflit"],
    [422, "validation"],
    [500, "serveur"],
  ])("traduit le statut %i en %s", async (statut, nature) => {
    simuler(reponse(statut, {}));
    await expect(api.get("/x")).rejects.toMatchObject({ nature });
  });

  it("reconnaît une route qui n'existe pas encore comme service indisponible", async () => {
    simuler(
      reponse(404, { message: "Cannot GET /applications", statusCode: 404 }),
    );
    const erreur = await api.get("/applications").catch((e: unknown) => e);
    expect(estIndisponible(erreur)).toBe(true);
    expect(messageDe(erreur)).toContain("Service indisponible");
  });

  it("garde les erreurs champ par champ renvoyées par le serveur", async () => {
    simuler(
      reponse(422, { errors: { email: "Adresse déjà utilisée.", nombre: 3 } }),
    );
    const erreur = (await api
      .post("/x", { corps: {} })
      .catch((e: unknown) => e)) as ApiError;
    expect(erreur.champs).toEqual({ email: "Adresse déjà utilisée." });
  });

  it("n'affiche pas le texte brut d'une erreur serveur", async () => {
    simuler(reponse(500, { message: "PrismaClientKnownRequestError: ..." }));
    const erreur = (await api.get("/x").catch((e: unknown) => e)) as ApiError;
    expect(erreur.message).toBe(
      "Le serveur rencontre un problème. Réessayez dans quelques instants.",
    );
  });

  it("signale la session expirée sur un 401, sauf si on l'a demandé autrement", async () => {
    const surExpiration = vi.fn();
    gererSessionExpiree(surExpiration);
    simuler(reponse(401, {}));
    await api.get("/x").catch(() => undefined);
    expect(surExpiration).toHaveBeenCalledTimes(1);
    await api.get("/auth/me", { ignorer401: true }).catch(() => undefined);
    expect(surExpiration).toHaveBeenCalledTimes(1);
  });

  it("renvoie rien pour une réponse 204", async () => {
    simuler(new Response(null, { status: 204 }));
    await expect(api.post("/x")).resolves.toBeUndefined();
  });
});
