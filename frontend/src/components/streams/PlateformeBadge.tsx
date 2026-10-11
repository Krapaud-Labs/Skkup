import Image from "next/image";
import type { Plateforme } from "@/lib/streams";

const assets: Record<Plateforme, { src: string; label: string }> = {
  TWITCH: { src: "/branding/platforms/twitch.svg", label: "Twitch" },
  YOUTUBE: { src: "/branding/platforms/youtube.svg", label: "YouTube" },
  FACEBOOK: { src: "/branding/platforms/facebook.svg", label: "Facebook Live" },
};

export function PlateformeBadge({ plateforme }: { plateforme: Plateforme }) {
  const asset = assets[plateforme];
  return <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-accent-violet-light"><Image src={asset.src} alt="" width={20} height={20} aria-hidden="true" />{asset.label}</span>;
}
