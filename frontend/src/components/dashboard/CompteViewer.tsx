"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CarteGlow } from "@/components/ui/CarteGlow";
import { ChangerMotDePasse } from "@/components/auth/ChangerMotDePasse";
import { ErreurApi } from "@/lib/api";
import { recupererProfil, type Profil } from "@/lib/dashboard";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export function CompteViewer() {
  const { langue } = useLanguage();
  const anglais = langue === "en";
  const [profil, setProfil] = useState<Profil | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    recupererProfil().then(setProfil).catch((exception: unknown) => setErreur(exception instanceof ErreurApi ? exception.message : (anglais ? "Your account is unavailable." : "Ton compte est indisponible.")));
  }, [anglais]);

  return (
    <div className="skuup-viewer-page">
      <header className="skuup-dashboard-page-header">
        <p className="skuup-kicker">{anglais ? "Personal space" : "Espace personnel"}</p>
        <h1 className="skuup-dashboard-page-title">{anglais ? "My account" : "Mon compte"}</h1>
        <p>{anglais ? "Manage your profile and security without exposing any private data in the interface." : "Gère ton profil et ta sécurité sans exposer de donnée privée inutile dans l’interface."}</p>
      </header>
      {erreur && <p role="alert" className="skuup-viewer-error">{erreur}</p>}
      {profil && <div className="skuup-viewer-account-grid"><CarteGlow className="skuup-viewer-section"><p className="skuup-kicker">{anglais ? "Profile" : "Profil"}</p><h2>{profil.pseudo}</h2><dl className="skuup-viewer-profile-list"><div><dt>{anglais ? "Email" : "E-mail"}</dt><dd>{profil.email}</dd></div><div><dt>{anglais ? "Points balance" : "Solde de points"}</dt><dd>{profil.soldePoints}</dd></div><div><dt>{anglais ? "Current streak" : "Série actuelle"}</dt><dd>{profil.streakActuel} {anglais ? "days" : "jours"}</dd></div><div><dt>{anglais ? "Member since" : "Membre depuis"}</dt><dd>{new Date(profil.createdAt).toLocaleDateString(anglais ? "en-US" : "fr-FR")}</dd></div></dl><Link className="skuup-button skuup-button-outline mt-5 inline-flex" href="/dashboard/extension">{anglais ? "Manage extension" : "Gérer l’extension"}</Link></CarteGlow><ChangerMotDePasse /></div>}
      {profil === null && !erreur && <p role="status" className="skuup-viewer-state">{anglais ? "Loading account…" : "Chargement du compte…"}</p>}
    </div>
  );
}
