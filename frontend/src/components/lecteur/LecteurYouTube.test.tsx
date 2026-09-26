import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ORIGINE_YOUTUBE } from "@/lib/lecteur-youtube";
import { LecteurYouTube } from "./LecteurYouTube";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test("accepte uniquement les états émis par la fenêtre YouTube attendue", () => {
  const onEtat = vi.fn();
  const { unmount } = render(
    <LecteurYouTube identifiantChaine="UC123" titre="Alpha" onEtat={onEtat} />,
  );
  const iframe = screen.getByTitle("Lecteur YouTube: Alpha") as HTMLIFrameElement;
  const source = iframe.contentWindow;
  expect(source).not.toBeNull();

  const donnees = JSON.stringify({
    event: "infoDelivery",
    info: { playerState: 1, currentTime: 42 },
  });
  window.dispatchEvent(new MessageEvent("message", { data: donnees, origin: "https://evil.test", source }));
  window.dispatchEvent(new MessageEvent("message", { data: donnees, origin: ORIGINE_YOUTUBE, source: window }));
  expect(onEtat).not.toHaveBeenCalled();

  window.dispatchEvent(new MessageEvent("message", { data: donnees, origin: ORIGINE_YOUTUBE, source }));
  expect(onEtat).toHaveBeenCalledWith({ enLecture: true, positionSecondes: 42 });

  unmount();
  window.dispatchEvent(new MessageEvent("message", { data: donnees, origin: ORIGINE_YOUTUBE, source }));
  expect(onEtat).toHaveBeenCalledTimes(1);
});

test("arrête la poignée de main au démontage", () => {
  const { unmount } = render(
    <LecteurYouTube identifiantChaine="UC123" titre="Alpha" onEtat={vi.fn()} />,
  );
  const iframe = screen.getByTitle("Lecteur YouTube: Alpha") as HTMLIFrameElement;
  const poster = vi.spyOn(iframe.contentWindow!, "postMessage");
  fireEvent.load(iframe);
  expect(poster).toHaveBeenCalled();
  const appels = poster.mock.calls.length;
  unmount();
  vi.advanceTimersByTime(5_000);
  expect(poster).toHaveBeenCalledTimes(appels);
});
