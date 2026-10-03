import type { Metadata } from "next";
import { CodeAppariement } from "@/components/extension/CodeAppariement";
import { LocalizedDashboardExtension } from "@/components/i18n/LocalizedDashboardExtension";

export const metadata: Metadata = { title: "Extension | Dashboard | Skkup" };

export default function DashboardExtensionPage() {
  return <div className="skuup-dashboard-page"><LocalizedDashboardExtension /><section className="skuup-dashboard-narrow-content" aria-labelledby="extension-title"><CodeAppariement /></section></div>;
}
