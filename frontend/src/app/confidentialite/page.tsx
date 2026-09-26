/* Le contenu juridique conserve les apostrophes françaises pour rester lisible. */
/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import { ConfidentialiteContent } from "@/components/legal/ConfidentialiteContent";

export const metadata: Metadata = { title: "Politique de confidentialité | Skkup", description: "Politique de confidentialité et protection des données personnelles de Skkup.", alternates: { canonical: "/confidentialite" } };

export default function ConfidentialitePage() { return <ConfidentialiteContent />; }
