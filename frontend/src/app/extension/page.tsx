import type { Metadata } from "next";
import { CodeAppariement } from "@/components/extension/CodeAppariement";

export const metadata: Metadata = {
  title: "Extension navigateur | Skuup",
  description:
    "Associe l'extension Skuup à ton compte pour que ton temps de visionnage sur Twitch, YouTube et Facebook Live soit comptabilisé.",
};

export default function PageExtension() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 p-6">
      <header>
        <h1 className="text-4xl font-extrabold text-foreground">
          Extension navigateur
        </h1>
        <p className="mt-2 text-foreground-muted">
          L&apos;extension mesure ton temps de visionnage directement sur
          Twitch, YouTube et Facebook Live, sans passer par le lecteur du site.
        </p>
      </header>

      <CodeAppariement />

      <section className="text-sm text-foreground-muted">
        <h2 className="mb-2 text-base font-bold text-foreground">
          Comment ça marche
        </h2>
        <ol className="list-inside list-decimal space-y-1">
          <li>Installe l&apos;extension Skuup sur ton navigateur.</li>
          <li>Génère un code ci-dessus et recopie-le dans l&apos;extension.</li>
          <li>
            Regarde un direct d&apos;une chaîne partenaire : ton temps est
            compté tant que l&apos;onglet reste au premier plan.
          </li>
        </ol>
      </section>
    </main>
  );
}
