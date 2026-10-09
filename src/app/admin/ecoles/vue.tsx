"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ariaChamp,
  Champ,
  Envoi,
  TitreCarte,
} from "@/components/admin/Formulaire";
import { CLASSE_CHAMP, CLASSE_LIEN } from "@/components/styles";
import {
  Carte,
  Chargement,
  CLASSE_TABLEAU,
  CLASSE_TABLEAU_DEFILANT,
  CLASSE_TD,
  CLASSE_TH,
  EnTete,
  Erreur,
  Vide,
} from "@/components/ui";
import { useRessource } from "@/hooks/useRessource";
import { api, messageErreurApi } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import type { Ecole, Tenant } from "@/types";

const ecoleSchema = z.object({
  tenantId: z.string().min(1, "Choisissez un établissement."),
  nom: z.string().trim().min(1, "Le nom est obligatoire."),
  code: z.string().trim().min(1, "Le code est obligatoire."),
  description: z.string().trim(),
});

type EcoleValues = z.infer<typeof ecoleSchema>;

// Monté une fois les établissements chargés, pour que la liste déroulante
// ait ses options dès le premier rendu.
function FormulaireEcole({
  tenants,
  onCree,
}: {
  tenants: Tenant[];
  onCree: () => void;
}) {
  const tenantConnecte = useAuthStore((etat) => etat.user?.tenantId);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EcoleValues>({
    resolver: zodResolver(ecoleSchema),
    defaultValues: {
      // Par défaut, l'établissement de la personne connectée.
      tenantId: tenants.some(({ id }) => id === tenantConnecte)
        ? tenantConnecte
        : "",
      nom: "",
      code: "",
      description: "",
    },
  });

  async function onSubmit({ description, ...values }: EcoleValues) {
    setConfirmation(null);
    try {
      // Une description vide n'est pas envoyée du tout.
      const { data } = await api.post<Ecole>(
        "/ecoles",
        description ? { ...values, description } : values,
      );
      reset();
      setConfirmation(`L'école « ${data.nom} » a été créée.`);
      onCree();
    } catch (erreur) {
      setError("root.server", { message: messageErreurApi(erreur) });
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="grid gap-5 px-5 py-5 sm:grid-cols-2"
    >
      <Champ
        id="ecole-tenant"
        libelle="Établissement"
        erreur={errors.tenantId?.message}
        className="sm:col-span-2"
      >
        <select
          className={CLASSE_CHAMP}
          {...ariaChamp("ecole-tenant", errors.tenantId?.message)}
          {...register("tenantId")}
        >
          <option value="">Choisir un établissement</option>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.nom}
            </option>
          ))}
        </select>
      </Champ>
      <Champ id="ecole-nom" libelle="Nom" erreur={errors.nom?.message}>
        <input
          type="text"
          className={CLASSE_CHAMP}
          {...ariaChamp("ecole-nom", errors.nom?.message)}
          {...register("nom")}
        />
      </Champ>
      <Champ id="ecole-code" libelle="Code" erreur={errors.code?.message}>
        <input
          type="text"
          autoCapitalize="characters"
          spellCheck={false}
          className={CLASSE_CHAMP}
          {...ariaChamp("ecole-code", errors.code?.message)}
          {...register("code")}
        />
      </Champ>
      <Champ
        id="ecole-description"
        libelle="Description (facultative)"
        erreur={errors.description?.message}
        className="sm:col-span-2"
      >
        <textarea
          rows={3}
          className={CLASSE_CHAMP}
          {...ariaChamp("ecole-description", errors.description?.message)}
          {...register("description")}
        />
      </Champ>
      <Envoi
        erreur={errors.root?.server?.message}
        confirmation={confirmation}
        enCours={isSubmitting}
        libelle="Créer l'école"
        libelleEnCours="Création en cours…"
      />
    </form>
  );
}

export default function AdminEcolesPage() {
  const ecoles = useRessource<Ecole[]>("/ecoles");
  const tenants = useRessource<Tenant[]>("/tenants");
  const nomTenant = new Map(
    tenants.donnees?.map(({ id, nom }) => [id, nom] as const),
  );

  return (
    <>
      <EnTete
        titre="Écoles"
        texte="Les écoles et facultés rattachées à chaque établissement."
      />

      <Carte className="mt-6">
        <TitreCarte>Liste des écoles</TitreCarte>
        {ecoles.chargement ? (
          <Chargement />
        ) : ecoles.erreur ? (
          <div className="p-5">
            <Erreur message={ecoles.erreur} onReessayer={ecoles.recharger} />
          </div>
        ) : !ecoles.donnees?.length ? (
          <Vide>Aucune école pour le moment.</Vide>
        ) : (
          <div className={CLASSE_TABLEAU_DEFILANT}>
            <table className={CLASSE_TABLEAU}>
              <caption className="sr-only">Liste des écoles</caption>
              <thead>
                <tr>
                  <th scope="col" className={CLASSE_TH}>
                    Nom
                  </th>
                  <th scope="col" className={CLASSE_TH}>
                    Code
                  </th>
                  <th scope="col" className={CLASSE_TH}>
                    Établissement
                  </th>
                  <th scope="col" className={CLASSE_TH}>
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {ecoles.donnees.map((ecole) => (
                  <tr key={ecole.id}>
                    <td className={`${CLASSE_TD} font-semibold`}>
                      {ecole.nom}
                    </td>
                    <td className={`${CLASSE_TD} whitespace-nowrap`}>
                      {ecole.code}
                    </td>
                    <td className={CLASSE_TD}>
                      {nomTenant.get(ecole.tenantId) ??
                        (tenants.chargement ? "…" : "—")}
                    </td>
                    <td className={`${CLASSE_TD} text-muted`}>
                      {ecole.description || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Carte>

      <Carte className="mt-6">
        <TitreCarte>Ajouter une école</TitreCarte>
        {tenants.chargement ? (
          <Chargement texte="Chargement des établissements…" />
        ) : tenants.erreur ? (
          <div className="p-5">
            <Erreur message={tenants.erreur} onReessayer={tenants.recharger} />
          </div>
        ) : !tenants.donnees?.length ? (
          <Vide>
            Une école se rattache à un établissement.{" "}
            <Link href="/admin/tenants" className={CLASSE_LIEN}>
              Créer d&apos;abord un établissement
            </Link>
          </Vide>
        ) : (
          <FormulaireEcole
            tenants={tenants.donnees}
            onCree={ecoles.recharger}
          />
        )}
      </Carte>
    </>
  );
}
