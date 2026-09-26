import type { Metadata } from "next";

type PublicMetadataOptions = {
  path: string;
  title: string;
  description: string;
};

type PublicMetadata = Metadata & {
  openGraph: NonNullable<Metadata["openGraph"]>;
  twitter: NonNullable<Metadata["twitter"]>;
};

/**
 * The selected UI language currently lives in localStorage, so Next.js cannot
 * know it while generating server metadata. These values deliberately describe
 * the French server-rendered document. Do not add hreflang entries until FR and
 * EN have distinct, stable URLs (for example /fr and /en).
 */
export function publicMetadata({
  path,
  title,
  description,
}: PublicMetadataOptions): PublicMetadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      alternateLocale: "en_US",
      url: path,
      siteName: "Skkup",
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
