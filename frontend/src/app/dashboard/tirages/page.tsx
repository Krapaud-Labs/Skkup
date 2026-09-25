import type { Metadata } from "next";
import { ListeTirages } from "@/components/raffles/ListeTirages";
import { LocalizedPageIntro } from "@/components/i18n/LocalizedPageIntro";

export const metadata: Metadata = { title: "Tirages | Dashboard | Skkup" };

export default function DashboardTiragesPage() {
  return (
    <div className="skuup-dashboard-page">
      <header className="skuup-dashboard-page-header">
        <LocalizedPageIntro page="dashboardRaffles" />
      </header>
      <ListeTirages />
    </div>
  );
}
