"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BoutonCTA } from "@/components/ui/BoutonCTA";
import { CarteGlow } from "@/components/ui/CarteGlow";
import { ErreurApi } from "@/lib/api";
import { connexion, inscription } from "@/lib/auth";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { LocalizedReglementDocument } from "@/components/legal/LocalizedReglementDocument";

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
  fr: { connexion: { titre: "Connexion", sousTitre: "Retrouve tes points, ta série et tes cartes à gratter.", bouton: "Je me connecte", boutonEnCours: "Connexion en cours...", invite: "Pas encore de compte ?", lien: "/inscription", libelleLien: "Créer un compte" }, inscription: { titre: "Créer un compte", sousTitre: "Gagne des points en regardant tes streams préférés.", bouton: "Je crée mon compte", boutonEnCours: "Création en cours...", invite: "Tu as déjà un compte ?", lien: "/connexion", libelleLien: "Se connecter" }, pseudo: "Pseudo", email: "Adresse email", password: "Mot de passe", confirmPassword: "Confirmer le mot de passe", passwordRules: ["12 caractères minimum", "Une majuscule", "Une minuscule", "Un chiffre", "Un symbole"], passwordValid: "Mot de passe conforme", passwordInvalid: "Le mot de passe ne respecte pas encore toutes les contraintes.", rulesTitle: "Règlement du jeu", acceptRules: "J’ai lu et j’accepte le règlement du jeu.", acceptRulesAction: "J’accepte le règlement et je continue", refuseRules: "Refuser et retourner à la vitrine", closeRules: "Fermer le règlement" },
  en: { connexion: { titre: "Log in", sousTitre: "Find your points, streak and scratch cards.", bouton: "Log in", boutonEnCours: "Logging in...", invite: "Do not have an account yet?", lien: "/inscription", libelleLien: "Create an account" }, inscription: { titre: "Create an account", sousTitre: "Earn points while watching your favourite streams.", bouton: "Create my account", boutonEnCours: "Creating account...", invite: "Already have an account?", lien: "/connexion", libelleLien: "Log in" }, pseudo: "Username", email: "Email address", password: "Password", confirmPassword: "Confirm password", passwordRules: ["At least 12 characters", "One uppercase letter", "One lowercase letter", "One number", "One symbol"], passwordValid: "Password meets the requirements", passwordInvalid: "The password does not meet all requirements yet.", rulesTitle: "Game rules", acceptRules: "I have read and accept the game rules.", acceptRulesAction: "I accept the rules and continue", refuseRules: "Decline and return to the homepage", closeRules: "Close game rules" },
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
  const [reglementLu, setReglementLu] = useState(false);
  const [reglementAccepte, setReglementAccepte] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const reglesMotDePasse = [motDePasse.length >= 12, /[A-Z]/.test(motDePasse), /[a-z]/.test(motDePasse), /\d/.test(motDePasse), /[^A-Za-z0-9]/.test(motDePasse)];
  const motDePasseValide = reglesMotDePasse.every(Boolean);

  function refuserReglement() {
    router.push("/");
  }

  async function soumettre(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreur(null);

    if (mode === "inscription" && motDePasse !== confirmationMotDePasse) {
      setErreur(estAnglais ? "Passwords do not match." : "Les mots de passe ne correspondent pas.");
      return;
    }
    if (mode === "inscription" && !motDePasseValide) {
      setErreur(textes[langue].passwordInvalid);
      return;
    }
    if (mode === "inscription" && !reglementAccepte) {
      setErreur(estAnglais ? "You must accept the game rules." : "Tu dois accepter le règlement du jeu.");
      return;
    }

    setEnCours(true);

    try {
      if (mode === "inscription") {
        await inscription({ email, motDePasse, pseudo, accepteReglement: true });
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
    <CarteGlow className="skuup-auth-card w-full max-w-md">
      <h1 className="text-3xl font-extrabold text-foreground">{t.titre}</h1>
      <p className="mt-2 text-sm text-foreground-muted">{t.sousTitre}</p>

      {mode === "inscription" && !reglementAccepte && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="reglement-inscription-title"
            aria-describedby="reglement-inscription-description"
            onKeyDown={(evenement) => {
              if (evenement.key === "Escape") refuserReglement();
            }}
            className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-accent-violet-light/40 bg-background shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-accent-violet-light/20 px-6 py-5 sm:px-8">
              <div>
                <h2 id="reglement-inscription-title" className="text-2xl font-extrabold text-foreground">{textes[langue].rulesTitle}</h2>
              <p id="reglement-inscription-description" className="mt-2 text-sm text-foreground-muted">
                {estAnglais ? "Please read and accept the game rules before creating your account." : "Lis et accepte le règlement du jeu avant de créer ton compte."}
              </p>
              </div>
              <button type="button" aria-label={textes[langue].closeRules} className="rounded-full px-2 text-2xl leading-none text-foreground-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-violet-light" onClick={refuserReglement}>×</button>
            </div>
            <div className="overflow-y-auto px-6 py-5 text-sm text-foreground-muted sm:px-8">
              <LocalizedReglementDocument />
            </div>
            <div className="border-t border-accent-violet-light/20 px-6 py-5 sm:px-8">
              <label className="flex items-start gap-3 text-sm text-foreground-muted" htmlFor="acceptReglement">
                <input id="acceptReglement" name="acceptReglement" type="checkbox" checked={reglementLu} onChange={(evenement) => setReglementLu(evenement.target.checked)} autoFocus className="mt-1 size-4 accent-accent-violet-light" />
                <span>{textes[langue].acceptRules}</span>
              </label>
              <BoutonCTA type="button" className="mt-4 w-full disabled:cursor-not-allowed disabled:opacity-60" disabled={!reglementLu} onClick={() => { setReglementAccepte(true); setErreur(null); }}>
                {textes[langue].acceptRulesAction}
              </BoutonCTA>
              <button type="button" className="mt-3 w-full text-sm text-foreground-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-violet-light" onClick={refuserReglement}>
                {textes[langue].refuseRules}
              </button>
            </div>
          </section>
        </div>
      )}

      {(mode === "connexion" || reglementAccepte) && <form className="flex flex-col gap-5" onSubmit={soumettre}>
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
              minLength={mode === "inscription" ? 12 : undefined}
              pattern={mode === "inscription" ? "(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{12,}" : undefined}
              aria-describedby={mode === "inscription" ? "motDePasseContraintes" : undefined}
              required
            />
          {mode === "inscription" && (
            <div id="motDePasseContraintes" className="space-y-1 text-xs text-foreground-muted" aria-live="polite">
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
              minLength={12}
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
      </form>}

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
