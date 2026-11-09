import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';

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

  expect(decodeURIComponent(heroImage.getAttribute('src') ?? ''))
    .toContain('/assets/marketing/hero/skkup-hero-products.png');
  expect(heroImage.getAttribute('width')).toBe('1536');
  expect(heroImage.getAttribute('height')).toBe('1024');
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

test("aligne le contenu du CTA de fin à gauche sans changer le pied de page", () => {
  const { container } = render(<Home />);
  const cta = container.querySelector("#engagement");
  const content = cta?.firstElementChild;

  expect(cta?.classList.contains("text-left")).toBe(true);
  expect(content?.classList.contains("items-start")).toBe(true);
  expect(content?.classList.contains("justify-start")).toBe(true);
  expect(content?.classList.contains("sm:flex-row")).toBe(false);
  expect(cta?.querySelector("h2")?.textContent).toBe("Prêt à commencer ?");
  expect(cta?.querySelector('a[href="/connexion"]')?.textContent).toContain("Créer mon compte");
  expect(cta?.nextElementSibling?.tagName).toBe("FOOTER");
  expect(cta?.nextElementSibling?.classList.contains("justify-center")).toBe(true);
});
