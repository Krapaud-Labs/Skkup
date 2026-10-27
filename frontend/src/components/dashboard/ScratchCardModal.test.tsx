import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { ScratchCardModal } from "./ScratchCardModal";
import { dispositionIllustrationCarteParPalier } from "@/lib/scratch-card-reward";
import type { CarteAGratter } from "@/lib/dashboard";

const carte = (streakPalier: number): CarteAGratter => ({
  id: `fixture-${streakPalier}`,
  userId: "fixture-user",
  streakPalier,
  grattee: false,
  gainType: null,
  gainMontant: null,
  createdAt: "2026-10-27T00:00:00.000Z",
  gratteeAt: null,
});

function sampleIndexes(width: number, height: number, contour: Array<[number, number]>) {
  const inside = (x: number, y: number) => {
    let value = false;
    for (let i = 0, j = contour.length - 1; i < contour.length; j = i, i += 1) {
      const [xi, yi] = contour[i];
      const [xj, yj] = contour[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) value = !value;
    }
    return value;
  };
  const indexes: number[] = [];
  for (let alphaIndex = 3; alphaIndex < width * height * 4; alphaIndex += 32) {
    const pixelIndex = (alphaIndex - 3) / 4;
    const x = ((pixelIndex % width) / width) * 100;
    const y = (Math.floor(pixelIndex / width) / height) * 100;
    if (inside(x, y)) indexes.push(alphaIndex);
  }
  return indexes;
}

function mockCanvas(progressRatio: number | "outside-only", tier = 7) {
  let readCount = 0;
  const gradient = { addColorStop: vi.fn() };
  const context = {
    setTransform: vi.fn(),
    createLinearGradient: vi.fn(() => gradient),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    fillText: vi.fn(),
    getImageData: vi.fn((_x: number, _y: number, width: number, height: number) => {
      readCount += 1;
      const data = new Uint8ClampedArray(width * height * 4);
      for (let alphaIndex = 3; alphaIndex < data.length; alphaIndex += 4) data[alphaIndex] = 255;
      // The first read builds the polygon mask. Later reads model the current foil.
      if (readCount > 1 && progressRatio !== "outside-only") {
        const contour = dispositionIllustrationCarteParPalier(tier).contour;
        const indexes = sampleIndexes(width, height, contour);
        const clearCount = Math.ceil(indexes.length * progressRatio);
        indexes.slice(0, clearCount).forEach((index) => { data[index] = 0; });
      } else if (readCount > 1 && progressRatio === "outside-only") {
        const contour = dispositionIllustrationCarteParPalier(tier).contour;
        const inside = new Set(sampleIndexes(width, height, contour));
        for (let alphaIndex = 3; alphaIndex < data.length; alphaIndex += 32) {
          if (!inside.has(alphaIndex)) data[alphaIndex] = 0;
        }
      }
      return { data } as ImageData;
    }),
    globalCompositeOperation: "source-over",
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    textAlign: "center",
    textBaseline: "middle",
    font: "",
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue({ x: 0, y: 0, left: 0, top: 0, right: 100, bottom: 50, width: 100, height: 50, toJSON: () => ({}) });
  Object.defineProperties(HTMLCanvasElement.prototype, {
    setPointerCapture: { configurable: true, value: vi.fn() },
    hasPointerCapture: { configurable: true, value: vi.fn(() => false) },
    releasePointerCapture: { configurable: true, value: vi.fn() },
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    if (this.classList.contains("skuup-scratch-canvas-wrap")) return { x: 0, y: 0, left: 0, top: 0, right: 100, bottom: 50, width: 100, height: 50, toJSON: () => ({}) };
    return { x: 0, y: 0, left: 0, top: 0, right: 100, bottom: 50, width: 100, height: 50, toJSON: () => ({}) };
  });
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => { callback(0); return 1; });
  return context;
}

afterEach(() => {
  vi.restoreAllMocks();
  delete (HTMLCanvasElement.prototype as Partial<HTMLCanvasElement>).setPointerCapture;
  delete (HTMLCanvasElement.prototype as Partial<HTMLCanvasElement>).hasPointerCapture;
  delete (HTMLCanvasElement.prototype as Partial<HTMLCanvasElement>).releasePointerCapture;
});

describe("ScratchCardModal, fixture sans API", () => {
  test("applique le contour foil propre à chacun des cinq visuels de palier", async () => {
    mockCanvas(0);
    const props = { card: carte(3), english: false, artwork: "/fixture.png", onClose: vi.fn(), onPrepare: vi.fn().mockResolvedValue("+25 points"), onReveal: vi.fn().mockResolvedValue("+25 points") };
    const view = render(<ScratchCardModal {...props} />);
    for (const tier of [3, 7, 14, 30, 51]) {
      if (tier !== 3) view.rerender(<ScratchCardModal {...props} card={carte(tier)} />);
      const zone = document.querySelector<HTMLElement>(".skuup-scratch-zone");
      const contour = dispositionIllustrationCarteParPalier(tier).contour;
      const reveal = dispositionIllustrationCarteParPalier(tier).reveal;
      expect(zone?.style.clipPath).toBe(`polygon(${contour.map(([x, y]) => `${x}% ${y}%`).join(", ")})`);
      const gain = zone?.querySelector<HTMLElement>(".skuup-scratch-modal-reveal span");
      expect(gain).not.toBeNull();
      expect(gain?.style.left).toBe(`${reveal.left}%`);
      expect(gain?.style.top).toBe(`${reveal.top}%`);
      expect(gain?.style.fontSize).toBe(reveal.fontSize);
      expect(zone?.querySelector("canvas")).not.toBeNull();
    }
  });

  test("le gain préparé reste masqué tant que moins de 90% du foil est gratté", async () => {
    mockCanvas(0.89);
    const onReveal = vi.fn().mockResolvedValue("+40 points");
    render(<ScratchCardModal card={carte(7)} english={false} artwork="/fixture.png" onClose={vi.fn()} onPrepare={vi.fn().mockResolvedValue("+40 points")} onReveal={onReveal} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Gratter automatiquement" }).hasAttribute("disabled")).toBe(false));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Gratter automatiquement" })); });
    expect(onReveal).not.toHaveBeenCalled();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("89");
    expect(screen.getByText("+40 points").closest(".skuup-scratch-modal-reveal")?.getAttribute("aria-hidden")).toBe("true");
  });

  test("valide le gain dès 90% du foil et le révèle dans la zone grise", async () => {
    mockCanvas(0.9, 14);
    let resolveReveal!: (value: string) => void;
    const onReveal = vi.fn(() => new Promise<string>((resolve) => { resolveReveal = resolve; }));
    render(<ScratchCardModal card={carte(14)} english={false} artwork="/fixture.png" onClose={vi.fn()} onPrepare={vi.fn().mockResolvedValue("aperçu masqué")} onReveal={onReveal} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Gratter automatiquement" }).hasAttribute("disabled")).toBe(false));
    expect(document.getElementById("scratch-modal-hint")?.textContent).toBe("Gratte au moins 90 % pour découvrir la récompense");
    expect(screen.getByRole("dialog").textContent).not.toMatch(/ton gain|your reward/i);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Gratter automatiquement" })); });
    expect(document.getElementById("scratch-modal-hint")?.textContent).toBe("Validation…");
    await waitFor(() => expect(onReveal).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("90");
    expect(screen.getByText("aperçu masqué").closest(".skuup-scratch-modal-reveal")?.getAttribute("aria-hidden")).toBe("true");
    await act(async () => { resolveReveal("+75 points"); });
    const gains = await screen.findAllByText("+75 points");
    const gain = gains.find((element) => element.closest(".skuup-scratch-zone"));
    if (!gain) throw new Error("Le montant doit rester rendu dans le foil du ticket.");
    expect(gain.closest(".skuup-scratch-zone")).not.toBeNull();
    expect(gain.closest(".skuup-scratch-modal-reveal")?.getAttribute("aria-hidden")).toBe("false");
    expect(screen.getByRole("dialog").textContent).not.toMatch(/ton gain|your reward/i);
    expect(screen.getAllByText("+75 points")).toHaveLength(1);
    expect(document.getElementById("scratch-modal-hint")?.textContent).toBe("");
    expect(screen.getByRole("dialog").getAttribute("aria-describedby")).toBeNull();
  });

  test("ignore les pixels transparents hors du polygone du foil dans la progression", async () => {
    mockCanvas("outside-only");
    const onReveal = vi.fn().mockResolvedValue("+25 points");
    render(<ScratchCardModal card={carte(7)} english={false} artwork="/fixture.png" onClose={vi.fn()} onPrepare={vi.fn().mockResolvedValue("+25 points")} onReveal={onReveal} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Gratter automatiquement" }).hasAttribute("disabled")).toBe(false));
    const canvas = document.querySelector("canvas");
    expect(canvas).not.toBeNull();
    await act(async () => { fireEvent.pointerDown(canvas!, { pointerId: 1, pointerType: "mouse", clientX: 50, clientY: 25 }); });
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("0");
    expect(onReveal).not.toHaveBeenCalled();
  });
});
