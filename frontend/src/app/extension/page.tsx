import type { Metadata } from "next";
import { CodeAppariement } from "@/components/extension/CodeAppariement";
import { EnteteVitrine } from "@/components/navigation/EnteteVitrine";

export const metadata: Metadata = {
  title: "Extension navigateur | Skkup",
  description:
    "Associe l'extension Skkup à ton compte pour que ton temps de visionnage sur Twitch, YouTube et Facebook Live soit comptabilisé.",
  alternates: { canonical: "/extension" },
};

export default function PageExtension() {
  return (
    <main className="skuup-vitrine min-h-screen">
      <EnteteVitrine actionHref="/streams" actionLabel="Voir les streams" />
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1fr_30rem]">
        <div className="max-w-xl">
          <p className="skuup-kicker">Ton extension Skkup</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-6xl">
            Regarde où tu veux,
            <br />
            <span className="skuup-gradient-text">garde le contrôle.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-white/65">
            Relie ton navigateur à ton compte Skkup pour retrouver ton suivi
            de visionnage dans une expérience simple, transparente et sécurisée.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-white/75 sm:grid-cols-2">
            <span>✦ Code valable 5 minutes</span>
            <span>✦ Une utilisation unique</span>
            <span>✦ Jusqu&apos;à 5 appareils</span>
            <span>✦ Données protégées</span>
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <CodeAppariement />
          <section className="rounded-2xl border border-fuchsia-400/25 bg-violet-950/40 p-5 text-sm text-white/65">
            <h2 className="mb-3 text-base font-bold text-white">Comment ça marche ?</h2>
            <ol className="list-inside list-decimal space-y-2">
              <li>Installe l&apos;extension Skkup sur ton navigateur.</li>
              <li>Génère un code et recopie-le dans l&apos;extension.</li>
              <li>Ton navigateur est associé, sans exposer ton mot de passe.</li>
            </ol>
          </section>
        </div>
      </section>
    </main>
  );
}
