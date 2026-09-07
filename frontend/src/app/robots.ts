import type { MetadataRoute } from "next";

const siteUrl = "https://skkup.fr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    host: siteUrl,
    sitemap: siteUrl + "/sitemap.xml",
  };
}
