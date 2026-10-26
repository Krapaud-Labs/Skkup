import { copyFile, mkdir, mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { GET, HEAD } from "./route";

const get = (path: string[]) =>
  GET(new Request("http://localhost/assets/test"), {
    params: Promise.resolve({ path }),
  });

describe("GET /assets/[...path]", () => {
  it.each([
    "analytics.png", "arrow.png", "arrow-up-right.png", "audit.png", "bell.png",
    "check.png", "chevronDown.png", "close.png", "draws.png", "extension.png",
    "eye.png", "favorite-heart-active.png", "favorite-heart.png", "flag.png",
    "flame.png", "gift.png", "megaphone.png", "points.png", "rules.png", "scratchCard.png",
    "shield.png", "sparkle.png", "status-pending.png", "streams.png", "ticket.png",
    "timer.png", "trophy.png", "users.png", "warning.png",
  ])("sert le PNG d’interface autorisé %s", async (filename) => {
    const response = await get(["icons", "ui", filename]);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(Number(response.headers.get("content-length"))).toBeGreaterThan(0);
  });

  it("sert un PNG autorisé sans altérer ses octets", async () => {
    const relativePath = "icons/ui/ticket.png";
    const response = await get(relativePath.split("/"));
    const expected = await readFile(resolve(process.cwd(), "../asset", relativePath));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("content-length")).toBe(String(expected.byteLength));
    const actual = Buffer.from(await response.arrayBuffer());
    expect(actual.equals(expected), "response bytes must exactly match the source").toBe(true);
  });

  it("répond à HEAD avec les métadonnées sans corps", async () => {
    const response = await HEAD(new Request("http://localhost/assets/test"), {
      params: Promise.resolve({ path: ["icons", "ui", "ticket.png"] }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("content-length")).not.toBeNull();
    expect((await response.arrayBuffer()).byteLength).toBe(0);
  });

  it("refuse un lien symbolique interne vers un fichier source privé", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "skkup-assets-route-"));
    const previousRoot = process.env.SKKUP_ASSET_ROOT;
    const privateSource = join(temporaryRoot, "brand/source/skkup-s-source.png");
    const publicAlias = join(temporaryRoot, "icons/ui/ticket.png");

    try {
      await mkdir(join(temporaryRoot, "brand/source"), { recursive: true });
      await mkdir(join(temporaryRoot, "icons/ui"), { recursive: true });
      await copyFile(resolve(process.cwd(), "../asset/brand/source/skkup-s-source.png"), privateSource);
      await symlink("../../brand/source/skkup-s-source.png", publicAlias);
      process.env.SKKUP_ASSET_ROOT = temporaryRoot;

      const response = await get(["icons", "ui", "ticket.png"]);
      expect(response.status).toBe(404);
    } finally {
      if (previousRoot === undefined) delete process.env.SKKUP_ASSET_ROOT;
      else process.env.SKKUP_ASSET_ROOT = previousRoot;
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it.each([
    { label: "source de marque", path: ["brand", "source", "skkup-s-source.png"] },
    { label: "promotion extension", path: ["extension", "store", "skkup-promo-large.jpg"] },
    { label: "traversée de répertoire", path: ["..", "README.md"] },
    { label: "ancien pictogramme cube retiré", path: ["icons", "ui", "cube.png"] },
    { label: "ancien emplacement des points déplacé", path: ["dashboard", "illustrations", "skkup-icon-points.png"] },
    { label: "ancienne illustration ticket remplacée", path: ["dashboard", "illustrations", "skkup-icon-ticket-s.png"] },
    { label: "ancienne illustration de série remplacée par flame", path: ["dashboard", "illustrations", "skkup-icon-streak.png"] },
    { label: "répertoire sans fichier", path: ["icons", "ui"] },
  ])("refuse l’accès au chemin $label", async ({ path }) => {
    const response = await get(path);

    expect(response.status).toBe(404);
  });
});
