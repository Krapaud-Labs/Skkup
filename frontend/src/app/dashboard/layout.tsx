import type { Metadata } from "next";
import { DashboardSas } from "@/components/dashboard/DashboardSas";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <DashboardSas>{children}</DashboardSas>;
}
