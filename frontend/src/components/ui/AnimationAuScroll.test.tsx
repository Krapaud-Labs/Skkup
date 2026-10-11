import { render } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { AnimationAuScroll } from "./AnimationAuScroll";

describe("AnimationAuScroll", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("laisse le contenu visible si IntersectionObserver est indisponible", () => {
    vi.stubGlobal("IntersectionObserver", undefined);

    const { container } = render(
      <AnimationAuScroll>
        <p>Contenu visible</p>
      </AnimationAuScroll>,
    );

    expect(container.firstElementChild?.className).toContain("skuup-reveal-visible");
  });
});
