// import dayjs from 'dayjs' // dayjs is more compatible, but much slower (roughly 30x slower in earlier tests).

// Cache parsed values for a small speedup

const cacheParseTime = (function() {
  let cacheString = {};
  let cacheValue = {};
  let count = 0;

  return function(timeName, timeString) {
    if (cacheString[timeName] !== timeString) {
      // Avoid caching too many objects
      if (count++ > 10000) {
        cacheString = {};
        cacheValue = {};
      }
      cacheString[timeName] = timeString;
      return (cacheValue[timeName] = parseTime(timeString));
    }

    return cacheValue[timeName];
  };
})();

// pStart is cached because getWidthAbout2Times and getPositionOffset are usually called in sequence and both use start once

/**
 * Calculate the visual length between two times in gantt based on config
 * Note: start should be earlier than end
 *
 * @export
 * @param {string} start
 * @param {string} end
 * @param {{scale:number,cellWidth:number}} arg
 * @returns number
 */
export function getWidthAbout2Times(start, end, arg) {
  const { scale, cellWidth } = arg;
  const pStart = cacheParseTime("pStart", start);
  const pEnd = parseTime(end);
  return (diffTimeByMinutes(pStart, pEnd) / scale) * cellWidth;
}

/**
 * Calculate distance from timeline start based on config; specialized version of getWidthAbout2Times
 * Note: time should be later than beginTimeOfTimeLine
 *
 * @export
 * @param {string} time
 * @param {string} beginTimeOfTimeLine
 * @param {{scale:number,cellWidth:number}} arg
 * @returns number
 */
export function getPositionOffset(time, beginTimeOfTimeLine, arg) {
  const { scale, cellWidth } = arg;
  const pTime = cacheParseTime("pStart", time);
  const pBeginTimeOfTimeLine = cacheParseTime(
    "pBeginTimeOfTimeLine",
    beginTimeOfTimeLine
  );
  return (diffTimeByMinutes(pBeginTimeOfTimeLine, pTime) / scale) * cellWidth;
}

function parseTime(time) {
  return new Date(time);
}
/**
 * Calculate minute difference between two times
 *
 * @param {string} start
 * @param {string} end
 * @returns
 */
function diffTimeByMinutes(start, end) {
  const diff = end.getTime() - start.getTime();
  return diff / 1000 / 60;
}

// function parseTime(time){
//   return dayjs(time)
// }

// function diffTimeByMinutes(start,end){
//   return end.diff(start, "m", true)
// }


/**
 * Stack overlapping labels: each label gets the lowest level where it does not overlap
 * a label placed before it. Labels start at x and extend to the right.
 *
 * @export
 * @param {Array<{x:number,width:number}>} labels
 * @returns {number[]} level of each label, in the input order
 */
export function assignLabelLevels(labels) {
  const levels = new Array(labels.length);
  // Right edge of the last label on each level
  const levelEnds = [];
  labels
    .map((label, index) => ({ ...label, index }))
    .sort((a, b) => a.x - b.x)
    .forEach(({ x, width, index }) => {
      let level = levelEnds.findIndex((end) => end <= x);
      if (level === -1) level = levelEnds.length;
      levelEnds[level] = x + width;
      levels[index] = level;
    });
  return levels;
}
