import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { HomepageWheelSnapController } from "./HomepageWheelSnapController";

describe("HomepageWheelSnapController", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.querySelectorAll("main.skuup-homepage").forEach((root) => root.remove());
  });

  const setupStops = () => {
    const root = document.createElement("main");
    root.className = "skuup-homepage";
    const sections = [0, 1, 2].map(() => {
      const section = document.createElement("section");
      section.className = "skuup-home-snap-section";
      root.append(section);
      return section;
    });
    document.body.append(root);
    vi.spyOn(sections[0], "getBoundingClientRect").mockReturnValue({ top: 0, bottom: 800 } as DOMRect);
    vi.spyOn(sections[1], "getBoundingClientRect").mockReturnValue({ top: 800, bottom: 1600 } as DOMRect);
    vi.spyOn(sections[2], "getBoundingClientRect").mockReturnValue({ top: 1600, bottom: 2400 } as DOMRect);
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    return { root, sections };
  };

  it("advances one stop for pixel wheel input and blocks momentum from chaining stops", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    vi.stubGlobal("scrollTo", vi.fn());
    const { root } = setupStops();
    const nested = document.createElement("div");
    nested.style.overflowY = "auto";
    Object.defineProperties(nested, {
      scrollHeight: { configurable: true, value: 1200 },
      clientHeight: { configurable: true, value: 300 },
      scrollTop: { configurable: true, writable: true, value: 120 },
    });
    root.append(nested);

    const { unmount } = render(<HomepageWheelSnapController />);
    const pixel = new WheelEvent("wheel", { deltaY: 32, deltaMode: WheelEvent.DOM_DELTA_PIXEL, cancelable: true });
    window.dispatchEvent(pixel);
    expect(pixel.defaultPrevented).toBe(true);
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 800, behavior: "smooth" });

    const nestedWheelDuringLock = new WheelEvent("wheel", { deltaY: 4, deltaMode: WheelEvent.DOM_DELTA_PIXEL, cancelable: true, bubbles: true });
    nested.dispatchEvent(nestedWheelDuringLock);
    expect(nestedWheelDuringLock.defaultPrevented).toBe(false);

    const momentum = new WheelEvent("wheel", { deltaY: 4, deltaMode: WheelEvent.DOM_DELTA_PIXEL, cancelable: true });
    window.dispatchEvent(momentum);
    expect(momentum.defaultPrevented).toBe(true);
    expect(window.scrollTo).toHaveBeenCalledTimes(1);

    unmount();
    root.remove();
  });

  it("unlocks on the fallback after the wheel burst is idle", () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    const { root } = setupStops();
    const { unmount } = render(<HomepageWheelSnapController />);
    const wheel = () => new WheelEvent("wheel", { deltaY: 20, deltaMode: WheelEvent.DOM_DELTA_PAGE, cancelable: true });

    window.dispatchEvent(wheel());
    vi.advanceTimersByTime(1600);
    const nextGestureAfterFallback = wheel();
    window.dispatchEvent(nextGestureAfterFallback);
    expect(nextGestureAfterFallback.defaultPrevented).toBe(true);
    expect(scrollTo).toHaveBeenCalledTimes(2);
    document.dispatchEvent(new Event("scrollend"));

    const momentum = wheel();
    window.dispatchEvent(momentum);
    expect(momentum.defaultPrevented).toBe(true);
    expect(scrollTo).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(179);
    const lateMomentum = wheel();
    window.dispatchEvent(lateMomentum);
    expect(lateMomentum.defaultPrevented).toBe(true);
    expect(scrollTo).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(180);
    window.dispatchEvent(wheel());
    expect(scrollTo).toHaveBeenCalledTimes(3);

    vi.advanceTimersByTime(200);
    const momentumAfterThirdGesture = wheel();
    window.dispatchEvent(momentumAfterThirdGesture);
    expect(momentumAfterThirdGesture.defaultPrevented).toBe(true);
    expect(scrollTo).toHaveBeenCalledTimes(3);

    unmount();
    root.remove();
  });

  it("accepts the next gesture immediately after scrollend when wheel input was already idle", () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    let currentScrollY = 0;
    const scrollTo = vi.fn(({ top }: ScrollToOptions) => { currentScrollY = top ?? 0; });
    vi.stubGlobal("scrollTo", scrollTo);
    const { root, sections } = setupStops();
    Object.defineProperty(window, "scrollY", { configurable: true, get: () => currentScrollY });
    const pointerTarget = document.createElement("button");
    sections[0].append(pointerTarget);
    sections.forEach((section, index) => {
      vi.spyOn(section, "getBoundingClientRect").mockImplementation(() => {
        const top = index * 800 - currentScrollY;
        return { top, bottom: top + 800 } as DOMRect;
      });
    });
    const { unmount } = render(<HomepageWheelSnapController />);
    const wheel = () => new WheelEvent("wheel", { deltaY: 24, deltaMode: WheelEvent.DOM_DELTA_PIXEL, cancelable: true, bubbles: true });

    const firstGesture = wheel();
    pointerTarget.dispatchEvent(firstGesture);
    expect(firstGesture.defaultPrevented).toBe(true);
    expect(currentScrollY).toBe(800);

    // The deliberate wheel-idle period elapses while smooth scrolling runs.
    vi.advanceTimersByTime(180);
    document.dispatchEvent(new Event("scrollend"));
    const secondGesture = wheel();
    pointerTarget.dispatchEvent(secondGesture);
    expect(secondGesture.defaultPrevented).toBe(true);
    expect(currentScrollY).toBe(1600);
    expect(scrollTo.mock.calls.map(([options]) => options.top)).toEqual([800, 1600]);

    unmount();
    root.remove();
  });

  it("blocks wheel inertia after scrollend until 180 ms of wheel silence", () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    let currentScrollY = 0;
    const scrollTo = vi.fn(({ top }: ScrollToOptions) => { currentScrollY = top ?? 0; });
    vi.stubGlobal("scrollTo", scrollTo);
    const { root, sections } = setupStops();
    Object.defineProperty(window, "scrollY", { configurable: true, get: () => currentScrollY });
    const pointerTarget = document.createElement("button");
    sections[0].append(pointerTarget);
    sections.forEach((section, index) => {
      vi.spyOn(section, "getBoundingClientRect").mockImplementation(() => {
        const top = index * 800 - currentScrollY;
        return { top, bottom: top + 800 } as DOMRect;
      });
    });
    const { unmount } = render(<HomepageWheelSnapController />);
    const wheel = () => new WheelEvent("wheel", { deltaY: 24, deltaMode: WheelEvent.DOM_DELTA_PIXEL, cancelable: true, bubbles: true });

    pointerTarget.dispatchEvent(wheel());
    expect(currentScrollY).toBe(800);
    document.dispatchEvent(new Event("scrollend"));

    vi.advanceTimersByTime(60);
    const inertia = wheel();
    pointerTarget.dispatchEvent(inertia);
    expect(inertia.defaultPrevented).toBe(true);
    expect(scrollTo).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(179);
    const lateInertia = wheel();
    pointerTarget.dispatchEvent(lateInertia);
    expect(lateInertia.defaultPrevented).toBe(true);
    expect(scrollTo).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(180);
    const nextGesture = wheel();
    pointerTarget.dispatchEvent(nextGesture);
    expect(nextGesture.defaultPrevented).toBe(true);
    expect(currentScrollY).toBe(1600);
    expect(scrollTo).toHaveBeenCalledTimes(2);

    unmount();
    root.remove();
  });

  it("navigates three section stops through the same stable pointer target", () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    let currentScrollY = 0;
    const scrollTo = vi.fn(({ top }: ScrollToOptions) => { currentScrollY = top ?? 0; });
    vi.stubGlobal("scrollTo", scrollTo);
    const { root, sections } = setupStops();
    Object.defineProperty(window, "scrollY", { configurable: true, get: () => currentScrollY });
    const stableTarget = document.createElement("button");
    sections[0].append(stableTarget);
    sections.forEach((section, index) => {
      vi.spyOn(section, "getBoundingClientRect").mockImplementation(() => {
        const top = index * 800 - currentScrollY;
        return { top, bottom: top + 800 } as DOMRect;
      });
    });
    const { unmount } = render(<HomepageWheelSnapController />);
    const wheel = (deltaY: number) => new WheelEvent("wheel", {
      deltaY,
      deltaMode: WheelEvent.DOM_DELTA_PIXEL,
      cancelable: true,
      bubbles: true,
    });

    const downToMiddle = wheel(30);
    stableTarget.dispatchEvent(downToMiddle);
    expect(downToMiddle.defaultPrevented).toBe(true);
    expect(currentScrollY).toBe(800);
    document.dispatchEvent(new Event("scrollend"));
    vi.advanceTimersByTime(180);

    const downToEnd = wheel(30);
    stableTarget.dispatchEvent(downToEnd);
    expect(downToEnd.defaultPrevented).toBe(true);
    expect(scrollTo).toHaveBeenCalledTimes(2);
    expect(currentScrollY).toBe(1600);
    document.dispatchEvent(new Event("scrollend"));
    vi.advanceTimersByTime(180);

    const residualPastEnd = wheel(30);
    stableTarget.dispatchEvent(residualPastEnd);
    expect(residualPastEnd.defaultPrevented).toBe(true);
    expect(scrollTo).toHaveBeenCalledTimes(2);
    expect(currentScrollY).toBe(1600);

    const backToMiddle = wheel(-30);
    stableTarget.dispatchEvent(backToMiddle);
    expect(backToMiddle.defaultPrevented).toBe(true);
    expect(currentScrollY).toBe(800);
    expect(scrollTo.mock.calls.map(([options]) => options.top)).toEqual([800, 1600, 800]);

    unmount();
    root.remove();
  });

  it("does not mistake body scrolling for a nested homepage scroller", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    const { root, sections } = setupStops();
    const previousOverflow = document.body.style.overflowY;
    document.body.style.overflowY = "auto";
    Object.defineProperties(document.body, {
      scrollHeight: { configurable: true, value: 2400 },
      clientHeight: { configurable: true, value: 800 },
      scrollTop: { configurable: true, writable: true, value: 0 },
    });
    const pointerTarget = document.createElement("button");
    sections[0].append(pointerTarget);
    const { unmount } = render(<HomepageWheelSnapController />);

    const wheel = new WheelEvent("wheel", { deltaY: 32, deltaMode: WheelEvent.DOM_DELTA_PIXEL, cancelable: true, bubbles: true });
    pointerTarget.dispatchEvent(wheel);
    expect(wheel.defaultPrevented).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({ top: 800, behavior: "smooth" });

    unmount();
    root.remove();
    document.body.style.overflowY = previousOverflow;
  });

  it("leaves nested scrolling and reduced-motion wheel gestures native", () => {
    const { root } = setupStops();
    const nested = document.createElement("div");
    nested.style.overflowY = "auto";
    Object.defineProperties(nested, {
      scrollHeight: { configurable: true, value: 1200 },
      clientHeight: { configurable: true, value: 300 },
      scrollTop: { configurable: true, writable: true, value: 120 },
    });
    root.append(nested);
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    const media = vi.fn(() => ({ matches: false }));
    vi.stubGlobal("matchMedia", media);
    const { unmount } = render(<HomepageWheelSnapController />);

    const nestedWheel = new WheelEvent("wheel", { deltaY: 3, deltaMode: WheelEvent.DOM_DELTA_LINE, cancelable: true, bubbles: true });
    nested.dispatchEvent(nestedWheel);
    expect(nestedWheel.defaultPrevented).toBe(false);
    expect(scrollTo).not.toHaveBeenCalled();

    nested.scrollTop = 900;
    const nestedAtBoundary = new WheelEvent("wheel", { deltaY: 3, deltaMode: WheelEvent.DOM_DELTA_LINE, cancelable: true, bubbles: true });
    nested.dispatchEvent(nestedAtBoundary);
    expect(nestedAtBoundary.defaultPrevented).toBe(true);
    expect(scrollTo).toHaveBeenCalledTimes(1);

    media.mockReturnValue({ matches: true });
    const reducedMotionWheel = new WheelEvent("wheel", { deltaY: 3, deltaMode: WheelEvent.DOM_DELTA_LINE, cancelable: true });
    window.dispatchEvent(reducedMotionWheel);
    expect(reducedMotionWheel.defaultPrevented).toBe(false);
    expect(scrollTo).toHaveBeenCalledTimes(1);

    unmount();
    root.remove();
  });
});
