import { describe, expect, it } from "vitest";
import {
  actionDecisionSchema,
  commentaireSaisieSchema,
  commentaireSchema,
  decisionSchema,
  documentDossierSchema,
  dossierSchema,
  historiqueSchema,
  idDossierSchema,
  refusDocumentSchema,
} from "./schemas";

const messages = (resultat: { error?: { issues: { message: string }[] } }) =>
  resultat.error?.issues.map((i) => i.message) ?? [];

const dossier = {
  id: "d1",
  numeroDossier: "IUC-2026-0001",
  statut: "SOUMIS",
  soumisLe: "2026-03-01T10:00:00.000Z",
  doublonPossible: false,
  candidat: {
    nom: "Ngono",
    prenom: "Awa",
    email: "awa@exemple.cm",
    telephone: "+237600000000",
    dateNaissance: "2005-04-12T00:00:00.000Z",
    sexe: "FEMININ",
    adresse: "Douala",
  },
  programme: { id: "p1", nom: "Informatique", niveau: "Licence" },
  documents: [
    { id: "x1", type: "CNI", nomFichier: "cni.pdf", statut: "A_VERIFIER", motif: null },
  ],
  commentaires: [],
};

describe("dossierSchema (GET /applications/:id)", () => {
  it("accepte un dossier valide", () => {
    expect(dossierSchema.safeParse(dossier).success).toBe(true);
  });

  it("accepte un document refusé avec son motif", () => {
    const refuse = { ...dossier.documents[0], statut: "REFUSE", motif: "Illisible" };
    const lecture = dossierSchema.parse({ ...dossier, documents: [refuse] });
    expect(lecture.documents[0].motif).toBe("Illisible");
  });

  it("refuse un statut de document inconnu", () => {
    const inconnu = { ...dossier.documents[0], statut: "PERDU" };
    expect(documentDossierSchema.safeParse(inconnu).success).toBe(false);
    expect(
      dossierSchema.safeParse({ ...dossier, documents: [inconnu] }).success,
    ).toBe(false);
  });

  it("refuse un statut de dossier inconnu ou un champ manquant", () => {
    expect(dossierSchema.safeParse({ ...dossier, statut: "PERDU" }).success).toBe(false);
    expect(dossierSchema.safeParse({ ...dossier, candidat: undefined }).success).toBe(false);
  });

  it("accepte une liste de commentaires vide et des commentaires valides", () => {
    expect(dossierSchema.safeParse({ ...dossier, commentaires: [] }).success).toBe(true);
    const commentaire = { id: "c1", auteur: "Marie", contenu: "À revoir", date: "2026-03-02T08:00:00Z" };
    expect(commentaireSchema.safeParse(commentaire).success).toBe(true);
    expect(commentaireSchema.safeParse({ ...commentaire, contenu: 3 }).success).toBe(false);
  });
});

describe("historiqueSchema (GET /applications/:id/history)", () => {
  const evenement = { id: "e1", action: "Dossier soumis", auteur: "Awa", date: "2026-03-01T10:00:00Z", detail: null };

  it("accepte un historique vide ou rempli", () => {
    expect(historiqueSchema.safeParse([]).success).toBe(true);
    expect(historiqueSchema.safeParse([evenement, { ...evenement, id: "e2", detail: "Motif" }]).success).toBe(true);
  });

  it("refuse un événement sans date ou un historique qui n'est pas une liste", () => {
    expect(historiqueSchema.safeParse([{ ...evenement, date: undefined }]).success).toBe(false);
    expect(historiqueSchema.safeParse({ items: [] }).success).toBe(false);
  });
});

describe("idDossierSchema", () => {
  it("accepte un identifiant et retire les espaces autour", () => {
    expect(idDossierSchema.parse(" d1 ")).toBe("d1");
  });

  it("refuse un identifiant vide ou trop long", () => {
    expect(messages(idDossierSchema.safeParse("  "))).toContain("L'identifiant du dossier est obligatoire.");
    expect(messages(idDossierSchema.safeParse("a".repeat(101)))).toContain("L'identifiant du dossier est trop long.");
  });
});

describe("refusDocumentSchema", () => {
  it.each([[""], ["   "]])("refuse un motif vide ou fait d'espaces (%j)", (motif) => {
    expect(messages(refusDocumentSchema.safeParse({ motif }))).toContain("Le motif du refus est obligatoire.");
  });

  it("accepte un motif et retire les espaces autour", () => {
    expect(refusDocumentSchema.parse({ motif: "  Photo floue " }).motif).toBe("Photo floue");
  });

  it("refuse un motif trop long", () => {
    expect(refusDocumentSchema.safeParse({ motif: "a".repeat(501) }).success).toBe(false);
  });
});

describe("commentaireSaisieSchema", () => {
  it.each([[""], ["   "]])("refuse un commentaire vide (%j)", (contenu) => {
    expect(messages(commentaireSaisieSchema.safeParse({ contenu }))).toContain("Le commentaire est obligatoire.");
  });

  it("accepte un commentaire et refuse un texte trop long", () => {
    expect(commentaireSaisieSchema.safeParse({ contenu: "Dossier complet" }).success).toBe(true);
    expect(messages(commentaireSaisieSchema.safeParse({ contenu: "a".repeat(2001) }))).toContain(
      "Le commentaire ne dépasse pas 2000 caractères.",
    );
  });
});

describe("decisionSchema", () => {
  it.each([
    ["DEMANDER_CORRECTION", "Le message de correction est obligatoire."],
    ["REFUSER", "Le motif du refus est obligatoire."],
  ])("exige un message pour %s", (action, attendu) => {
    expect(messages(decisionSchema.safeParse({ action }))).toContain(attendu);
    expect(messages(decisionSchema.safeParse({ action, message: "   " }))).toContain(attendu);
    expect(decisionSchema.safeParse({ action, message: "Pièce manquante" }).success).toBe(true);
  });

  it.each([["EN_EXAMEN"], ["ACCEPTER"]])("rend le message facultatif pour %s", (action) => {
    expect(decisionSchema.safeParse({ action }).success).toBe(true);
    expect(decisionSchema.safeParse({ action, message: "" }).success).toBe(true);
  });

  it("refuse une action inconnue ou absente", () => {
    expect(decisionSchema.safeParse({ action: "SUPPRIMER" }).success).toBe(false);
    expect(decisionSchema.safeParse({}).success).toBe(false);
    expect(messages(actionDecisionSchema.safeParse("SUPPRIMER"))).toContain("L'action demandée n'est pas reconnue.");
  });

  it("refuse un message trop long", () => {
    expect(decisionSchema.safeParse({ action: "ACCEPTER", message: "a".repeat(1001) }).success).toBe(false);
  });
});
