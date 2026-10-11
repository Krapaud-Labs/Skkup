import { test, expect } from "@playwright/test";

test("viewer streams affiche les cartes plateforme, filtres et favoris", async ({ page }) => {
  await page.route("**/streams", async (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ streams: [
      { id: "youtube-1", plateforme: "YOUTUBE", identifiantChaine: "alpha", nomAffiche: "Alpha Live", estPartenaire: true, bonusPointsHeure: 12 },
      { id: "twitch-1", plateforme: "TWITCH", identifiantChaine: "beta", nomAffiche: "Beta Live" },
    ] }),
  }));
  await page.goto("/streams", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Alpha Live")).toBeVisible();
  await expect(page.getByText("Twitch")).toBeVisible();
  await page.getByRole("combobox", { name: "Filtrer par plateforme" }).selectOption("TWITCH");
  await expect(page.getByText("Beta Live")).toBeVisible();
  await expect(page.getByText("Alpha Live")).toBeHidden();
  await page.getByRole("button", { name: /Ajouter aux favoris : Beta Live/ }).click();
  await expect(page.getByRole("button", { name: /Retirer des favoris : Beta Live/ })).toBeVisible();
});
