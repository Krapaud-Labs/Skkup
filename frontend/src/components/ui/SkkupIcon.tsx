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
  | "play"
  | "users"
  | "gift"
  | "trophy"
  | "shield"
  | "check"
  | "spark"
  | "eye"
  | "points"
  | "chevronDown"
  | "timer"
  | "singleUse"
  | "devices";

const paths: Record<SkkupIconName, ReactNode> = {
  overview: <><path d="M4 10.5 12 4l8 6.5" /><path d="M6.5 9.5V20h11V9.5M9.5 20v-5h5v5" /></>,
  streams: <><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><path d="m10 8 5 4-5 4z" /></>,
  draws: <><path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="m19 15 .7 1.8L21.5 17l-1.8.7L19 19.5l-.7-1.8-1.8-.7 1.8-.7z" /></>,
  extension: <><path d="M8 4.5h8v3a2.5 2.5 0 1 0 0 5v3H8v-3a2.5 2.5 0 1 1 0-5z" /><path d="M12 4.5v3" /></>,
  rules: <><path d="M6 4.5h12v15H6z" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
  admin: <><path d="m12 3 2 2.2 3-.1.8 2.9 2.5 1.7-1.5 2.6.6 2.9-2.8 1-1.4 2.6-3-.8-2.6.8-1.4-2.6-2.8-1 .6-2.9-1.5-2.6L6.2 8l.8-2.9 3 .1z" /><circle cx="12" cy="12" r="2.5" /></>,
  arrow: <><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></>,
  play: <path d="m9 6 9 6-9 6z" />,
  users: <><circle cx="9" cy="9" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M15 7.5a3 3 0 0 1 0 5.8M16.5 15a4.5 4.5 0 0 1 4 4" /></>,
  gift: <><path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13" /><path d="M12 7H8.5a2.5 2.5 0 1 1 2.2-3.7L12 7ZM12 7h3.5a2.5 2.5 0 1 0-2.2-3.7L12 7Z" /></>,
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
};

export function SkkupIcon({ name, size = 24, strokeWidth = 1.8, ...props }: { name: SkkupIconName; size?: number; strokeWidth?: number } & Omit<SVGProps<SVGSVGElement>, "name">) {
  const generatedAsset: Partial<Record<SkkupIconName, string>> = {
    streams: "/branding/generated/skkup-icon-streams.png",
    draws: "/branding/generated/skkup-icon-draws.png",
    extension: "/branding/generated/skkup-icon-extension.png",
    rules: "/branding/generated/skkup-icon-rules.png",
  };
  if (generatedAsset[name]) {
    return <Image src={generatedAsset[name]} alt="" width={size} height={size} className={`skuup-generated-icon ${props.className ?? ""}`} aria-hidden="true" />;
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>{paths[name]}</svg>;
}
