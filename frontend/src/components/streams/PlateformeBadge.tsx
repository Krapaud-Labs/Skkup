import Image from "next/image";
import type { Plateforme } from "@/lib/streams";

const assets: Partial<Record<Plateforme, { src: string; label: string }>> = {
  TWITCH: { src: "/assets/shared/platforms/twitch.png", label: "Twitch" },
  YOUTUBE: { src: "/assets/shared/platforms/youtube.png", label: "YouTube" },
};

export function PlateformeBadge({ plateforme }: { plateforme: Plateforme }) {
  const asset = assets[plateforme];
  const label = asset?.label ?? "Kick";
  return <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-accent-violet-light">{asset && <Image src={asset.src} alt="" width={20} height={20} aria-hidden="true" />}{label}</span>;
}
