"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";

export function HomepageScrollIndicator() {
  const { langue } = useLanguage();
  const label = langue === "en" ? "Scroll down to continue" : "Défiler vers le bas pour continuer";

  return (
    <div aria-label={label} className="skuup-home-scroll-indicator" role="img">
      <span aria-hidden="true" className="skuup-home-scroll-indicator-arrow" />
    </div>
  );
}
