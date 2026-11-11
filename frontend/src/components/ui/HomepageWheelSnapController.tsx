"use client";

import { useEffect } from "react";

const WHEEL_BURST_IDLE_MS = 180;
const LOCK_FALLBACK_MS = 1600;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function canNestedScrollerMove(target: EventTarget | null, direction: number, root: HTMLElement) {
  if (!(target instanceof Element) || !root.contains(target)) return false;

  let element: Element | null = target;
  while (element && element !== root) {
    const style = window.getComputedStyle(element);
    const scrollable = /(auto|scroll|overlay)/.test(style.overflowY);
    if (scrollable && element.scrollHeight > element.clientHeight) {
      const atTop = element.scrollTop <= 0;
      const atBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 1;
      if ((direction < 0 && !atTop) || (direction > 0 && !atBottom)) return true;
    }
    element = element.parentElement;
  }
  return false;
}

export function HomepageWheelSnapController() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("main.skuup-homepage");
    if (!root) return;

    let locked = false;
    let scrollEnded = false;
    let wheelBurstEnded = true;
    let wheelBurstTimer: number | undefined;
    let fallbackTimer: number | undefined;

    const tryUnlock = () => {
      if (!scrollEnded || !wheelBurstEnded) return;
      locked = false;
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
      fallbackTimer = undefined;
    };

    const markWheelBurstActive = () => {
      wheelBurstEnded = false;
      if (wheelBurstTimer !== undefined) window.clearTimeout(wheelBurstTimer);
      wheelBurstTimer = window.setTimeout(() => {
        wheelBurstTimer = undefined;
        wheelBurstEnded = true;
        tryUnlock();
      }, WHEEL_BURST_IDLE_MS);
    };

    const onScrollEnd = () => {
      scrollEnded = true;
      tryUnlock();
    };

    const onWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.shiftKey || event.deltaY === 0) return;
      if (prefersReducedMotion()) return;
      if (canNestedScrollerMove(event.target, event.deltaY, root)) return;
      if (locked) {
        event.preventDefault();
        markWheelBurstActive();
        return;
      }

      const sections = Array.from(root.querySelectorAll<HTMLElement>(".skuup-home-snap-section"));
      if (sections.length < 2) return;

      const viewportCenter = window.innerHeight / 2;
      const currentIndex = sections.findIndex((section) => {
        const bounds = section.getBoundingClientRect();
        return bounds.top <= viewportCenter && bounds.bottom > viewportCenter;
      });
      if (currentIndex < 0) return;

      const direction = Math.sign(event.deltaY);
      const current = sections[currentIndex];
      const bounds = current.getBoundingClientRect();
      const atBoundary = direction > 0
        ? bounds.bottom <= window.innerHeight + 2
        : bounds.top >= -2;
      if (!atBoundary) return;

      const next = sections[currentIndex + direction];
      if (!next) {
        // At the final stop there is no next snap target. Keep residual wheel
        // momentum from moving the document past the homepage's last section.
        if (direction > 0 && currentIndex === sections.length - 1 && atBoundary) {
          event.preventDefault();
        }
        return;
      }

      event.preventDefault();
      if (wheelBurstTimer !== undefined) window.clearTimeout(wheelBurstTimer);
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
      locked = true;
      scrollEnded = false;
      markWheelBurstActive();
      fallbackTimer = window.setTimeout(() => {
        fallbackTimer = undefined;
        scrollEnded = true;
        tryUnlock();
      }, LOCK_FALLBACK_MS);
      window.scrollTo({ top: window.scrollY + next.getBoundingClientRect().top, behavior: "smooth" });
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("scrollend", onScrollEnd);
    return () => {
      window.removeEventListener("wheel", onWheel);
      document.removeEventListener("scrollend", onScrollEnd);
      if (wheelBurstTimer !== undefined) window.clearTimeout(wheelBurstTimer);
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
    };
  }, []);

  return null;
}
