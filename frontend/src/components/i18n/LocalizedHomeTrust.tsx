"use client";

import { SkkupIcon, type SkkupIconName } from "@/components/ui/SkkupIcon";
import { traductions, useLanguage } from "./LanguageProvider";
import { useEffect, useState } from "react";
import { requeteApi } from "@/lib/api";
import { connecterTempsReel, EVENEMENT_UTILISATEURS_INSCRITS, type EvenementUtilisateursInscrits } from "@/lib/temps-reel";

const icons: SkkupIconName[] = ["eye", "points", "trophy", "shield"];
const lotIcons: SkkupIconName[] = ["gift", "draws", "check"];

export function LocalizedHomeTrust() {
  const { langue } = useLanguage();
  const t = traductions[langue].home;
  const [nombreUtilisateurs, setNombreUtilisateurs] = useState<number | null>(null);
  const [chargementStats, setChargementStats] = useState(true);
  const [erreurStats, setErreurStats] = useState(false);
  useEffect(() => {
    let actif = true;
    void requeteApi<{ nombreUtilisateursInscrits: number }>("/public/stats").then((stats) => {
      if (!actif) return;
      setNombreUtilisateurs(stats.nombreUtilisateursInscrits);
      setErreurStats(false);
      setChargementStats(false);
    }).catch(() => {
      if (!actif) return;
      setErreurStats(true);
      setChargementStats(false);
    });
    const socket = connecterTempsReel();
    const mettreAJour = (event: EvenementUtilisateursInscrits) => {
      if (Number.isInteger(event.nombre) && event.nombre >= 0) {
        setNombreUtilisateurs(event.nombre);
        setErreurStats(false);
        setChargementStats(false);
      }
    };
    socket.on(EVENEMENT_UTILISATEURS_INSCRITS, mettreAJour);
    return () => { actif = false; socket.off(EVENEMENT_UTILISATEURS_INSCRITS, mettreAJour); socket.close(); };
  }, []);
  const libelleStats = chargementStats
    ? (langue === "en" ? "Loading" : "Chargement")
    : erreurStats
      ? (langue === "en" ? "Unavailable" : "Indisponible")
      : nombreUtilisateurs;
  return <><section className="skuup-stats mx-auto mt-12 grid max-w-6xl grid-cols-2 gap-px px-6 sm:grid-cols-5">{t.stats.map(([value, label], index) => <div key={label} className="skuup-stat"><span className="skuup-stat-icon"><SkkupIcon name={icons[index]} size={28} preferSvg /></span><strong>{value}</strong><span>{label}</span></div>)}<div className="skuup-stat" aria-live="polite"><span className="skuup-stat-icon"><SkkupIcon name="users" size={28} preferSvg /></span><strong>{libelleStats}</strong><span>{langue === "en" ? "registered members" : "membres inscrits"}</span></div></section><section id="lots" className="mx-auto max-w-6xl px-6 pb-16 pt-16 text-center"><p className="skuup-kicker">{t.lotsKicker}</p><h2 className="skuup-section-title">{t.lotsTitle}</h2><div className="mt-10 grid gap-5 md:grid-cols-3">{t.lots.map(([title, description, badge], index) => <article key={title} className="skuup-lot"><div className="skuup-lot-visual"><SkkupIcon name={lotIcons[index]} size={42} preferSvg /></div><h3>{title}</h3><p>{description}</p><span className="skuup-badge"><SkkupIcon name="spark" size={12} preferSvg /> {badge}</span></article>)}</div></section></>;
}
