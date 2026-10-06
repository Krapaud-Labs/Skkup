import type { SkkupIconName } from "@/components/ui/SkkupIcon";

export const priorities = [
  { href: "/admin/raffles", label: "Tirages ouverts", key: "openRaffles" as const, icon: "gift" as SkkupIconName, tone: "cyan", detail: "sur les tirages programmés" },
  { href: "/admin/lots", label: "Lots disponibles", key: "availableLots" as const, icon: "cube" as SkkupIconName, tone: "blue", detail: "sur les lots enregistrés" },
  { href: "/admin/announcements", label: "Annonces publiées", key: "activeAnnouncements" as const, icon: "megaphone" as SkkupIconName, tone: "pink", detail: "sur les annonces créées" },
  { href: "/admin/moderation", label: "Signalements à traiter", key: "openFraudFlags" as const, icon: "flag" as SkkupIconName, tone: "amber", detail: "Modération et sécurité" },
];
