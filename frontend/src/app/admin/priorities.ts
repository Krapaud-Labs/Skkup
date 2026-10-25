import type { SkkupIconName, SkkupVisualName } from "@/components/ui/SkkupIcon";

export const priorities = [
  { href: "/admin/raffles", label: "Tirages ouverts", key: "openRaffles" as const, totalKey: "totalRaffles" as const, icon: "draws" as SkkupIconName, illustration: "ticketIllustration" as SkkupVisualName, tone: "cyan", detail: "tirages programmés" },
  { href: "/admin/lots", label: "Lots disponibles", key: "availableLots" as const, totalKey: "totalLots" as const, icon: "cube" as SkkupIconName, illustration: "rewardIllustration" as SkkupVisualName, tone: "blue", detail: "lots enregistrés" },
  { href: "/admin/announcements", label: "Annonces publiées", key: "activeAnnouncements" as const, totalKey: "totalAnnouncements" as const, icon: "megaphone" as SkkupIconName, tone: "pink", detail: "annonces créées" },
  { href: "/admin/moderation", label: "Signalements à traiter", key: "openFraudFlags" as const, totalKey: "totalFraudFlags" as const, icon: "flag" as SkkupIconName, tone: "amber", detail: "signalements reçus" },
];
