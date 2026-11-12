"use client";

import { useEffect } from "react";

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

    const onWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.shiftKey || event.deltaY <= 0) return;
      if (canNestedScrollerMove(event.target, event.deltaY, root)) return;

      const sections = Array.from(root.querySelectorAll<HTMLElement>(".skuup-home-snap-section"));
      if (sections.length < 2) return;

      const viewportCenter = window.innerHeight / 2;
      const currentIndex = sections.findIndex((section) => {
        const bounds = section.getBoundingClientRect();
        return bounds.top <= viewportCenter && bounds.bottom > viewportCenter;
      });
      if (currentIndex !== sections.length - 1) return;

      const lastSection = sections[currentIndex];
      if (lastSection.getBoundingClientRect().bottom <= window.innerHeight + 2) {
        // Let native wheel and CSS scroll-snap handle all section transitions.
        // Only stop residual downward wheel input at the real end of the page.
        event.preventDefault();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
    };
  }, []);

  return null;
}
