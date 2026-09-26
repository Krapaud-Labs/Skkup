import type { Metadata } from "next";
import { ListeStreams } from "@/components/streams/ListeStreams";
import { CodeAppariement } from "@/components/extension/CodeAppariement";
import { LocalizedPageIntro } from "@/components/i18n/LocalizedPageIntro";
import { LocalizedDashboardExtension } from "@/components/i18n/LocalizedDashboardExtension";

export const metadata: Metadata = { title: "Streams | Dashboard | Skkup" };

export default function DashboardStreamsPage() {
  return (
    <div className="skuup-dashboard-page">
      <header className="skuup-dashboard-page-header">
        <LocalizedPageIntro page="streams" />
      </header>
      <ListeStreams />
      <section className="skuup-dashboard-narrow-content mt-10" aria-labelledby="extension-title">
        <LocalizedDashboardExtension />
        <CodeAppariement />
      </section>
    </div>
  );
}
