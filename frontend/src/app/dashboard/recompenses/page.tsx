import type { Metadata } from "next";
import { CentreRecompenses } from "@/components/dashboard/CentreRecompenses";

export const metadata: Metadata = { title: "Récompenses | Dashboard | Skkup" };

export default function DashboardRecompensesPage() {
  return <CentreRecompenses />;
}
