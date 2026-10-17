"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useEffect, useRef } from "react";
import { MenuCompteDashboard } from "@/components/dashboard/MenuCompteDashboard";
import { CentreNotifications, type NotificationDashboard } from "@/components/dashboard/CentreNotifications";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import type { Profil } from "@/lib/dashboard";
import { connecterTempsReel, EVENEMENT_APPARIEMENTS_MIS_A_JOUR, EVENEMENT_CARTE_DEBLOQUEE, EVENEMENT_POINTS_MIS_A_JOUR, EVENEMENT_STREAK_MIS_A_JOUR } from "@/lib/temps-reel";

export function TopbarDashboard({ profil, notificationHref = "/dashboard", notificationLabel = "Notifications", admin = false }: { profil: Profil | null; notificationHref?: string; notificationLabel?: string; admin?: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDashboard[]>([]);
  const boutonNotification = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!profil || admin) return;
    const socket = connecterTempsReel();
    const ajouter = (notification: Omit<NotificationDashboard, "id" | "createdAt" | "read">) => setNotifications((courantes) => [{ ...notification, id: `${notification.type}-${Date.now()}`, createdAt: Date.now(), read: false }, ...courantes].slice(0, 8));
    socket.on(EVENEMENT_POINTS_MIS_A_JOUR, (event: { montant: number }) => ajouter({ type: "points", title: "Points mis à jour", message: `${event.montant >= 0 ? "+" : ""}${event.montant} point${Math.abs(event.montant) > 1 ? "s" : ""} ajouté${Math.abs(event.montant) > 1 ? "s" : ""} à ton solde.` }));
    socket.on(EVENEMENT_STREAK_MIS_A_JOUR, (event: { streakActuel: number }) => ajouter({ type: "streak", title: "Série mise à jour", message: `Ta série actuelle est de ${event.streakActuel} jour${event.streakActuel > 1 ? "s" : ""}.` }));
    socket.on(EVENEMENT_CARTE_DEBLOQUEE, () => ajouter({ type: "scratch-card", title: "Nouvelle carte à gratter", message: "Une carte est disponible dans tes récompenses." }));
    socket.on(EVENEMENT_APPARIEMENTS_MIS_A_JOUR, () => ajouter({ type: "extension", title: "Extension mise à jour", message: "L’état de ton extension a changé." }));
    return () => { socket.disconnect(); };
  }, [admin, profil]);
  useEffect(() => {
    if (!ouvert) return;
    const fermer = (event: MouseEvent) => { if (!(event.target as HTMLElement).closest(".skuup-notification-anchor")) { setOuvert(false); boutonNotification.current?.focus(); } };
    const echap = (event: KeyboardEvent) => { if (event.key === "Escape") { setOuvert(false); boutonNotification.current?.focus(); } };
    document.addEventListener("mousedown", fermer); document.addEventListener("keydown", echap);
    return () => { document.removeEventListener("mousedown", fermer); document.removeEventListener("keydown", echap); };
  }, [ouvert]);
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  return <div className={`skuup-viewer-topbar${admin ? " skuup-admin-topbar" : ""}`}>
    <div className="skuup-viewer-topbar-actions">
      {profil && <Link href="/dashboard/compte" className="inline-flex items-center gap-1 rounded-full border border-cyan-300/30 bg-slate-900/80 px-3 py-2 text-white no-underline" aria-label={`Solde Skkup : ${profil.soldePoints} points`}><Image className="skuup-balance-coin" src="/assets/dashboard-v3/coin-points-transparent.png" alt="" width={20} height={20} priority /><strong className="text-sm leading-none">{profil.soldePoints}</strong><span className="text-[10px] font-bold tracking-wider text-white/60">SKKUP</span></Link>}
      <div className="relative skuup-notification-anchor">
        <button ref={boutonNotification} type="button" className="skuup-viewer-icon-button" aria-label={unreadCount > 0 ? `${notificationLabel}, ${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : notificationLabel} aria-expanded={ouvert} aria-controls="dashboard-notifications-title" onClick={() => setOuvert((value) => !value)}>
          <SkkupIcon name="bell" size={20} />
          {unreadCount > 0 && <span aria-hidden="true">{unreadCount > 9 ? "9+" : unreadCount}</span>}
        </button>
        <CentreNotifications notifications={notifications} ouvert={ouvert} onClose={() => { setOuvert(false); boutonNotification.current?.focus(); }} onMarkAllRead={() => setNotifications((courantes) => courantes.map((notification) => ({ ...notification, read: true })))} notificationHref={notificationHref} />
      </div>
      <MenuCompteDashboard profil={profil} />
    </div>
  </div>;
}
