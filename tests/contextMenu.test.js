import { describe, it, expect } from "vitest";
import { clampMenuPosition } from "@/components/context-menu/position.js";

const menu = { width: 120, height: 80 };
const viewport = { width: 1000, height: 600 };

describe("clampMenuPosition", () => {
  it("keeps the cursor position when the menu fits", () => {
    expect(clampMenuPosition(100, 100, menu, viewport)).toEqual({ x: 100, y: 100 });
  });

  it("opens to the left near the right edge", () => {
    expect(clampMenuPosition(950, 100, menu, viewport)).toEqual({ x: 830, y: 100 });
  });

  it("opens upwards near the bottom edge", () => {
    expect(clampMenuPosition(100, 580, menu, viewport)).toEqual({ x: 100, y: 500 });
  });

  it("never goes past the top-left corner", () => {
    const tiny = { width: 100, height: 50 };
    expect(clampMenuPosition(90, 40, menu, tiny)).toEqual({ x: 0, y: 0 });
  });
});
