import { describe, expect, it } from "vitest";
import { connexionSchema, utilisateurSchema } from "./schemas";

const messages = (saisie: unknown) =>
  connexionSchema.safeParse(saisie).error?.issues.map((i) => i.message) ?? [];

describe("connexionSchema", () => {
  it("accepte des identifiants valides et retire les espaces autour de l'e-mail", () => {
    const lecture = connexionSchema.parse({
      email: "  a@b.cm ",
      password: "motdepasse1",
    });
    expect(lecture.email).toBe("a@b.cm");
  });

  it.each([
    [{ email: "", password: "motdepasse1" }, "L'adresse e-mail est obligatoire."],
    [
      { email: "pas-un-email", password: "motdepasse1" },
      "L'adresse e-mail n'est pas valide.",
    ],
    [{ email: "a@b.cm", password: "" }, "Le mot de passe est obligatoire."],
    [
      { email: "a@b.cm", password: "court" },
      "Le mot de passe contient au moins 8 caractères.",
    ],
  ])("refuse %j", (saisie, message) => {
    expect(messages(saisie)).toContain(message);
  });
});

describe("utilisateurSchema (GET /auth/me)", () => {
  it("accepte un profil avec rôle connu", () => {
    expect(
      utilisateurSchema.safeParse({ id: "u1", role: "SCOLARITE" }).success,
    ).toBe(true);
  });

  it("refuse un rôle inconnu ou absent", () => {
    expect(
      utilisateurSchema.safeParse({ id: "u1", role: "ROOT" }).success,
    ).toBe(false);
    expect(utilisateurSchema.safeParse({ id: "u1" }).success).toBe(false);
  });
});
