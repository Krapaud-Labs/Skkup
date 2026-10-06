"use client";

import Link from "next/link";
import { useState } from "react";
import { MenuCompteDashboard } from "@/components/dashboard/MenuCompteDashboard";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import type { Profil } from "@/lib/dashboard";

export function TopbarDashboard({ profil, notificationHref = "/dashboard", notificationLabel = "Notifications", admin = false }: { profil: Profil | null; notificationHref?: string; notificationLabel?: string; admin?: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  return <div className={`skuup-viewer-topbar${admin ? " skuup-admin-topbar" : ""}`}>
    {!admin && <div className="min-w-0 flex-1"><p className="skuup-premium-dashboard-greeting">{profil?.pseudo ?? "Administration"}</p></div>}
    <div className="skuup-viewer-topbar-actions">
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
