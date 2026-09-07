import type { Metadata } from "next";
import { ListeStreams } from "@/components/streams/ListeStreams";
import { EnteteVitrine } from "@/components/navigation/EnteteVitrine";

export const metadata: Metadata = {
  title: "Streams | Skkup",
  description:
    "Regarde librement tes streams préférés et laisse l'extension Skkup synchroniser ton visionnage.",
  alternates: { canonical: "/streams" },
};

export default function PageStreams() {
  return (
    <main className="skuup-vitrine min-h-screen w-full">
      <EnteteVitrine actionHref="/inscription" actionLabel="S'inscrire" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-12 pt-8">
      <header>
        <h1 className="text-4xl font-extrabold text-foreground">Streams</h1>
        <p className="mt-2 text-foreground-muted">
          Choisis le direct que tu veux sur Twitch, YouTube ou Facebook Live.
          L&apos;extension Skkup suit ton visionnage depuis l&apos;onglet de ton
          choix.
        </p>
      </header>

      <ListeStreams />
      </div>
    </main>
  );
}
