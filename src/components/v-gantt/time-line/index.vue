<template>
  <div class="gantt-timeline">
    <div
      v-if="lazy"
      class="gantt-timeline-padding_block"
      :style="{ width: paddingWidth + 'px' }"
    ></div>
    <template v-for="(day, index) in allDayBlocks">
      <div
        class="gantt-timeline-block"
        v-if="!lazy || isInRenderingDayRange(day)"
        :style="{ width: getTimeScales(day).length * cellWidth + 'px' }"
        :key="index"
      >
        <slot :day="day" :getTimeScales="getTimeScales">
          <div class="gantt-timeline-day" :style="heightStyle">
            {{ day.format("MM/DD") }}
          </div>
          <div v-if="!isDayScale" class="gantt-timeline-scale" :style="heightStyle">
            <div :style="cellWidthStyle" v-for="(time, index) in getTimeScales(day)" :key="index">
              {{ scale >= 60 ? time.format("HH") : time.format("HH:mm") }}
            </div>
          </div>
        </slot>
      </div>
    </template>
  </div>
</template>

<script>
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);

import { isDayScale, MINUTE_OF_ONE_DAY, getBeginTimeOfTimeLine } from "@/utils/timeLineUtils.js";

function isSameDay(one, two) {
  return one.isSame(two, "day");
}

function isSameOrBetween(start, end, mid) {
  return mid.isSameOrAfter(start) && mid.isSameOrBefore(end);
}

export default {
  name: "Timeline",

  props: {
    start: {
      type: Object
    },
    end: {
      type: Object
    },
    cellWidth: {
      type: Number
    },
    titleHeight: {
      type: Number
    },
    scale: {
      type: Number
    },
    endTimeOfRenderArea: Object,
    startTimeOfRenderArea: Object,
    getPositionOffset: {
      type: Function
    },
    lazy: {
      type: Boolean,
      default: true
    }
  },

  computed: {
    startDayOfRenderArea() {
      return this.startTimeOfRenderArea.startOf("day");
    },
    endDayOfRenderArea() {
      return this.endTimeOfRenderArea.endOf("day");
    },
    paddingWidth() {
      const { allDayBlocks, scale, startDayOfRenderArea } = this;
      const temp = allDayBlocks.find((day) => {
        if (
          scale >= MINUTE_OF_ONE_DAY &&
          startDayOfRenderArea.isBetween(day, day.add(scale / MINUTE_OF_ONE_DAY, "day"))
        ) {
          return true;
        } else {
          return isSameDay(day, startDayOfRenderArea);
        }
      });
      if (!temp || temp == allDayBlocks[0]) {
        return 0;
      } else {
        return this.getPositionOffset(temp.toString());
      }
    },
    isDayScale() {
      const { scale } = this;
      return isDayScale(scale);
    },
    /**
     * Day list
     * @returns {[dayjs]} All data entries that need rendering in this data set
     */
    allDayBlocks() {
      const temp = [];
      let { start, end, scale, isDayScale } = this;
      let tempStart = start.clone().startOf("day");
      let addNum = isDayScale && scale > MINUTE_OF_ONE_DAY ? scale / MINUTE_OF_ONE_DAY : 1;
      while (tempStart.isSameOrBefore(end)) {
        temp.push(tempStart);
        tempStart = tempStart.add(addNum, "day");
      }
      return temp;
    },
    cellWidthStyle() {
      return {
        width: `${this.cellWidth}px`
      };
    },
    heightStyle() {
      return {
        height: this.titleHeight / (this.isDayScale ? 1 : 2) + "px",
        "line-height": this.titleHeight / (this.isDayScale ? 1 : 2) + "px"
      };
    }
  },

  created() {
    // Scales only depend on the day and start/end/scale, so they are cached per day
    this.timeScaleCache = new Map();
    this.$watch(
      () => [this.start, this.end, this.scale],
      () => this.timeScaleCache.clear()
    );
  },

  methods: {
    isInRenderingDayRange(day) {
      const { startDayOfRenderArea, endDayOfRenderArea, scale } = this;
      if (
        scale >= MINUTE_OF_ONE_DAY &&
        startDayOfRenderArea.isBetween(day, day.add(scale / MINUTE_OF_ONE_DAY, "day"))
      ) {
        return true;
      } else return !!isSameOrBetween(startDayOfRenderArea, endDayOfRenderArea, day);
    },
    /**
     * Get time scale array (cached per day)
     *
     * @param {dayjs} date
     * @returns {[dayjs]} All time scales of the day
     */
    getTimeScales(date) {
      const key = date.valueOf();
      let scales = this.timeScaleCache.get(key);
      if (!scales) {
        scales = this.generateTimeScale(date);
        this.timeScaleCache.set(key, scales);
      }
      return scales;
    },
    /**
     * Generate time scale array
     *
     * @param {dayjs} date
     * @returns {[dayjs]} All time scales of the day
     */
    generateTimeScale(date) {
      const totalblock = [];
      const { start, end, scale } = this;
      let a, b;
      if (isSameDay(date, start)) {
        a = getBeginTimeOfTimeLine(start, scale);
        //special case when start and end are on same day
        b = isSameDay(start, end) ? end : start.endOf("day");
      } else if (isSameDay(date, end)) {
        a = end.startOf("day");
        b = end;
      } else {
        //days between start and end
        a = date.startOf("day");
        b = date.endOf("day");
      }
      while (!a.isAfter(b)) {
        totalblock.push(a);
        a = a.add(scale, "minute");
      }

      return totalblock;
    }
  }
};
</script>
