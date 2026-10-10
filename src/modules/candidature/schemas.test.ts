import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  brouillonSchema,
  candidatureCreeeSchema,
  candidatureSchema,
  coordonneesSchema,
  corpsCandidatureSchema,
  documentsSchema,
  fichierSchema,
  formationDansListeSchema,
  formationsSchema,
  formationSchema,
  identiteSchema,
  numeroUrlSchema,
  versCorps,
} from "./schemas";

const messages = (schema: { safeParse: (v: unknown) => { error?: { issues: { message: string }[] } } }, saisie: unknown) =>
  schema.safeParse(saisie).error?.issues.map((i) => i.message) ?? [];

const fichier = (nom: string, type: string, taille = 10) =>
  new File([new Uint8Array(taille)], nom, { type });

const identite = {
  nom: "Mbarga",
  prenom: "Awa",
  dateNaissance: "2002-05-14",
  sexe: "FEMININ",
};
const coordonnees = {
  telephone: "+237 6 70 00 00 00",
  email: "awa@exemple.cm",
  adresse: "Rue 1.234, Douala",
};

describe("identiteSchema", () => {
  it("accepte une identité valide et retire les espaces autour du nom", () => {
    const lecture = identiteSchema.parse({ ...identite, nom: "  Mbarga " });
    expect(lecture.nom).toBe("Mbarga");
  });

  it.each([
    [{ ...identite, nom: "  " }, "Le nom est obligatoire."],
    [{ ...identite, prenom: "" }, "Le prénom est obligatoire."],
    [{ ...identite, dateNaissance: "" }, "La date de naissance est obligatoire."],
    [{ ...identite, dateNaissance: "2020-02-30" }, "La date de naissance n'est pas valide."],
    [{ ...identite, dateNaissance: "14/05/2002" }, "La date de naissance n'est pas valide."],
    [{ ...identite, dateNaissance: "1850-01-01" }, "La date de naissance n'est pas valide."],
    [{ ...identite, dateNaissance: "2999-01-01" }, "La date de naissance doit être dans le passé."],
    [{ ...identite, sexe: undefined }, "Sélectionnez le sexe."],
    [{ ...identite, sexe: "Féminin" }, "Sélectionnez le sexe."],
  ])("refuse %j", (saisie, message) => {
    expect(messages(identiteSchema, saisie)).toContain(message);
  });
});

describe("identiteSchema : longueurs", () => {
  it.each(["nom", "prenom"] as const)("accepte %s de 100 caractères et refuse 101", (champ) => {
    expect(identiteSchema.safeParse({ ...identite, [champ]: "a".repeat(100) }).success).toBe(true);
    const libelle = champ === "nom" ? "Le nom" : "Le prénom";
    expect(messages(identiteSchema, { ...identite, [champ]: "a".repeat(101) })).toContain(
      `${libelle} est trop long (100 caractères maximum).`,
    );
  });

  it("compte la longueur après retrait des espaces autour", () => {
    expect(
      identiteSchema.safeParse({ ...identite, nom: ` ${"a".repeat(100)} ` }).success,
    ).toBe(true);
  });
});

describe("identiteSchema : bornes de la date de naissance", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 10, 12, 0, 0));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const date = (dateNaissance: string) => ({ ...identite, dateNaissance });

  it("refuse aujourd'hui et accepte hier", () => {
    expect(messages(identiteSchema, date("2026-10-10"))).toContain(
      "La date de naissance doit être dans le passé.",
    );
    expect(identiteSchema.safeParse(date("2026-10-09")).success).toBe(true);
  });

  it("accepte le 1er janvier 1900 et refuse le 31 décembre 1899", () => {
    expect(identiteSchema.safeParse(date("1900-01-01")).success).toBe(true);
    expect(messages(identiteSchema, date("1899-12-31"))).toContain(
      "La date de naissance n'est pas valide.",
    );
  });

  it("accepte un 29 février d'année bissextile et refuse les autres", () => {
    expect(identiteSchema.safeParse(date("2024-02-29")).success).toBe(true);
    expect(identiteSchema.safeParse(date("2000-02-29")).success).toBe(true);
    expect(messages(identiteSchema, date("2023-02-29"))).toContain(
      "La date de naissance n'est pas valide.",
    );
    expect(messages(identiteSchema, date("1900-02-29"))).toContain(
      "La date de naissance n'est pas valide.",
    );
  });
});

describe("coordonneesSchema", () => {
  it("accepte des coordonnées valides", () => {
    expect(coordonneesSchema.safeParse(coordonnees).success).toBe(true);
  });

  it.each([
    [{ ...coordonnees, telephone: "" }, "Le numéro de téléphone est obligatoire."],
    [{ ...coordonnees, telephone: "12345" }, "Le numéro de téléphone n'est pas valide (8 à 15 chiffres)."],
    [{ ...coordonnees, telephone: "06 abc 12 34" }, "Le numéro de téléphone n'est pas valide (8 à 15 chiffres)."],
    [{ ...coordonnees, email: "" }, "L'adresse e-mail est obligatoire."],
    [{ ...coordonnees, email: "pas-un-email" }, "L'adresse e-mail n'est pas valide."],
    [{ ...coordonnees, adresse: "" }, "L'adresse est obligatoire."],
    [{ ...coordonnees, adresse: "Rue" }, "L'adresse est trop courte."],
  ])("refuse %j", (saisie, message) => {
    expect(messages(coordonneesSchema, saisie)).toContain(message);
  });
});

describe("coordonneesSchema : longueurs", () => {
  // 15 chiffres séparés par des espaces : 29 caractères, 30 avec le « + ».
  const chiffres = "123456789012345".split("");
  const telephone30 = `+${chiffres.join(" ")}`;

  it("accepte un téléphone de 30 caractères et refuse 31", () => {
    expect(telephone30).toHaveLength(30);
    expect(coordonneesSchema.safeParse({ ...coordonnees, telephone: telephone30 }).success).toBe(
      true,
    );
    expect(
      messages(coordonneesSchema, { ...coordonnees, telephone: `${telephone30} ` + "1" }),
    ).toContain("Le numéro de téléphone est trop long (30 caractères maximum).");
  });

  it("accepte une adresse de 300 caractères et refuse 301", () => {
    expect(
      coordonneesSchema.safeParse({ ...coordonnees, adresse: "a".repeat(300) }).success,
    ).toBe(true);
    expect(messages(coordonneesSchema, { ...coordonnees, adresse: "a".repeat(301) })).toContain(
      "L'adresse est trop longue (300 caractères maximum).",
    );
  });

  // 64 + 1 + 189 = 254 caractères ; le plus long domaine admis par étiquette (63).
  const domaine = (longueur: number) =>
    `${"b".repeat(63)}.${"b".repeat(63)}.${"b".repeat(longueur - 128)}`;

  it("accepte un e-mail de 254 caractères et refuse 255", () => {
    const limite = `${"a".repeat(64)}@${domaine(189)}`;
    expect(limite).toHaveLength(254);
    expect(coordonneesSchema.safeParse({ ...coordonnees, email: limite }).success).toBe(true);
    const trop = `${"a".repeat(64)}@${domaine(190)}`;
    expect(trop).toHaveLength(255);
    expect(messages(coordonneesSchema, { ...coordonnees, email: trop })).toContain(
      "L'adresse e-mail est trop longue (254 caractères maximum).",
    );
  });
});

describe("formationSchema", () => {
  it("accepte l'identifiant d'une formation", () => {
    expect(formationSchema.safeParse({ programId: "p1" }).success).toBe(true);
  });

  it.each([{ programId: "" }, {}, { programId: undefined }])(
    "refuse une formation absente %j",
    (saisie) => {
      expect(messages(formationSchema, saisie)).toContain("Choisissez une formation.");
    },
  );
});

describe("formationDansListeSchema", () => {
  const schema = formationDansListeSchema(["p1", "p2"]);

  it("accepte une formation de la liste", () => {
    expect(schema.safeParse("p2").success).toBe(true);
  });

  it.each(["p3", "", "P1"])("refuse %j, absent de la liste", (id) => {
    expect(messages(schema, id)).toEqual([
      "Cette formation n'est pas dans la liste proposée. Choisissez-en une.",
    ]);
  });

  it("refuse tout quand la liste est vide, et une valeur absente", () => {
    expect(formationDansListeSchema([]).safeParse("p1").success).toBe(false);
    expect(messages(schema, undefined)).toEqual(["Choisissez une formation."]);
  });
});

describe("fichierSchema", () => {
  const requis = fichierSchema({ requis: true });
  const facultatif = fichierSchema({ requis: false });

  it.each([
    ["PDF", fichier("a.pdf", "application/pdf")],
    ["JPG", fichier("a.jpg", "image/jpeg")],
    ["PNG", fichier("a.png", "image/png")],
  ])("accepte un %s", (_nom, document) => {
    expect(requis.safeParse(document).success).toBe(true);
  });

  it("accepte un fichier de 5 Mo pile", () => {
    const document = fichier("a.pdf", "application/pdf", 5 * 1024 * 1024);
    expect(requis.safeParse(document).success).toBe(true);
  });

  it("refuse un document obligatoire absent", () => {
    for (const absent of [undefined, null]) {
      expect(messages(requis, absent)).toEqual(["Ce document est obligatoire."]);
    }
  });

  it("accepte l'absence d'un document facultatif", () => {
    expect(facultatif.safeParse(undefined).success).toBe(true);
    expect(facultatif.safeParse(null).success).toBe(true);
  });

  it("refuse un format non accepté", () => {
    expect(messages(requis, fichier("a.gif", "image/gif"))).toEqual([
      "Format non accepté : utilisez un fichier PDF, JPG ou PNG.",
    ]);
    expect(messages(facultatif, fichier("a.txt", "text/plain"))).toEqual([
      "Format non accepté : utilisez un fichier PDF, JPG ou PNG.",
    ]);
  });

  it("refuse un fichier vide", () => {
    expect(messages(requis, fichier("a.pdf", "application/pdf", 0))).toEqual([
      "Le fichier est vide.",
    ]);
  });

  it("refuse un fichier trop lourd", () => {
    const document = fichier("a.pdf", "application/pdf", 5 * 1024 * 1024 + 1);
    expect(messages(requis, document)).toEqual(["Le fichier est trop lourd (5 Mo maximum)."]);
  });
});

describe("documentsSchema", () => {
  const pdf = fichier("a.pdf", "application/pdf");

  it("accepte les deux documents obligatoires sans photo", () => {
    expect(
      documentsSchema.safeParse({ pieceIdentite: pdf, dernierDiplome: pdf }).success,
    ).toBe(true);
  });

  it("refuse l'absence des documents obligatoires", () => {
    expect(messages(documentsSchema, { photoIdentite: pdf })).toEqual([
      "Ce document est obligatoire.",
      "Ce document est obligatoire.",
    ]);
  });
});

describe("candidatureSchema et versCorps", () => {
  const pdf = fichier("a.pdf", "application/pdf");
  const complet = {
    ...identite,
    ...coordonnees,
    programId: "p1",
    pieceIdentite: pdf,
    dernierDiplome: pdf,
  };

  it("accepte un dossier complet et n'envoie aucun fichier au serveur", () => {
    const corps = versCorps(candidatureSchema.parse({ ...complet, nom: " Mbarga " }));
    expect(corps).toEqual({
      nom: "Mbarga",
      prenom: "Awa",
      dateNaissance: "2002-05-14",
      sexe: "FEMININ",
      telephone: "+237 6 70 00 00 00",
      email: "awa@exemple.cm",
      adresse: "Rue 1.234, Douala",
      programId: "p1",
    });
    expect(corpsCandidatureSchema.safeParse(corps).success).toBe(true);
  });

  it("refuse un dossier incomplet", () => {
    expect(candidatureSchema.safeParse({ ...complet, programId: "" }).success).toBe(false);
  });
});

describe("formationsSchema (GET /programs)", () => {
  it("accepte une liste de formations, même vide", () => {
    const formation = { id: "p1", code: "L1-INF", nom: "Informatique", niveau: "Licence 1" };
    expect(formationsSchema.safeParse([formation]).success).toBe(true);
    expect(formationsSchema.safeParse([]).success).toBe(true);
  });

  it("refuse une formation sans niveau ou autre chose qu'une liste", () => {
    expect(formationsSchema.safeParse([{ id: "p1", code: "x", nom: "y" }]).success).toBe(false);
    expect(formationsSchema.safeParse({ items: [] }).success).toBe(false);
  });
});

describe("candidatureCreeeSchema (POST /applications)", () => {
  it("accepte { id, numeroDossier }", () => {
    expect(candidatureCreeeSchema.safeParse({ id: "7", numeroDossier: "IUC-2026-0007" }).success).toBe(true);
  });

  it("ignore les champs en plus et n'exige que id et numeroDossier", () => {
    const lecture = candidatureCreeeSchema.parse({
      id: "7",
      numeroDossier: "IUC-2026-0007",
      statut: "SOUMISE",
    });
    expect(lecture).toEqual({ id: "7", numeroDossier: "IUC-2026-0007" });
  });

  it("refuse un numéro absent ou vide", () => {
    expect(candidatureCreeeSchema.safeParse({ id: "7" }).success).toBe(false);
    expect(candidatureCreeeSchema.safeParse({ id: "7", numeroDossier: "" }).success).toBe(false);
  });
});

describe("brouillonSchema", () => {
  it("accepte une étape et des valeurs partielles", () => {
    const lecture = brouillonSchema.parse({ etape: 2, valeurs: { nom: "Awa", sexe: "FEMININ" } });
    expect(lecture.etape).toBe(2);
  });

  it.each([
    [{ etape: 5, valeurs: {} }],
    [{ etape: -1, valeurs: {} }],
    [{ etape: 1.5, valeurs: {} }],
    [{ etape: 1, valeurs: { sexe: "Féminin" } }],
    [{ valeurs: {} }],
    ["texte"],
  ])("refuse %j", (saisie) => {
    expect(brouillonSchema.safeParse(saisie).success).toBe(false);
  });
});

describe("numeroUrlSchema", () => {
  it("garde un numéro de dossier ordinaire", () => {
    expect(numeroUrlSchema.parse("IUC-2026/0007")).toBe("IUC-2026/0007");
  });

  it("retire les caractères dangereux et limite la longueur", () => {
    expect(numeroUrlSchema.parse("<b>AB-1</b>")).toBe("bAB-1/b");
    expect(numeroUrlSchema.parse("A".repeat(100))).toHaveLength(40);
  });

  it("refuse un numéro vide ou sans caractère exploitable", () => {
    expect(numeroUrlSchema.safeParse("").success).toBe(false);
    expect(numeroUrlSchema.safeParse("<> ").success).toBe(false);
  });
});
