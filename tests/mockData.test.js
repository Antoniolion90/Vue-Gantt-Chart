import { describe, it, expect } from "vitest";
import dayjs from "dayjs";
import { mockDatas } from "@/api/mock-data.js";

const channel = "(?:25[0-5]|2[0-4][0-9]|1?[0-9]?[0-9])";
const rgba = new RegExp(`^rgb[(]${channel}, ${channel}, ${channel},0[.][0-9][)]$`);
const week = [new Date(2024, 2, 10), new Date(2024, 2, 16, 23, 59)];

describe("mockDatas", () => {
  it("generates valid row colors", () => {
    const rows = mockDatas(10, 1, week);
    for (const { colorPair } of rows) {
      expect(colorPair.dark).toMatch(rgba);
      expect(colorPair.light).toMatch(rgba);
    }
  });

  it("keeps blocks inside the time range", () => {
    const range = [new Date(2024, 2, 10), new Date(2024, 2, 11)];
    const rows = mockDatas(20, 25, range);
    for (const row of rows) {
      expect(row.gtArray.length).toBeLessThan(25);
      for (const block of row.gtArray) {
        expect(dayjs(block.start).isBefore(range[1])).toBe(true);
        expect(dayjs(block.end).isAfter(range[1])).toBe(false);
      }
    }
  });

  it("generates unique block ids, also with more than 26 columns", () => {
    const longRange = [new Date(2024, 0, 1), new Date(2024, 11, 31)];
    const rows = mockDatas(300, 60, longRange, 1234567);
    const ids = rows.flatMap((row) => row.gtArray.map((block) => block.id));
    expect(ids).toHaveLength(300 * 60);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[A-Z]{2}\d+$/);
  });
});
