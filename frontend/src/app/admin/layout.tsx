import type { Metadata } from "next";
import { AdminSas } from "@/components/admin/AdminSas";

export const metadata: Metadata = {
  title: "Administration | Skkup",
  description: "Espace d’administration Skkup.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminSas>{children}</AdminSas>;
}
