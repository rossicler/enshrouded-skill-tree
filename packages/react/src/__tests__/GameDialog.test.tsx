// @vitest-environment jsdom
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GameDialog } from "../kit/GameDialog";

// jsdom runs no CSS transitions, so the dialog sees the ones listed here.
let running: Animation[] = [];
const originalGetAnimations = Element.prototype.getAnimations;

function fakeTransition() {
  let resolve!: () => void;
  const animation = { playState: "running", finished: new Promise<void>((r) => (resolve = r)) };
  return {
    animation: animation as unknown as Animation,
    end: () => {
      animation.playState = "finished";
      resolve();
    },
  };
}

const flush = () => act(() => new Promise<void>((r) => setTimeout(r, 0)));
const panel = () => document.querySelector('[data-dialog="test"]');

const Harness = ({ open }: { open: boolean }) => (
  <GameDialog open={open} onClose={() => {}} name="test">
    <button>inside</button>
  </GameDialog>
);

beforeEach(() => {
  running = [];
  Element.prototype.getAnimations = () => running;
});

afterEach(() => {
  cleanup();
  Element.prototype.getAnimations = originalGetAnimations;
});

describe("GameDialog", () => {
  it("unmounts once its leave transitions end, including ones that start while it waits", async () => {
    const { rerender } = render(<Harness open />);
    await waitFor(() => expect(panel()).not.toBeNull());

    const first = fakeTransition();
    running = [first.animation];
    rerender(<Harness open={false} />);
    expect(panel()?.hasAttribute("data-leaving")).toBe(true);

    // A transition that starts late (a slow render applied the closing
    // styles after the first check) is waited for too.
    const late = fakeTransition();
    running = [first.animation, late.animation];
    first.end();
    await flush();
    expect(panel()).not.toBeNull();

    late.end();
    await flush();
    await waitFor(() => expect(panel()).toBeNull());
  });

  it("unmounts at once without transitions", async () => {
    const { rerender } = render(<Harness open />);
    await waitFor(() => expect(panel()).not.toBeNull());
    rerender(<Harness open={false} />);
    await waitFor(() => expect(panel()).toBeNull());
  });

  it("stays open when reopened while it fades out", async () => {
    const { rerender } = render(<Harness open />);
    await waitFor(() => expect(panel()).not.toBeNull());

    const leave = fakeTransition();
    running = [leave.animation];
    rerender(<Harness open={false} />);
    rerender(<Harness open />);
    expect(panel()?.hasAttribute("data-leaving")).toBe(false);

    leave.end();
    await flush();
    expect(panel()).not.toBeNull();
  });
});
