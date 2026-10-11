import { beforeEach, describe, expect, test, vi } from "vitest";

const { mockedIo } = vi.hoisted(() => ({ mockedIo: vi.fn() }));

vi.mock("socket.io-client", () => ({ io: mockedIo }));
vi.mock("./api", () => ({ URL_API: "https://localhost/api" }));

const { connecterTempsReel, origineSocketTempsReel } = await import(
  "./temps-reel"
);

describe("connexion temps réel", () => {
  beforeEach(() => {
    mockedIo.mockReset();
    mockedIo.mockReturnValue({});
  });

  test("retire le préfixe REST du point d'entrée Socket.IO", () => {
    expect(origineSocketTempsReel("https://localhost/api")).toBe(
      "https://localhost",
    );
    expect(origineSocketTempsReel("https://api.example.test")).toBe(
      "https://api.example.test",
    );
  });

  test("utilise la gateway Socket.IO hors namespace REST", () => {
    connecterTempsReel();

    expect(mockedIo).toHaveBeenCalledWith("https://localhost", {
      path: "/socket.io",
      withCredentials: true,
    });
  });
});
