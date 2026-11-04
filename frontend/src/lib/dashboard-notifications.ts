export type DashboardNotification = {
  id: string;
  title: string;
  message: string;
};

type DashboardNotificationListener = (notification: DashboardNotification) => void;
type DashboardRaffleStatusListener = () => void;

const listeners = new Set<DashboardNotificationListener>();
const raffleStatusListeners = new Set<DashboardRaffleStatusListener>();
let sequence = 0;

/** Publie une notification locale entre le dashboard et sa topbar. */
export function publierNotificationDashboard(title: string, message: string): void {
  const notification: DashboardNotification = {
    id: `dashboard-action-${Date.now()}-${++sequence}`,
    title,
    message,
  };
  listeners.forEach((listener) => listener(notification));
}

export function ecouterNotificationsDashboard(listener: DashboardNotificationListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Relaye localement le statut de tirage reçu par la socket du Dashboard. */
export function publierStatutTirageDashboard(): void {
  raffleStatusListeners.forEach((listener) => listener());
}

export function ecouterStatutTirageDashboard(listener: DashboardRaffleStatusListener): () => void {
  raffleStatusListeners.add(listener);
  return () => raffleStatusListeners.delete(listener);
}
