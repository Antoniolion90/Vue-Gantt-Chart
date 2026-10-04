import { describe, it, expect } from "vitest";
import dayjs from "dayjs";
import {
  findBlocks,
  getScaleOptions,
  getTimeOffset,
  groupRows,
  normalizeDateRange
} from "@/utils/demoUtils.js";
import { validateScale } from "@/utils/timeLineUtils.js";

describe("normalizeDateRange", () => {
  it("covers whole first and last days", () => {
    const [start, end] = normalizeDateRange([new Date(2024, 2, 10, 15, 30), new Date(2024, 2, 12)]);
    expect(dayjs(start).format("YYYY-MM-DD HH:mm:ss")).toBe("2024-03-10 00:00:00");
    expect(dayjs(end).format("YYYY-MM-DD HH:mm:ss")).toBe("2024-03-12 23:59:59");
  });

  it("returns null for a cleared or invalid range", () => {
    expect(normalizeDateRange(null)).toBeNull();
    expect(normalizeDateRange([])).toBeNull();
    expect(normalizeDateRange(["nope", new Date()])).toBeNull();
    expect(normalizeDateRange([new Date(2024, 2, 12), new Date(2024, 2, 10)])).toBeNull();
  });
});

describe("getTimeOffset", () => {
  const options = { scale: 60, cellWidth: 50 };

  it("counts from the start time aligned to the scale", () => {
    // Timeline starts at 10:00, not at 10:10
    const start = new Date(2024, 2, 10, 10, 10).toString();
    const time = new Date(2024, 2, 10, 12, 0).toString();
    expect(getTimeOffset(time, start, options)).toBe(100);
  });

  it("is zero at an aligned start", () => {
    const start = new Date(2024, 2, 10, 10, 0).toString();
    expect(getTimeOffset(start, start, options)).toBe(0);
  });
});

const row = (...ids) => ({ gtArray: ids.map((id) => ({ id })) });

describe("findBlocks", () => {
  const cellHeight = 10;

  it("finds matches in every group, not only the first one", () => {
    const groups = [
      { isOpen: true, children: [row("AA1"), row("AA2")] },
      { isOpen: true, children: [row("BB1"), row("XY7", "BB2")] }
    ];
    const { matches, groupIndexes } = findBlocks(groups, "XY", cellHeight);
    expect(groupIndexes).toEqual([1]);
    expect(matches).toHaveLength(1);
    // Group 0 takes 3 rows (header + 2), then group 1 header, then row 0, then row 1
    expect(matches[0]).toMatchObject({ block: { id: "XY7" }, groupIndex: 1, y: 50 });
  });

  it("uses the row position inside the group, not the original index", () => {
    const groups = [
      { isOpen: true, children: [{ rawIndex: 7, ...row("AB1") }] },
      { isOpen: true, children: [{ rawIndex: 3, ...row("AB2") }] }
    ];
    const { matches } = findBlocks(groups, "AB", cellHeight);
    expect(matches.map((m) => m.y)).toEqual([10, 30]);
  });

  it("treats closed groups with matches as open and closed groups without matches as collapsed", () => {
    const groups = [
      { isOpen: false, children: [row("AA1"), row("AA2"), row("AA3")] },
      { isOpen: false, children: [row("BB1"), row("CC1")] }
    ];
    const { matches, groupIndexes } = findBlocks(groups, "CC", cellHeight);
    expect(groupIndexes).toEqual([1]);
    // Group 0 stays collapsed (header only), group 1 opens
    expect(matches[0].y).toBe(30);
  });

  it("returns all matches in display order", () => {
    const groups = [{ isOpen: true, children: [row("A1", "A2"), row("B1"), row("A3")] }];
    const { matches } = findBlocks(groups, "A", cellHeight);
    expect(matches.map((m) => [m.block.id, m.y])).toEqual([
      ["A1", 10],
      ["A2", 10],
      ["A3", 30]
    ]);
  });

  it("returns nothing when there are no matches", () => {
    const groups = [{ isOpen: true, children: [row("A1")] }];
    expect(findBlocks(groups, "Z", cellHeight)).toEqual({ matches: [], groupIndexes: [] });
  });
});

describe("groupRows", () => {
  const rows = [
    { id: "r1", type: "🚅", speed: 10 },
    { id: "r2", type: "🚈", speed: 60 },
    { id: "r3", type: "🚅", speed: 120 },
    { id: "r4", type: "🚄", speed: 50 }
  ];
  const ids = (group) => group.children.map((row) => row.id);

  it("puts all rows in one group without a selection", () => {
    const groups = groupRows(rows, [], []);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ groupType: {}, isOpen: true });
    expect(ids(groups[0])).toEqual(["r1", "r2", "r3", "r4"]);
  });

  it("groups by type", () => {
    const groups = groupRows(rows, ["🚅", "🚄"], []);
    expect(groups.map((g) => g.groupType)).toEqual([{ type: "🚅" }, { type: "🚄" }]);
    expect(groups.map(ids)).toEqual([["r1", "r3"], ["r4"]]);
  });

  it("groups by speed ranges, the last range is open-ended", () => {
    const groups = groupRows(rows, [], ["0~50", "50~100", "100"]);
    expect(groups.map(ids)).toEqual([["r1"], ["r2", "r4"], ["r3"]]);
  });

  it("groups by every speed and type combination", () => {
    const groups = groupRows(rows, ["🚅", "🚈"], ["0~50", "50~100"]);
    expect(groups.map((g) => g.groupType)).toEqual([
      { speed: "0~50", type: "🚅" },
      { speed: "0~50", type: "🚈" },
      { speed: "50~100", type: "🚅" },
      { speed: "50~100", type: "🚈" }
    ]);
    expect(groups.map(ids)).toEqual([["r1"], [], [], ["r2"]]);
    expect(groups[0]).toMatchObject({ speed: "0~50", type: "🚅" });
  });

  it("keeps groups collapsed after regrouping", () => {
    const first = groupRows(rows, ["🚅", "🚈"], []);
    first[1].isOpen = false;
    const second = groupRows(rows.slice(1), ["🚅", "🚈"], [], first);
    expect(second.map((g) => g.isOpen)).toEqual([true, false]);
  });

  it("opens groups that did not exist before", () => {
    const first = groupRows(rows, ["🚅"], []);
    first[0].isOpen = false;
    const second = groupRows(rows, ["🚅", "🚈"], [], first);
    expect(second.map((g) => g.isOpen)).toEqual([false, true]);
  });
});

describe("getScaleOptions", () => {
  it("labels scales with units", () => {
    const labels = Object.fromEntries(getScaleOptions().map((o) => [o.value, o.label]));
    expect(labels[1]).toBe("1 minute");
    expect(labels[30]).toBe("30 minutes");
    expect(labels[60]).toBe("1 hour");
    expect(labels[360]).toBe("6 hours");
    expect(labels[1440]).toBe("1 day");
    expect(labels[4320]).toBe("3 days");
  });

  it("only offers scales the gantt accepts", () => {
    const values = getScaleOptions().map((o) => o.value);
    values.forEach((value) => expect(() => validateScale(value)).not.toThrow());
  });
});
