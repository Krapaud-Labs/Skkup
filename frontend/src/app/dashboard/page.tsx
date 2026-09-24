"use client";
import Image from "next/image";
import type { Metadata } from "next";
import { TableauDeBord } from "@/components/dashboard/TableauDeBord";
import { traductions, useLanguage } from "@/components/i18n/LanguageProvider";

export const metadata: Metadata = {
  title: "Tableau de bord | Skkup",
  description: "Ton solde de points, ta série de visites, tes cartes à gratter et tes tickets de tirage.",
};

export default function PageDashboard() {
  const { langue } = useLanguage();
  const t = traductions[langue];
  return (
    <div className="skuup-dashboard-page">
      <header className="skuup-dashboard-hero">
        <div>
          <p className="skuup-kicker">{t.viewerSpace}</p>
          <h1 className="mt-2 text-4xl font-extrabold text-white sm:text-5xl">
            {t.viewerTitle}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-white/65">
            {t.viewerDescription}
          </p>
        </div>
        <div className="skuup-dashboard-orb" aria-hidden="true"><Image src="/branding/skkup-s-favicon.png" alt="" width={720} height={720} className="skuup-dashboard-orb-logo" priority /></div>
      </header>
      <TableauDeBord />
    </div>
  );
}
