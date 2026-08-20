import type { Metadata } from "next";
import { ListeStreams } from "@/components/streams/ListeStreams";

export const metadata: Metadata = {
  title: "Streams | Skuup",
  description:
    "Regarde les streams de nos chaînes partenaires depuis le site et cumule des points.",
};

export default function PageStreams() {
  return (
    <main className="skuup-vitrine min-h-screen w-full">
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
