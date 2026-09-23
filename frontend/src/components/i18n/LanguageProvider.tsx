"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Langue = "fr" | "en";
type ContexteLangue = { langue: Langue; definirLangue: (langue: Langue) => void };
const Contexte = createContext<ContexteLangue | null>(null);

function langueNavigateur(): Langue {
  if (typeof navigator === "undefined") return "fr";
  return navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
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
  fr: { how: "Comment ça marche", prizes: "Lots en jeu", project: "Le projet", faq: "FAQ", privacy: "Confidentialité", dashboard: "Dashboard", signup: "S'inscrire", language: "Langue" },
  en: { how: "How it works", prizes: "Prizes", project: "The project", faq: "FAQ", privacy: "Privacy", dashboard: "Dashboard", signup: "Sign up", language: "Language" },
} as const;
