import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Splash, { SPLASH_MS } from "@/rmacts/Splash";

describe("Splash loading screen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows only the animated bars and hands over to the menu after 10 seconds", () => {
    const onDone = vi.fn();
    const { container } = render(<Splash onDone={onDone} />);

    expect(
      screen.getByRole("status", {
        name: "Loading Regional Maritime Awareness Capability Training School",
      }),
    ).toBeTruthy();
    expect(container.querySelectorAll(".splash-bars span")).toHaveLength(9);
    expect(container.querySelector(".splash-fill")).toBeNull();
    expect(container.querySelector(".splash-track")).toBeNull();
    expect(container.querySelector(".splash-meta")).toBeNull();
    expect(container.textContent).not.toContain("%");
    expect(SPLASH_MS).toBe(10000);
    expect(onDone).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(SPLASH_MS - 200);
    });
    expect(onDone).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
