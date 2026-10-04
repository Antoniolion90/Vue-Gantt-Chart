import dayjs from "dayjs";
import { cloneDeep } from "lodash-es";
/**
 * Whether value is empty
 *
 * @export
 * @param {*} v
 * @returns
 */
export function isUndef(v) {
  return v === undefined || v === null;
}
/**
 * Whether value exists
 *
 * @export
 * @param {*} v
 * @returns
 */
export function isDef(v) {
  return v !== undefined && v !== null;
}

export function warn(str) {
  console.warn(str)
}

export function noop() {}

// Runs fn at most once per animation frame with the latest arguments
export function throttle(fn) {
  let timer = null;
  let lastArgs = null;
  let lastContext = null;

  return function() {
    lastArgs = arguments;
    lastContext = this;

    if (!timer) {
      timer = requestAnimationFrame(() => {
        fn.apply(lastContext, lastArgs);
        timer = null;
      });
    }
  };
}

export function checkConflict(blockItem, row, targetBlockItem) {
  function convertTimeStr(time) {
    return dayjs(time).format("MM-DD HH:mm");
  }

  let currentBlock = blockItem; // Task to move
  let blockList = row.gtArray.filter((item) => {
    return (
      item.movedStatus !== "before" &&
      item.id !== currentBlock.id &&
      (targetBlockItem ? item.id !== targetBlockItem.id : true)
    );
  }); // Task list for this stand, excluding black shadow items after drag

  let conflictList = [];

  /* Check time conflicts */

  let blockStart = dayjs(currentBlock.start).valueOf();
  let blockEnd = dayjs(currentBlock.end).valueOf();
  for (let i = 0; i < blockList.length; i++) {
    let compareBlock = blockList[i];
    let compareBlockStart = dayjs(compareBlock.start).valueOf();
    let compareBlockEnd = dayjs(compareBlock.end).valueOf();
    if (
      (compareBlockStart < blockStart && blockStart < compareBlockEnd) || // Current block start is within target block (overlap exists)
      (compareBlockStart < blockEnd && blockEnd < compareBlockEnd) || // Current block end is within target block (overlap exists)
      (compareBlockStart >= blockStart && blockEnd >= compareBlockEnd) // Target block is fully within current block time range (subset)
    ) {
      let timeConflictStr = `${currentBlock.id}:(${convertTimeStr(
        currentBlock.start
      )}-${convertTimeStr(currentBlock.end)}) with target: ${
        compareBlock.id
      }(${convertTimeStr(compareBlock.start)}-${convertTimeStr(
        compareBlock.end
      )}) has a time conflict`;

      conflictList.push({
        conflictType: "Time validation conflict",
        conflictDesc: timeConflictStr,
        isIgnore: false
      });
    }
  }
  return {
    blockItem: blockItem,
    targetRowId: row.id,
    // Block excluded from the check (swap target), kept for revalidation
    targetBlockItem: targetBlockItem || null,
    blockId: blockItem.id,
    adjustType: "Move",
    conflictList: conflictList
  };
}

/**
 * Whether a block can be moved: it has not started yet and is not a shadow of a moved block
 *
 * @export
 * @param {Object} block
 * @param {*} now current time, anything dayjs accepts
 * @returns {boolean}
 */
export function canMoveBlock(block, now) {
  if (!block || block.movedStatus === "before") return false;
  return dayjs(block.start).isAfter(dayjs(now));
}

/**
 * Build adjustment list for a move (or swap, when a target block exists).
 * Moves into the row the block already belongs to are skipped.
 * A target block that can not be moved (a shadow, or started when `now` is given)
 * is not swapped: the drop is treated as a drop on its row.
 *
 * @export
 * @param {{currentBlock, currentRow, targetBlock, targetRow}} selection
 * @param {*} [now] current time; when given, blocks that already started are not moved
 * @returns {Array} adjustments produced by checkConflict
 */
export function buildAdjustList({ currentBlock, currentRow, targetBlock, targetRow }, now) {
  const isMovable = (block) =>
    now === undefined ? block.movedStatus !== "before" : canMoveBlock(block, now);
  if (currentBlock && !isMovable(currentBlock)) return [];
  if (targetBlock && !isMovable(targetBlock)) targetBlock = null;
  const adjustList = [];
  if (targetRow && currentBlock && currentBlock.parentId !== targetRow.id) {
    adjustList.push(checkConflict(currentBlock, targetRow, targetBlock || null));
  }
  if (currentRow && targetBlock && targetBlock.parentId !== currentRow.id) {
    adjustList.push(checkConflict(targetBlock, currentRow, currentBlock || null));
  }
  return adjustList;
}

/**
 * Check an adjustment again against the current rows. Conflicts ignored by the user stay ignored.
 *
 * @export
 * @param {Object} adjustItem adjustment produced by checkConflict
 * @param {Array} rows current row list
 * @returns {Array} conflicts that are not ignored
 */
export function revalidateAdjust(adjustItem, rows) {
  const targetRow = rows.find((row) => row.id === adjustItem.targetRowId);
  if (!targetRow) return [];
  const ignored = new Set(
    adjustItem.conflictList.filter((item) => item.isIgnore).map((item) => item.conflictDesc)
  );
  const { conflictList } = checkConflict(
    adjustItem.blockItem,
    targetRow,
    adjustItem.targetBlockItem
  );
  return conflictList.filter((item) => !ignored.has(item.conflictDesc));
}

/**
 * Apply adjustments to the row list. Only changed rows and blocks are copied,
 * the source list is not mutated.
 *
 * @export
 * @param {Array} rows source row list, not mutated
 * @param {Array} adjustList adjustments produced by checkConflict
 * @param {boolean} showMovedBlock keep a "before" shadow of moved blocks
 * @returns {Array} new row list
 */
export function applyAdjustList(rows, adjustList, showMovedBlock) {
  const rowList = rows.slice();
  const copied = new Set();

  // Copy a row (and its block list) once before changing it
  function getRow(id) {
    const index = rowList.findIndex((row) => row.id === id);
    if (index === -1) return null;
    if (!copied.has(id)) {
      rowList[index] = { ...rowList[index], gtArray: rowList[index].gtArray.slice() };
      copied.add(id);
    }
    return rowList[index];
  }

  adjustList.forEach((adjustItem) => {
    const { blockId } = adjustItem;
    const sourceRowId = adjustItem.blockItem.parentId;
    if (sourceRowId === adjustItem.targetRowId) return;
    const currentRow = getRow(sourceRowId);
    const targetRow = getRow(adjustItem.targetRowId);
    if (!currentRow || !targetRow) return;

    const movedIndex = currentRow.gtArray.findIndex(
      (blockItem) => blockItem.id === blockId && blockItem.movedStatus !== "before"
    );
    const movedBlock = currentRow.gtArray[movedIndex];
    if (showMovedBlock && movedBlock && movedBlock.movedStatus !== "after") {
      // Moved for the first time, keep it as a shadow
      currentRow.gtArray[movedIndex] = { ...movedBlock, movedStatus: "before" };
    } else if (movedIndex !== -1) {
      // Already moved once, or shadows are off
      currentRow.gtArray.splice(movedIndex, 1);
    }

    const shadowIndex = targetRow.gtArray.findIndex(
      (blockItem) => blockItem.id === blockId && blockItem.movedStatus === "before"
    );
    if (shadowIndex !== -1) {
      // Back to its original row: restore the block instead of adding a duplicate
      // eslint-disable-next-line no-unused-vars
      const { movedStatus, ...restored } = targetRow.gtArray[shadowIndex];
      targetRow.gtArray[shadowIndex] = restored;
      return;
    }
    targetRow.gtArray.push({
      ...cloneDeep(adjustItem.blockItem),
      movedStatus: "after",
      parentId: targetRow.id
    });
  });
  return rowList;
}
