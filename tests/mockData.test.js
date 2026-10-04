import { describe, it, expect } from "vitest";
import { mockDatas } from "@/api/mock-data.js";

const channel = "(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)";
const rgba = new RegExp(`^rgb\\(${channel}, ${channel}, ${channel},0\\.\\d\\)$`);

describe("mockDatas", () => {
  it("generates valid row colors", () => {
    const rows = mockDatas(10, 1, [new Date(2024, 2, 10), new Date(2024, 2, 11)]);
    for (const { colorPair } of rows) {
      expect(colorPair.dark).toMatch(rgba);
      expect(colorPair.light).toMatch(rgba);
    }
  });
});
