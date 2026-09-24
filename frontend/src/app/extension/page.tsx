"use client";

import { CodeAppariement } from "@/components/extension/CodeAppariement";
import { EnteteVitrine } from "@/components/navigation/EnteteVitrine";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export default function PageExtension() {
  const { langue } = useLanguage();
  const anglais = langue === "en";
  return (
    <main className="skuup-vitrine min-h-screen">
      <EnteteVitrine actionHref="/streams" actionLabel="Voir les streams" />
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1fr_30rem]">
        <div className="max-w-xl">
          <p className="skuup-kicker">{anglais ? "Your Skkup extension" : "Ton extension Skkup"}</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-6xl">
            {anglais ? "Watch anywhere," : "Regarde où tu veux,"}
            <br />
            <span className="skuup-gradient-text">{anglais ? "stay in control." : "garde le contrôle."}</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-white/65">
            {anglais ? "Link your browser to your Skkup account to track your viewing in a simple, transparent and secure experience." : "Relie ton navigateur à ton compte Skkup pour retrouver ton suivi de visionnage dans une expérience simple, transparente et sécurisée."}
          </p>
          <div className="mt-8 grid gap-3 text-sm text-white/75 sm:grid-cols-2">
            <span><SkkupIcon name="timer" size={15} /> {anglais ? "Code valid for 5 minutes" : "Code valable 5 minutes"}</span>
            <span><SkkupIcon name="singleUse" size={15} /> {anglais ? "Single use" : "Une utilisation unique"}</span>
            <span><SkkupIcon name="devices" size={15} /> {anglais ? "Up to 5 devices" : "Jusqu'à 5 appareils"}</span>
            <span><SkkupIcon name="shield" size={15} /> {anglais ? "Protected data" : "Données protégées"}</span>
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <CodeAppariement />
          <section className="skuup-card text-sm text-white/65">
            <h2 className="mb-3 text-base font-bold text-white">{anglais ? "How does it work?" : "Comment ça marche ?"}</h2>
            <ol className="list-inside list-decimal space-y-2">
              <li>{anglais ? "Install the Skkup extension in your browser." : "Installe l'extension Skkup sur ton navigateur."}</li>
              <li>{anglais ? "Generate a code and enter it in the extension." : "Génère un code et recopie-le dans l'extension."}</li>
              <li>{anglais ? "Your browser is paired without exposing your password." : "Ton navigateur est associé, sans exposer ton mot de passe."}</li>
            </ol>
          </section>
        </div>
      </section>
    </main>
  );
}
