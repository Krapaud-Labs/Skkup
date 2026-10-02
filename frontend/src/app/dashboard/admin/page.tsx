import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Administration | Dashboard | Skkup" };

export default function DashboardAdminPage() {
  redirect("/admin");
}
