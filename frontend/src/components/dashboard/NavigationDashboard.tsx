"use client";

import Link from "next/link";
import type { Profil } from "@/lib/dashboard";

interface NavigationDashboardProps {
  profil: Profil;
}

const actions = [
  {
    href: "/streams",
    icon: "▶",
    label: "Regarder des streams",
    description: "Choisis le direct que tu veux regarder.",
  },
  {
    href: "/tirages",
    icon: "✦",
    label: "Voir les tirages",
    description: "Découvre les lots et les résultats publiés.",
  },
  {
    href: "/extension",
    icon: "⌁",
    label: "Gérer l’extension",
    description: "Associe ton navigateur pour suivre ton visionnage.",
  },
] as const;

/** Regroupe les parcours authentifiés dans le tableau de bord. */
export function NavigationDashboard({ profil }: NavigationDashboardProps) {
  const liens = profil.role === "ADMIN"
    ? [
        ...actions,
        {
          href: "/admin",
          icon: "◆",
          label: "Administration",
          description: "Gère les tirages et les annonces du service.",
        },
      ]
    : actions;

  return (
    <section className="skuup-dashboard-actions" aria-labelledby="dashboard-actions-title">
      <div className="skuup-dashboard-actions-header">
        <div>
          <p className="skuup-kicker">Ton espace</p>
          <h2 id="dashboard-actions-title" className="mt-1 text-2xl font-extrabold text-white">
            Que veux-tu faire ?
          </h2>
          <p className="mt-2 text-sm text-white/55">
            Bonjour {profil.pseudo}, retrouve ici tous tes parcours Skkup.
          </p>
        </div>
      </div>
      <nav aria-label="Navigation de ton espace personnel">
        <div className="mb-4 flex items-center justify-between gap-4">
          <span className="text-xs font-semibold uppercase tracking-[.16em] text-white/40">
            Tes parcours
          </span>
          <span className="hidden text-sm text-white/50 sm:block">Tout Skkup, au même endroit</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {liens.map((lien) => (
            <Link key={lien.href} href={lien.href} className="skuup-dashboard-action group">
              <span className="skuup-dashboard-action-icon" aria-hidden="true">{lien.icon}</span>
              <span className="flex-1">
                <strong>{lien.label}</strong>
                <span>{lien.description}</span>
              </span>
              <span className="skuup-dashboard-action-arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </nav>
    </section>
  );
}
