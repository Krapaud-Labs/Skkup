"use client";

import { useEffect } from "react";

const WHEEL_IDLE_MS = 180;
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
    let unlockTimer: number | undefined;
    let fallbackTimer: number | undefined;

    const tryUnlock = () => {
      if (!scrollEnded || unlockTimer !== undefined) return;
      locked = false;
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
      fallbackTimer = undefined;
    };

    const waitForWheelIdle = () => {
      if (unlockTimer !== undefined) window.clearTimeout(unlockTimer);
      unlockTimer = window.setTimeout(() => {
        unlockTimer = undefined;
        tryUnlock();
      }, WHEEL_IDLE_MS);
    };

    const onScrollEnd = () => {
      scrollEnded = true;
      waitForWheelIdle();
    };

    const onWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.shiftKey || event.deltaY === 0) return;
      if (prefersReducedMotion()) return;
      if (canNestedScrollerMove(event.target, event.deltaY, root)) return;
      if (locked) {
        event.preventDefault();
        waitForWheelIdle();
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
      if (!next) return;

      event.preventDefault();
      if (unlockTimer !== undefined) window.clearTimeout(unlockTimer);
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
      locked = true;
      scrollEnded = false;
      waitForWheelIdle();
      fallbackTimer = window.setTimeout(() => {
        fallbackTimer = undefined;
        scrollEnded = true;
        waitForWheelIdle();
      }, LOCK_FALLBACK_MS);
      window.scrollTo({ top: window.scrollY + next.getBoundingClientRect().top, behavior: "smooth" });
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("scrollend", onScrollEnd);
    return () => {
      window.removeEventListener("wheel", onWheel);
      document.removeEventListener("scrollend", onScrollEnd);
      if (unlockTimer !== undefined) window.clearTimeout(unlockTimer);
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
    };
  }, []);

  return null;
}
