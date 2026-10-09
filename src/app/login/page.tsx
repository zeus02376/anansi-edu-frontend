"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Connexion</h1>
        <p className="mt-2 text-sm text-foreground/70">
          Saisissez vos identifiants pour accéder à votre espace.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit, () => setIsLoggedIn(false))}
          noValidate
          className="mt-8 flex flex-col gap-5"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Adresse e-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "email-error" : undefined}
              className="rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-hidden focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground/20 aria-invalid:border-red-600"
              {...register("email")}
            />
            {errors.email && (
              <p
                id="email-error"
                role="alert"
                className="text-sm text-red-700 dark:text-red-400"
              >
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? "password-error" : undefined}
              className="rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-hidden focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground/20 aria-invalid:border-red-600"
              {...register("password")}
            />
            {errors.password && (
              <p
                id="password-error"
                role="alert"
                className="text-sm text-red-700 dark:text-red-400"
              >
                {errors.password.message}
              </p>
            )}
          </div>

          {errors.root?.server && (
            <p
              role="alert"
              className="rounded-md border border-red-600/40 bg-red-600/10 px-3 py-2 text-sm text-red-800 dark:text-red-300"
            >
              {errors.root.server.message}
            </p>
          )}

          {isLoggedIn && (
            <p
              role="status"
              className="rounded-md border border-green-700/40 bg-green-700/10 px-3 py-2 text-sm text-green-800 dark:text-green-300"
            >
              Connexion réussie.
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Connexion en cours…" : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}
