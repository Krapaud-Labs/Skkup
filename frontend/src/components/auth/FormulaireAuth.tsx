"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BoutonCTA } from "@/components/ui/BoutonCTA";
import { CarteGlow } from "@/components/ui/CarteGlow";
import { ErreurApi } from "@/lib/api";
import { connexion, inscription } from "@/lib/auth";
import { useLanguage } from "@/components/i18n/LanguageProvider";

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
  fr: { connexion: { titre: "Connexion", sousTitre: "Retrouve tes points, ta série et tes cartes à gratter.", bouton: "Je me connecte", boutonEnCours: "Connexion en cours...", invite: "Pas encore de compte ?", lien: "/inscription", libelleLien: "Créer un compte" }, inscription: { titre: "Créer un compte", sousTitre: "Gagne des points en regardant tes streams préférés.", bouton: "Je crée mon compte", boutonEnCours: "Création en cours...", invite: "Tu as déjà un compte ?", lien: "/connexion", libelleLien: "Se connecter" }, pseudo: "Pseudo", email: "Adresse email", password: "Mot de passe", confirmPassword: "Confirmer le mot de passe", passwordHint: "8 caractères minimum, avec une majuscule, une minuscule et un chiffre.", passwordRules: ["8 caractères minimum", "Une majuscule", "Une minuscule", "Un chiffre"], passwordValid: "Mot de passe conforme" },
  en: { connexion: { titre: "Log in", sousTitre: "Find your points, streak and scratch cards.", bouton: "Log in", boutonEnCours: "Logging in...", invite: "Do not have an account yet?", lien: "/inscription", libelleLien: "Create an account" }, inscription: { titre: "Create an account", sousTitre: "Earn points while watching your favourite streams.", bouton: "Create my account", boutonEnCours: "Creating account...", invite: "Already have an account?", lien: "/connexion", libelleLien: "Log in" }, pseudo: "Username", email: "Email address", password: "Password", confirmPassword: "Confirm password", passwordHint: "At least 8 characters, including uppercase, lowercase and number.", passwordRules: ["At least 8 characters", "One uppercase letter", "One lowercase letter", "One number"], passwordValid: "Password meets the requirements" },
} as const;
// ─── Styles de champ ─────────────────────────────────────────────────────────

const classeChamp =
  "w-full rounded-2xl border border-accent-violet-light/40 bg-background px-4 py-3 " +
  "text-foreground placeholder:text-foreground-muted/60 outline-none transition " +
  "focus:border-accent-violet-light focus:shadow-glow";

const classeLabel = "block text-sm font-medium text-foreground-muted";

// ─── Composant ───────────────────────────────────────────────────────────────

export function FormulaireAuth({ mode }: FormulaireAuthProps) {
  const router = useRouter();
  const { langue } = useLanguage();
  const t = textes[langue][mode];
  const estAnglais = langue === "en";

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const reglesMotDePasse = [motDePasse.length >= 8, /[A-Z]/.test(motDePasse), /[a-z]/.test(motDePasse), /\d/.test(motDePasse)];
  const motDePasseValide = reglesMotDePasse.every(Boolean);

  async function soumettre(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreur(null);

    if (mode === "inscription" && motDePasse !== confirmationMotDePasse) {
      setErreur(estAnglais ? "Passwords do not match." : "Les mots de passe ne correspondent pas.");
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
          : estAnglais ? "Something went wrong. Please try again." : "Une erreur est survenue. Merci de réessayer.",
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
              {textes[langue].pseudo}
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
            {textes[langue].email}
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
            {textes[langue].password}
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
            <div className="space-y-1 text-xs text-foreground-muted" aria-live="polite">
              <p>{textes[langue].passwordHint}</p>
              <ul className="grid gap-1 sm:grid-cols-2">
                {textes[langue].passwordRules.map((regle, index) => <li key={regle} className={reglesMotDePasse[index] ? "text-emerald-300" : "text-foreground-muted"}>{reglesMotDePasse[index] ? "✓" : "○"} {regle}</li>)}
              </ul>
              {motDePasseValide && <p className="text-emerald-300">{textes[langue].passwordValid}</p>}
            </div>
          )}
        </div>

        {mode === "inscription" && (
          <div className="flex flex-col gap-2">
            <label className={classeLabel} htmlFor="confirmationMotDePasse">
              {textes[langue].confirmPassword}
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
              <p className="text-xs text-red-200">{estAnglais ? "Passwords do not match." : "Les mots de passe ne correspondent pas."}</p>
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
