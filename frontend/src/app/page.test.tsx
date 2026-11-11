import { expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Home from './page';
import { LanguageProvider } from '@/components/i18n/LanguageProvider';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

test("affiche le titre et mène vers la connexion", () => {
  render(<Home />);
  const heading = screen.getByRole('heading', {
    level: 1,
    name: /Regarder, c'est déjà gagner/i,
  });
  expect(heading).toBeDefined();
  expect(heading.previousElementSibling).toBeNull();
  expect(
    screen
      .getByRole('link', { name: 'Je commence gratuitement' })
      .getAttribute('href'),
  ).toBe('/connexion');
});

test("affiche la nouvelle illustration hero avec ses dimensions paysage", () => {
  render(<Home />);
  const heroImage = screen.getByRole('img', { name: /boîte cadeau skkup violette ouverte/i });

  expect(heroImage.closest('.skuup-reveal')).toBeNull();
  expect(decodeURIComponent(heroImage.getAttribute('src') ?? ''))
    .toContain('/assets/marketing/hero/skkup-hero-products.png');
  expect(heroImage.getAttribute('width')).toBe('1536');
  expect(heroImage.getAttribute('height')).toBe('1024');
});

test("déclare le logo Organization dédié dans les données structurées", () => {
  const { container } = render(<Home />);
  const structuredData = container.querySelector('script[type="application/ld+json"]');
  const graph = JSON.parse(structuredData?.textContent ?? "{}");
  const organization = graph["@graph"]?.find((entry: { "@type"?: string }) => entry["@type"] === "Organization");

  expect(organization?.logo).toBe(
    "https://skkup.fr/assets/brand/search/skkup-organization-logo.png",
  );
});

test("définit trois arrêts et garde les chiffres après les lots", () => {
  const { container } = render(<Home />);
  const homepage = container.querySelector("main.skuup-homepage");
  const sections = homepage?.querySelectorAll(":scope > .skuup-home-snap-section");
  const how = homepage?.querySelector("#fonctionnement");

  expect(homepage).not.toBeNull();
  expect(sections).toHaveLength(3);
  const lots = homepage?.querySelector("#lots.skuup-home-snap-section");
  const stats = lots?.querySelector(".skuup-stats");
  expect(lots?.parentElement).toBe(homepage);
  expect(stats).not.toBeNull();
  expect(stats?.classList.contains("skuup-home-snap-section")).toBe(false);
  expect(stats?.querySelectorAll(".skuup-stat")).toHaveLength(4);
  expect(stats?.querySelectorAll(".skuup-stat-icon img")).toHaveLength(4);
  expect(stats?.className).toBe("skuup-stats mx-auto grid max-w-6xl grid-cols-2 gap-px px-6 sm:grid-cols-4");
  expect(stats?.hasAttribute("aria-label")).toBe(false);
  const statIcons = Array.from(stats?.querySelectorAll(".skuup-stat-icon img") ?? [])
    .map((image) => decodeURIComponent(image.getAttribute("src") ?? ""));
  expect(statIcons.map((src) => src.match(/icons\/ui\/(eye|points|trophy|shield)\.png/)?.[1]))
    .toEqual(["eye", "points", "trophy", "shield"]);
  expect(how?.classList.contains("skuup-home-snap-section")).toBe(true);
  expect(how?.querySelector("#engagement")).not.toBeNull();
  expect(how?.querySelector("footer")).not.toBeNull();
  expect(how?.querySelector(".skuup-stats")).toBeNull();
});

test("égalise à 32 px les espacements autour des grilles Lots et Étapes", () => {
  const { container } = render(<Home />);
  const lotsGrid = container.querySelector("#lots .skuup-reveal-stagger > div > div.mt-8");
  const stepsGrid = container.querySelector("#fonctionnement .skuup-reveal-stagger > div > div.mt-8");

  for (const grid of [lotsGrid, stepsGrid]) {
    expect(grid).not.toBeNull();
    expect(grid?.classList.contains("mt-8")).toBe(true);
    expect(grid?.classList.contains("mb-8")).toBe(true);
    expect(grid?.classList.contains("mt-10")).toBe(false);
  }
});

test("aligne le contenu du CTA de fin à gauche sans changer le pied de page", () => {
  const { container } = render(<Home />);
  const cta = container.querySelector("#engagement");
  const content = cta?.firstElementChild;

  expect(cta?.classList.contains("text-left")).toBe(true);
  expect(content?.classList.contains("items-start")).toBe(true);
  expect(content?.classList.contains("justify-start")).toBe(true);
  expect(content?.classList.contains("flex-col")).toBe(true);
  expect(content?.classList.contains("md:flex-row")).toBe(true);
  expect(content?.classList.contains("md:items-center")).toBe(true);
  expect(content?.classList.contains("md:justify-between")).toBe(true);
  expect(cta?.querySelector("h2")?.textContent).toBe("Prêt à commencer ?");
  expect(cta?.querySelector('a[href="/connexion"]')?.textContent).toContain("Créer mon compte");
  expect(cta?.nextElementSibling?.tagName).toBe("FOOTER");
  expect(cta?.nextElementSibling?.classList.contains("justify-center")).toBe(true);
});

test("masque les indicateurs au bord inférieur réel du document", async () => {
  const scrollRoot = document.scrollingElement ?? document.documentElement;
  const descriptors = {
    scrollHeight: Object.getOwnPropertyDescriptor(scrollRoot, "scrollHeight"),
    clientHeight: Object.getOwnPropertyDescriptor(scrollRoot, "clientHeight"),
    innerHeight: Object.getOwnPropertyDescriptor(window, "innerHeight"),
    scrollY: Object.getOwnPropertyDescriptor(window, "scrollY"),
  };
  Object.defineProperty(scrollRoot, "scrollHeight", { configurable: true, value: 2400 });
  Object.defineProperty(scrollRoot, "clientHeight", { configurable: true, value: 800 });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
  Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });

  try {
    const { container } = render(<Home />);
    const sections = Array.from(container.querySelectorAll(".skuup-home-snap-section"));
    expect(sections).toHaveLength(3);
    await waitFor(() => {
      expect(container.querySelectorAll(".skuup-home-scroll-indicator")).toHaveLength(3);
    });

    Object.defineProperty(window, "scrollY", { configurable: true, value: 1599 });
    window.dispatchEvent(new Event("scroll"));
    await waitFor(() => {
      expect(container.querySelectorAll(".skuup-home-scroll-indicator")).toHaveLength(3);
    });

    Object.defineProperty(window, "scrollY", { configurable: true, value: 1600 });
    window.dispatchEvent(new Event("scroll"));
    await waitFor(() => {
      expect(container.querySelectorAll(".skuup-home-scroll-indicator")).toHaveLength(0);
    });
  } finally {
    for (const [target, property, descriptor] of [
      [scrollRoot, "scrollHeight", descriptors.scrollHeight],
      [scrollRoot, "clientHeight", descriptors.clientHeight],
      [window, "innerHeight", descriptors.innerHeight],
      [window, "scrollY", descriptors.scrollY],
    ] as const) {
      if (descriptor) Object.defineProperty(target, property, descriptor);
      else Reflect.deleteProperty(target, property);
    }
  }
});

test("traduit le libellé du repère de défilement en anglais", async () => {
  const languageKey = "skkup-language";
  const previousDescriptor = Object.getOwnPropertyDescriptor(window, "localStorage");
  const scrollRoot = document.scrollingElement ?? document.documentElement;
  const scrollHeightDescriptor = Object.getOwnPropertyDescriptor(scrollRoot, "scrollHeight");
  const clientHeightDescriptor = Object.getOwnPropertyDescriptor(scrollRoot, "clientHeight");
  const innerHeightDescriptor = Object.getOwnPropertyDescriptor(window, "innerHeight");
  const scrollYDescriptor = Object.getOwnPropertyDescriptor(window, "scrollY");
  Object.defineProperty(scrollRoot, "scrollHeight", { configurable: true, value: 2400 });
  Object.defineProperty(scrollRoot, "clientHeight", { configurable: true, value: 800 });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
  Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  } as unknown as Storage;
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });
  const previousLanguage = window.localStorage.getItem(languageKey);
  window.localStorage.setItem(languageKey, "en");
  try {
    render(<LanguageProvider><Home /></LanguageProvider>);
    await waitFor(() => {
      expect(screen.getAllByRole("img", { name: "Scroll down to continue" })).toHaveLength(3);
    });
  } finally {
    if (previousLanguage === null) window.localStorage.removeItem(languageKey);
    else window.localStorage.setItem(languageKey, previousLanguage);
    if (previousDescriptor) Object.defineProperty(window, "localStorage", previousDescriptor);
    else Reflect.deleteProperty(window, "localStorage");
    if (scrollHeightDescriptor) Object.defineProperty(scrollRoot, "scrollHeight", scrollHeightDescriptor);
    else Reflect.deleteProperty(scrollRoot, "scrollHeight");
    if (clientHeightDescriptor) Object.defineProperty(scrollRoot, "clientHeight", clientHeightDescriptor);
    else Reflect.deleteProperty(scrollRoot, "clientHeight");
    if (innerHeightDescriptor) Object.defineProperty(window, "innerHeight", innerHeightDescriptor);
    else Reflect.deleteProperty(window, "innerHeight");
    if (scrollYDescriptor) Object.defineProperty(window, "scrollY", scrollYDescriptor);
    else Reflect.deleteProperty(window, "scrollY");
  }
});
