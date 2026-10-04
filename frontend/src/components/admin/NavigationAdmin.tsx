"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { SkkupIcon, type SkkupIconName } from "@/components/ui/SkkupIcon";

const liens = [
  { href: "/admin#overview", label: "Vue d’ensemble", icon: "overview" as SkkupIconName },
  { href: "/admin/raffles", label: "Tirages", icon: "draws" as SkkupIconName },
  { href: "/admin/lots", label: "Lots", icon: "gift" as SkkupIconName },
  { href: "/admin/announcements", label: "Annonces", icon: "bell" as SkkupIconName },
  { href: "/admin/content", label: "Contenus", icon: "content" as SkkupIconName },
  { href: "/admin/moderation", label: "Signalements", icon: "shield" as SkkupIconName },
  { href: "/admin/users", label: "Utilisateurs", icon: "users" as SkkupIconName },
  { href: "/admin/audit", label: "Journal d’audit", icon: "admin" as SkkupIconName },
] as const;

/** Navigation dédiée à l’administration, séparée du parcours viewer. */
export function NavigationAdmin() {
  const { langue } = useLanguage();
  const pathname = usePathname();

  return (
    <nav className="skuup-admin-sidebar-navigation" aria-label={langue === "en" ? "Administration navigation" : "Navigation administration"}>
      <div className="skuup-premium-dashboard-nav-group">
        {liens.map((lien) => {
          const [hrefPath, hrefHash] = lien.href.split("#");
          const actif = hrefHash === "overview"
            ? pathname === "/admin"
            : pathname === hrefPath;
          return (
            <Link key={lien.href} href={lien.href} className={`skuup-premium-dashboard-nav-link${actif ? " skuup-premium-dashboard-nav-active" : ""}`} aria-current={actif ? "page" : undefined}>
              <span className="flex items-center gap-3"><SkkupIcon name={lien.icon} size={18} /><strong>{lien.label}</strong></span>
            </Link>
          );
        })}
        <Link href="/dashboard" className="skuup-premium-dashboard-nav-link skuup-premium-dashboard-nav-back">
          <span className="flex items-center gap-3"><SkkupIcon name="eye" size={18} /><strong>{langue === "en" ? "Viewer space" : "Espace viewer"}</strong></span>
        </Link>
      </div>
    </nav>
  );
}
