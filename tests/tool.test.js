import { describe, it, expect } from "vitest";
import { applyAdjustList, buildAdjustList, checkConflict } from "@/utils/tool.js";

const block = (id, start, end, parentId, extra = {}) => ({ id, start, end, parentId, ...extra });

function makeRows() {
  return [
    {
      id: "R1",
      gtArray: [block("A", "2024-03-10T10:00", "2024-03-10T12:00", "R1")]
    },
    {
      id: "R2",
      gtArray: [
        block("B", "2024-03-10T11:00", "2024-03-10T13:00", "R2"),
        block("C", "2024-03-10T14:00", "2024-03-10T15:00", "R2")
      ]
    }
  ];
}

describe("checkConflict", () => {
  it("detects partial overlap", () => {
    const [r1, r2] = makeRows();
    const result = checkConflict(r1.gtArray[0], r2);
    expect(result.conflictList).toHaveLength(1);
    expect(result.targetRowId).toBe("R2");
    expect(result.blockId).toBe("A");
  });

  it("detects a block fully inside the moved block", () => {
    const row = { id: "R", gtArray: [block("X", "2024-03-10T11:00", "2024-03-10T11:30", "R")] };
    const moved = block("M", "2024-03-10T10:00", "2024-03-10T12:00", "Q");
    expect(checkConflict(moved, row).conflictList).toHaveLength(1);
  });

  it("allows adjacent blocks", () => {
    const row = { id: "R", gtArray: [block("X", "2024-03-10T12:00", "2024-03-10T13:00", "R")] };
    const moved = block("M", "2024-03-10T10:00", "2024-03-10T12:00", "Q");
    expect(checkConflict(moved, row).conflictList).toHaveLength(0);
  });

  it("ignores the target block, the block itself and moved-before shadows", () => {
    const row = {
      id: "R",
      gtArray: [
        block("T", "2024-03-10T10:00", "2024-03-10T12:00", "R"),
        block("S", "2024-03-10T10:00", "2024-03-10T12:00", "R", { movedStatus: "before" }),
        block("M", "2024-03-10T10:00", "2024-03-10T12:00", "R")
      ]
    };
    const moved = block("M", "2024-03-10T10:00", "2024-03-10T12:00", "Q");
    expect(checkConflict(moved, row, row.gtArray[0]).conflictList).toHaveLength(0);
  });
});

describe("buildAdjustList", () => {
  it("builds one adjustment for a move", () => {
    const [r1, r2] = makeRows();
    const list = buildAdjustList({
      currentBlock: r1.gtArray[0],
      currentRow: r1,
      targetBlock: null,
      targetRow: r2
    });
    expect(list.map((a) => [a.blockId, a.targetRowId])).toEqual([["A", "R2"]]);
  });

  it("builds two adjustments for a swap", () => {
    const [r1, r2] = makeRows();
    const list = buildAdjustList({
      currentBlock: r1.gtArray[0],
      currentRow: r1,
      targetBlock: r2.gtArray[1],
      targetRow: r2
    });
    expect(list.map((a) => [a.blockId, a.targetRowId])).toEqual([
      ["A", "R2"],
      ["C", "R1"]
    ]);
  });

  it("returns nothing without a selection", () => {
    const empty = { currentBlock: null, currentRow: null, targetBlock: null, targetRow: null };
    expect(buildAdjustList(empty)).toEqual([]);
  });
});

describe("applyAdjustList", () => {
  it("moves a block without mutating the source", () => {
    const rows = makeRows();
    const adjust = [checkConflict(rows[0].gtArray[0], rows[1])];
    const result = applyAdjustList(rows, adjust, false);

    expect(result[0].gtArray).toHaveLength(0);
    expect(result[1].gtArray.map((b) => b.id)).toEqual(["B", "C", "A"]);
    expect(result[1].gtArray[2]).toMatchObject({ parentId: "R2", movedStatus: "after" });
    expect(rows[0].gtArray).toHaveLength(1);
    expect(rows[1].gtArray).toHaveLength(2);
  });

  it("keeps a shadow when showMovedBlock is on", () => {
    const rows = makeRows();
    const adjust = [checkConflict(rows[0].gtArray[0], rows[1])];
    const result = applyAdjustList(rows, adjust, true);

    expect(result[0].gtArray).toEqual([
      expect.objectContaining({ id: "A", movedStatus: "before" })
    ]);
    expect(result[1].gtArray.at(-1)).toMatchObject({ id: "A", movedStatus: "after" });
  });

  it("does not leave a second shadow for an already moved block", () => {
    const rows = makeRows();
    const once = applyAdjustList(rows, [checkConflict(rows[0].gtArray[0], rows[1])], true);
    const moved = once[1].gtArray.at(-1);
    const twice = applyAdjustList(once, [checkConflict(moved, once[0])], true);

    expect(twice[1].gtArray.map((b) => b.id)).toEqual(["B", "C"]);
    expect(twice[0].gtArray.map((b) => [b.id, b.movedStatus])).toEqual([
      ["A", "before"],
      ["A", "after"]
    ]);
  });

  it("skips adjustments for unknown rows", () => {
    const rows = makeRows();
    const adjust = [{ blockItem: block("Z", "", "", "nope"), blockId: "Z", targetRowId: "R1" }];
    expect(applyAdjustList(rows, adjust, true)).toEqual(rows);
  });
});
