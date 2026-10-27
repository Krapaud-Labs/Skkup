export type DashboardNotification = {
  id: string;
  title: string;
  message: string;
};

type DashboardNotificationListener = (notification: DashboardNotification) => void;

const listeners = new Set<DashboardNotificationListener>();
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
