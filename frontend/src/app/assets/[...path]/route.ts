import { readFile, realpath, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, isAbsolute, join, relative, resolve, sep } from "node:path";

export const runtime = "nodejs";

const assetRoots = [
  resolve(process.cwd(), "asset"),
  resolve(process.cwd(), "../asset"),
];
const mimeTypes: Record<string, string> = {
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};
const allowedAssets = new Set([
  "brand/logos/skkup-wordmark-transparent.png",
  "brand/marks/apple-icon.png",
  "brand/marks/favicon.ico",
  "brand/marks/icon.png",
  "brand/marks/skkup-s-favicon.png",
  "dashboard/illustrations/skkup-icon-extension-dashboard.png",
  "dashboard/illustrations/skkup-icon-reward.png",
  "dashboard/rewards/reward-art-sprite-v1.png",
  "icons/ui/analytics.png",
  "icons/ui/arrow.png",
  "icons/ui/audit.png",
  "icons/ui/bell.png",
  "icons/ui/check.png",
  "icons/ui/chevronDown.png",
  "icons/ui/close.png",
  "icons/ui/draws.png",
  "icons/ui/extension.png",
  "icons/ui/eye.png",
  "icons/ui/flag.png",
  "icons/ui/flame.png",
  "icons/ui/favorite-heart-active.png",
  "icons/ui/favorite-heart.png",
  "icons/ui/gift.png",
  "icons/ui/megaphone.png",
  "icons/ui/points.png",
  "icons/ui/rules.png",
  "icons/ui/scratchCard.png",
  "icons/ui/sparkle.png",
  "icons/ui/shield.png",
  "icons/ui/streams.png",
  "icons/ui/status-pending.png",
  "icons/ui/ticket.png",
  "icons/ui/timer.png",
  "icons/ui/trophy.png",
  "icons/ui/users.png",
  "icons/ui/warning.png",
  "icons/ui/arrow-up-right.png",
  "marketing/hero/skkup-hero-products-v3.png",
  "marketing/steps/skkup-step-install.png",
  "marketing/steps/skkup-step-points-v2.png",
  "marketing/steps/skkup-step-reward.png",
  "marketing/steps/skkup-step-watch.png",
  "platforms/twitch.png",
  "platforms/youtube.png",
]);

function findAssetRoot() {
  const override = process.env.SKKUP_ASSET_ROOT;
  if (override) return resolve(override);
  return assetRoots.find((root) => existsSync(root)) ?? assetRoots[0];
}

async function serveAsset(path: string[], headOnly: boolean) {
  const assetRoot = findAssetRoot();
  const filename = resolve(assetRoot, ...path);
  const assetPath = join(...path);
  const relativePath = relative(assetRoot, filename);
  const contentType = mimeTypes[extname(filename).toLowerCase()];

  if (
    !allowedAssets.has(assetPath) ||
    !contentType ||
    isAbsolute(relativePath) ||
    relativePath === ".." ||
    relativePath.startsWith(`..${sep}`)
  ) {
    return new Response(null, { status: 404 });
  }

  try {
    const assetRootRealPath = await realpath(/*turbopackIgnore: true*/ assetRoot);
    const realFilename = await realpath(/*turbopackIgnore: true*/ filename);
    const realRelativePath = relative(assetRootRealPath, realFilename);
    const canonicalAssetPath = realRelativePath.split(sep).join("/");
    if (
      isAbsolute(realRelativePath) ||
      realRelativePath === ".." ||
      realRelativePath.startsWith(`..${sep}`) ||
      canonicalAssetPath !== assetPath ||
      !allowedAssets.has(canonicalAssetPath)
    ) {
      return new Response(null, { status: 404 });
    }
    const fileInfo = await stat(realFilename);
    if (!fileInfo.isFile()) return new Response(null, { status: 404 });
    const content = headOnly ? null : new Uint8Array(await readFile(realFilename));
    return new Response(content, {
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Content-Length": String(fileInfo.size),
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}

type AssetRouteContext = { params: Promise<{ path: string[] }> };

export async function GET(_request: Request, context: AssetRouteContext) {
  return serveAsset((await context.params).path, false);
}

export async function HEAD(_request: Request, context: AssetRouteContext) {
  return serveAsset((await context.params).path, true);
}
