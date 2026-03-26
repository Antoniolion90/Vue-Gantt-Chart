// import dayjs from "dayjs";

export const scaleList = [
  1,
  2,
  3,
  4,
  5,
  6,
  10,
  12,
  15,
  20,
  30,
  60,
  120,
  180,
  240,
  360,
  720,
  1440
];

export const MINUTE_OF_ONE_DAY = 60 * 24;

export function isDayScale(scale) {
  return scale >= MINUTE_OF_ONE_DAY && scale % MINUTE_OF_ONE_DAY === 0;
}

/**
 * Validate whether scale is legal
 *
 * @export
 * @param {number} scale
 * @returns
 */
export function validateScale(scale) {
  if (!scaleList.includes(scale) && !isDayScale(scale)) {
    throw new RangeError(
      `Invalid scale value, input is ${scale}, available scale values are ${scaleList.join(
        ","
      )}, or an integer multiple of 1440`
    );
  }
  return true;
}

/**
 * Calculate chart start time for computation/rendering from provided scale and start time
 * eg: Start is 10:10 and scale is 60, getBeginTimeOfTimeLine returns 10:00
 *                    scale 5 -> getBeginTimeOfTimeLine returns 10:10
 *                    scale 3 -> getBeginTimeOfTimeLine returns 10:09
 *
 * @export
 * @param {dayjs} start
 * @param {number} [scale=60]
 * @returns {dayjs} calculated start time
 */
export function getBeginTimeOfTimeLine(start, scale = 60) {
  validateScale(scale);
  let timeBlocks;
  let result = start.clone();
  let rate = scale / 60;
  if (scale > 60) {
    timeBlocks = Math.floor(start.hour() / rate);
    result = result
      .hour(timeBlocks * rate)
      .minute(0)
      .second(0);
  } else {
    timeBlocks = Math.floor(start.minute() / scale);
    result = result.minute(timeBlocks * scale).second(0);
  }

  return result;
}
/**
 * Calculate how many scales fit between two times for the given scale
 * Note: timdStart is not the actual calculation start; it is aligned by getBeginTimeOfTimeLine
 *
 * @export
 * @param {dayjs} timeStart start time
 * @param {dayjs} timeEnd end time
 * @param {number} [scale=60] split scale
 * @returns number of time blocks
 */
export function calcScalesAbout2Times(timeStart, timeEnd, scale = 60) {
  if (timeStart.isAfter(timeEnd)) {
    throw new TypeError(
      "Invalid argument order: in calcScalesAbout2Times, first time argument must be greater than second one"
    );
  }

  validateScale(scale);

  let startBlocksTime = getBeginTimeOfTimeLine(timeStart, scale);
  let result = 0;
  while (!startBlocksTime.isAfter(timeEnd)) {
    result++;
    startBlocksTime = startBlocksTime.add(scale, "minute");
  }

  return result;
}


