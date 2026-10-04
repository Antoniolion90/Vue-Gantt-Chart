import { describe, it, expect } from "vitest";
import { getPositionOffset, getWidthAbout2Times } from "@/utils/gtUtils.js";

const options = { scale: 60, cellWidth: 50 };

describe("getWidthAbout2Times", () => {
  it("converts duration to pixels", () => {
    expect(getWidthAbout2Times("2024-03-10T10:00:00", "2024-03-10T12:00:00", options)).toBe(100);
    expect(getWidthAbout2Times("2024-03-10T10:00:00", "2024-03-10T10:30:00", options)).toBe(25);
  });

  it("respects scale and cell width", () => {
    const opts = { scale: 15, cellWidth: 20 };
    expect(getWidthAbout2Times("2024-03-10T10:00:00", "2024-03-10T11:00:00", opts)).toBe(80);
  });

  it("does not return a stale cached start", () => {
    getWidthAbout2Times("2024-03-10T10:00:00", "2024-03-10T11:00:00", options);
    expect(getWidthAbout2Times("2024-03-10T11:00:00", "2024-03-10T12:00:00", options)).toBe(50);
  });
});

describe("getPositionOffset", () => {
  const begin = "2024-03-10T00:00:00";

  it("returns offset from the timeline start", () => {
    expect(getPositionOffset("2024-03-10T03:00:00", begin, options)).toBe(150);
    expect(getPositionOffset(begin, begin, options)).toBe(0);
  });

  it("returns negative offset before the timeline start", () => {
    expect(getPositionOffset("2024-03-09T23:00:00", begin, options)).toBe(-50);
  });

  it("follows a changed timeline start", () => {
    expect(getPositionOffset("2024-03-10T03:00:00", "2024-03-10T01:00:00", options)).toBe(100);
  });
});
