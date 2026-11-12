import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { HomepageWheelSnapController } from "./HomepageWheelSnapController";

describe("HomepageWheelSnapController", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.documentElement.classList.remove("skuup-homepage-wheel-animating");
    document.querySelectorAll("main.skuup-homepage").forEach((root) => root.remove());
  });

  const setupStops = () => {
    const root = document.createElement("main");
    root.className = "skuup-homepage";
    const sections = [0, 1, 2].map(() => {
      const section = document.createElement("section");
      section.className = "skuup-home-snap-section";
      Object.defineProperty(section, "offsetHeight", { configurable: true, value: 800 });
      root.append(section);
      return section;
    });
    document.body.append(root);

    let scrollY = 0;
    sections.forEach((section, index) => {
      vi.spyOn(section, "getBoundingClientRect").mockImplementation(() => {
        const top = index * 800 - scrollY;
        return { top, bottom: top + section.offsetHeight } as DOMRect;
      });
    });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    Object.defineProperty(window, "scrollY", { configurable: true, get: () => scrollY });
    const scrollTo = vi.fn((options: ScrollToOptions | number, y?: number) => {
      scrollY = typeof options === "number" ? (y ?? 0) : options.top ?? scrollY;
    });
    vi.stubGlobal("scrollTo", scrollTo);

    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    return {
      root,
      sections,
      scrollTo,
      frames,
      getScrollY: () => scrollY,
      setScrollY: (value: number) => { scrollY = value; },
      flushFrame: (time: number) => {
        const next = frames.shift();
        if (next) act(() => next(time));
      },
    };
  };

  const wheel = (target: EventTarget, deltaY: number, options: WheelEventInit = {}, timeStamp = 0) => {
    const event = new WheelEvent("wheel", {
      deltaY,
      deltaMode: WheelEvent.DOM_DELTA_PIXEL,
      cancelable: true,
      bubbles: true,
      ...options,
    });
    Object.defineProperty(event, "timeStamp", { configurable: true, value: timeStamp });
    target.dispatchEvent(event);
    return event;
  };

  it("eases to the next section over multiple frames and accepts a direction reversal immediately", () => {
    const { root, scrollTo, frames, getScrollY, flushFrame } = setupStops();
    const { unmount } = render(<HomepageWheelSnapController />);

    const down = wheel(window, 500, {}, 0);
    expect(down.defaultPrevented).toBe(true);
    expect(frames).toHaveLength(1);
    flushFrame(0);
    flushFrame(180);
    const partialProgress = getScrollY();
    expect(partialProgress).toBeGreaterThan(0);
    expect(partialProgress).toBeLessThan(800);

    const up = wheel(window, -120, {}, 200);
    expect(up.defaultPrevented).toBe(true);
    flushFrame(200);
    flushFrame(980);

    expect(getScrollY()).toBe(0);
    expect(scrollTo.mock.calls.length).toBeGreaterThan(2);
    expect(document.documentElement.classList.contains("skuup-homepage-wheel-animating")).toBe(false);
    unmount();
    root.remove();
  });

  it("does not create cooldown timers and uses a CSS override only while animating", () => {
    vi.useFakeTimers();
    const { root, flushFrame } = setupStops();
    const { unmount } = render(<HomepageWheelSnapController />);

    wheel(window, 500);
    expect(document.documentElement.classList.contains("skuup-homepage-wheel-animating")).toBe(true);
    flushFrame(0);
    flushFrame(760);
    expect(vi.getTimerCount()).toBe(0);

    const css = readFileSync("src/app/globals.css", "utf8");
    expect(css).toMatch(/html\.skuup-homepage-wheel-animating\s*\{[^}]*scroll-snap-type:\s*none[^}]*scroll-behavior:\s*auto/);
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?html:has\(main\.skuup-homepage\)\s*\{\s*scroll-behavior:\s*auto/);
    unmount();
    root.remove();
  });

  it("keeps nested scrollers native while they can scroll and uses native scrolling inside tall sections", () => {
    const { root, sections, frames } = setupStops();
    const tall = sections[0];
    Object.defineProperty(tall, "offsetHeight", { configurable: true, value: 1200 });
    const nested = document.createElement("div");
    nested.style.overflowY = "auto";
    Object.defineProperties(nested, {
      scrollHeight: { configurable: true, value: 1200 },
      clientHeight: { configurable: true, value: 300 },
      scrollTop: { configurable: true, writable: true, value: 120 },
    });
    root.append(nested);
    const { unmount } = render(<HomepageWheelSnapController />);

    expect(wheel(nested, 120).defaultPrevented).toBe(false);
    nested.scrollTop = 900;
    expect(wheel(nested, 120).defaultPrevented).toBe(false);
    expect(wheel(window, 120).defaultPrevented).toBe(false);
    expect(frames).toHaveLength(0);

    unmount();
    root.remove();
  });

  it("limits a wheel burst to one section and does not start another transition automatically", () => {
    const { root, frames, getScrollY, flushFrame } = setupStops();
    const { unmount } = render(<HomepageWheelSnapController />);

    expect(wheel(window, 500).defaultPrevented).toBe(true);
    expect(wheel(window, 500).defaultPrevented).toBe(true);
    expect(wheel(window, 500).defaultPrevented).toBe(true);
    flushFrame(0);
    flushFrame(760);
    expect(getScrollY()).toBe(800);
    expect(frames).toHaveLength(0);
    unmount();
    root.remove();
  });

  it("blocks the continuous wheel tail after RAF but accepts a distinct strong impulse immediately", () => {
    const { root, frames, getScrollY, flushFrame } = setupStops();
    const { unmount } = render(<HomepageWheelSnapController />);

    expect(wheel(window, 40, {}, 0).defaultPrevented).toBe(true);
    flushFrame(0);
    expect(wheel(window, 40, {}, 700).defaultPrevented).toBe(true);
    expect(frames).toHaveLength(1);
    flushFrame(760);
    expect(getScrollY()).toBe(800);

    expect(wheel(window, 40, {}, 800).defaultPrevented).toBe(true);
    expect(frames).toHaveLength(0);
    expect(getScrollY()).toBe(800);

    expect(wheel(window, 120, {}, 900).defaultPrevented).toBe(true);
    expect(frames).toHaveLength(1);
    flushFrame(900);
    flushFrame(1660);
    expect(getScrollY()).toBe(1600);

    unmount();
    root.remove();
  });

  it("accepts a same-direction deliberate gesture after wheel input has gone quiet", () => {
    const { root, frames, getScrollY, flushFrame } = setupStops();
    const { unmount } = render(<HomepageWheelSnapController />);

    expect(wheel(window, 40, {}, 0).defaultPrevented).toBe(true);
    flushFrame(0);
    expect(wheel(window, 40, {}, 700).defaultPrevented).toBe(true);
    flushFrame(760);
    expect(getScrollY()).toBe(800);

    expect(wheel(window, 40, {}, 800).defaultPrevented).toBe(true);
    expect(frames).toHaveLength(0);
    expect(wheel(window, 40, {}, 1000).defaultPrevented).toBe(true);
    expect(frames).toHaveLength(1);
    flushFrame(1000);
    flushFrame(1760);
    expect(getScrollY()).toBe(1600);

    unmount();
    root.remove();
  });

  it("normalizes line-based wheel deltas before detecting a distinct impulse", () => {
    const { root, frames, getScrollY, flushFrame } = setupStops();
    const { unmount } = render(<HomepageWheelSnapController />);

    expect(wheel(window, 1, { deltaMode: WheelEvent.DOM_DELTA_LINE }, 0).defaultPrevented).toBe(true);
    flushFrame(0);
    expect(wheel(window, 1, { deltaMode: WheelEvent.DOM_DELTA_LINE }, 700).defaultPrevented).toBe(true);
    flushFrame(760);
    expect(getScrollY()).toBe(800);

    expect(wheel(window, 1, { deltaMode: WheelEvent.DOM_DELTA_LINE }, 800).defaultPrevented).toBe(true);
    expect(frames).toHaveLength(0);
    expect(wheel(window, 3, { deltaMode: WheelEvent.DOM_DELTA_LINE }, 820).defaultPrevented).toBe(true);
    expect(frames).toHaveLength(1);
    flushFrame(820);
    flushFrame(1580);
    expect(getScrollY()).toBe(1600);

    unmount();
    root.remove();
  });

  it("prevents scrolling past the final section and leaves modified or reduced-motion input native", () => {
    const { root, sections, frames, setScrollY } = setupStops();
    const { unmount } = render(<HomepageWheelSnapController />);
    expect(wheel(window, 120, { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(wheel(window, 120, { shiftKey: true }).defaultPrevented).toBe(false);
    setScrollY(1600);
    sections[2].getBoundingClientRect = () => ({ top: 0, bottom: 800 } as DOMRect);
    expect(wheel(window, 120).defaultPrevented).toBe(true);
    expect(frames).toHaveLength(0);
    unmount();
    root.remove();

    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    const reduced = setupStops();
    const reducedRender = render(<HomepageWheelSnapController />);
    expect(wheel(window, 120).defaultPrevented).toBe(false);
    expect(reduced.frames).toHaveLength(0);
    reducedRender.unmount();
    reduced.root.remove();
  });
});
