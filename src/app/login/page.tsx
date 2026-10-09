"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Cadre } from "@/components/Cadre";
import { Scene3D } from "@/components/Scene3D";
import {
  CLASSE_BOUTON_PRINCIPAL,
  CLASSE_CHAMP,
  CLASSE_ERREUR,
  CLASSE_LIBELLE,
  CLASSE_TITRE,
} from "@/components/styles";
import { ACCUEIL_PAR_ROLE } from "@/lib/roles";
import { messageErreurConnexion } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "L'adresse e-mail est obligatoire.")
    .pipe(z.email("L'adresse e-mail n'est pas valide.")),
  // Le backend refuse tout mot de passe de moins de 8 caractères.
  password: z
    .string()
    .min(1, "Le mot de passe est obligatoire.")
    .min(8, "Le mot de passe contient au moins 8 caractères."),
});

type LoginValues = z.infer<typeof loginSchema>;

// Affiché quand services/api.ts a renvoyé ici après un 401.
function AvisSessionExpiree() {
  const parametres = useSearchParams();
  if (parametres.get("session") !== "expiree") return null;
  return (
    <p
      role="status"
      className="mt-6 max-w-sm rounded-md border border-primary/30 bg-primary/5 px-3.5 py-2.5 text-sm text-ink"
    >
      Votre session a expiré. Reconnectez-vous pour continuer.
    </p>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((etat) => etat.login);
  const estPret = useAuthStore((etat) => etat.estPret);
  const roleConnecte = useAuthStore((etat) =>
    etat.isAuthenticated ? etat.user?.role : undefined,
  );
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Déjà connecté (ou connexion tout juste réussie) : direction le tableau
  // de bord qui correspond au rôle.
  useEffect(() => {
    if (estPret && roleConnecte) router.replace(ACCUEIL_PAR_ROLE[roleConnecte]);
  }, [estPret, roleConnecte, router]);

  async function onSubmit(values: LoginValues) {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      setError("root.server", {
        message:
          "L'adresse du serveur n'est pas configurée (NEXT_PUBLIC_API_URL).",
      });
      return;
    }

    try {
      await login(values.email, values.password);
    } catch (erreur) {
      setError("root.server", { message: messageErreurConnexion(erreur) });
    }
  }

  const redirectionEnCours = estPret && roleConnecte !== undefined;

  return (
    <Cadre
      texte="Gestion académique : candidatures, inscriptions, enseignements."
      accroche="Bon retour parmi nous."
      decor={<Scene3D />}
    >
      <div className="lg:flex lg:min-h-[calc(100vh-8rem)] lg:flex-col lg:justify-center">
        <h1 className={CLASSE_TITRE}>Connexion</h1>
        <p className="mt-3 text-base text-muted">
          Saisissez vos identifiants pour accéder à votre espace.
        </p>

        <Suspense fallback={null}>
          <AvisSessionExpiree />
        </Suspense>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="mt-8 flex max-w-sm flex-col gap-5"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className={CLASSE_LIBELLE}>
              Adresse e-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={CLASSE_CHAMP}
              {...register("email")}
            />
            {errors.email && (
              <p id="email-error" role="alert" className={CLASSE_ERREUR}>
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className={CLASSE_LIBELLE}>
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="password"
                type={isPasswordVisible ? "text" : "password"}
                autoComplete="current-password"
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                className={`${CLASSE_CHAMP} w-full pr-24`}
                {...register("password")}
              />
              <button
                type="button"
                aria-pressed={isPasswordVisible}
                aria-controls="password"
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                className="absolute inset-y-1 right-1 rounded px-3 text-sm font-semibold text-muted transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-ink"
              >
                {isPasswordVisible ? "Masquer" : "Afficher"}
                <span className="sr-only"> le mot de passe</span>
              </button>
            </div>
            {errors.password && (
              <p id="password-error" role="alert" className={CLASSE_ERREUR}>
                {errors.password.message}
              </p>
            )}
          </div>

          {errors.root?.server && (
            <p
              role="alert"
              className="apparition rounded-md border border-red-600/40 bg-red-600/10 px-3.5 py-2.5 text-sm text-red-800"
            >
              {errors.root.server.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || redirectionEnCours}
            className={`${CLASSE_BOUTON_PRINCIPAL} mt-1 self-start`}
          >
            {(isSubmitting || redirectionEnCours) && (
              <span
                aria-hidden="true"
                className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
              />
            )}
            {redirectionEnCours
              ? "Ouverture de votre espace…"
              : isSubmitting
                ? "Connexion en cours…"
                : "Se connecter"}
          </button>
        </form>
      </div>
    </Cadre>
  );
}
