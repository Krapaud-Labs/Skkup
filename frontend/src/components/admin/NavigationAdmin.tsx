"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SkkupIcon, type SkkupIconName } from "@/components/ui/SkkupIcon";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const liens = [
  { href: "/admin", icon: "overview", label: "Vue d’ensemble", description: "Pilotage du service" },
  { href: "/admin#content", icon: "rules", label: "Contenus", description: "Pages et textes éditoriaux" },
  { href: "/admin#announcements", icon: "streams", label: "Annonces", description: "Messages visibles par les viewers" },
  { href: "/admin#raffles", icon: "draws", label: "Tirages", description: "Lots, résultats et historique" },
] as const;

/** Navigation dédiée à l’administration, séparée du parcours viewer. */
export function NavigationAdmin() {
  const pathname = usePathname();
  const { langue } = useLanguage();

  return (
    <nav className="skuup-dashboard-actions" aria-label={langue === "en" ? "Administration navigation" : "Navigation administration"}>
        <div className="skuup-dashboard-sidebar-links">
          {liens.map((lien) => {
            const actif = lien.href === "/admin" ? pathname === "/admin" : false;
            return (
              <Link key={lien.href} href={lien.href} className={`skuup-dashboard-action group${actif ? " skuup-dashboard-action-active" : ""}`} aria-current={actif ? "page" : undefined}>
                <span className="skuup-dashboard-action-icon"><SkkupIcon name={lien.icon as SkkupIconName} size={22} /></span>
                <span className="flex-1"><strong>{lien.label}</strong><span>{lien.description}</span></span>
                <span className="skuup-dashboard-action-arrow"><SkkupIcon name="arrow" size={17} /></span>
              </Link>
            );
          })}
          <Link href="/dashboard" className="skuup-dashboard-action group">
            <span className="skuup-dashboard-action-icon"><SkkupIcon name="overview" size={22} /></span>
            <span className="flex-1"><strong>{langue === "en" ? "Viewer space" : "Espace viewer"}</strong><span>{langue === "en" ? "Open the viewer dashboard" : "Ouvrir le dashboard viewer"}</span></span>
            <span className="skuup-dashboard-action-arrow"><SkkupIcon name="arrow" size={17} /></span>
          </Link>
        </div>
    </nav>
  );
}
