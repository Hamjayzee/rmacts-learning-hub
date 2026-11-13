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

  it("shows a loading bar and only hands over to the menu after 8 seconds", () => {
    const onDone = vi.fn();
    const { container } = render(<Splash onDone={onDone} />);

    expect(
      screen.getByRole("status", {
        name: "Loading Regional Maritime Awareness Capability Training School",
      }),
    ).toBeTruthy();
    expect(container.querySelector(".splash-fill")).toBeTruthy();
    expect(SPLASH_MS).toBe(8000);
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
