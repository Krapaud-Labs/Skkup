"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { SkkupIcon, type SkkupIconName } from "@/components/ui/SkkupIcon";

const liens = [
  { href: "/admin#overview", label: "Vue d’ensemble", description: "Santé du service et priorités", icon: "overview" as SkkupIconName },
  { href: "/admin/raffles", label: "Tirages", description: "Création, résultats et historique", icon: "draws" as SkkupIconName },
  { href: "/admin/lots", label: "Lots", description: "Inventaire et attribution", icon: "gift" as SkkupIconName },
  { href: "/admin/announcements", label: "Annonces", description: "Messages visibles par les viewers", icon: "rules" as SkkupIconName },
  { href: "/admin/content", label: "Contenus", description: "Pages éditoriales et versions", icon: "rules" as SkkupIconName },
  { href: "/admin/moderation", label: "Signalements", description: "Modération et suivi anti-fraude", icon: "shield" as SkkupIconName },
  { href: "/admin/users", label: "Utilisateurs", description: "Profils concernés par les alertes", icon: "users" as SkkupIconName },
  { href: "/admin/audit", label: "Journal d’audit", description: "Actions éditoriales vérifiables", icon: "admin" as SkkupIconName },
] as const;

/** Navigation dédiée à l’administration, séparée du parcours viewer. */
export function NavigationAdmin() {
  const { langue } = useLanguage();
  const pathname = usePathname();

  return (
    <nav aria-label={langue === "en" ? "Administration navigation" : "Navigation administration"}>
      <div className="skuup-premium-dashboard-nav-group">
        {liens.map((lien) => {
          const [hrefPath, hrefHash] = lien.href.split("#");
          const actif = hrefHash === "overview"
            ? pathname === "/admin"
            : pathname === hrefPath;
          return (
            <Link key={lien.href} href={lien.href} className={`skuup-premium-dashboard-nav-link${actif ? " skuup-premium-dashboard-nav-active" : ""}`} aria-current={actif ? "page" : undefined}>
              <span className="flex items-center gap-3"><SkkupIcon name={lien.icon} size={18} /><strong>{lien.label}</strong></span>
              <span>{lien.description}</span>
            </Link>
          );
        })}
        <Link href="/dashboard" className="skuup-premium-dashboard-nav-link skuup-premium-dashboard-nav-back">
          <span className="flex items-center gap-3"><SkkupIcon name="eye" size={18} /><strong>{langue === "en" ? "Viewer space" : "Espace viewer"}</strong></span>
          <span>{langue === "en" ? "Open the viewer dashboard" : "Ouvrir le dashboard viewer"}</span>
        </Link>
      </div>
    </nav>
  );
}
