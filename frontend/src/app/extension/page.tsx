import type { Metadata } from "next";
import { CodeAppariement } from "@/components/extension/CodeAppariement";
import { EnteteVitrine } from "@/components/navigation/EnteteVitrine";
import { LocalizedExtensionIntro } from "@/components/i18n/LocalizedExtensionIntro";
import { LocalizedExtensionSteps } from "@/components/i18n/LocalizedExtensionSteps";

export const metadata: Metadata = {
  title: "Extension Chrome | Skkup",
  description:
    "Associe l'extension Chrome Skkup à ton compte pour que ton temps de visionnage sur Twitch, YouTube et Kick soit comptabilisé.",
  alternates: { canonical: "/extension" },
  openGraph: { url: "/extension" },
};

export default function PageExtension() {
  return (
    <main className="skuup-vitrine min-h-screen">
      <EnteteVitrine actionHref="/streams" actionLabel="Voir les streams" />
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1fr_30rem]">
        <LocalizedExtensionIntro />
        <div className="flex flex-col gap-6">
          <CodeAppariement />
          <LocalizedExtensionSteps />
        </div>
      </section>
    </main>
  );
}
