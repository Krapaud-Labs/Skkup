import type { Metadata } from "next";
import { LocalizedDashboardExtensionPage } from "@/components/i18n/LocalizedDashboardExtensionPage";

export const metadata: Metadata = { title: "Extension | Dashboard | Skkup" };

export default function DashboardExtensionPage() {
  return <LocalizedDashboardExtensionPage />;
}
