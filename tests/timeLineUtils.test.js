import { describe, it, expect } from "vitest";
import dayjs from "dayjs";
import {
  calcScalesAbout2Times,
  getBeginTimeOfTimeLine,
  isDayScale,
  validateScale
} from "@/utils/timeLineUtils.js";

// Reference implementation of the previous loop-based algorithm
function calcScalesByLoop(start, end, scale) {
  let t = getBeginTimeOfTimeLine(start, scale);
  let result = 0;
  while (!t.isAfter(end)) {
    result++;
    t = t.add(scale, "minute");
  }
  return result;
}

describe("isDayScale", () => {
  it("accepts multiples of a day only", () => {
    expect(isDayScale(1440)).toBe(true);
    expect(isDayScale(2880)).toBe(true);
    expect(isDayScale(60)).toBe(false);
    expect(isDayScale(2000)).toBe(false);
  });
});

describe("validateScale", () => {
  it("throws on invalid scale", () => {
    expect(() => validateScale(7)).toThrow(RangeError);
    expect(validateScale(15)).toBe(true);
    expect(validateScale(4320)).toBe(true);
  });
});

describe("getBeginTimeOfTimeLine", () => {
  const start = dayjs("2024-03-10T10:10:30");

  it("aligns to the scale", () => {
    expect(getBeginTimeOfTimeLine(start, 60).format("HH:mm:ss")).toBe("10:00:00");
    expect(getBeginTimeOfTimeLine(start, 5).format("HH:mm:ss")).toBe("10:10:00");
    expect(getBeginTimeOfTimeLine(start, 3).format("HH:mm:ss")).toBe("10:09:00");
    expect(getBeginTimeOfTimeLine(start, 180).format("HH:mm:ss")).toBe("09:00:00");
    expect(getBeginTimeOfTimeLine(start, 1440).format("HH:mm:ss")).toBe("00:00:00");
  });

  it("does not mutate the input", () => {
    getBeginTimeOfTimeLine(start, 60);
    expect(start.format("HH:mm:ss")).toBe("10:10:30");
  });
});

describe("calcScalesAbout2Times", () => {
  it("counts scales including both ends", () => {
    const start = dayjs("2024-03-10T00:00:00");
    expect(calcScalesAbout2Times(start, dayjs("2024-03-10T23:59:00"), 60)).toBe(24);
    expect(calcScalesAbout2Times(start, dayjs("2024-03-11T00:00:00"), 60)).toBe(25);
    expect(calcScalesAbout2Times(start, start, 60)).toBe(1);
  });

  it("matches the loop-based algorithm", () => {
    const cases = [
      ["2024-03-10T10:10:00", "2024-03-17T23:59:00", 1],
      ["2024-03-10T10:10:00", "2024-03-17T23:59:00", 15],
      ["2024-03-10T10:10:00", "2024-03-17T23:59:00", 60],
      ["2024-03-10T10:10:00", "2024-03-17T23:59:00", 180],
      ["2024-03-10T10:10:00", "2024-04-17T23:59:00", 1440],
      ["2024-03-10T10:10:00", "2024-04-17T23:59:00", 4320],
      // Range crossing a DST switch in many time zones
      ["2024-10-26T22:00:00", "2024-10-28T03:00:00", 30]
    ];
    for (const [s, e, scale] of cases) {
      const start = dayjs(s);
      const end = dayjs(e);
      expect(calcScalesAbout2Times(start, end, scale)).toBe(calcScalesByLoop(start, end, scale));
    }
  });

  it("throws when start is after end", () => {
    expect(() => calcScalesAbout2Times(dayjs("2024-03-11"), dayjs("2024-03-10"), 60)).toThrow(
      TypeError
    );
  });
});
