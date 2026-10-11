import type { Metadata } from "next";
import { ReglementPublicContent } from "@/components/legal/ReglementPublicContent";

export const metadata: Metadata = { title: "Règlement du jeu | Skkup", description: "Règlement du jeu et modalités des tirages Skkup.", alternates: { canonical: "/reglement" } };

export default function ReglementPage() { return <ReglementPublicContent />; }
