import type { Metadata } from "next";
import { ListeStreams } from "@/components/streams/ListeStreams";
import { EnteteVitrine } from "@/components/navigation/EnteteVitrine";

export const metadata: Metadata = {
  title: "Streams | Skkup",
  description:
    "Regarde les streams disponibles depuis le site et retrouve ton activité au même endroit.",
};

export default function PageStreams() {
  return (
    <main className="skuup-vitrine min-h-screen w-full">
      <EnteteVitrine actionHref="/inscription" actionLabel="S'inscrire" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-12 pt-8">
      <header>
        <h1 className="text-4xl font-extrabold text-foreground">Streams</h1>
        <p className="mt-2 text-foreground-muted">
          Lance un direct ici et tes points se cumulent automatiquement pendant
          la lecture.
        </p>
      </header>

      <ListeStreams />
      </div>
    </main>
  );
}
