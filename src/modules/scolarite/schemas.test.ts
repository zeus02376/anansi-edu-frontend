import { describe, expect, it } from "vitest";
import { criteresSchema, pageDossiersSchema } from "./schemas";

const dossier = {
  id: "d1",
  numeroDossier: "IUC-2026-0001",
  nom: "Mbarga",
  prenom: "Aline",
  programme: { id: "p1", nom: "Informatique" },
  statut: "SOUMIS",
  soumisLe: "2026-09-01T10:00:00.000Z",
  doublonPossible: false,
};
const page = { items: [dossier], total: 1, page: 1, pageSize: 20 };

const messages = (saisie: unknown) =>
  pageDossiersSchema.safeParse(saisie).error?.issues.map((i) => i.message) ?? [];

describe("pageDossiersSchema (GET /applications)", () => {
  it("accepte une page valide", () => {
    expect(pageDossiersSchema.safeParse(page).success).toBe(true);
  });

  it("accepte une liste vide", () => {
    expect(
      pageDossiersSchema.safeParse({ ...page, items: [], total: 0 }).success,
    ).toBe(true);
  });

  it("refuse un total négatif", () => {
    expect(messages({ ...page, total: -1 })).toContain(
      "Le total de dossiers ne peut pas être négatif.",
    );
  });

  it("refuse un dossier sans doublonPossible", () => {
    const { doublonPossible: _omis, ...sansDoublon } = dossier;
    void _omis;
    expect(messages({ ...page, items: [sansDoublon] })).toContain(
      "Le signalement de doublon est manquant.",
    );
  });

  it("refuse un statut inconnu", () => {
    expect(
      pageDossiersSchema.safeParse({
        ...page,
        items: [{ ...dossier, statut: "ARCHIVE" }],
      }).success,
    ).toBe(false);
  });
});

describe("criteresSchema", () => {
  const erreurs = (saisie: unknown) =>
    criteresSchema.safeParse(saisie).error?.issues.map((i) => i.message) ?? [];

  it("applique les valeurs par défaut", () => {
    expect(criteresSchema.parse({})).toEqual({
      page: 1,
      q: "",
      programId: "",
      statut: "",
      tri: "date_desc",
    });
  });

  it("refuse une page inférieure à 1", () => {
    expect(erreurs({ page: 0 })).toContain(
      "Le numéro de page doit être au moins 1.",
    );
  });

  it("refuse un statut inconnu", () => {
    expect(erreurs({ statut: "ARCHIVE" })).toContain("Ce statut n'existe pas.");
  });

  it("accepte un statut connu", () => {
    expect(criteresSchema.parse({ statut: "ACCEPTE" }).statut).toBe("ACCEPTE");
  });

  it("refuse un tri inconnu", () => {
    expect(erreurs({ tri: "nom" })).toContain("Ce tri n'existe pas.");
  });

  it("nettoie la recherche", () => {
    expect(criteresSchema.parse({ q: "  Mbarga  " }).q).toBe("Mbarga");
  });

  it("refuse une recherche trop longue", () => {
    expect(erreurs({ q: "a".repeat(101) })).toContain(
      "La recherche ne peut pas dépasser 100 caractères.",
    );
  });
});
