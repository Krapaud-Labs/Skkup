"use client";

import { traductions, useLanguage } from "./LanguageProvider";
import { SkkupIcon, type SkkupIconName } from "@/components/ui/SkkupIcon";

type ClePage = "raffles" | "dashboardRaffles" | "rules" | "streams";

const pageIcons: Record<ClePage, SkkupIconName> = {
  raffles: "draws",
  dashboardRaffles: "draws",
  rules: "rules",
  streams: "streams",
};

export function LocalizedPageIntro({ page }: { page: ClePage }) {
  const { langue } = useLanguage();
  const t = traductions[langue].pages[page];
  return (
    <>
      <p className="skuup-kicker">{t.kicker}</p>
      <div className="mt-2 flex items-center gap-3">
        <SkkupIcon name={pageIcons[page]} size={40} />
        <h1 className="text-4xl font-extrabold text-foreground">{t.title}</h1>
      </div>
      <p className="mt-3 max-w-2xl text-foreground-muted">{t.description}</p>
    </>
  );
}
