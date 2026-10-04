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

export function debounce(fn, interval = 500, immediate = false) {
  // fn is the function to execute
  // interval is the waiting time
  // immediate decides whether to execute immediately
  var timeout; // timer

  return function() {
    // Return a closure
    var context = this,
      args = arguments; // Cache variables first
    var later = function() {
      // Wrap logic to run later
      timeout = null; // Clear timer after successful call
      if (!immediate) fn.apply(context, args); // Call only when not immediate
    };

    var callNow = immediate && !timeout; // Determine immediate call; if timer exists, do not call now
    clearTimeout(timeout); // Always clear timer first for stability
    timeout = setTimeout(later, interval); // Delayed execution
    if (callNow) fn.apply(context, args); // If first trigger and immediate is true, execute now
  };
}

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
    blockId: blockItem.id,
    adjustType: "Move",
    conflictList: conflictList
  };
}

/**
 * Build adjustment list for a move (or swap, when a target block exists)
 *
 * @export
 * @param {{currentBlock, currentRow, targetBlock, targetRow}} selection
 * @returns {Array} adjustments produced by checkConflict
 */
export function buildAdjustList({ currentBlock, currentRow, targetBlock, targetRow }) {
  const adjustList = [];
  if (targetRow && currentBlock) {
    adjustList.push(checkConflict(currentBlock, targetRow, targetBlock || null));
  }
  if (currentRow && targetBlock) {
    adjustList.push(checkConflict(targetBlock, currentRow, currentBlock || null));
  }
  return adjustList;
}

/**
 * Apply adjustments to a copy of the row list
 *
 * @export
 * @param {Array} rows source row list, not mutated
 * @param {Array} adjustList adjustments produced by checkConflict
 * @param {boolean} showMovedBlock keep a "before" shadow of moved blocks
 * @returns {Array} new row list
 */
export function applyAdjustList(rows, adjustList, showMovedBlock) {
  const rowList = cloneDeep(rows);
  adjustList.forEach((adjustItem) => {
    const currentRow = rowList.find((row) => row.id === adjustItem.blockItem.parentId);
    const targetRow = rowList.find((row) => row.id === adjustItem.targetRowId);
    if (!currentRow || !targetRow) return;

    const movedBeforeBlock = currentRow.gtArray.find(
      (blockItem) => blockItem.id === adjustItem.blockId
    );
    if (showMovedBlock && movedBeforeBlock && movedBeforeBlock.movedStatus !== "after") {
      // Not moved before, keep it as a shadow
      movedBeforeBlock.movedStatus = "before";
    } else {
      // Filter out items that were already moved once
      currentRow.gtArray = currentRow.gtArray.filter(
        (blockItem) => blockItem.id !== adjustItem.blockId
      );
    }
    const newBlock = cloneDeep(adjustItem.blockItem);
    newBlock.movedStatus = "after";
    newBlock.parentId = targetRow.id;
    targetRow.gtArray.push(newBlock);
  });
  return rowList;
}


