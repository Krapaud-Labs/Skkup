import type { MetadataRoute } from "next";

const siteUrl = "https://skkup.fr";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/faq",
    "/streams",
    "/tirages",
    "/extension",
    "/confidentialite",
  ];
  return routes.map((route) => ({
    url: siteUrl + route,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.6,
  }));
}
