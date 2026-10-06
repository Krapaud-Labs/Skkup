import type { SkkupIconName } from "@/components/ui/SkkupIcon";

export const priorities = [
  { href: "/admin/raffles", label: "Tirages ouverts", key: "openRaffles" as const, totalKey: "totalRaffles" as const, icon: "giftAdmin" as SkkupIconName, tone: "cyan", detail: "tirages programmés" },
  { href: "/admin/lots", label: "Lots disponibles", key: "availableLots" as const, totalKey: "totalLots" as const, icon: "cubeAdmin" as SkkupIconName, tone: "blue", detail: "lots enregistrés" },
  { href: "/admin/announcements", label: "Annonces publiées", key: "activeAnnouncements" as const, totalKey: "totalAnnouncements" as const, icon: "megaphoneAdmin" as SkkupIconName, tone: "pink", detail: "annonces créées" },
  { href: "/admin/moderation", label: "Signalements à traiter", key: "openFraudFlags" as const, totalKey: "totalFraudFlags" as const, icon: "flagAdmin" as SkkupIconName, tone: "amber", detail: "signalements reçus" },
];
