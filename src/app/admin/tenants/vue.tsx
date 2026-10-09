"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ariaChamp,
  Champ,
  Envoi,
  TitreCarte,
} from "@/components/admin/Formulaire";
import { CLASSE_CHAMP } from "@/components/styles";
import {
  Carte,
  Chargement,
  CLASSE_TABLEAU,
  CLASSE_TABLEAU_DEFILANT,
  CLASSE_TD,
  CLASSE_TH,
  EnTete,
  Erreur,
  formaterDate,
  Vide,
} from "@/components/ui";
import { useRessource } from "@/hooks/useRessource";
import { api, messageErreurApi } from "@/services/api";
import type { Tenant } from "@/types";

const tenantSchema = z.object({
  nom: z.string().trim().min(1, "Le nom est obligatoire."),
  // Le backend accepte un identifiant de 2 à 80 caractères.
  slug: z
    .string()
    .trim()
    .min(1, "L'identifiant est obligatoire.")
    .min(2, "L'identifiant contient au moins 2 caractères.")
    .max(80, "L'identifiant contient au plus 80 caractères.")
    .regex(
      /^[a-z0-9-]+$/,
      "Utilisez uniquement des minuscules, des chiffres et des tirets.",
    ),
  pays: z.string().trim().min(1, "Le pays est obligatoire."),
  ville: z.string().trim().min(1, "La ville est obligatoire."),
});

type TenantValues = z.infer<typeof tenantSchema>;

function FormulaireTenant({ onCree }: { onCree: () => void }) {
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TenantValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: { nom: "", slug: "", pays: "", ville: "" },
  });

  async function onSubmit(values: TenantValues) {
    setConfirmation(null);
    try {
      const { data } = await api.post<Tenant>("/tenants", values);
      reset();
      setConfirmation(`L'établissement « ${data.nom} » a été créé.`);
      onCree();
    } catch (erreur) {
      // Le backend ne crée que le tout premier établissement : au-delà, il
      // répond 409 avec un message en français, affiché tel quel.
      setError("root.server", { message: messageErreurApi(erreur) });
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="grid gap-5 px-5 py-5 sm:grid-cols-2"
    >
      <Champ id="tenant-nom" libelle="Nom" erreur={errors.nom?.message}>
        <input
          type="text"
          autoComplete="organization"
          className={CLASSE_CHAMP}
          {...ariaChamp("tenant-nom", errors.nom?.message)}
          {...register("nom")}
        />
      </Champ>
      <Champ
        id="tenant-slug"
        libelle="Identifiant"
        aide="Minuscules, chiffres et tirets, par exemple universite-douala."
        erreur={errors.slug?.message}
      >
        <input
          type="text"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={CLASSE_CHAMP}
          {...ariaChamp("tenant-slug", errors.slug?.message, true)}
          {...register("slug")}
        />
      </Champ>
      <Champ id="tenant-pays" libelle="Pays" erreur={errors.pays?.message}>
        <input
          type="text"
          autoComplete="country-name"
          className={CLASSE_CHAMP}
          {...ariaChamp("tenant-pays", errors.pays?.message)}
          {...register("pays")}
        />
      </Champ>
      <Champ id="tenant-ville" libelle="Ville" erreur={errors.ville?.message}>
        <input
          type="text"
          autoComplete="address-level2"
          className={CLASSE_CHAMP}
          {...ariaChamp("tenant-ville", errors.ville?.message)}
          {...register("ville")}
        />
      </Champ>
      <Envoi
        erreur={errors.root?.server?.message}
        confirmation={confirmation}
        enCours={isSubmitting}
        libelle="Créer l'établissement"
        libelleEnCours="Création en cours…"
      />
    </form>
  );
}

export default function AdminTenantsPage() {
  const { donnees, erreur, chargement, recharger } =
    useRessource<Tenant[]>("/tenants");

  return (
    <>
      <EnTete
        titre="Établissements"
        texte="Les universités et instituts hébergés sur la plateforme."
      />

      <Carte className="mt-6">
        <TitreCarte>Liste des établissements</TitreCarte>
        {chargement ? (
          <Chargement />
        ) : erreur ? (
          <div className="p-5">
            <Erreur message={erreur} onReessayer={recharger} />
          </div>
        ) : !donnees?.length ? (
          <Vide>Aucun établissement pour le moment.</Vide>
        ) : (
          <div className={CLASSE_TABLEAU_DEFILANT}>
            <table className={CLASSE_TABLEAU}>
              <caption className="sr-only">Liste des établissements</caption>
              <thead>
                <tr>
                  <th scope="col" className={CLASSE_TH}>
                    Nom
                  </th>
                  <th scope="col" className={CLASSE_TH}>
                    Identifiant
                  </th>
                  <th scope="col" className={CLASSE_TH}>
                    Ville
                  </th>
                  <th scope="col" className={CLASSE_TH}>
                    Pays
                  </th>
                  <th scope="col" className={CLASSE_TH}>
                    Créé le
                  </th>
                </tr>
              </thead>
              <tbody>
                {donnees.map((tenant) => (
                  <tr key={tenant.id}>
                    <td className={`${CLASSE_TD} font-semibold`}>
                      {tenant.nom}
                    </td>
                    <td className={`${CLASSE_TD} font-mono text-[0.8125rem]`}>
                      {tenant.slug}
                    </td>
                    <td className={CLASSE_TD}>{tenant.ville}</td>
                    <td className={CLASSE_TD}>{tenant.pays}</td>
                    <td className={`${CLASSE_TD} whitespace-nowrap`}>
                      {formaterDate(tenant.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Carte>

      <Carte className="mt-6">
        <TitreCarte>Ajouter un établissement</TitreCarte>
        <FormulaireTenant onCree={recharger} />
      </Carte>
    </>
  );
}
