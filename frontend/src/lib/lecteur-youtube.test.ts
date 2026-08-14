import { describe, expect, test } from "vitest";
import {
  ORIGINE_YOUTUBE,
  interpreterMessageYouTube,
  urlEmbarquementYouTube,
} from "./lecteur-youtube";

describe("urlEmbarquementYouTube", () => {
  test("borne le lecteur à la chaîne et à l'origine du site", () => {
    const url = new URL(
      urlEmbarquementYouTube("UC chaîne/test", "https://viewer.example"),
    );

    expect(url.origin).toBe(ORIGINE_YOUTUBE);
    expect(url.pathname).toBe("/embed/live_stream");
    expect(url.searchParams.get("channel")).toBe("UC chaîne/test");
    expect(url.searchParams.get("enablejsapi")).toBe("1");
    expect(url.searchParams.get("origin")).toBe("https://viewer.example");
  });
});

describe("interpreterMessageYouTube", () => {
  test("traduit l'état de lecture et la position", () => {
    expect(
      interpreterMessageYouTube(
        JSON.stringify({ event: "infoDelivery", info: { playerState: 1, currentTime: 42.5 } }),
      ),
    ).toEqual({ enLecture: true, positionSecondes: 42.5 });
  });

  test("considère tout autre état comme une lecture inactive", () => {
    expect(
      interpreterMessageYouTube(
        JSON.stringify({ event: "infoDelivery", info: { playerState: 2, currentTime: 18 } }),
      ),
    ).toEqual({ enLecture: false, positionSecondes: 18 });
  });

  test.each([
    null,
    { info: { playerState: 1 } },
    "pas du JSON",
    JSON.stringify({ event: "onReady" }),
    JSON.stringify({ event: "infoDelivery", info: { playerState: Number.NaN } }),
  ])("ignore un message inexploitable", (message) => {
    expect(interpreterMessageYouTube(message)).toBeNull();
  });
});
