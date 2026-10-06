"use client";

import Link from "next/link";
import { useState } from "react";
import { MenuCompteDashboard } from "@/components/dashboard/MenuCompteDashboard";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import type { Profil } from "@/lib/dashboard";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export function TopbarDashboard({ profil, notificationHref = "/dashboard", notificationLabel = "Notifications", admin = false }: { profil: Profil | null; notificationHref?: string; notificationLabel?: string; admin?: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  const { langue, definirLangue } = useLanguage();
  return <div className={`skuup-viewer-topbar${admin ? " skuup-admin-topbar" : ""}`}>
    {!admin && <div className="min-w-0 flex-1"><p className="skuup-premium-dashboard-greeting">{profil?.pseudo ?? "Administration"}</p></div>}
    <div className="skuup-viewer-topbar-actions">
      <label className="skuup-language-switcher" aria-label={langue === "en" ? "Language" : "Langue"}>
        <span aria-hidden="true">{langue === "fr" ? "🇫🇷" : "🇬🇧"}</span>
        <select value={langue} onChange={(event) => definirLangue(event.target.value as "fr" | "en")}>
          <option value="fr">FR</option>
          <option value="en">EN</option>
        </select>
      </label>
      {profil && <Link href="/dashboard/compte" className="inline-flex items-center gap-1 rounded-full border border-cyan-300/30 bg-slate-900/80 px-3 py-2 text-white no-underline" aria-label={`Solde Skkup : ${profil.soldePoints} points`}><SkkupIcon name="points" size={17} /><strong className="text-sm leading-none">{profil.soldePoints}</strong><span className="text-[10px] font-bold tracking-wider text-white/60">SKKUP</span></Link>}
      <div className="relative">
        <button type="button" className="skuup-viewer-icon-button" aria-label={notificationLabel} aria-expanded={ouvert} onClick={() => setOuvert((value) => !value)}>
          <SkkupIcon name="bell" size={20} />
          <span aria-hidden="true" />
        </button>
        {ouvert && <div className="skuup-viewer-notification-popover" role="status"><strong>{notificationLabel}</strong><p>Aucune nouvelle notification.</p><Link href={notificationHref}>Ouvrir le journal</Link></div>}
      </div>
      <MenuCompteDashboard profil={profil} />
    </div>
  </div>;
}
