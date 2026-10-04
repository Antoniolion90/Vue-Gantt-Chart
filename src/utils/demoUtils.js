import dayjs from "dayjs";
import { getPositionOffset } from "./gtUtils.js";
import { getBeginTimeOfTimeLine } from "./timeLineUtils.js";

/**
 * Horizontal offset of a time in the gantt. The timeline starts at the start time
 * aligned to the scale, so the offset is calculated from there, as the gantt does.
 *
 * @export
 * @param {string} time
 * @param {string} startTime gantt startTime
 * @param {{scale:number,cellWidth:number}} options
 * @returns {number} offset, px
 */
export function getTimeOffset(time, startTime, options) {
  const beginTimeOfTimeLine = getBeginTimeOfTimeLine(dayjs(startTime), options.scale);
  return getPositionOffset(time, beginTimeOfTimeLine.toString(), options);
}

/**
 * Normalize a date range from the date picker: start of the first day and end of the last day
 *
 * @export
 * @param {Array|null} range [start, end] from el-date-picker, null when cleared
 * @returns {[string, string]|null} normalized range, or null when the range is invalid
 */
export function normalizeDateRange(range) {
  if (!Array.isArray(range) || range.length !== 2) return null;
  const start = dayjs(range[0]);
  const end = dayjs(range[1]);
  if (!start.isValid() || !end.isValid() || start.isAfter(end)) return null;
  return [start.startOf("day").toString(), end.endOf("day").toString()];
}

/**
 * Find blocks whose id contains the search value and calculate their vertical scroll position.
 * Groups that contain matches are treated as open, since search opens them.
 *
 * @export
 * @param {Array} groups gantt groups: { isOpen, children: [{ gtArray }] }
 * @param {string} searchValue part of a block id
 * @param {number} cellHeight row height, px
 * @returns {{ matches: Array<{ block, groupIndex, y }>, groupIndexes: number[] }}
 *   matches in display order and indexes of groups that contain them
 */
export function findBlocks(groups, searchValue, cellHeight) {
  const matchedRows = groups.map((group) =>
    (group.children || []).map((row) =>
      row.gtArray.filter((block) => block.id.includes(searchValue))
    )
  );
  const groupIndexes = [];
  matchedRows.forEach((rows, index) => {
    if (rows.some((blocks) => blocks.length)) groupIndexes.push(index);
  });

  const matches = [];
  let groupTop = 0;
  groups.forEach((group, groupIndex) => {
    const rowCount = (group.children || []).length;
    const isOpen = group.isOpen || groupIndexes.includes(groupIndex);
    if (isOpen) {
      matchedRows[groupIndex].forEach((blocks, rowIndex) => {
        // The group header takes one row
        const y = groupTop + (rowIndex + 1) * cellHeight;
        blocks.forEach((block) => matches.push({ block, groupIndex, y }));
      });
    }
    groupTop += (isOpen ? rowCount + 1 : 1) * cellHeight;
  });

  return { matches, groupIndexes };
}
