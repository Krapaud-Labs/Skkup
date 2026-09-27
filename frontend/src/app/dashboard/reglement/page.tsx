import type { Metadata } from "next";
import { LocalizedPageIntro } from "@/components/i18n/LocalizedPageIntro";
import { LocalizedRulesCard } from "@/components/i18n/LocalizedRulesCard";
import { LocalizedReglementDocument } from "@/components/legal/LocalizedReglementDocument";

export const metadata: Metadata = {
  title: "Règlement du jeu | Dashboard | Skkup",
  description: "Consulte le projet de règlement des tirages Skkup.",
};

export default function ReglementPage() {
  return (
    <div className="skuup-dashboard-page">
      <header className="skuup-dashboard-page-header">
        <LocalizedPageIntro page="rules" />
      </header>
      <LocalizedRulesCard>
        <LocalizedReglementDocument />
      </LocalizedRulesCard>
    </div>
  );
}
