// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import gantt from "@/components/v-gantt/index.js";

const { totalHeight, groupTops } = gantt.computed;

describe("gantt group layout", () => {
  const datas = [
    { isOpen: true, children: [{}, {}] },
    { isOpen: false, children: [{}] },
    // An open group without rows takes only its header row
    { isOpen: true }
  ];

  it("counts the header and the rows of open groups", () => {
    expect(totalHeight.call({ datas, cellHeight: 10 })).toBe(50);
  });

  it("places each group below the previous one", () => {
    expect(groupTops.call({ datas, cellHeight: 10 })).toEqual([0, 30, 40]);
  });
});

describe("gantt plugin", () => {
  it("exposes the package version", () => {
    const { version } = JSON.parse(readFileSync("package.json", "utf-8"));
    expect(gantt.version).toBe(version);
  });
});
