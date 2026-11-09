import Image from "next/image";
import type { HTMLAttributes } from "react";

/**
 * Shared runtime register for compact functional pictograms and larger
 * semantic Skkup illustrations. Every entry resolves to a local PNG.
 */
export type SkkupIconName =
  | "analytics"
  | "streams"
  | "draws"
  | "extension"
  | "rules"
  | "audit"
  | "arrow"
  | "users"
  | "gift"
  | "megaphone"
  | "flag"
  | "trophy"
  | "shield"
  | "check"
  | "eye"
  | "points"
  | "chevronDown"
  | "timer"
  | "bell"
  | "scratchCard"
  | "ticket"
  | "flame"
  | "close"
  | "favoriteHeart"
  | "favoriteHeartActive"
  | "statusPending"
  | "warning"
  | "sparkle"
  | "arrowUpRight";

export type SkkupIllustrationName =
  | "extensionIllustration"
  | "ticketIllustration";

export type SkkupVisualName = SkkupIconName | SkkupIllustrationName;

const iconSources: Record<SkkupIconName, string> = {
  analytics: "/assets/icons/ui/analytics.png#v=3424bc77",
  streams: "/assets/icons/ui/streams.png#v=8b43b8f5",
  draws: "/assets/icons/ui/draws-v2.png#v=64195cae",
  extension: "/assets/icons/ui/extension.png#v=c7e64fc7",
  rules: "/assets/icons/ui/rules.png#v=c899013e",
  audit: "/assets/icons/ui/audit.png#v=8e9c9780",
  arrow: "/assets/icons/ui/arrow.png#v=c4f231d0",
  users: "/assets/icons/ui/users.png#v=9d983cf4",
  gift: "/assets/icons/ui/gift.png#v=4aca3e63",
  megaphone: "/assets/icons/ui/megaphone.png#v=71e7a7b9",
  flag: "/assets/icons/ui/flag.png#v=8f4a32f1",
  trophy: "/assets/icons/ui/trophy.png#v=e3abea26",
  shield: "/assets/icons/ui/shield.png#v=274de3de",
  check: "/assets/icons/ui/check.png#v=572732e1",
  eye: "/assets/icons/ui/eye.png#v=f35369f7",
  // Each fragment keys the optimized image cache to the active PNG content.
  points: "/assets/icons/ui/points.png#v=00b2ef94",
  chevronDown: "/assets/icons/ui/chevronDown.png#v=ed28850a",
  timer: "/assets/icons/ui/timer.png#v=225472eb",
  bell: "/assets/icons/ui/bell.png#v=9add245a",
  scratchCard: "/assets/icons/ui/scratchCard.png#v=52f0b199",
  ticket: "/assets/icons/ui/ticket.png#v=86d8d0bb",
  flame: "/assets/icons/ui/flame.png#v=b1fe4c38",
  close: "/assets/icons/ui/close.png#v=4f314637",
  favoriteHeart: "/assets/icons/ui/favorite-heart.png#v=583c9aae",
  favoriteHeartActive: "/assets/icons/ui/favorite-heart-active.png#v=02153ab4",
  statusPending: "/assets/icons/ui/status-pending.png#v=7d2bf3a4",
  warning: "/assets/icons/ui/warning.png#v=b5b071a1",
  sparkle: "/assets/icons/ui/sparkle.png#v=7bf15b63",
  arrowUpRight: "/assets/icons/ui/arrow-up-right.png#v=8ee9973a",
};

const illustrationSources: Record<SkkupIllustrationName, string> = {
  extensionIllustration: "/assets/dashboard/illustrations/skkup-icon-extension-dashboard.png",
  ticketIllustration: "/assets/icons/ui/ticket.png#v=86d8d0bb",
};

const visualSources: Record<SkkupVisualName, string> = {
  ...iconSources,
  ...illustrationSources,
};

export function SkkupIcon({
  name,
  size = 24,
  sizes,
  className = "",
  ...props
}: {
  name: SkkupVisualName;
  size?: number;
  sizes?: string;
  className?: string;
} & Omit<HTMLAttributes<HTMLSpanElement>, "width" | "height">) {
  return (
    <Image
      {...props}
      src={visualSources[name]}
      alt=""
      width={size}
      height={size}
      sizes={sizes}
      className={`skuup-generated-icon ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
