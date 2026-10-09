"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Cadre } from "@/components/Cadre";
import {
  CLASSE_BOUTON_PRINCIPAL,
  CLASSE_CHAMP,
  CLASSE_ERREUR,
  CLASSE_LIBELLE,
  CLASSE_TITRE,
} from "@/components/styles";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "L'adresse e-mail est obligatoire.")
    .pipe(z.email("L'adresse e-mail n'est pas valide.")),
  password: z.string().min(1, "Le mot de passe est obligatoire."),
});

type LoginValues = z.infer<typeof loginSchema>;

const REQUEST_TIMEOUT_MS = 10_000;

const SERVER_UNREACHABLE =
  "Le serveur ne répond pas. Vérifiez votre connexion puis réessayez.";

function messageForStatus(status: number): string {
  if (status === 400 || status === 401 || status === 403) {
    return "E-mail ou mot de passe incorrect.";
  }
  if (status === 429) {
    return "Trop de tentatives. Patientez un instant avant de réessayer.";
  }
  if (status >= 500) {
    return "Le serveur rencontre un problème. Réessayez dans quelques instants.";
  }
  return "La connexion a échoué. Réessayez.";
}

export default function LoginPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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

  async function onSubmit(values: LoginValues) {
    setIsLoggedIn(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
    if (!apiUrl) {
      setError("root.server", {
        message:
          "L'adresse du serveur n'est pas configurée (NEXT_PUBLIC_API_URL).",
      });
      return;
    }

    let response: Response;
    try {
      response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      setError("root.server", { message: SERVER_UNREACHABLE });
      return;
    }

    if (!response.ok) {
      setError("root.server", { message: messageForStatus(response.status) });
      return;
    }

    setIsLoggedIn(true);
  }

  return (
    <Cadre
      texte="Retrouvez votre espace personnel ANANSI EDU."
      accroche="Bon retour parmi nous."
    >
      <div className="lg:flex lg:min-h-[calc(100vh-8rem)] lg:flex-col lg:justify-center">
        <h1 className={CLASSE_TITRE}>Connexion</h1>
        <p className="mt-3 text-base text-muted">
          Saisissez vos identifiants pour accéder à votre espace.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit, () => setIsLoggedIn(false))}
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
              className="apparition rounded-md border border-red-600/40 bg-red-600/10 px-3.5 py-2.5 text-sm text-red-800 dark:text-red-300"
            >
              {errors.root.server.message}
            </p>
          )}

          {isLoggedIn && (
            <p
              role="status"
              className="apparition rounded-md border border-green-700/40 bg-green-700/10 px-3.5 py-2.5 text-sm font-medium text-green-800 dark:text-green-300"
            >
              Connexion réussie.
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`${CLASSE_BOUTON_PRINCIPAL} mt-1 self-start`}
          >
            {isSubmitting && (
              <span
                aria-hidden="true"
                className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
              />
            )}
            {isSubmitting ? "Connexion en cours…" : "Se connecter"}
          </button>
        </form>
      </div>
    </Cadre>
  );
}
