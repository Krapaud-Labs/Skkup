export function nextImageSource(image: HTMLImageElement | null): string | null {
  const src = image?.getAttribute("src");
  if (!src) return null;

  const url = new URL(src, "http://localhost");
  return url.pathname === "/_next/image" ? url.searchParams.get("url") : src;
}

export function imagesForSource(root: ParentNode, source: string): HTMLImageElement[] {
  return [...root.querySelectorAll<HTMLImageElement>("img")].filter(
    (image) => nextImageSource(image) === source,
  );
}
