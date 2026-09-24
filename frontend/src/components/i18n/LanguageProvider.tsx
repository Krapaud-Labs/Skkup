"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Langue = "fr" | "en";
type ContexteLangue = { langue: Langue; definirLangue: (langue: Langue) => void };
const Contexte = createContext<ContexteLangue | null>(null);

function langueNavigateur(): Langue {
  if (typeof navigator === "undefined") return "fr";
  return (navigator.languages ?? [navigator.language]).some((langue) => langue.toLowerCase().startsWith("fr")) ? "fr" : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [langue, setLangue] = useState<Langue>(() => {
    if (typeof window === "undefined") return "fr";
    const memorisee = window.localStorage.getItem("skkup-language");
    return memorisee === "en" || memorisee === "fr" ? memorisee : langueNavigateur();
  });
  const valeur = useMemo(() => ({ langue, definirLangue: (nouvelle: Langue) => { setLangue(nouvelle); window.localStorage.setItem("skkup-language", nouvelle); document.documentElement.lang = nouvelle; } }), [langue]);
  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useLanguage() {
  const contexte = useContext(Contexte);
  return contexte ?? { langue: "fr", definirLangue: () => undefined };
}

export const traductions = {
  fr: {
    how: "Comment ça marche", prizes: "Lots en jeu", project: "Le projet", faq: "FAQ", privacy: "Confidentialité", dashboard: "Dashboard", signup: "S'inscrire", language: "Langue", logout: "Déconnexion",
    space: "Ton espace", browse: "Parcourir Skkup", welcome: (pseudo: string) => `Bonjour ${pseudo}, tout est accessible ici.`, overview: "Vue d’ensemble", overviewDescription: "Retrouve tes points et ton activité.", streams: "Regarder et suivre", streamsDescription: "Choisis un direct et associe ton extension.", draws: "Voir les tirages", drawsDescription: "Découvre les lots et les résultats publiés.", rules: "Lire le règlement", rulesDescription: "Consulte les règles des tirages et des lots.", admin: "Administration", adminDescription: "Gère les tirages et les annonces du service.", dashboardNav: "Navigation de ton espace personnel",
  },
  en: {
    how: "How it works", prizes: "Prizes", project: "The project", faq: "FAQ", privacy: "Privacy", dashboard: "Dashboard", signup: "Sign up", language: "Language", logout: "Log out",
    space: "Your space", browse: "Explore Skkup", welcome: (pseudo: string) => `Hi ${pseudo}, everything is available here.`, overview: "Overview", overviewDescription: "Review your points and activity.", streams: "Watch and follow", streamsDescription: "Choose a live stream and pair your extension.", draws: "View draws", drawsDescription: "Discover prizes and published results.", rules: "Read the rules", rulesDescription: "Review draw and prize rules.", admin: "Administration", adminDescription: "Manage draws and service announcements.", dashboardNav: "Personal space navigation",
  },
} as const;
