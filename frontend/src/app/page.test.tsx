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
  expect(stats?.className).toContain("skuup-stats mx-auto mt-12 grid max-w-6xl grid-cols-2 gap-px px-6 sm:grid-cols-4");
  const statIcons = Array.from(stats?.querySelectorAll(".skuup-stat-icon img") ?? [])
    .map((image) => decodeURIComponent(image.getAttribute("src") ?? ""));
  expect(statIcons.map((src) => src.match(/icons\/ui\/(eye|points|trophy|shield)\.png/)?.[1]))
    .toEqual(["eye", "points", "trophy", "shield"]);
  expect(how?.classList.contains("skuup-home-snap-section")).toBe(true);
  expect(how?.querySelector("#engagement")).not.toBeNull();
  expect(how?.querySelector("footer")).not.toBeNull();
  expect(how?.querySelector(".skuup-stats")).toBeNull();
});
