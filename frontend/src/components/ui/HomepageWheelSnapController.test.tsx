import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { HomepageWheelSnapController } from "./HomepageWheelSnapController";

describe("HomepageWheelSnapController", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
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

    let scrollY = 0;
    const rectOverrides = new Map<number, DOMRect>();
    sections.forEach((section, index) => {
      vi.spyOn(section, "getBoundingClientRect").mockImplementation(() => {
        const override = rectOverrides.get(index);
        if (override) return override;
        const top = index * 800 - scrollY;
        return { top, bottom: top + 800 } as DOMRect;
      });
    });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    Object.defineProperty(window, "scrollY", { configurable: true, get: () => scrollY });

    return {
      root,
      sections,
      setScrollY: (value: number) => { scrollY = value; },
      setSectionRect: (index: number, top: number, bottom: number) => {
        rectOverrides.set(index, { top, bottom } as DOMRect);
      },
    };
  };

  const wheel = (deltaY: number, options: WheelEventInit = {}) => new WheelEvent("wheel", {
    deltaY,
    deltaMode: WheelEvent.DOM_DELTA_PIXEL,
    cancelable: true,
    bubbles: true,
    ...options,
  });

  it("lets repeated wheel gestures use native scroll-snap without a JS lock or timer", () => {
    vi.useFakeTimers();
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    const { root, setScrollY, setSectionRect } = setupStops();
    const { unmount } = render(<HomepageWheelSnapController />);

    setSectionRect(2, -100, 900);
    for (const nextScrollY of [0, 800, 1600]) {
      setScrollY(nextScrollY);
      const event = wheel(24);
      window.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }

    expect(scrollTo).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    unmount();
    root.remove();
  });

  it("keeps pixel, line, and page wheel units native during section transitions", () => {
    const { root } = setupStops();
    const { unmount } = render(<HomepageWheelSnapController />);

    for (const deltaMode of [WheelEvent.DOM_DELTA_PIXEL, WheelEvent.DOM_DELTA_LINE, WheelEvent.DOM_DELTA_PAGE]) {
      const event = wheel(12, { deltaMode });
      window.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }

    unmount();
    root.remove();
  });

  it("blocks only downward wheel input at the real bottom of the final section", () => {
    const { root, setScrollY } = setupStops();
    setScrollY(1600);
    const { unmount } = render(<HomepageWheelSnapController />);

    const atEnd = wheel(16);
    window.dispatchEvent(atEnd);
    expect(atEnd.defaultPrevented).toBe(true);

    unmount();
    root.remove();
  });

  it("does not block downward wheel input while the final section still has scrollable content", () => {
    const { root, setScrollY, setSectionRect } = setupStops();
    setScrollY(1600);
    setSectionRect(2, -100, 900);
    const { unmount } = render(<HomepageWheelSnapController />);

    const beforeEnd = wheel(16);
    window.dispatchEvent(beforeEnd);
    expect(beforeEnd.defaultPrevented).toBe(false);

    unmount();
    root.remove();
  });

  it("keeps upward and modified wheel gestures native at the page end", () => {
    const { root, setScrollY } = setupStops();
    setScrollY(1600);
    const { unmount } = render(<HomepageWheelSnapController />);

    const upward = wheel(-16);
    window.dispatchEvent(upward);
    const zoom = wheel(16, { ctrlKey: true });
    window.dispatchEvent(zoom);
    const horizontalIntent = wheel(16, { shiftKey: true });
    window.dispatchEvent(horizontalIntent);

    expect(upward.defaultPrevented).toBe(false);
    expect(zoom.defaultPrevented).toBe(false);
    expect(horizontalIntent.defaultPrevented).toBe(false);

    unmount();
    root.remove();
  });

  it("keeps nested scroller wheel events native both while they can scroll and at their edge", () => {
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

    const whileScrollable = wheel(12);
    nested.dispatchEvent(whileScrollable);
    expect(whileScrollable.defaultPrevented).toBe(false);

    nested.scrollTop = 900;
    const atNestedEdge = wheel(12);
    nested.dispatchEvent(atNestedEdge);
    expect(atNestedEdge.defaultPrevented).toBe(false);

    unmount();
    root.remove();
  });

  it("uses native wheel input with reduced motion and disables smooth scrolling in CSS", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    const { root } = setupStops();
    const { unmount } = render(<HomepageWheelSnapController />);

    const event = wheel(20);
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);

    const css = readFileSync("src/app/globals.css", "utf8");
    expect(css).toMatch(/html:has\(main\.skuup-homepage\)\s*\{[^}]*scroll-behavior:\s*smooth/);
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?html:has\(main\.skuup-homepage\)\s*\{\s*scroll-behavior:\s*auto/);

    unmount();
    root.remove();
  });
});
