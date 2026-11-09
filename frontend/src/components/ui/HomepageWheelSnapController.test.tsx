import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { HomepageWheelSnapController } from "./HomepageWheelSnapController";

describe("HomepageWheelSnapController", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
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

  it("routes the fallback through the wheel-idle period", () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    const { root } = setupStops();
    const { unmount } = render(<HomepageWheelSnapController />);
    const wheel = () => new WheelEvent("wheel", { deltaY: 20, deltaMode: WheelEvent.DOM_DELTA_PAGE, cancelable: true });

    window.dispatchEvent(wheel());
    vi.advanceTimersByTime(1600);
    const residualAfterFallback = wheel();
    window.dispatchEvent(residualAfterFallback);
    expect(residualAfterFallback.defaultPrevented).toBe(true);
    expect(scrollTo).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(179);
    const residualDuringCooldown = wheel();
    window.dispatchEvent(residualDuringCooldown);
    expect(residualDuringCooldown.defaultPrevented).toBe(true);
    expect(scrollTo).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(180);
    window.dispatchEvent(wheel());
    expect(scrollTo).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(200);
    const momentum = wheel();
    window.dispatchEvent(momentum);
    expect(momentum.defaultPrevented).toBe(true);
    expect(scrollTo).toHaveBeenCalledTimes(2);

    unmount();
    root.remove();
  });

  it("waits for document scrollend and 180 ms without wheel before unlocking", () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    const { root, sections } = setupStops();
    const { unmount } = render(<HomepageWheelSnapController />);
    const pointerTarget = document.createElement("div");
    pointerTarget.textContent = "Visible section content";
    sections[0].append(pointerTarget);
    const wheel = () => new WheelEvent("wheel", { deltaY: 24, deltaMode: WheelEvent.DOM_DELTA_PIXEL, cancelable: true, bubbles: true });

    pointerTarget.dispatchEvent(wheel());
    document.dispatchEvent(new Event("scrollend"));
    vi.advanceTimersByTime(179);
    const inertia = wheel();
    pointerTarget.dispatchEvent(inertia);
    expect(inertia.defaultPrevented).toBe(true);
    expect(scrollTo).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(180);
    pointerTarget.dispatchEvent(wheel());
    expect(scrollTo).toHaveBeenCalledTimes(2);

    unmount();
    root.remove();
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
