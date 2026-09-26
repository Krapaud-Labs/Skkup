import { describe, expect, it } from "vitest";
import { publicMetadata } from "./public-metadata";

describe("publicMetadata", () => {
  it("keeps the server-rendered French document canonical without inventing locale URLs", () => {
    const metadata = publicMetadata({
      path: "/faq",
      title: "FAQ | Skkup",
      description: "Les réponses aux questions fréquentes.",
    });

    expect(metadata.alternates).toEqual({ canonical: "/faq" });
    expect(metadata.openGraph).toMatchObject({
      locale: "fr_FR",
      alternateLocale: "en_US",
      url: "/faq",
    });
  });
});
