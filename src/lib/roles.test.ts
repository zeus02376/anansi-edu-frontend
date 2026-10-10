import { describe, expect, it } from "vitest";
import { cheminNormalise, espaceDuChemin } from "./roles";

describe("espaceDuChemin", () => {
  it.each([
    ["/scolarite", "/scolarite"],
    ["/scolarite/dossiers/a1", "/scolarite"],
    ["/admin/dashboard", "/admin"],
    ["/etudiant", "/etudiant"],
    ["/candidature", null],
    ["/suivi", null],
    ["/scolariteX", null],
  ])("%s -> %s", (chemin, espace) => {
    expect(espaceDuChemin(chemin)).toBe(espace);
  });
});

describe("cheminNormalise", () => {
  it("décode les caractères encodés pour que le garde-fou les voie", () => {
    expect(espaceDuChemin(cheminNormalise("/%73colarite/dossiers/a1") ?? "")).toBe("/scolarite");
    expect(espaceDuChemin(cheminNormalise("/%61dmin") ?? "")).toBe("/admin");
  });

  it("regroupe les barres en double", () => {
    expect(cheminNormalise("//scolarite///dossiers")).toBe("/scolarite/dossiers");
    expect(espaceDuChemin(cheminNormalise("//scolarite") ?? "")).toBe("/scolarite");
  });

  it("refuse un chemin mal encodé", () => {
    expect(cheminNormalise("/%E0%A4%A")).toBeNull();
  });
});
