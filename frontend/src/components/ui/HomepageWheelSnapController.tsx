"use client";

import { useEffect } from "react";

const TRANSITION_MS = 760;

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

function sectionIndexAtScroll(sections: HTMLElement[], scrollY: number) {
  const viewportCenter = scrollY + window.innerHeight / 2;
  const index = sections.findIndex((section) => {
    const bounds = section.getBoundingClientRect();
    const top = bounds.top + window.scrollY;
    return top <= viewportCenter && top + section.offsetHeight > viewportCenter;
  });
  return index < 0 ? 0 : index;
}

export function HomepageWheelSnapController() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("main.skuup-homepage");
    if (!root) return;

    const sections = Array.from(root.querySelectorAll<HTMLElement>(".skuup-home-snap-section"));
    if (sections.length < 2 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let animationStart: number | null = null;
    let startY = 0;
    let targetY = 0;
    let targetIndex = 0;
    let direction = 0;

    const sectionTop = (section: HTMLElement) => section.getBoundingClientRect().top + window.scrollY;
    const setScroll = (top: number) => window.scrollTo({ top, behavior: "instant" });
    const cleanupAnimation = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      document.documentElement.classList.remove("skuup-homepage-wheel-animating");
    };

    const animate = (time: number) => {
      if (animationStart === null) animationStart = time;
      const progress = Math.min(1, (time - animationStart) / TRANSITION_MS);
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      setScroll(startY + (targetY - startY) * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
        return;
      }
      setScroll(targetY);
      cleanupAnimation();
      animationStart = null;
      direction = 0;
    };

    const beginTransition = (index: number, nextDirection: number) => {
      const boundedIndex = Math.max(0, Math.min(sections.length - 1, index));
      if (boundedIndex === targetIndex && frame) return;
      if (frame) {
        const bounds = sections[targetIndex].getBoundingClientRect();
        const reachedTarget = nextDirection > 0 ? bounds.top <= 0 : bounds.top >= 0;
        if (nextDirection === direction && !reachedTarget) return;
        cleanupAnimation();
      }
      targetIndex = boundedIndex;
      direction = nextDirection;
      startY = window.scrollY;
      targetY = sectionTop(sections[targetIndex]);
      animationStart = null;
      document.documentElement.classList.add("skuup-homepage-wheel-animating");
      frame = requestAnimationFrame(animate);
    };

    const onWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.shiftKey || event.deltaY === 0) return;
      const nextDirection = Math.sign(event.deltaY);
      if (canNestedScrollerMove(event.target, nextDirection, root)) return;

      const currentIndex = frame ? targetIndex : sectionIndexAtScroll(sections, window.scrollY);
      const currentSection = sections[currentIndex];
      const top = sectionTop(currentSection);
      const bottom = top + currentSection.offsetHeight;
      const viewportBottom = window.scrollY + window.innerHeight;
      const tallSection = currentSection.offsetHeight > window.innerHeight + 2;
      const canScrollWithinSection = tallSection && (nextDirection > 0
        ? viewportBottom < bottom - 2
        : window.scrollY > top + 2);
      if (canScrollWithinSection) return;

      const intendedIndex = frame ? targetIndex : currentIndex;
      const nextIndex = intendedIndex + nextDirection;
      if (nextIndex < 0 || nextIndex >= sections.length) {
        const lastBottom = sectionTop(sections[sections.length - 1]) + sections[sections.length - 1].offsetHeight;
        if (nextDirection > 0 && viewportBottom >= lastBottom - 2) event.preventDefault();
        return;
      }

      event.preventDefault();
      if (frame && nextDirection === direction) {
        // A wheel burst belongs to the current section transition; it must not
        // queue automatic movement through more sections.
        return;
      }
      beginTransition(nextIndex, nextDirection);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      cleanupAnimation();
    };
  }, []);

  return null;
}
