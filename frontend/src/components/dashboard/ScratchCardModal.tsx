"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import Image from "next/image";
import type { CarteAGratter } from "@/lib/dashboard";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { dispositionIllustrationCarteParPalier, illustrationCarteParPalier, masqueGrattageCarteParPalier } from "@/lib/scratch-card-reward";

type ScratchCardModalProps = {
  card: CarteAGratter;
  english: boolean;
  artwork?: string;
  onClose: () => void;
  onPrepare: () => Promise<string>;
  onReveal: () => Promise<string>;
};

type Phase = "preparing" | "ready" | "scratching" | "validating" | "revealed" | "error";

/** Modal de grattage : la récompense définitive n'apparaît qu'après validation par l'API. */
export function ScratchCardModal({ card, english, artwork, onClose, onPrepare, onReveal }: ScratchCardModalProps) {
  const illustration = dispositionIllustrationCarteParPalier(card.streakPalier);
  const foilMask = masqueGrattageCarteParPalier(card.streakPalier);
  const revealCentre = illustration.reveal;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskSourceRef = useRef<HTMLImageElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const pointerDown = useRef(false);
  const lastPointerPosition = useRef<{ x: number; y: number } | null>(null);
  const validationStarted = useRef(false);
  const prepared = useRef(false);
  const scratchableAlphaIndices = useRef<number[]>([]);
  const onPrepareRef = useRef(onPrepare);
  const onRevealRef = useRef(onReveal);
  onPrepareRef.current = onPrepare;
  onRevealRef.current = onReveal;
  const [phase, setPhase] = useState<Phase>("preparing");
  const [progress, setProgress] = useState(0);
  const [maskReady, setMaskReady] = useState(false);
  const [maskLoadError, setMaskLoadError] = useState<string | null>(null);
  const [rewardPreview, setRewardPreview] = useState<string | null>(null);
  const [reward, setReward] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const copy = english
    ? { title: "Scratch to reveal", subtitle: `Streak tier · ${card.streakPalier} days`, hint: "Scratch at least 90% to discover the reward", auto: "Scratch automatically", validating: "Validating…", preparing: "Preparing the hidden reward…", retry: "Try again", close: "Close", error: "The card could not be validated. Try again.", maskError: "The scratch image could not be loaded. Close and reopen the card." }
    : { title: "Gratte pour découvrir", subtitle: `Palier de série · ${card.streakPalier} jours`, hint: "Gratte au moins 90 % pour découvrir la récompense", auto: "Gratter automatiquement", validating: "Validation…", preparing: "Préparation de la récompense…", retry: "Réessayer", close: "Fermer", error: "La carte n’a pas pu être validée. Réessaie.", maskError: "L’image de grattage n’a pas pu être chargée. Ferme puis rouvre la carte." };

  const paintCover = useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    const maskImage = maskSourceRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !wrapper || !context || !maskImage?.complete || maskImage.naturalWidth === 0) return;
    const rect = wrapper.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const gradient = context.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, "#f5f0ff");
    gradient.addColorStop(.48, "#d9d1e8");
    gradient.addColorStop(1, "#fffaff");
    context.globalCompositeOperation = "source-over";
    context.fillStyle = gradient;
    context.fillRect(0, 0, rect.width, rect.height);
    context.strokeStyle = "rgb(104 72 145 / .14)";
    context.lineWidth = 1;
    for (let x = -rect.height; x < rect.width + rect.height; x += 18) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x - rect.height, rect.height);
      context.stroke();
    }
    context.globalCompositeOperation = "destination-out";
    context.globalCompositeOperation = "source-over";
    context.fillStyle = "#54336f";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `700 ${Math.max(14, Math.min(18, rect.width * .04))}px system-ui, sans-serif`;
    context.fillText(english ? "SCRATCH TO REVEAL" : "GRATTE POUR RÉVÉLER", rect.width * revealCentre.left / 100, rect.height * revealCentre.top / 100);
    context.globalCompositeOperation = "destination-out";
    const grattables: number[] = [];
    const maskCanvas = maskCanvasRef.current ?? document.createElement("canvas");
    maskCanvasRef.current = maskCanvas;
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskContext = maskCanvas.getContext("2d", { willReadFrequently: true });
    if (!maskContext) return;
    maskContext.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    maskContext.drawImage(maskImage, 0, 0, maskCanvas.width, maskCanvas.height);
    const maskPixels = maskContext.getImageData(0, 0, maskCanvas.width, maskCanvas.height).data;
    for (let alphaIndex = 3; alphaIndex < maskPixels.length; alphaIndex += 4) {
      if (maskPixels[alphaIndex] > 0) grattables.push(alphaIndex);
    }
    scratchableAlphaIndices.current = grattables;
    setMaskReady(grattables.length > 0);
    setMaskLoadError(grattables.length > 0 ? null : copy.maskError);
    setProgress(0);
  }, [copy.maskError, english, revealCentre.left, revealCentre.top]);

  const handleMaskError = useCallback(() => {
    scratchableAlphaIndices.current = [];
    setMaskReady(false);
    setMaskLoadError(copy.maskError);
  }, [copy.maskError]);

  useEffect(() => {
    paintCover();
    const observer = typeof ResizeObserver === "undefined" || !wrapperRef.current ? null : new ResizeObserver(paintCover);
    if (wrapperRef.current) observer?.observe(wrapperRef.current);
    return () => observer?.disconnect();
  }, [paintCover]);

  const prepareReward = useCallback(async () => {
    setPhase("preparing");
    setError(null);
    try {
      setRewardPreview(await onPrepareRef.current());
      prepared.current = true;
      setPhase("ready");
    } catch (exception) {
      prepared.current = false;
      setError(exception instanceof Error && exception.message ? exception.message : english ? "The card could not be validated. Try again." : "La carte n’a pas pu être validée. Réessaie.");
      setPhase("error");
    }
  }, [english]);

  useEffect(() => {
    const preparation = window.setTimeout(() => { void prepareReward(); }, 0);
    // La préparation est idempotente côté serveur; ne pas la répéter aux rendus.
    return () => window.clearTimeout(preparation);
  }, [prepareReward]);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])");
    firstFocusable?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && phase !== "validating") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"));
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, phase]);

  const updateProgress = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !context) return;
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let clear = 0;
    const samples = scratchableAlphaIndices.current.length;
    for (const alphaIndex of scratchableAlphaIndices.current) {
      if (pixels[alphaIndex] < 32) clear += 1;
    }
    const ratio = samples === 0 ? 0 : clear / samples;
    setProgress(ratio);
    if (ratio >= .9 && prepared.current) void validateReward();
  };

  const eraseAt = useCallback((clientX: number, clientY: number, radius = 23) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    const rect = canvas?.getBoundingClientRect();
    if (!canvas || !context || !rect) return;
    // Le contexte garde déjà le transform DPR appliqué par paintCover.
    // On lui fournit donc des coordonnées et un rayon CSS, sans remultiplier le DPR.
    context.globalCompositeOperation = "destination-out";
    context.beginPath();
    context.arc(clientX - rect.left, clientY - rect.top, radius, 0, Math.PI * 2);
    context.fill();
  }, []);

  async function validateReward() {
    if (validationStarted.current) return;
    validationStarted.current = true;
    setPhase("validating");
    setError(null);
    try {
      setReward(await onRevealRef.current());
      setProgress(1);
      setPhase("revealed");
    } catch (exception) {
      validationStarted.current = false;
      setError(exception instanceof Error && exception.message ? exception.message : copy.error);
      setPhase("error");
    }
  }

  function onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (!maskReady || !prepared.current || phase === "preparing" || phase === "validating" || phase === "revealed" || phase === "error") return;
    pointerDown.current = true;
    lastPointerPosition.current = { x: event.clientX, y: event.clientY };
    setPhase("scratching");
    event.currentTarget.setPointerCapture(event.pointerId);
    eraseAt(event.clientX, event.clientY);
    updateProgress();
  }

  function onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!maskReady || !prepared.current || !pointerDown.current || phase === "preparing" || phase === "validating" || phase === "revealed") return;
    const previous = lastPointerPosition.current;
    if (previous) {
      const deltaX = event.clientX - previous.x;
      const deltaY = event.clientY - previous.y;
      const steps = Math.max(1, Math.ceil(Math.hypot(deltaX, deltaY) / 16));
      for (let step = 1; step <= steps; step += 1) {
        const progress = step / steps;
        eraseAt(previous.x + deltaX * progress, previous.y + deltaY * progress);
      }
    } else {
      eraseAt(event.clientX, event.clientY);
    }
    lastPointerPosition.current = { x: event.clientX, y: event.clientY };
    updateProgress();
  }

  function onPointerUp(event: PointerEvent<HTMLCanvasElement>) {
    pointerDown.current = false;
    lastPointerPosition.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    updateProgress();
  }

  async function scratchAutomatically() {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (!canvas || !rect || !maskReady || scratchableAlphaIndices.current.length === 0 || !prepared.current || phase === "preparing" || phase === "validating" || phase === "revealed") return;
    setPhase("scratching");
    const radius = Math.min(38, Math.max(14, Math.min(rect.width, rect.height) * .2));
    const spacing = radius * 1.2;
    const positions = (length: number) => {
      const values = Array.from({ length: Math.ceil(length / spacing) }, (_, index) => index * spacing);
      if (values[values.length - 1] !== length) values.push(length);
      return values;
    };
    const xPositions = positions(rect.width);
    for (const y of positions(rect.height)) {
      for (const x of xPositions) {
        if (validationStarted.current) break;
        eraseAt(rect.left + x, rect.top + y, radius);
      }
      updateProgress();
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      if (validationStarted.current) break;
    }
  }

  return (
    <div className="skuup-scratch-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && phase !== "validating") onClose(); }}>
      <section ref={dialogRef} tabIndex={-1} className="skuup-scratch-modal" role="dialog" aria-modal="true" aria-labelledby="scratch-modal-title" aria-describedby={phase === "revealed" ? undefined : "scratch-modal-hint"}>
        <button type="button" className="skuup-scratch-modal-close" aria-label={copy.close} disabled={phase === "validating"} onClick={onClose}><SkkupIcon name="close" size={18} /></button>
        <p className="skuup-kicker">{copy.subtitle}</p>
        <h2 id="scratch-modal-title">{copy.title}</h2>
        <div className="skuup-scratch-modal-card" style={{ backgroundImage: `url("${artwork ?? illustrationCarteParPalier(card.streakPalier)}")`, aspectRatio: `${illustration.largeur} / ${illustration.hauteur}` }}>
          <Image ref={maskSourceRef} className="skuup-scratch-modal-mask-source" src={foilMask} alt="" aria-hidden="true" width={illustration.largeur} height={illustration.hauteur} unoptimized loading="eager" onLoad={paintCover} onError={handleMaskError} />
          <div className="skuup-scratch-zone" style={{ left: 0, top: 0, width: "100%", height: "100%", maskImage: `url("${foilMask}")`, WebkitMaskImage: `url("${foilMask}")`, maskSize: "100% 100%", WebkitMaskSize: "100% 100%", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat" }}>
            <div className="skuup-scratch-modal-reveal" aria-live={phase === "revealed" ? "polite" : undefined} aria-hidden={phase !== "revealed"}>
              <span style={{ left: `${revealCentre.left}%`, top: `${revealCentre.top}%`, fontSize: illustration.reveal.fontSize }}>{reward ?? rewardPreview ?? ""}</span>
            </div>
            <div className="skuup-scratch-canvas-wrap" ref={wrapperRef}>
              {phase !== "revealed" && <canvas ref={canvasRef} aria-label={copy.hint} role="img" className={phase === "preparing" || phase === "validating" || phase === "error" || !maskReady || !prepared.current ? "is-disabled" : ""} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} />}
            </div>
          </div>
        </div>
        <p id="scratch-modal-hint" className="skuup-scratch-modal-hint">{phase === "preparing" ? copy.preparing : phase === "validating" ? copy.validating : phase === "revealed" ? "" : copy.hint}</p>
        <div className="skuup-scratch-modal-progress" role="progressbar" aria-label={copy.hint} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
          <span style={{ width: `${Math.min(100, progress * 100)}%` }} />
        </div>
        {(phase === "error" || maskLoadError) && <p className="skuup-scratch-modal-error" role="alert">{maskLoadError ?? error ?? copy.error}</p>}
        <div className="skuup-scratch-modal-actions">
          {phase === "error" ? <button type="button" className="skuup-button skuup-button-primary" onClick={() => void (prepared.current ? validateReward() : prepareReward())}>{copy.retry}</button> : phase !== "revealed" && <button type="button" className="skuup-button skuup-button-primary" onClick={() => void scratchAutomatically()} disabled={phase === "preparing" || phase === "validating" || !maskReady || scratchableAlphaIndices.current.length === 0 || !prepared.current || Boolean(maskLoadError)}>{copy.auto}</button>}
          {phase === "revealed" && <button type="button" className="skuup-button skuup-button-primary" onClick={onClose}>{copy.close}</button>}
        </div>
      </section>
    </div>
  );
}
