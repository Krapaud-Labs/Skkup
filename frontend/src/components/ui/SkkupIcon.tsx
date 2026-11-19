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
  | "free"
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
  analytics: "/assets/icons/ui/analytics.png#v=0d09d6a6",
  streams: "/assets/icons/ui/streams.png#v=ded569a3",
  draws: "/assets/icons/ui/draws-v2.png#v=0814d1b6",
  extension: "/assets/icons/ui/extension.png#v=abd77811",
  rules: "/assets/icons/ui/rules.png#v=0a5fde3d",
  audit: "/assets/icons/ui/audit.png#v=70df5d83",
  arrow: "/assets/icons/ui/arrow.png#v=67044f1d",
  users: "/assets/icons/ui/users.png#v=017a91a7",
  gift: "/assets/icons/ui/gift.png#v=97a8af24",
  megaphone: "/assets/icons/ui/megaphone.png#v=b6080e1b",
  flag: "/assets/icons/ui/flag.png#v=83585ddd",
  trophy: "/assets/icons/ui/trophy.png#v=02effb0c",
  shield: "/assets/icons/ui/shield.png#v=f3e25c8b",
  check: "/assets/icons/ui/check.png#v=cf39220f",
  eye: "/assets/icons/ui/eye.png#v=9ace834b",
  free: "/assets/icons/ui/free.png#v=3d742d90",
  // Each fragment keys the optimized image cache to the active PNG content.
  points: "/assets/icons/ui/points.png#v=24a670d7",
  chevronDown: "/assets/icons/ui/chevronDown.png#v=ed28850a",
  timer: "/assets/icons/ui/timer.png#v=c99cc707",
  bell: "/assets/icons/ui/bell.png#v=45b65735",
  scratchCard: "/assets/icons/ui/scratchCard.png#v=6c0627b4",
  ticket: "/assets/icons/ui/ticket.png#v=3108e55c",
  flame: "/assets/icons/ui/flame.png#v=64f5c9ef",
  close: "/assets/icons/ui/close.png#v=80c1408d",
  favoriteHeart: "/assets/icons/ui/favorite-heart.png#v=6fd1c439",
  favoriteHeartActive: "/assets/icons/ui/favorite-heart-active.png#v=73dc746c",
  statusPending: "/assets/icons/ui/status-pending.png#v=38ecc482",
  warning: "/assets/icons/ui/warning.png#v=32409074",
  sparkle: "/assets/icons/ui/sparkle.png#v=2874a6d3",
  arrowUpRight: "/assets/icons/ui/arrow-up-right.png#v=9f70f3b1",
};

const illustrationSources: Record<SkkupIllustrationName, string> = {
  extensionIllustration: "/assets/dashboard/illustrations/skkup-icon-extension-dashboard.png",
  ticketIllustration: "/assets/icons/ui/ticket.png#v=3108e55c",
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
  if (name === "gift") {
    const renderedSize = Math.round(size * 1.66);
    return (
      <span
        className={`skuup-gift-icon-frame ${className}`.trim()}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <Image
          {...props}
          src={visualSources[name]}
          alt=""
          width={renderedSize}
          height={renderedSize}
          sizes={sizes}
          className="skuup-generated-icon"
          aria-hidden="true"
        />
      </span>
    );
  }

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
