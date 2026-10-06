import type { SkkupIconName } from "@/components/ui/SkkupIcon";

export const priorities = [
  { href: "/admin/raffles", label: "Tirages à piloter", key: "openRaffles" as const, icon: "gift" as SkkupIconName, tone: "cyan", detail: "Participation et résultats" },
  { href: "/admin/lots", label: "Lots disponibles", key: "availableLots" as const, icon: "cube" as SkkupIconName, tone: "blue", detail: "Inventaire et stock" },
  { href: "/admin/announcements", label: "Annonces et contenus", key: "activeAnnouncements" as const, icon: "megaphone" as SkkupIconName, tone: "pink", detail: "Publication éditoriale" },
  { href: "/admin/moderation", label: "Signalements à traiter", key: "openFraudFlags" as const, icon: "flag" as SkkupIconName, tone: "amber", detail: "Modération et sécurité" },
];
