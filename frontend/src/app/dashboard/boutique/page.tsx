import type { Metadata } from "next";
import { BoutiqueViewer } from "@/components/dashboard/BoutiqueViewer";

export const metadata: Metadata = { title: "Boutique | Dashboard | Skkup" };

export default function DashboardBoutiquePage() {
  return <BoutiqueViewer />;
}
