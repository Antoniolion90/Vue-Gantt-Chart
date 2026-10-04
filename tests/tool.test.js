import { describe, it, expect } from "vitest";
import {
  applyAdjustList,
  buildAdjustList,
  canMoveBlock,
  checkConflict,
  revalidateAdjust
} from "@/utils/tool.js";

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

  it("skips a move into the row the block is already in", () => {
    const [r1] = makeRows();
    const list = buildAdjustList({
      currentBlock: r1.gtArray[0],
      currentRow: r1,
      targetBlock: null,
      targetRow: r1
    });
    expect(list).toEqual([]);
  });

  it("skips a swap inside one row", () => {
    const [, r2] = makeRows();
    const list = buildAdjustList({
      currentBlock: r2.gtArray[0],
      currentRow: r2,
      targetBlock: r2.gtArray[1],
      targetRow: r2
    });
    expect(list).toEqual([]);
  });

  it("treats a drop on a shadow as a drop on its row", () => {
    const [r1, r2] = makeRows();
    const shadow = { ...r2.gtArray[1], movedStatus: "before" };
    const list = buildAdjustList({
      currentBlock: r1.gtArray[0],
      currentRow: r1,
      targetBlock: shadow,
      targetRow: r2
    });
    expect(list.map((a) => [a.blockId, a.targetRowId])).toEqual([["A", "R2"]]);
    expect(list[0].targetBlockItem).toBeNull();
  });
});

describe("revalidateAdjust", () => {
  it("checks the adjustment again and keeps ignored conflicts out", () => {
    const rows = makeRows();
    const adjust = checkConflict(rows[0].gtArray[0], rows[1]);
    adjust.conflictList[0].isIgnore = true;
    expect(revalidateAdjust(adjust, rows)).toEqual([]);
  });

  it("finds conflicts that appeared after the first check", () => {
    const rows = makeRows();
    const free = block("F", "2024-03-10T16:00", "2024-03-10T17:00", "R1");
    const adjust = checkConflict(free, rows[1]);
    expect(adjust.conflictList).toHaveLength(0);

    rows[1].gtArray.push(block("N", "2024-03-10T16:30", "2024-03-10T18:00", "R2"));
    expect(revalidateAdjust(adjust, rows)).toHaveLength(1);
  });

  it("still excludes the swap target", () => {
    const rows = makeRows();
    const adjust = checkConflict(rows[0].gtArray[0], rows[1], rows[1].gtArray[0]);
    expect(revalidateAdjust(adjust, rows)).toEqual([]);
  });
});

describe("applyAdjustList", () => {
  it("moves a block without mutating the source", () => {
    const rows = makeRows();
    const snapshot = structuredClone(rows);
    const adjust = [checkConflict(rows[0].gtArray[0], rows[1])];
    const result = applyAdjustList(rows, adjust, false);

    expect(result[0].gtArray).toHaveLength(0);
    expect(result[1].gtArray.map((b) => b.id)).toEqual(["B", "C", "A"]);
    expect(result[1].gtArray[2]).toMatchObject({ parentId: "R2", movedStatus: "after" });
    expect(rows).toEqual(snapshot);
  });

  it("copies only the rows it changes", () => {
    const rows = [...makeRows(), { id: "R3", gtArray: [] }];
    const result = applyAdjustList(rows, [checkConflict(rows[0].gtArray[0], rows[1])], true);
    expect(result[2]).toBe(rows[2]);
    expect(result[0]).not.toBe(rows[0]);
    expect(result[1].gtArray[0]).toBe(rows[1].gtArray[0]);
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

  it("moves an already moved block without leaving a second shadow", () => {
    const rows = [...makeRows(), { id: "R3", gtArray: [] }];
    const once = applyAdjustList(rows, [checkConflict(rows[0].gtArray[0], rows[1])], true);
    const moved = once[1].gtArray.at(-1);
    const twice = applyAdjustList(once, [checkConflict(moved, once[2])], true);

    expect(twice[0].gtArray.map((b) => [b.id, b.movedStatus])).toEqual([["A", "before"]]);
    expect(twice[1].gtArray.map((b) => b.id)).toEqual(["B", "C"]);
    expect(twice[2].gtArray.map((b) => [b.id, b.movedStatus])).toEqual([["A", "after"]]);
  });

  it("restores a block moved back to its original row instead of duplicating it", () => {
    const rows = makeRows();
    const once = applyAdjustList(rows, [checkConflict(rows[0].gtArray[0], rows[1])], true);
    const moved = once[1].gtArray.at(-1);
    const back = applyAdjustList(once, [checkConflict(moved, once[0])], true);

    expect(back[0].gtArray).toEqual([block("A", "2024-03-10T10:00", "2024-03-10T12:00", "R1")]);
    expect(back[1].gtArray.map((b) => b.id)).toEqual(["B", "C"]);
  });

  it("swaps two blocks between rows", () => {
    const rows = makeRows();
    const adjust = buildAdjustList({
      currentBlock: rows[0].gtArray[0],
      currentRow: rows[0],
      targetBlock: rows[1].gtArray[1],
      targetRow: rows[1]
    });
    const result = applyAdjustList(rows, adjust, false);
    expect(result[0].gtArray.map((b) => b.id)).toEqual(["C"]);
    expect(result[1].gtArray.map((b) => b.id)).toEqual(["B", "A"]);
  });

  it("skips adjustments for unknown rows", () => {
    const rows = makeRows();
    const adjust = [{ blockItem: block("Z", "", "", "nope"), blockId: "Z", targetRowId: "R1" }];
    expect(applyAdjustList(rows, adjust, true)).toEqual(rows);
  });
});

describe("canMoveBlock", () => {
  const now = "2024-03-10T12:00";

  it("allows blocks that have not started", () => {
    expect(canMoveBlock(block("A", "2024-03-10T13:00", "2024-03-10T14:00", "R"), now)).toBe(true);
  });

  it("forbids blocks in progress or in the past", () => {
    expect(canMoveBlock(block("A", "2024-03-10T11:00", "2024-03-10T13:00", "R"), now)).toBe(false);
    expect(canMoveBlock(block("A", "2024-03-10T09:00", "2024-03-10T10:00", "R"), now)).toBe(false);
  });

  it("forbids shadows of moved blocks and missing blocks", () => {
    const shadow = block("A", "2024-03-10T13:00", "2024-03-10T14:00", "R", {
      movedStatus: "before"
    });
    expect(canMoveBlock(shadow, now)).toBe(false);
    expect(canMoveBlock(null, now)).toBe(false);
  });
});

describe("buildAdjustList with the current time", () => {
  // A (10:00-12:00) is in R1, B (11:00-13:00) and C (14:00-15:00) are in R2
  const selection = (rows, targetBlock) => ({
    currentBlock: rows[0].gtArray[0],
    currentRow: rows[0],
    targetBlock,
    targetRow: rows[1]
  });

  it("does not move a block that already started", () => {
    const rows = makeRows();
    expect(buildAdjustList(selection(rows, null), "2024-03-10T10:30")).toEqual([]);
  });

  it("does not swap a target block that already started", () => {
    const rows = [
      { id: "R1", gtArray: [block("L", "2024-03-10T16:00", "2024-03-10T17:00", "R1")] },
      { id: "R2", gtArray: [block("E", "2024-03-10T08:00", "2024-03-10T10:00", "R2")] }
    ];
    // E started at 08:00, L starts at 16:00: L moves to R2, E stays where it is
    const list = buildAdjustList(selection(rows, rows[1].gtArray[0]), "2024-03-10T09:00");
    expect(list.map((a) => [a.blockId, a.targetRowId])).toEqual([["L", "R2"]]);
    expect(list[0].targetBlockItem).toBeNull();
  });

  it("swaps when both blocks have not started", () => {
    const rows = makeRows();
    const list = buildAdjustList(selection(rows, rows[1].gtArray[1]), "2024-03-10T09:00");
    expect(list.map((a) => [a.blockId, a.targetRowId])).toEqual([
      ["A", "R2"],
      ["C", "R1"]
    ]);
  });
});

describe("checkConflict overlap", () => {
  const row = { id: "R", gtArray: [block("X", "2024-03-10T10:00", "2024-03-10T12:00", "R")] };
  const conflicts = (start, end) =>
    checkConflict(block("M", start, end, "Q"), row).conflictList.length;

  it("detects blocks with the same time, or inside the target block", () => {
    expect(conflicts("2024-03-10T10:00", "2024-03-10T12:00")).toBe(1);
    expect(conflicts("2024-03-10T10:00", "2024-03-10T11:00")).toBe(1);
    expect(conflicts("2024-03-10T10:30", "2024-03-10T11:30")).toBe(1);
    expect(conflicts("2024-03-10T11:00", "2024-03-10T12:00")).toBe(1);
  });

  it("allows blocks touching the target block", () => {
    expect(conflicts("2024-03-10T08:00", "2024-03-10T10:00")).toBe(0);
    expect(conflicts("2024-03-10T12:00", "2024-03-10T13:00")).toBe(0);
  });

  it("names the conflicting block", () => {
    const [conflict] = checkConflict(
      block("M", "2024-03-10T11:00", "2024-03-10T13:00", "Q"),
      row
    ).conflictList;
    expect(conflict.conflictBlockId).toBe("X");
  });
});

describe("revalidateAdjust ignored conflicts", () => {
  it("keeps a conflict ignored when its description changes", () => {
    const rows = makeRows();
    const adjust = checkConflict(rows[0].gtArray[0], rows[1]);
    adjust.conflictList[0].isIgnore = true;
    // e.g. the description is formatted in another language or time format
    adjust.conflictList[0].conflictDesc = "changed";
    expect(revalidateAdjust(adjust, rows)).toEqual([]);
  });

  it("does not ignore a new conflict with another block", () => {
    const rows = makeRows();
    const adjust = checkConflict(rows[0].gtArray[0], rows[1]);
    adjust.conflictList[0].isIgnore = true;
    rows[1].gtArray.push(block("N", "2024-03-10T09:00", "2024-03-10T10:30", "R2"));
    const conflicts = revalidateAdjust(adjust, rows);
    expect(conflicts.map((item) => item.conflictBlockId)).toEqual(["N"]);
  });
});
