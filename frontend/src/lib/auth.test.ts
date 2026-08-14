import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ErreurApi } from "./api";
import { connexion, deconnexion, fetchAuthentifie, inscription } from "./auth";

/**
 * La session étant portée par un cookie httpOnly, ces tests vérifient
 * surtout deux invariants : chaque appel doit joindre le cookie
 * (`credentials: "include"`, sans quoi le backend répond 401), et rien
 * ne doit être écrit dans le stockage local du navigateur.
 */

function reponseJson(corps: unknown, statut = 200): Response {
  return new Response(JSON.stringify(corps), {
    status: statut,
    headers: { "Content-Type": "application/json" },
  });
}

let fetchSimule: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchSimule = vi.fn();
  vi.stubGlobal("fetch", fetchSimule);
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("connexion", () => {
  test("appelle POST /auth/login avec le cookie de session", async () => {
    fetchSimule.mockResolvedValue(reponseJson({ pseudo: "Lyra" }));

    const reponse = await connexion({
      email: "lyra@example.com",
      motDePasse: "motdepasse123",
    });

    expect(reponse).toEqual({ pseudo: "Lyra" });
    const [url, options] = fetchSimule.mock.calls[0];
    expect(url).toContain("/auth/login");
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("include");
  });

  test("ne stocke aucun jeton côté client", async () => {
    fetchSimule.mockResolvedValue(reponseJson({ pseudo: "Lyra" }));

    await connexion({ email: "lyra@example.com", motDePasse: "motdepasse123" });

    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });

  test("propage le message d'erreur renvoyé par le backend", async () => {
    fetchSimule.mockResolvedValue(
      reponseJson({ message: "Identifiants invalides." }, 401),
    );

    await expect(
      connexion({ email: "lyra@example.com", motDePasse: "mauvais" }),
    ).rejects.toMatchObject({
      name: "ErreurApi",
      statut: 401,
      message: "Identifiants invalides.",
    });
  });

  test("agrège les messages de validation renvoyés en tableau", async () => {
    fetchSimule.mockResolvedValue(
      reponseJson({ message: ["email must be an email"] }, 400),
    );

    await expect(
      connexion({ email: "pas-un-email", motDePasse: "motdepasse123" }),
    ).rejects.toThrow("email must be an email");
  });
});

describe("inscription", () => {
  test("transmet le pseudo en plus des identifiants", async () => {
    fetchSimule.mockResolvedValue(reponseJson({ pseudo: "Lyra" }, 201));

    await inscription({
      email: "lyra@example.com",
      motDePasse: "motdepasse123",
      pseudo: "Lyra",
    });

    const [url, options] = fetchSimule.mock.calls[0];
    expect(url).toContain("/auth/register");
    expect(JSON.parse(options.body)).toEqual({
      email: "lyra@example.com",
      motDePasse: "motdepasse123",
      pseudo: "Lyra",
    });
    expect(options.credentials).toBe("include");
  });
});

describe("deconnexion", () => {
  test("appelle POST /auth/logout et accepte une réponse sans corps", async () => {
    fetchSimule.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(deconnexion()).resolves.toBeUndefined();

    const [url, options] = fetchSimule.mock.calls[0];
    expect(url).toContain("/auth/logout");
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("include");
  });
});

describe("fetchAuthentifie", () => {
  test("joint le cookie de session sans écraser les options fournies", async () => {
    fetchSimule.mockResolvedValue(reponseJson({ soldePoints: 42 }));

    await fetchAuthentifie("/me", { headers: { "X-Test": "1" } });

    const [url, options] = fetchSimule.mock.calls[0];
    expect(url).toContain("/me");
    expect(options.credentials).toBe("include");
    expect(options.headers).toEqual({ "X-Test": "1" });
  });

  test("signale une erreur réseau sans exposer de détail technique", async () => {
    fetchSimule.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchAuthentifie("/me")).rejects.toBeInstanceOf(ErreurApi);
  });
});
