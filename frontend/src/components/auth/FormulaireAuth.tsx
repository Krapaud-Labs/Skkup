"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BoutonCTA } from "@/components/ui/BoutonCTA";
import { CarteGlow } from "@/components/ui/CarteGlow";
import { ErreurApi } from "@/lib/api";
import { connexion, inscription } from "@/lib/auth";

/**
 * Formulaire partagé entre la connexion et l'inscription : les deux pages
 * n'ont ni champs ni comportement réellement différents, seul le pseudo
 * s'ajoute à l'inscription. Un composant unique évite de dupliquer la
 * gestion d'erreur et l'état de soumission.
 */

export type ModeAuth = "connexion" | "inscription";

interface FormulaireAuthProps {
  mode: ModeAuth;
}

// ─── Textes par mode ─────────────────────────────────────────────────────────

const textes = {
  connexion: {
    titre: "Connexion",
    sousTitre: "Retrouve tes points, ta série et tes cartes à gratter.",
    bouton: "Je me connecte",
    boutonEnCours: "Connexion en cours...",
    invite: "Pas encore de compte ?",
    lien: "/inscription",
    libelleLien: "Créer un compte",
  },
  inscription: {
    titre: "Créer un compte",
    sousTitre: "Gagne des points en regardant tes streams préférés.",
    bouton: "Je crée mon compte",
    boutonEnCours: "Création en cours...",
    invite: "Tu as déjà un compte ?",
    lien: "/connexion",
    libelleLien: "Se connecter",
  },
} as const satisfies Record<ModeAuth, Record<string, string>>;

// ─── Styles de champ ─────────────────────────────────────────────────────────

const classeChamp =
  "w-full rounded-2xl border border-accent-violet-light/40 bg-background px-4 py-3 " +
  "text-foreground placeholder:text-foreground-muted/60 outline-none transition " +
  "focus:border-accent-violet-light focus:shadow-glow";

const classeLabel = "block text-sm font-medium text-foreground-muted";

// ─── Composant ───────────────────────────────────────────────────────────────

export function FormulaireAuth({ mode }: FormulaireAuthProps) {
  const router = useRouter();
  const t = textes[mode];

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreur(null);

    if (mode === "inscription" && motDePasse !== confirmationMotDePasse) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }

    setEnCours(true);

    try {
      if (mode === "inscription") {
        await inscription({ email, motDePasse, pseudo });
      } else {
        await connexion({ email, motDePasse });
      }
      // Le cookie de session est déjà posé par la réponse : refresh() force
      // les composants serveur à se re-rendre avec l'état connecté.
      router.push("/dashboard");
      router.refresh();
    } catch (exception) {
      setErreur(
        exception instanceof ErreurApi
          ? exception.message
          : "Une erreur est survenue. Merci de réessayer.",
      );
      setEnCours(false);
    }
  }

  return (
    <CarteGlow className="w-full max-w-md">
      <h1 className="text-3xl font-extrabold text-foreground">{t.titre}</h1>
      <p className="mt-2 text-sm text-foreground-muted">{t.sousTitre}</p>

      <form className="flex flex-col gap-5" onSubmit={soumettre}>
        {mode === "inscription" && (
          <div className="flex flex-col gap-2">
            <label className={classeLabel} htmlFor="pseudo">
              Pseudo
            </label>
            <input
              id="pseudo"
              name="pseudo"
              type="text"
              className={classeChamp}
              value={pseudo}
              onChange={(evenement) => setPseudo(evenement.target.value)}
              autoComplete="username"
              minLength={2}
              required
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className={classeLabel} htmlFor="email">
            Adresse email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className={classeChamp}
            value={email}
            onChange={(evenement) => setEmail(evenement.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className={classeLabel} htmlFor="motDePasse">
            Mot de passe
          </label>
          <input
            id="motDePasse"
            name="motDePasse"
            type="password"
            className={classeChamp}
            value={motDePasse}
            onChange={(evenement) => setMotDePasse(evenement.target.value)}
            autoComplete={
              mode === "inscription" ? "new-password" : "current-password"
            }
            minLength={mode === "inscription" ? 8 : undefined}
            required
          />
          {mode === "inscription" && (
            <p className="text-xs text-foreground-muted">
              8 caractères minimum.
            </p>
          )}
        </div>

        {mode === "inscription" && (
          <div className="flex flex-col gap-2">
            <label className={classeLabel} htmlFor="confirmationMotDePasse">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmationMotDePasse"
              name="confirmationMotDePasse"
              type="password"
              className={classeChamp}
              value={confirmationMotDePasse}
              onChange={(evenement) => setConfirmationMotDePasse(evenement.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              aria-invalid={confirmationMotDePasse.length > 0 && motDePasse !== confirmationMotDePasse}
            />
            {confirmationMotDePasse.length > 0 && motDePasse !== confirmationMotDePasse && (
              <p className="text-xs text-red-200">Les mots de passe ne correspondent pas.</p>
            )}
          </div>
        )}

        {erreur && (
          <p
            role="alert"
            className="rounded-2xl border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            {erreur}
          </p>
        )}

        <BoutonCTA
          type="submit"
          className="mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60"
          disabled={enCours}
        >
          {enCours ? t.boutonEnCours : t.bouton}
        </BoutonCTA>
      </form>

      <p className="mt-6 text-center text-sm text-foreground-muted">
        {t.invite}{" "}
        <Link
          href={t.lien}
          className="font-semibold text-accent-cta hover:underline"
        >
          {t.libelleLien}
        </Link>
      </p>
    </CarteGlow>
  );
}
