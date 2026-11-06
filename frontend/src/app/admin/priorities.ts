import type { SkkupIconName, SkkupVisualName } from "@/components/ui/SkkupIcon";

export const priorities = [
  { href: "/admin/raffles", label: "Tirages ouverts", key: "openRaffles" as const, icon: "draws" as SkkupIconName, illustration: "ticketIllustration" as SkkupVisualName, tone: "cyan" },
  { href: "/admin/lots", label: "Lots disponibles", key: "availableLots" as const, icon: "gift" as SkkupIconName, tone: "blue" },
  { href: "/admin/announcements", label: "Annonces publiées", key: "activeAnnouncements" as const, icon: "megaphone" as SkkupIconName, tone: "pink" },
  { href: "/admin/moderation", label: "Signalements à traiter", key: "openFraudFlags" as const, icon: "flag" as SkkupIconName, tone: "amber" },
];
