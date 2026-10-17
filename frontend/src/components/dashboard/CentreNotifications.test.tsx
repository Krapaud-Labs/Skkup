import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { CentreNotifications, type NotificationDashboard } from "./CentreNotifications";

vi.mock("next/link", () => ({ default: ({ children, ...props }: { children: ReactNode; href: string; onClick?: () => void }) => <a {...props} href={props.href}>{children}</a> }));

const notification: NotificationDashboard = {
  id: "notification-1",
  type: "points",
  title: "Points mis à jour",
  message: "+5 points ajoutés à ton solde.",
  createdAt: Date.now(),
  read: false,
};

describe("CentreNotifications", () => {
  it("présente un état vide accessible", () => {
    render(<CentreNotifications notifications={[]} ouvert onClose={vi.fn()} onMarkAllRead={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Notifications" })).not.toBeNull();
    expect(screen.getByText("Aucune notification")).not.toBeNull();
  });

  it("affiche le compteur et permet de tout marquer comme lu", () => {
    const onMarkAllRead = vi.fn();
    render(<CentreNotifications notifications={[notification]} ouvert onClose={vi.fn()} onMarkAllRead={onMarkAllRead} />);

    expect(screen.getByText("1 non lue")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Tout marquer comme lu" }));
    expect(onMarkAllRead).toHaveBeenCalledOnce();
  });
});
