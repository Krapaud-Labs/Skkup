import type { Metadata } from "next";
import { ConfidentialiteContent } from "@/components/legal/ConfidentialiteContent";

export const metadata: Metadata = { title: "Politique de confidentialité | Skkup", description: "Politique de confidentialité et protection des données personnelles de Skkup.", alternates: { canonical: "/confidentialite" }, openGraph: { url: "/confidentialite" } };

export default function ConfidentialitePage() { return <ConfidentialiteContent />; }
