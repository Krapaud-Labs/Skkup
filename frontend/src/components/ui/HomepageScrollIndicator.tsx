"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export function HomepageScrollIndicator() {
  const { langue } = useLanguage();
  const [hasMoreContent, setHasMoreContent] = useState(true);
  const label = langue === "en" ? "Scroll down to continue" : "Défiler vers le bas pour continuer";

  useEffect(() => {
    const updateVisibility = () => {
      const scrollRoot = document.scrollingElement ?? document.documentElement;
      const viewportHeight = window.innerHeight || scrollRoot.clientHeight;
      const scrollOffset = window.scrollY || scrollRoot.scrollTop;
      const remaining = scrollRoot.scrollHeight - viewportHeight - scrollOffset;

      setHasMoreContent(remaining > 0);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);

    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(updateVisibility);
    resizeObserver?.observe(document.documentElement);
    if (document.body) resizeObserver?.observe(document.body);

    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
      resizeObserver?.disconnect();
    };
  }, []);

  if (!hasMoreContent) return null;

  return (
    <div aria-label={label} className="skuup-home-scroll-indicator" role="img">
      <span aria-hidden="true" className="skuup-home-scroll-indicator-arrow" />
    </div>
  );
}
