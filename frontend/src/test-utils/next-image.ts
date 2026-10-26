export function nextImageSource(image: HTMLImageElement | null): string | null {
  const src = image?.getAttribute("src");
  if (!src) return null;

  const url = new URL(src, "http://localhost");
  const source = url.pathname === "/_next/image" ? url.searchParams.get("url") : src;
  return source?.split("#", 1)[0] ?? null;
}

export function imagesForSource(root: ParentNode, source: string): HTMLImageElement[] {
  return [...root.querySelectorAll<HTMLImageElement>("img")].filter(
    (image) => nextImageSource(image) === source,
  );
}
