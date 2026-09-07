import type { Metadata } from "next";
import { CodeAppariement } from "@/components/extension/CodeAppariement";

export const metadata: Metadata = { title: "Extension | Dashboard | Skkup" };

export default function DashboardExtensionPage() {
  return (
    <div className="skuup-dashboard-page">
      <header className="skuup-dashboard-page-header">
        <p className="skuup-kicker">Ton extension Skkup</p>
        <h1 className="skuup-dashboard-page-title">Associe ton navigateur</h1>
        <p>Génère un code temporaire pour relier l&apos;extension à ton compte sans exposer ton mot de passe.</p>
      </header>
      <div className="skuup-dashboard-narrow-content">
        <CodeAppariement />
      </div>
    </div>
  );
}
