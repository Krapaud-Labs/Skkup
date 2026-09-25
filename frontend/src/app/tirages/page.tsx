import type { Metadata } from "next";
import { ListeTirages } from "@/components/raffles/ListeTirages";
import { EnteteVitrine } from "@/components/navigation/EnteteVitrine";
import { LocalizedPageIntro } from "@/components/i18n/LocalizedPageIntro";

export const metadata: Metadata = {
  title: "Tirages | Skkup",
  description: "Découvre les tirages en cours, les lots et les résultats publiés.",
  alternates: { canonical: "/tirages" },
};

export default function PageTirages() {
  return (
    <main className="skuup-vitrine min-h-screen w-full">
      <EnteteVitrine actionHref="/inscription" actionLabel="S'inscrire" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-12 pt-8">
      <header>
        <LocalizedPageIntro page="raffles" />
      </header>
      <ListeTirages />
      </div>
    </main>
  );
}
