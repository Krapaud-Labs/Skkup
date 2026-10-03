"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const liens = [
  { href: "/admin#overview", label: "Cockpit", description: "Santé du service et priorités" },
  { href: "/admin/users", label: "Utilisateurs", description: "Profils concernés par les alertes" },
  { href: "/admin/moderation", label: "Signalements", description: "Modération et suivi anti-fraude" },
  { href: "/admin/raffles", label: "Tirages", description: "Création, résultats et historique" },
  { href: "/admin/lots", label: "Lots", description: "Inventaire et attribution" },
  { href: "/admin/content", label: "Contenus", description: "Pages éditoriales et versions" },
  { href: "/admin/announcements", label: "Annonces", description: "Messages visibles par les viewers" },
  { href: "/admin/audit", label: "Journal d’audit", description: "Actions éditoriales vérifiables" },
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
              <strong>{lien.label}</strong>
              <span>{lien.description}</span>
            </Link>
          );
        })}
        <Link href="/dashboard" className="skuup-premium-dashboard-nav-link skuup-premium-dashboard-nav-back">
          <strong>{langue === "en" ? "Viewer space" : "Espace viewer"}</strong>
          <span>{langue === "en" ? "Open the viewer dashboard" : "Ouvrir le dashboard viewer"}</span>
        </Link>
      </div>
    </nav>
  );
}
