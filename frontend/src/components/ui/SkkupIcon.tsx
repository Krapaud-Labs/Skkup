import Image from "next/image";
import type { CSSProperties, HTMLAttributes } from "react";

/**
 * Shared runtime register for compact functional pictograms and larger
 * semantic Skkup illustrations. Every entry resolves to a local PNG. The
 * ticket and points coin use the official transparent S mark as a layer.
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
  | "rewardIllustration"
  | "streakIllustration"
  | "extensionIllustration"
  | "ticketIllustration";

export type SkkupVisualName = SkkupIconName | SkkupIllustrationName;

const iconSources: Record<SkkupIconName, string> = {
  analytics: "/assets/icons/ui/analytics.png",
  streams: "/assets/icons/ui/streams.png",
  draws: "/assets/icons/ui/draws.png",
  extension: "/assets/icons/ui/extension.png",
  rules: "/assets/icons/ui/rules.png",
  audit: "/assets/icons/ui/audit.png",
  arrow: "/assets/icons/ui/arrow.png",
  users: "/assets/icons/ui/users.png",
  gift: "/assets/icons/ui/gift.png",
  megaphone: "/assets/icons/ui/megaphone.png",
  flag: "/assets/icons/ui/flag.png",
  trophy: "/assets/icons/ui/trophy.png",
  shield: "/assets/icons/ui/shield.png",
  check: "/assets/icons/ui/check.png",
  eye: "/assets/icons/ui/eye.png",
  points: "/assets/icons/ui/points.png",
  chevronDown: "/assets/icons/ui/chevronDown.png",
  timer: "/assets/icons/ui/timer.png",
  bell: "/assets/icons/ui/bell.png",
  scratchCard: "/assets/icons/ui/scratchCard.png",
  ticket: "/assets/icons/ui/ticket.png",
  flame: "/assets/icons/ui/flame.png",
  close: "/assets/icons/ui/close.png",
  favoriteHeart: "/assets/icons/ui/favorite-heart.png",
  favoriteHeartActive: "/assets/icons/ui/favorite-heart-active.png",
  statusPending: "/assets/icons/ui/status-pending.png",
  warning: "/assets/icons/ui/warning.png",
  sparkle: "/assets/icons/ui/sparkle.png",
  arrowUpRight: "/assets/icons/ui/arrow-up-right.png",
};

const illustrationSources: Record<SkkupIllustrationName, string> = {
  rewardIllustration: "/assets/dashboard/illustrations/skkup-icon-reward.png",
  streakIllustration: "/assets/dashboard/illustrations/skkup-icon-streak.png",
  extensionIllustration: "/assets/dashboard/illustrations/skkup-icon-extension-dashboard.png",
  ticketIllustration: "/assets/icons/ui/ticket.png",
};

const visualSources: Record<SkkupVisualName, string> = {
  ...iconSources,
  ...illustrationSources,
};

export function SkkupIcon({
  name,
  size = 24,
  className = "",
  ...props
}: {
  name: SkkupVisualName;
  size?: number;
  className?: string;
} & Omit<HTMLAttributes<HTMLSpanElement>, "width" | "height">) {
  if (name === "ticket" || name === "points" || name === "ticketIllustration") {
    return (
      <span
        {...props}
        aria-hidden="true"
        className={`skuup-generated-icon-composite skuup-generated-icon-composite-${name} ${className}`.trim()}
        style={{ "--skuup-icon-size": `${size}px`, ...props.style } as CSSProperties}
      >
        <Image
          src={visualSources[name]}
          alt=""
          width={size}
          height={size}
          unoptimized
          className="skuup-generated-icon skuup-generated-icon-base"
          aria-hidden="true"
        />
        <Image
          src="/assets/brand/marks/skkup-s-favicon.png"
          alt=""
          width={size}
          height={size}
          unoptimized
          className="skuup-generated-icon-brand-overlay"
          aria-hidden="true"
          data-brand-mark="official-s"
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
      unoptimized
      className={`skuup-generated-icon ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
