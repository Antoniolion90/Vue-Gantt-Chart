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

function matchSpeed(speed, range) {
  const [min, max] = range.split("~").map(Number);
  return max === undefined ? speed >= min : speed >= min && speed < max;
}

/**
 * Group rows by every combination of selected types and speed ranges.
 * Groups keep their open state from the previous grouping.
 *
 * @export
 * @param {Array} rows rows to group
 * @param {string[]} types selected row types, e.g. ["🚅", "🚈"]
 * @param {string[]} speeds selected speed ranges, e.g. ["0~50", "100"] ("100" means 100 and above)
 * @param {Array} [prevGroups] previous groups, used to keep isOpen
 * @returns {Array<{ groupType, children, isOpen }>} groups
 */
export function groupRows(rows, types, speeds, prevGroups = []) {
  const openState = new Map(
    prevGroups.map((group) => [JSON.stringify(group.groupType ?? {}), group.isOpen])
  );
  const makeGroup = (groupType, children) => ({
    ...groupType,
    groupType,
    children,
    isOpen: openState.get(JSON.stringify(groupType)) ?? true
  });

  if (!types.length && !speeds.length) {
    return [makeGroup({}, [...rows])];
  }

  const groups = [];
  for (const speed of speeds.length ? speeds : [null]) {
    for (const type of types.length ? types : [null]) {
      const groupType = {};
      if (speed !== null) groupType.speed = speed;
      if (type !== null) groupType.type = type;
      const children = rows.filter(
        (row) => (speed === null || matchSpeed(row.speed, speed)) && (type === null || row.type === type)
      );
      groups.push(makeGroup(groupType, children));
    }
  }
  return groups;
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
