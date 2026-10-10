import { describe, expect, it } from "vitest";
import {
  NUMERO_LONGUEUR_MAX,
  suiviDossierSchema,
  suiviSchema,
} from "./schemas";

const messages = (saisie: unknown) =>
  suiviSchema.safeParse(saisie).error?.issues.map((i) => i.message) ?? [];

describe("suiviSchema", () => {
  it("accepte une saisie valide et retire les espaces autour des champs", () => {
    const lecture = suiviSchema.parse({
      numero: "  CAND-2026-0042 ",
      email: " a@b.cm ",
    });
    expect(lecture).toEqual({ numero: "CAND-2026-0042", email: "a@b.cm" });
  });

  it.each([
    [{ numero: "", email: "a@b.cm" }, "Le numéro de dossier est obligatoire."],
    [{ numero: "   ", email: "a@b.cm" }, "Le numéro de dossier est obligatoire."],
    [
      { numero: "x".repeat(NUMERO_LONGUEUR_MAX + 1), email: "a@b.cm" },
      "Le numéro de dossier est trop long (50 caractères maximum).",
    ],
    [{ numero: "N1", email: "" }, "L'adresse e-mail est obligatoire."],
    [{ numero: "N1", email: "   " }, "L'adresse e-mail est obligatoire."],
    [{ numero: "N1", email: "pas-un-email" }, "L'adresse e-mail n'est pas valide."],
    [
      { numero: "N1", email: `${"a".repeat(250)}@b.cm` },
      "L'adresse e-mail est trop longue.",
    ],
  ])("refuse %j", (saisie, message) => {
    expect(messages(saisie)).toContain(message);
  });
});

describe("suiviDossierSchema (GET /applications/track)", () => {
  const base = {
    numeroDossier: "N1",
    statut: "INCOMPLET",
    corrections: [{ id: "c1", motif: "Photo floue", date: "2026-03-01T10:00:00Z" }],
    decision: null,
  };

  it("accepte un dossier sans décision", () => {
    expect(suiviDossierSchema.safeParse(base).success).toBe(true);
  });

  it("accepte un dossier avec décision, motif présent ou null", () => {
    for (const motif of ["Dossier incomplet", null]) {
      const lecture = suiviDossierSchema.safeParse({
        ...base,
        statut: "REJETE",
        decision: { resultat: "REJETE", motif, date: "2026-03-05T09:00:00Z" },
      });
      expect(lecture.success).toBe(true);
    }
  });

  it("accepte une liste de corrections vide", () => {
    expect(
      suiviDossierSchema.safeParse({ ...base, statut: "SOUMIS", corrections: [] })
        .success,
    ).toBe(true);
  });

  it("refuse un statut inconnu", () => {
    expect(
      suiviDossierSchema.safeParse({ ...base, statut: "ARCHIVE" }).success,
    ).toBe(false);
  });

  it("refuse un résultat de décision inconnu", () => {
    expect(
      suiviDossierSchema.safeParse({
        ...base,
        decision: { resultat: "PEUT_ETRE", motif: null, date: "2026-03-05" },
      }).success,
    ).toBe(false);
  });

  it("refuse une date manquante (correction ou décision)", () => {
    expect(
      suiviDossierSchema.safeParse({
        ...base,
        corrections: [{ id: "c1", motif: "Photo floue" }],
      }).success,
    ).toBe(false);
    expect(
      suiviDossierSchema.safeParse({
        ...base,
        decision: { resultat: "ACCEPTE", motif: null },
      }).success,
    ).toBe(false);
  });

  it("refuse une réponse sans corrections ni décision", () => {
    expect(
      suiviDossierSchema.safeParse({ numeroDossier: "N1", statut: "SOUMIS" })
        .success,
    ).toBe(false);
  });
});
