import type { Metadata } from "next";
import { ListeStreams } from "@/components/streams/ListeStreams";
import { LocalizedPageIntro } from "@/components/i18n/LocalizedPageIntro";

export const metadata: Metadata = { title: "Streams | Dashboard | Skkup" };

export default function DashboardStreamsPage() {
  return (
    <div className="skuup-dashboard-page">
      <header className="skuup-dashboard-page-header">
        <LocalizedPageIntro page="streams" />
      </header>
      <ListeStreams />
    </div>
  );
}
