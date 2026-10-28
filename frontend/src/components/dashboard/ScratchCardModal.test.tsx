import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import sharp from "sharp";
import { ScratchCardModal } from "./ScratchCardModal";
import { dispositionIllustrationCarteParPalier, masqueGrattageCarteParPalier } from "@/lib/scratch-card-reward";
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

async function chargerMasqueRedimensionne(tier: number, width = 100, height = 50) {
  const fichier = dispositionIllustrationCarteParPalier(tier).fichier;
  const { data, info } = await sharp(`${process.cwd()}/../asset/dashboard/rewards/scratch-tier-${fichier}-foil-mask.png`)
    .resize(width, height, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const alphaIndexes: number[] = [];
  for (let index = 3; index < data.length; index += 4) if (data[index] > 0) alphaIndexes.push(index);
  return { data: new Uint8ClampedArray(data), width: info.width, height: info.height, alphaIndexes };
}

function mockCanvas(progressRatio: number | "outside-only", mask: Awaited<ReturnType<typeof chargerMasqueRedimensionne>>, maskInitiallyLoaded = true) {
  const gradient = { addColorStop: vi.fn() };
  const maskContext = {
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({ data: mask.data } as ImageData)),
  };
  const overlayContext = {
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
      const data = new Uint8ClampedArray(width * height * 4);
      for (let alphaIndex = 3; alphaIndex < data.length; alphaIndex += 4) data[alphaIndex] = 255;
      const foil = new Set(mask.alphaIndexes);
      if (progressRatio === "outside-only") {
        for (let alphaIndex = 3; alphaIndex < data.length; alphaIndex += 4) {
          if (!foil.has(alphaIndex)) data[alphaIndex] = 0;
        }
      } else {
        const clearCount = Math.ceil(mask.alphaIndexes.length * progressRatio);
        mask.alphaIndexes.slice(0, clearCount).forEach((alphaIndex) => { data[alphaIndex] = 0; });
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
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (this: HTMLCanvasElement) {
    return (this.closest(".skuup-scratch-canvas-wrap") ? overlayContext : maskContext) as unknown as CanvasRenderingContext2D;
  });
  vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue({ x: 0, y: 0, left: 0, top: 0, right: 100, bottom: 50, width: 100, height: 50, toJSON: () => ({}) });
  const completeSpy = vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(maskInitiallyLoaded);
  const naturalWidthSpy = vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(maskInitiallyLoaded ? 1672 : 0);
  Object.defineProperties(HTMLCanvasElement.prototype, {
    setPointerCapture: { configurable: true, value: vi.fn() },
    hasPointerCapture: { configurable: true, value: vi.fn(() => false) },
    releasePointerCapture: { configurable: true, value: vi.fn() },
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    return { x: 0, y: 0, left: 0, top: 0, right: 100, bottom: 50, width: 100, height: 50, toJSON: () => ({}) };
  });
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => { callback(0); return 1; });
  return { setMaskLoaded(loaded: boolean) { completeSpy.mockReturnValue(loaded); naturalWidthSpy.mockReturnValue(loaded ? 1672 : 0); } };
}

afterEach(() => {
  vi.restoreAllMocks();
  delete (HTMLCanvasElement.prototype as Partial<HTMLCanvasElement>).setPointerCapture;
  delete (HTMLCanvasElement.prototype as Partial<HTMLCanvasElement>).hasPointerCapture;
  delete (HTMLCanvasElement.prototype as Partial<HTMLCanvasElement>).releasePointerCapture;
});

describe("ScratchCardModal, fixture sans API", () => {
  test("utilise le masque PNG propre à chaque illustration pour le voile et le gain", async () => {
    for (const tier of [3, 7, 14, 30, 51]) {
      const maskPixels = await chargerMasqueRedimensionne(tier);
      mockCanvas(0, maskPixels);
      const props = { card: carte(tier), english: false, artwork: "/fixture.png", onClose: vi.fn(), onPrepare: vi.fn().mockResolvedValue("+25 points"), onReveal: vi.fn().mockResolvedValue("+25 points") };
      const view = render(<ScratchCardModal {...props} />);
      const disposition = dispositionIllustrationCarteParPalier(tier);
      const mask = document.querySelector<HTMLImageElement>(".skuup-scratch-modal-mask-source");
      const zone = document.querySelector<HTMLElement>(".skuup-scratch-zone");
      expect(mask?.getAttribute("src")).toBe(new URL(masqueGrattageCarteParPalier(tier), window.location.origin).toString());
      expect(zone?.style.maskImage).toContain(masqueGrattageCarteParPalier(tier));
      expect(zone?.style.webkitMaskImage).toContain(masqueGrattageCarteParPalier(tier));
      expect(zone?.style.left).toBe("0px");
      expect(zone?.style.top).toBe("0px");
      const gain = zone?.querySelector<HTMLElement>(".skuup-scratch-modal-reveal span");
      expect(Number.parseFloat(gain?.style.left ?? "NaN")).toBeCloseTo(disposition.reveal.left, 3);
      expect(Number.parseFloat(gain?.style.top ?? "NaN")).toBeCloseTo(disposition.reveal.top, 3);
      expect(zone?.querySelector("canvas")).not.toBeNull();
      view.unmount();
    }
  });

  test("le gain préparé reste masqué tant que moins de 90% du foil est gratté", async () => {
    const mask = await chargerMasqueRedimensionne(7);
    mockCanvas(0.89, mask);
    const onReveal = vi.fn().mockResolvedValue("+40 points");
    render(<ScratchCardModal card={carte(7)} english={false} artwork="/fixture.png" onClose={vi.fn()} onPrepare={vi.fn().mockResolvedValue("+40 points")} onReveal={onReveal} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Gratter automatiquement" }).hasAttribute("disabled")).toBe(false));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Gratter automatiquement" })); });
    expect(onReveal).not.toHaveBeenCalled();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("89");
    expect(screen.getByText("+40 points").closest(".skuup-scratch-modal-reveal")?.getAttribute("aria-hidden")).toBe("true");
  });

  test("valide à 90% du masque et révèle le montant dans la zone grise", async () => {
    const mask = await chargerMasqueRedimensionne(14);
    mockCanvas(0.9, mask);
    let resolveReveal!: (value: string) => void;
    const onReveal = vi.fn(() => new Promise<string>((resolve) => { resolveReveal = resolve; }));
    render(<ScratchCardModal card={carte(14)} english={false} artwork="/fixture.png" onClose={vi.fn()} onPrepare={vi.fn().mockResolvedValue("aperçu masqué")} onReveal={onReveal} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Gratter automatiquement" }).hasAttribute("disabled")).toBe(false));
    expect(document.getElementById("scratch-modal-hint")?.textContent).toBe("Gratte au moins 90 % pour découvrir la récompense");
    expect(screen.getByRole("dialog").textContent).not.toMatch(/ton gain|votre gain|your gain/i);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Gratter automatiquement" })); });
    expect(document.getElementById("scratch-modal-hint")?.textContent).toBe("Validation…");
    await waitFor(() => expect(onReveal).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("90");
    expect(screen.getByText("aperçu masqué").closest(".skuup-scratch-modal-reveal")?.getAttribute("aria-hidden")).toBe("true");
    await act(async () => { resolveReveal("+75 points"); });
    const gains = await screen.findAllByText("+75 points");
    const gain = gains.find((element) => element.closest(".skuup-scratch-zone"));
    if (!gain) throw new Error("Le montant doit rester rendu dans le foil du ticket.");
    expect(gain.closest(".skuup-scratch-modal-reveal")?.getAttribute("aria-hidden")).toBe("false");
    expect(screen.getByRole("dialog").textContent).not.toMatch(/ton gain|votre gain|your gain/i);
    expect(screen.getAllByText("+75 points")).toHaveLength(1);
    expect(document.getElementById("scratch-modal-hint")?.textContent).toBe("");
    expect(screen.getByRole("dialog").getAttribute("aria-describedby")).toBeNull();
  });

  test("attend la fin du chargement du masque avant d'activer le grattage automatique", async () => {
    const mask = await chargerMasqueRedimensionne(7);
    const imageState = mockCanvas(0.9, mask, false);
    let resolveReveal!: (value: string) => void;
    const onReveal = vi.fn(() => new Promise<string>((resolve) => { resolveReveal = resolve; }));
    const onPrepare = vi.fn().mockResolvedValue("aperçu masqué");
    render(<ScratchCardModal card={carte(7)} english={false} artwork="/fixture.png" onClose={vi.fn()} onPrepare={onPrepare} onReveal={onReveal} />);
    const autoButton = screen.getByRole("button", { name: "Gratter automatiquement" });

    await waitFor(() => expect(autoButton.hasAttribute("disabled")).toBe(true));
    await waitFor(() => expect(onPrepare).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(document.getElementById("scratch-modal-hint")?.textContent).toBe("Gratte au moins 90 % pour découvrir la récompense"));
    expect(document.querySelector(".skuup-scratch-modal-reveal")?.getAttribute("aria-hidden")).toBe("true");
    await act(async () => { fireEvent.click(autoButton); });
    expect(onReveal).not.toHaveBeenCalled();

    const maskImage = document.querySelector<HTMLImageElement>(".skuup-scratch-modal-mask-source");
    expect(maskImage).not.toBeNull();
    imageState.setMaskLoaded(true);
    await act(async () => { fireEvent.load(maskImage!); });
    await waitFor(() => expect(autoButton.hasAttribute("disabled")).toBe(false));
    await act(async () => { fireEvent.click(autoButton); });
    await waitFor(() => expect(onReveal).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("90"));
    await act(async () => { resolveReveal("+30 points"); });
  });

  test("signale un échec de chargement du masque et garde le grattage désactivé", async () => {
    const mask = await chargerMasqueRedimensionne(3);
    const imageState = mockCanvas(0.9, mask, false);
    const onReveal = vi.fn();
    render(<ScratchCardModal card={carte(3)} english={false} artwork="/fixture.png" onClose={vi.fn()} onPrepare={vi.fn().mockResolvedValue("aperçu masqué")} onReveal={onReveal} />);
    const maskImage = document.querySelector<HTMLImageElement>(".skuup-scratch-modal-mask-source");
    expect(maskImage).not.toBeNull();
    imageState.setMaskLoaded(false);
    await act(async () => { fireEvent.error(maskImage!); });
    expect(screen.getByRole("alert").textContent).toContain("L’image de grattage n’a pas pu être chargée");
    expect(screen.getByRole("button", { name: "Gratter automatiquement" }).hasAttribute("disabled")).toBe(true);
    expect(onReveal).not.toHaveBeenCalled();
  });

  test("le grattage extérieur au masque ne compte pas dans le pourcentage", async () => {
    const mask = await chargerMasqueRedimensionne(7);
    mockCanvas("outside-only", mask);
    const onReveal = vi.fn().mockResolvedValue("+25 points");
    render(<ScratchCardModal card={carte(7)} english={false} artwork="/fixture.png" onClose={vi.fn()} onPrepare={vi.fn().mockResolvedValue("+25 points")} onReveal={onReveal} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Gratter automatiquement" }).hasAttribute("disabled")).toBe(false));
    const canvas = document.querySelector("canvas");
    expect(canvas).not.toBeNull();
    await act(async () => { fireEvent.pointerDown(canvas!, { pointerId: 1, pointerType: "mouse", clientX: 5, clientY: 5 }); });
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("0");
    expect(onReveal).not.toHaveBeenCalled();
  });
});
