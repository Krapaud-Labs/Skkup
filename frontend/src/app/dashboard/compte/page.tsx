import type { Metadata } from "next";
import { CompteViewer } from "@/components/dashboard/CompteViewer";

export const metadata: Metadata = { title: "Mon compte | Dashboard | Skkup" };

export default function DashboardComptePage() {
  return <CompteViewer />;
}
