import type { Metadata } from "next";
import { HistoriquePointsViewer } from "@/components/dashboard/HistoriquePointsViewer";

export const metadata: Metadata = { title: "Historique | Dashboard | Skkup" };

export default function DashboardHistoriquePage() {
  return <HistoriquePointsViewer />;
}
