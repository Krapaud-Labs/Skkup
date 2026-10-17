"use client";

import Link from "next/link";
import { SkkupIcon, type SkkupIconName } from "@/components/ui/SkkupIcon";

export interface NotificationDashboard {
  id: string;
  type: "points" | "streak" | "scratch-card" | "extension";
  title: string;
  message: string;
  createdAt: number;
  read: boolean;
}

const iconByType: Record<NotificationDashboard["type"], SkkupIconName> = {
  points: "points",
  streak: "flame",
  "scratch-card": "scratchCard",
  extension: "extension",
};

function dateRelative(timestamp: number): string {
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "À l’instant";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes} min`;
  return `Il y a ${Math.round(minutes / 60)} h`;
}

export function CentreNotifications({ notifications, ouvert, onClose, onMarkAllRead, notificationHref = "/dashboard" }: {
  notifications: NotificationDashboard[];
  ouvert: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
  notificationHref?: string;
}) {
  if (!ouvert) return null;
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return <div className="skuup-notification-panel" role="dialog" aria-modal="false" aria-labelledby="dashboard-notifications-title">
    <div className="skuup-notification-panel-header">
      <div>
        <p className="skuup-kicker">Espace personnel</p>
        <h2 id="dashboard-notifications-title">Notifications</h2>
      </div>
      <button type="button" className="skuup-notification-close" onClick={onClose} aria-label="Fermer les notifications">×</button>
    </div>
    <div className="skuup-notification-panel-toolbar">
      <span>{unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Tout est à jour"}</span>
      {unreadCount > 0 && <button type="button" onClick={onMarkAllRead}>Tout marquer comme lu</button>}
    </div>
    {notifications.length === 0 ? <div className="skuup-notification-empty" role="status"><span className="skuup-notification-empty-icon"><SkkupIcon name="bell" size={22} /></span><strong>Aucune notification</strong><p>Les mises à jour de ton compte apparaîtront ici.</p></div> : <ul className="skuup-notification-list" aria-label="Liste des notifications">
      {notifications.map((notification) => <li key={notification.id} className={`skuup-notification-item${notification.read ? " is-read" : ""}`}>
        <span className="skuup-notification-item-icon"><SkkupIcon name={iconByType[notification.type]} size={18} /></span>
        <div><strong>{notification.title}</strong><p>{notification.message}</p><time dateTime={new Date(notification.createdAt).toISOString()}>{dateRelative(notification.createdAt)}</time></div>
        {!notification.read && <span className="skuup-notification-unread" aria-label="Non lue" />}
      </li>)}
    </ul>}
    <Link className="skuup-notification-panel-link" href={notificationHref} onClick={onClose}>Voir le tableau de bord <span aria-hidden="true">→</span></Link>
  </div>;
}
