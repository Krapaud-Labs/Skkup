import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { PropsWithChildren } from "react";
import { beforeEach, expect, test, vi } from "vitest";
import { TopbarDashboard } from "./TopbarDashboard";
import { publierNotificationDashboard } from "@/lib/dashboard-notifications";

const recupererAnnoncesViewer = vi.fn();
const compterAnnoncesNonLuesViewer = vi.fn();
const pathname = vi.hoisted(() => ({ value: "/dashboard/raffles" }));
const tempsReel = vi.hoisted(() => ({
  handlers: {} as Record<
    string,
    (event?: {
      montant?: number;
      soldePoints?: number;
      streakActuel?: number;
    }) => void
  >,
  on: vi.fn(),
  off: vi.fn(),
  disconnect: vi.fn(),
  connect: vi.fn(),
}));
vi.mock("@/lib/dashboard", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/dashboard")>()),
  recupererAnnoncesViewer: (...args: unknown[]) =>
    recupererAnnoncesViewer(...args),
  compterAnnoncesNonLuesViewer: (...args: unknown[]) =>
    compterAnnoncesNonLuesViewer(...args),
}));

vi.mock("@/lib/temps-reel", () => ({
  connecterTempsReel: () => {
    tempsReel.connect();
    return {
      on: (
        event: string,
        handler: (event?: {
          montant?: number;
          soldePoints?: number;
          streakActuel?: number;
        }) => void,
      ) => {
        tempsReel.on(event, handler);
        tempsReel.handlers[event] = handler;
      },
      off: tempsReel.off,
      disconnect: tempsReel.disconnect,
    };
  },
  EVENEMENT_APPARIEMENTS_MIS_A_JOUR: "extension:pairings-updated",
  EVENEMENT_CARTE_DEBLOQUEE: "scratch-card:unlocked",
  EVENEMENT_POINTS_MIS_A_JOUR: "points:updated",
  EVENEMENT_RESULTAT_TIRAGE: "raffle:result",
  EVENEMENT_STREAK_MIS_A_JOUR: "streak:updated",
  EVENEMENT_TIRAGE_STATUT: "raffle:status",
}));

vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));

vi.mock("next/link", () => ({
  default: ({ children, ...props }: PropsWithChildren<{ href: string }>) => (
    <a {...props} href={props.href}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/dashboard/MenuCompteDashboard", () => ({
  MenuCompteDashboard: ({ profil }: { profil: { pseudo: string } | null }) => (
    <button
      type="button"
      aria-label={
        profil
          ? `Ouvrir le menu de ${profil.pseudo}`
          : "Ouvrir le menu du compte"
      }
    >
      Compte
    </button>
  ),
}));

const profil = {
  id: "user-1",
  email: "ada@example.com",
  pseudo: "Ada",
  soldePoints: 120,
  streakActuel: 3,
  streakMax: 7,
  derniereVisiteAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  role: "VIEWER" as const,
};

const stockageLocal = new Map<string, string>();

beforeEach(() => {
  recupererAnnoncesViewer.mockReset();
  compterAnnoncesNonLuesViewer.mockReset();
  compterAnnoncesNonLuesViewer.mockImplementation(
    async (readIds: string[] = []) => ({
      publishedCount: 1,
      readPublishedCount: readIds.includes("announcement-1") ? 1 : 0,
      publishedSetFingerprint: "a".repeat(64),
    }),
  );
  stockageLocal.clear();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      clear: () => stockageLocal.clear(),
      getItem: (key: string) => stockageLocal.get(key) ?? null,
      key: (index: number) => [...stockageLocal.keys()][index] ?? null,
      removeItem: (key: string) => {
        stockageLocal.delete(key);
      },
      setItem: (key: string, value: string) => {
        stockageLocal.set(key, value);
      },
      get length() {
        return stockageLocal.size;
      },
    } as Storage,
  });
  pathname.value = "/dashboard/raffles";
  tempsReel.handlers = {};
  tempsReel.on.mockClear();
  tempsReel.off.mockClear();
  tempsReel.disconnect.mockClear();
  tempsReel.connect.mockClear();
});

test("ne répète pas le logo S et conserve le pseudo uniquement dans le menu du compte", () => {
  render(<TopbarDashboard profil={profil} />);

  expect(screen.queryByRole("link", { name: "Skkup" })).toBeNull();
  expect(screen.queryByRole("img", { name: "Skkup" })).toBeNull();
  expect(screen.queryByText("Ada")).toBeNull();
  expect(
    screen.getByRole("button", { name: "Ouvrir le menu de Ada" }),
  ).not.toBeNull();
});

test("ne duplique pas les statistiques du dashboard dans la topbar", () => {
  render(<TopbarDashboard profil={profil} />);

  expect(
    screen.queryByRole("link", { name: "Solde Skkup : 120 points" }),
  ).toBeNull();
  expect(document.querySelector(".skuup-viewer-header-stats")).toBeNull();
});

test("masque les statistiques viewer sur la topbar administration", () => {
  render(<TopbarDashboard profil={{ ...profil, role: "ADMIN" }} admin />);

  expect(document.querySelector(".skuup-viewer-header-stats")).toBeNull();
});

test("charge la première page à chaque ouverture et actualise le compteur", async () => {
  recupererAnnoncesViewer.mockResolvedValue({
    items: [
      { id: "announcement-1", titre: "Maintenance", texte: "Retour à 18 h" },
    ],
    nextCursor: null,
  });
  render(<TopbarDashboard profil={profil} />);
  const notifications = screen.getByRole("button", { name: "Notifications" });
  fireEvent.click(notifications);
  expect(screen.getByRole("status").textContent).toContain("Chargement");
  expect(
    await screen.findByRole("button", { name: /^Maintenance,/ }),
  ).not.toBeNull();
  fireEvent.click(notifications);
  fireEvent.click(notifications);
  await waitFor(() => expect(recupererAnnoncesViewer).toHaveBeenCalledTimes(2));
  const notificationList = screen.getByRole("region", {
    name: "Notifications",
  });
  expect(notifications.getAttribute("aria-label")).toBe(
    "Notifications, 1 notification non lue",
  );
  expect(
    notificationList.querySelectorAll('button[aria-label$="annonce non lue"]'),
  ).toHaveLength(1);
  expect(
    notificationList.querySelectorAll('button[aria-label^="Maintenance,"]'),
  ).toHaveLength(1);
});

test("compte toutes les publications au-delà de la première page", async () => {
  recupererAnnoncesViewer.mockResolvedValue({
    items: [
      { id: "announcement-1", titre: "Maintenance", texte: "Retour à 18 h" },
    ],
    nextCursor: "next-page",
  });
  compterAnnoncesNonLuesViewer.mockResolvedValue({
    publishedCount: 68,
    readPublishedCount: 0,
    publishedSetFingerprint: "b".repeat(64),
  });
  render(<TopbarDashboard profil={profil} />);

  const notifications = await screen.findByRole("button", {
    name: /68 notifications non lues/,
  });
  await waitFor(() =>
    expect(
      notifications.querySelector(".skuup-viewer-notification-badge")
        ?.textContent,
    ).toBe("9+"),
  );
  expect(recupererAnnoncesViewer).toHaveBeenCalledTimes(1);
  expect(compterAnnoncesNonLuesViewer).toHaveBeenCalledWith([]);
});

test("retire le badge quand l’annonce ouverte est marquée lue localement", async () => {
  recupererAnnoncesViewer.mockResolvedValue({
    items: [
      { id: "announcement-1", titre: "Maintenance", texte: "Retour à 18 h" },
    ],
    nextCursor: null,
  });
  render(<TopbarDashboard profil={profil} />);

  fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
  fireEvent.click(await screen.findByRole("button", { name: /^Maintenance,/ }));

  await waitFor(() =>
    expect(compterAnnoncesNonLuesViewer).toHaveBeenLastCalledWith([
      "announcement-1",
    ]),
  );
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: "Notifications" })
        .querySelector(".skuup-viewer-notification-badge"),
    ).toBeNull(),
  );
  expect(
    stockageLocal.get("skkup-dashboard-read-announcements-v1:user-1"),
  ).toContain("announcement-1");
});

test("ferme le popover au clic extérieur", async () => {
  recupererAnnoncesViewer.mockResolvedValue({ items: [], nextCursor: null });
  render(<TopbarDashboard profil={profil} />);

  fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
  expect(
    await screen.findByRole("region", { name: "Notifications" }),
  ).not.toBeNull();

  fireEvent.pointerDown(document.body);

  expect(screen.queryByRole("region", { name: "Notifications" })).toBeNull();
});

test("ferme le popover avec Échap et rend le focus à la cloche", async () => {
  recupererAnnoncesViewer.mockResolvedValue({ items: [], nextCursor: null });
  render(<TopbarDashboard profil={profil} />);
  const boutonNotifications = screen.getByRole("button", {
    name: "Notifications",
  });

  fireEvent.click(boutonNotifications);
  expect(
    await screen.findByRole("region", { name: "Notifications" }),
  ).not.toBeNull();
  fireEvent.keyDown(document, { key: "Escape" });

  expect(screen.queryByRole("region", { name: "Notifications" })).toBeNull();
  expect(document.activeElement).toBe(boutonNotifications);
});

test("ferme le popover et ouvre le modal lorsqu’une annonce est choisie", async () => {
  recupererAnnoncesViewer.mockResolvedValue({
    items: [
      { id: "announcement-1", titre: "Maintenance", texte: "Retour à 18 h" },
    ],
    nextCursor: null,
  });
  render(<TopbarDashboard profil={profil} />);

  fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
  fireEvent.click(await screen.findByRole("button", { name: /^Maintenance,/ }));

  expect(screen.queryByRole("region", { name: "Notifications" })).toBeNull();
  expect(screen.getByRole("dialog", { name: "Maintenance" })).not.toBeNull();
});

test("conserve les abonnements temps réel et affiche un événement reçu", async () => {
  recupererAnnoncesViewer.mockResolvedValue({ items: [], nextCursor: null });
  const { unmount } = render(<TopbarDashboard profil={profil} />);
  expect(tempsReel.connect).toHaveBeenCalledTimes(1);
  expect(tempsReel.on.mock.calls.map(([event]) => event)).toEqual([
    "raffle:status",
  ]);
  publierNotificationDashboard(
    "Points mis à jour",
    "+3 points ajoutés à ton solde.",
  );
  expect(await screen.findByText("Points mis à jour")).not.toBeNull();
  expect(screen.getByText("+3 points ajoutés à ton solde.")).not.toBeNull();
  unmount();
  expect(tempsReel.off).toHaveBeenCalledTimes(1);
  expect(tempsReel.disconnect).toHaveBeenCalledTimes(1);
});

test("rafraîchit les annonces quand un tirage change", async () => {
  recupererAnnoncesViewer.mockResolvedValue({ items: [], nextCursor: null });
  render(<TopbarDashboard profil={profil} />);

  await waitFor(() => expect(recupererAnnoncesViewer).toHaveBeenCalledTimes(1));
  act(() => tempsReel.handlers["raffle:status"]?.({}));
  await waitFor(() => expect(recupererAnnoncesViewer).toHaveBeenCalledTimes(2));
});

test("le dialogue annonce applique le focus initial, Tab et Shift+Tab", async () => {
  recupererAnnoncesViewer.mockResolvedValue({
    items: [{ id: "announcement-1", titre: "Mise à jour", texte: "Détails" }],
    nextCursor: null,
  });
  render(<TopbarDashboard profil={profil} />);
  fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
  fireEvent.click(await screen.findByRole("button", { name: /^Mise à jour,/ }));
  const dialog = screen.getByRole("dialog", { name: "Mise à jour" });
  const closeButton = screen.getByRole("button", { name: "Fermer l’annonce" });
  expect(
    new URL(
      closeButton.querySelector("img")?.getAttribute("src") ?? "",
      "http://localhost",
    ).searchParams.get("url"),
  ).toBe("/assets/icons/ui/close.png");
  expect(document.activeElement).toBe(dialog);
  const controls = dialog.querySelectorAll<HTMLButtonElement>(
    "button:not([disabled])",
  );
  const firstControl = controls[0];
  const lastControl = controls[controls.length - 1];
  expect(controls).toHaveLength(2);

  firstControl.focus();
  const backward = new KeyboardEvent("keydown", {
    key: "Tab",
    shiftKey: true,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(backward);
  expect(backward.defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(lastControl);

  lastControl.focus();
  const forward = new KeyboardEvent("keydown", {
    key: "Tab",
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(forward);
  expect(forward.defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(firstControl);

  const fromDialogForward = new KeyboardEvent("keydown", {
    key: "Tab",
    bubbles: true,
    cancelable: true,
  });
  dialog.focus();
  document.dispatchEvent(fromDialogForward);
  expect(fromDialogForward.defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(firstControl);

  const fromDialogBackward = new KeyboardEvent("keydown", {
    key: "Tab",
    shiftKey: true,
    bubbles: true,
    cancelable: true,
  });
  dialog.focus();
  document.dispatchEvent(fromDialogBackward);
  expect(fromDialogBackward.defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(lastControl);
});

test("garde le focus dans le dialogue quand le backdrop est cliqué", async () => {
  recupererAnnoncesViewer.mockResolvedValue({
    items: [{ id: "announcement-1", titre: "Mise à jour", texte: "Détails" }],
    nextCursor: null,
  });
  render(<TopbarDashboard profil={profil} />);
  fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
  fireEvent.click(await screen.findByRole("button", { name: /^Mise à jour,/ }));

  const dialog = screen.getByRole("dialog", { name: "Mise à jour" });
  const backdrop = dialog.parentElement;
  expect(backdrop).not.toBeNull();
  expect(document.activeElement).toBe(dialog);

  const mouseDown = new MouseEvent("mousedown", {
    bubbles: true,
    cancelable: true,
  });
  backdrop!.dispatchEvent(mouseDown);

  expect(mouseDown.defaultPrevented).toBe(true);
  expect(screen.getByRole("dialog", { name: "Mise à jour" })).toBe(dialog);
  expect(document.activeElement).toBe(dialog);
});

test("charge et ajoute la page suivante dans la liste défilante", async () => {
  recupererAnnoncesViewer
    .mockResolvedValueOnce({
      items: [{ id: "a1", titre: "Annonce 1", texte: "Texte 1" }],
      nextCursor: "cursor 2",
    })
    .mockResolvedValueOnce({
      items: [{ id: "a2", titre: "Annonce 2", texte: "Texte 2" }],
      nextCursor: null,
    });
  render(<TopbarDashboard profil={profil} />);
  fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
  const annonce1 = await screen.findByRole("button", { name: /^Annonce 1,/ });
  const liste = annonce1.parentElement;
  expect(liste?.className).toContain("skuup-viewer-notification-list");
  expect(liste?.className).not.toContain("overflow-hidden");
  fireEvent.click(screen.getByRole("button", { name: "Charger plus" }));
  expect(
    await screen.findByRole("button", { name: /^Annonce 2,/ }),
  ).not.toBeNull();
  expect(recupererAnnoncesViewer).toHaveBeenNthCalledWith(2, "cursor 2");
  expect(screen.queryByRole("button", { name: "Charger plus" })).toBeNull();
});

test("la cible CSS conserve une fermeture de modal de 44×44 CSS px", () => {
  const css = readFileSync(
    resolve(process.cwd(), "src/app/globals.css"),
    "utf8",
  );
  const rule =
    css.match(/\.skuup-viewer-announcement-close\s*\{([^}]+)\}/)?.[1] ?? "";
  expect(rule).toMatch(/width\s*:\s*44px/);
  expect(rule).toMatch(/height\s*:\s*44px/);
});

test("positionne le popover viewer sous la cloche et le borne au viewport", async () => {
  const innerWidth = window.innerWidth;
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 390,
  });
  const rectOriginal = HTMLElement.prototype.getBoundingClientRect;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      if (this.classList.contains("skuup-viewer-icon-button"))
        return {
          x: 340,
          y: 60,
          left: 340,
          top: 60,
          right: 384,
          bottom: 104,
          width: 44,
          height: 44,
          toJSON: () => ({}),
        } as DOMRect;
      if (this.id === "viewer-notifications")
        return {
          x: 0,
          y: 0,
          left: 0,
          top: 0,
          right: 352,
          bottom: 160,
          width: 352,
          height: 160,
          toJSON: () => ({}),
        } as DOMRect;
      return rectOriginal.call(this);
    },
  );
  recupererAnnoncesViewer.mockResolvedValue({ items: [], nextCursor: null });
  render(<TopbarDashboard profil={profil} />);
  fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
  const popover = await screen.findByRole("region", { name: "Notifications" });
  await waitFor(() => expect(popover.style.visibility).toBe("visible"));
  expect(popover.style.left).toBe("26px");
  expect(popover.style.top).toBe("112px");
  expect(Number.parseFloat(popover.style.left) + 352).toBeLessThanOrEqual(390);
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: innerWidth,
  });
  vi.restoreAllMocks();
});
