import Image from "next/image";
import type { ImgHTMLAttributes } from "react";

/**
 * Shared runtime register for compact functional pictograms and larger
 * semantic Skkup illustrations. Every entry resolves to a local PNG; the
 * official Skkup points coin remains the approved brand asset.
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
  | "cube"
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
  | "flame";

export type SkkupIllustrationName =
  | "rewardIllustration"
  | "streakIllustration"
  | "extensionIllustration"
  | "ticketIllustration";

export type SkkupVisualName = SkkupIconName | SkkupIllustrationName;

const iconSources: Record<SkkupIconName, string> = {
  analytics: "/assets/ui-icons/analytics.png",
  streams: "/assets/ui-icons/streams.png",
  draws: "/assets/ui-icons/draws.png",
  extension: "/assets/ui-icons/extension.png",
  rules: "/assets/ui-icons/rules.png",
  audit: "/assets/ui-icons/audit.png",
  arrow: "/assets/ui-icons/arrow.png",
  users: "/assets/ui-icons/users.png",
  gift: "/assets/ui-icons/gift.png",
  cube: "/assets/ui-icons/cube.png",
  megaphone: "/assets/ui-icons/megaphone.png",
  flag: "/assets/ui-icons/flag.png",
  trophy: "/assets/ui-icons/trophy.png",
  shield: "/assets/ui-icons/shield.png",
  check: "/assets/ui-icons/check.png",
  eye: "/assets/ui-icons/eye.png",
  points: "/assets/dashboard/shared/icons/skkup-icon-points.png",
  chevronDown: "/assets/ui-icons/chevronDown.png",
  timer: "/assets/ui-icons/timer.png",
  bell: "/assets/ui-icons/bell.png",
  scratchCard: "/assets/ui-icons/scratchCard.png",
  ticket: "/assets/ui-icons/ticket.png",
  flame: "/assets/ui-icons/flame.png",
};

const illustrationSources: Record<SkkupIllustrationName, string> = {
  rewardIllustration: "/assets/dashboard/shared/icons/skkup-icon-reward.png",
  streakIllustration: "/assets/dashboard/shared/icons/skkup-icon-streak.png",
  extensionIllustration: "/assets/dashboard/shared/icons/skkup-icon-extension-dashboard.png",
  ticketIllustration: "/assets/dashboard/shared/icons/skkup-icon-ticket-s.png",
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
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "width" | "height">) {
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
