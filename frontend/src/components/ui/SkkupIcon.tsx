import Image from "next/image";
import type { ReactNode, SVGProps } from "react";

export type SkkupIconName =
  | "overview"
  | "streams"
  | "draws"
  | "extension"
  | "rules"
  | "admin"
  | "arrow"
  | "arrowBack"
  | "play"
  | "users"
  | "gift"
  | "giftAdmin"
  | "cubeAdmin"
  | "flagAdmin"
  | "megaphoneAdmin"
  | "cube"
  | "megaphone"
  | "flag"
  | "trophy"
  | "shield"
  | "check"
  | "spark"
  | "eye"
  | "points"
  | "chevronDown"
  | "timer"
  | "singleUse"
  | "devices"
  | "bell"
  | "analytics"
  | "audit"
  | "content"
  | "moderation"
  | "scratchCard"
  | "ticket"
  | "flame"
  | "lock";

const paths: Partial<Record<SkkupIconName, ReactNode>> = {
  overview: <><path d="M4 10.5 12 4l8 6.5" /><path d="M6.5 9.5V20h11V9.5M9.5 20v-5h5v5" /></>,
  streams: <><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><path d="m10 8 5 4-5 4z" /></>,
  draws: <><path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="m19 15 .7 1.8L21.5 17l-1.8.7L19 19.5l-.7-1.8-1.8-.7 1.8-.7z" /></>,
  extension: <><path d="M8 4.5h8v3a2.5 2.5 0 1 0 0 5v3H8v-3a2.5 2.5 0 1 1 0-5z" /><path d="M12 4.5v3" /></>,
  rules: <><path d="M6 4.5h12v15H6z" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
  admin: <><path d="m12 3 2 2.2 3-.1.8 2.9 2.5 1.7-1.5 2.6.6 2.9-2.8 1-1.4 2.6-3-.8-2.6.8-1.4-2.6-2.8-1 .6-2.9-1.5-2.6L6.2 8l.8-2.9 3 .1z" /><circle cx="12" cy="12" r="2.5" /></>,
  arrow: <><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></>,
  arrowBack: <><path d="M19 12H6" /><path d="m11 6-6 6 6 6" /></>,
  play: <path d="m9 6 9 6-9 6z" />,
  users: <><circle cx="9" cy="9" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M15 7.5a3 3 0 0 1 0 5.8M16.5 15a4.5 4.5 0 0 1 4 4" /></>,
  gift: <><path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13" /><path d="M12 7H8.5a2.5 2.5 0 1 1 2.2-3.7L12 7ZM12 7h3.5a2.5 2.5 0 1 0-2.2-3.7L12 7Z" /></>,
  giftAdmin: <><path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13" /><path d="M12 7H8.5a2.5 2.5 0 1 1 2.2-3.7L12 7ZM12 7h3.5a2.5 2.5 0 1 0-2.2-3.7L12 7Z" /></>,
  cube: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" /><path d="m4.2 7.7 7.8 4.5 7.8-4.5M12 12.2V21" /></>,
  megaphone: <><path d="m4 11 12-5v12L4 14z" /><path d="M16 9h3.5a1.5 1.5 0 0 1 0 3H16M7 15l1.5 5H12l-1.5-4.2" /></>,
  flag: <><path d="M6 21V4" /><path d="M6 5c4-3 8 3 12 0v9c-4 3-8-3-12 0" /></>,
  trophy: <><path d="M8 4h8v4a4 4 0 0 1-8 0zM12 12v5M8.5 20h7M6 5H3.5v2a3.5 3.5 0 0 0 3.5 3M18 5h2.5v2a3.5 3.5 0 0 1-3.5 3" /></>,
  shield: <><path d="M12 3 19 6v5c0 4.5-2.8 7.5-7 10-4.2-2.5-7-5.5-7-10V6z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
  check: <path d="m5 12 4.2 4.2L19 6.5" />,
  spark: <><path d="m12 3 1.8 6.2L20 12l-6.2 1.8L12 20l-1.8-6.2L4 12l6.2-2.8z" /><path d="m19 3 .4 1.6L21 5l-1.6.4L19 7l-.4-1.6L17 5l1.6-.4z" /></>,
  eye: <><path d="M2.5 12s3.2-5 9.5-5 9.5 5 9.5 5-3.2 5-9.5 5-9.5-5-9.5-5Z" /><circle cx="12" cy="12" r="2.5" /></>,
  points: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v10M9.5 9.5c.5-1.3 4.5-1.5 5 0 .6 1.7-1.1 2.2-2.5 2.5s-3.1.8-2.5 2.5c.5 1.5 4.5 1.3 5 0" /></>,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  timer: <><circle cx="12" cy="13" r="7" /><path d="M12 9v4l2.5 1.5M9 3h6M12 3v3" /></>,
  singleUse: <><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
  devices: <><rect x="3" y="5" width="12" height="9" rx="1.5" /><path d="M7 19h4M9 14v5M18 8h3v10h-5V8h2Z" /></>,
  bell: <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />,
  analytics: <><path d="M4 19V5M4 19h17" /><path d="m7 15 3-4 3 2 5-7" /><path d="M15 6h3v3" /></>,
  audit: <><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h5M8 16h4" /><circle cx="17" cy="16" r="3" /><path d="m19.2 18.2 2 2" /></>,
  content: <><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  moderation: <><path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6z" /><path d="m8.5 12 2.2 2.2 4.8-4.8" /></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
};

export function SkkupIcon({ name, size = 24, strokeWidth = 1.8, ...props }: { name: SkkupIconName; size?: number; strokeWidth?: number } & Omit<SVGProps<SVGSVGElement>, "name">) {
  const generatedAsset: Partial<Record<SkkupIconName, string>> = {
    streams: "/branding/icons/streams.svg",
    draws: "/branding/icons/draws.svg",
    extension: "/branding/icons/extension.svg",
    rules: "/branding/icons/rules.svg",
    gift: "/branding/icons/gift.svg",
    giftAdmin: "/branding/generated/skkup-icon-gift.png",
    cubeAdmin: "/branding/generated/skkup-icon-cube-admin.png",
    flagAdmin: "/branding/generated/skkup-icon-flag-admin.png",
    megaphoneAdmin: "/branding/generated/skkup-icon-megaphone-admin.png",
    trophy: "/branding/icons/trophy.svg",
    points: "/branding/icons/points.svg",
    shield: "/branding/icons/shield.svg",
    eye: "/branding/icons/eye.svg",
    check: "/branding/icons/check.svg",
    overview: "/branding/icons/overview.svg",
    admin: "/branding/icons/admin.svg",
    scratchCard: "/branding/v3/scratch-card.svg",
    ticket: "/branding/v3/ticket.svg",
    flame: "/branding/v3/flame.svg",
  };
  if (generatedAsset[name]) {
    // Les assets colorés restent des images. Les pictogrammes linéaires admin
    // sont rendus inline ci-dessous afin que currentColor reste pilotable par CSS.
    return <Image src={generatedAsset[name]} alt="" width={size} height={size} className={`skuup-generated-icon ${props.className ?? ""}`} aria-hidden="true" />;
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>{paths[name]}</svg>;
}
