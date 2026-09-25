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
    auth: { connexion: { kicker: "Ton espace Skkup", titleLine: "Reviens là où", titleAccent: "chaque vue compte.", description: "Connecte-toi pour retrouver tes points, suivre tes tirages et continuer à profiter de tes streams préférés.", benefitOne: "Points et historique centralisés", benefitTwo: "Tirages publics et vérifiables" }, inscription: { kicker: "Bienvenue dans Skkup", titleLine: "Ton temps de", titleAccent: "visionnage a de la valeur.", description: "Crée ton compte gratuitement, regarde les streams disponibles et garde une trace claire de tes points et de tes chances.", benefitOne: "Gratuit et sans achat obligatoire", benefitTwo: "Lots et résultats transparents" } },
    how: "Comment ça marche", prizes: "Lots en jeu", project: "Le projet", faq: "FAQ", privacy: "Confidentialité", dashboard: "Dashboard", signup: "S'inscrire", language: "Langue", logout: "Déconnexion",
    space: "Ton espace", browse: "Parcourir Skkup", welcome: (pseudo: string) => `Bonjour ${pseudo}, tout est accessible ici.`, overview: "Vue d’ensemble", overviewDescription: "Retrouve tes points et ton activité.", streams: "Regarder et suivre", streamsDescription: "Choisis un direct et associe ton extension.", draws: "Voir les tirages", drawsDescription: "Découvre les lots et les résultats publiés.", rules: "Lire le règlement", rulesDescription: "Consulte les règles des tirages et des lots.", admin: "Administration", adminDescription: "Gère les tirages et les annonces du service.", dashboardNav: "Navigation de ton espace personnel",
    pages: {
      dashboard: { kicker: "Espace viewer", title: "Ton aventure Skkup", description: "Suis tes points, garde ta série active et retrouve tous tes parcours depuis un seul espace." },
      raffles: { kicker: "Résultats transparents", title: "Tirages et gagnants", description: "Retrouve les lots en jeu, les dates prévues et les résultats déjà publiés." },
      dashboardRaffles: { kicker: "Résultats transparents", title: "Tirages et gagnants", description: "Retrouve les lots en jeu, les dates prévues et les résultats déjà publiés." },
      rules: { kicker: "Transparence et règles", title: "Règlement du jeu", description: "Retrouve ici les règles applicables aux participations, aux tickets et aux tirages Skkup." },
      streams: { kicker: "Visionnage libre", title: "Regarde ce que tu veux", description: "Choisis ton direct sur Twitch, YouTube ou Facebook Live. L’extension Skkup suit ton visionnage depuis l’onglet choisi." },
    },
    content: { open: "Ouvert", closed: "Clôturé", published: "Résultat publié", loading: "Chargement...", noDraws: "Aucun tirage n’est encore programmé.", prizes: "Lots", winners: "Gagnants", noWinners: "Aucun gagnant pour ce tirage.", planned: "Tirage prévu le", freeViewing: "Visionnage libre", installExtension: "Installer l’extension", selection: "Sélection Skkup", proposedChannels: "Chaînes proposées", openStream: "Ouvrir le direct", loadingStreams: "Chargement des chaînes...", emptyStreams: "Le catalogue Skkup est vide pour le moment.", streamDescription: "Ouvre n’importe quel direct sur Twitch, YouTube ou Facebook Live. L’extension Skkup détecte ton visionnage et synchronise les points selon les règles du service.", watchWhatYouWant: "Regarde ce que tu veux", extensionTitle: "Ton extension Skkup", extensionHeading: "Associe ton navigateur", extensionDescription: "Génère un code temporaire pour relier l’extension à ton compte sans exposer ton mot de passe.", streamLoadError: "Impossible de charger les streams pour le moment." },
  },
  en: {
    auth: { connexion: { kicker: "Your Skkup space", titleLine: "Come back to where", titleAccent: "every view counts.", description: "Log in to find your points, follow your draws and keep enjoying your favourite streams.", benefitOne: "Centralized points and history", benefitTwo: "Public, verifiable draws" }, inscription: { kicker: "Welcome to Skkup", titleLine: "Your viewing", titleAccent: "time has value.", description: "Create your free account, watch available streams and keep a clear record of your points and chances.", benefitOne: "Free, no purchase required", benefitTwo: "Transparent prizes and results" } },
    how: "How it works", prizes: "Prizes", project: "The project", faq: "FAQ", privacy: "Privacy", dashboard: "Dashboard", signup: "Sign up", language: "Language", logout: "Log out",
    space: "Your space", browse: "Explore Skkup", welcome: (pseudo: string) => `Hi ${pseudo}, everything is available here.`, overview: "Overview", overviewDescription: "Review your points and activity.", streams: "Watch and follow", streamsDescription: "Choose a live stream and pair your extension.", draws: "View draws", drawsDescription: "Discover prizes and published results.", rules: "Read the rules", rulesDescription: "Review draw and prize rules.", admin: "Administration", adminDescription: "Manage draws and service announcements.", dashboardNav: "Personal space navigation",
    pages: {
      dashboard: { kicker: "Viewer space", title: "Your Skkup journey", description: "Track your points, keep your streak active and find all your paths in one space." },
      raffles: { kicker: "Transparent results", title: "Draws and winners", description: "Find active prizes, upcoming dates and published results." },
      dashboardRaffles: { kicker: "Transparent results", title: "Draws and winners", description: "Find active prizes, upcoming dates and published results." },
      rules: { kicker: "Transparency and rules", title: "Game rules", description: "Review the rules that apply to entries, tickets and Skkup draws." },
      streams: { kicker: "Free viewing", title: "Watch what you want", description: "Choose a live stream on Twitch, YouTube or Facebook Live. The Skkup extension follows your viewing in the selected tab." },
    },
    content: { open: "Open", closed: "Closed", published: "Result published", loading: "Loading...", noDraws: "No draw is scheduled yet.", prizes: "Prizes", winners: "Winners", noWinners: "No winner for this draw.", planned: "Draw scheduled for", freeViewing: "Free viewing", installExtension: "Install extension", selection: "Skkup selection", proposedChannels: "Featured channels", openStream: "Open stream", loadingStreams: "Loading channels...", emptyStreams: "The Skkup catalogue is empty for now.", streamDescription: "Open any live stream on Twitch, YouTube or Facebook Live. The Skkup extension detects your viewing and synchronizes points according to the service rules.", watchWhatYouWant: "Watch what you want", extensionTitle: "Your Skkup extension", extensionHeading: "Pair your browser", extensionDescription: "Generate a temporary code to link the extension to your account without exposing your password.", streamLoadError: "Unable to load streams right now." },
  },
} as const;
