import type { Metadata } from "next";
import PageAdministration from "@/app/admin/page";

export const metadata: Metadata = { title: "Administration | Dashboard | Skkup" };

export default function DashboardAdminPage() {
  return <PageAdministration embedded />;
}
