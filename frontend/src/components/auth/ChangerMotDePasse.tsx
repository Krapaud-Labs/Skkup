"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ErreurApi } from "@/lib/api";
import { changerMotDePasse } from "@/lib/auth";
import { BoutonCTA } from "@/components/ui/BoutonCTA";
import { CarteGlow } from "@/components/ui/CarteGlow";
import { useLanguage } from "@/components/i18n/LanguageProvider";

/** Formulaire de changement de secret, volontairement isolé du dashboard. */
export function ChangerMotDePasse() {
  const router = useRouter();
  const { langue } = useLanguage();
  const anglais = langue === "en";
  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function soumettre(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);
    if (nouveau !== confirmation) {
      setErreur(anglais ? "The two new passwords do not match." : "Les deux nouveaux mots de passe sont différents.");
      return;
    }
    setEnvoi(true);
    try {
      await changerMotDePasse({ ancienMotDePasse: ancien, nouveauMotDePasse: nouveau });
      router.push("/connexion?motDePasseChange=1");
    } catch (exception: unknown) {
      setErreur(
        exception instanceof ErreurApi
          ? exception.message
          : anglais ? "Unable to change the password right now." : "Impossible de changer le mot de passe pour le moment.",
      );
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <CarteGlow>
      <h2 className="text-lg font-bold text-foreground">{anglais ? "Account security" : "Sécurité du compte"}</h2>
      <p className="mt-1 text-sm text-foreground-muted">
        {anglais ? "Changing your password signs out other sessions and revokes paired devices." : "Un changement de mot de passe déconnecte les autres sessions et révoque les appareils associés."}
      </p>
      <form className="mt-5 grid gap-4" onSubmit={soumettre}>
        <label className="grid gap-2 text-sm text-foreground-muted">
          {anglais ? "Current password" : "Mot de passe actuel"}
          <input className="rounded-xl border border-accent-violet-light/30 bg-background/60 px-3 py-2 text-foreground outline-none focus:border-accent-cta" type="password" required value={ancien} onChange={(event) => setAncien(event.target.value)} />
        </label>
        <label className="grid gap-2 text-sm text-foreground-muted">
          {anglais ? "New password" : "Nouveau mot de passe"}
          <input className="rounded-xl border border-accent-violet-light/30 bg-background/60 px-3 py-2 text-foreground outline-none focus:border-accent-cta" type="password" minLength={12} required value={nouveau} onChange={(event) => setNouveau(event.target.value)} />
        </label>
        <label className="grid gap-2 text-sm text-foreground-muted">
          {anglais ? "Confirm new password" : "Confirmer le nouveau mot de passe"}
          <input className="rounded-xl border border-accent-violet-light/30 bg-background/60 px-3 py-2 text-foreground outline-none focus:border-accent-cta" type="password" minLength={12} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
        </label>
        {erreur && <p role="alert" className="rounded-xl border border-red-400/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">{erreur}</p>}
        <BoutonCTA type="submit" disabled={envoi}>{envoi ? (anglais ? "Updating…" : "Mise à jour…") : anglais ? "Change password" : "Changer le mot de passe"}</BoutonCTA>
      </form>
    </CarteGlow>
  );
}
