import type { Metadata } from "next";
import { ListeStreams } from "@/components/streams/ListeStreams";
import { EnteteVitrine } from "@/components/navigation/EnteteVitrine";
import { LocalizedPageIntro } from "@/components/i18n/LocalizedPageIntro";
import { publicMetadata } from "../public-metadata";

export const metadata: Metadata = publicMetadata({
  path: "/streams",
  title: "Streams | Skkup",
  description:
    "Regarde librement tes streams préférés et laisse l'extension Skkup synchroniser ton visionnage.",
});

export default function PageStreams() {
  return (
    <main className="skuup-vitrine min-h-screen w-full">
      <EnteteVitrine actionHref="/inscription" actionLabel="S'inscrire" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-12 pt-8">
      <header><LocalizedPageIntro page="streams" /></header>

      <ListeStreams />
      </div>
    </main>
  );
}
