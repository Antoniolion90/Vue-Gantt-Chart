<template>
  <div class="gantt-blocks">
    <div class="gantt-block-top-space" :style="{ height: cellHeight + 'px' }" />
    <div
      v-show="isOpen"
      class="gantt-block-row-wrapper"
      :style="{
        height: datas.length * cellHeight + 'px'
      }"
      ref="wrapperElement"
    >
      <template v-for="(rowItem, index) in showDatas">
        <slot
          name="BlockRow"
          :rowData="rowItem"
          :style="{
            top: (startRenderNum + index) * cellHeight + 'px'
          }"
          :showList="computedRangeList(rowItem.gtArray)"
        ></slot>
      </template>
    </div>
  </div>
</template>

<script>
import dr from "../mixin/dynamic-render.js";
import { isUndef } from "@/utils/tool.js";

// Parsed start/end of each block, so they are not re-parsed on every scroll
const timeCache = new WeakMap();

function getBlockTimes(item) {
  let cached = timeCache.get(item);
  if (!cached || cached.start !== item.start || cached.end !== item.end) {
    cached = {
      start: item.start,
      end: item.end,
      startMs: new Date(item.start).getTime(),
      endMs: new Date(item.end).getTime()
    };
    timeCache.set(item, cached);
  }
  return cached;
}

export default {
  name: "Blocks",
  mixins: [dr],
  props: {
    cellWidth: {
      type: Number,
      required: true
    },
    scale: {
      type: Number,
      required: true
    },
    endTimeOfRenderArea: [Number, null],
    startTimeOfRenderArea: [Number, null]
  },
  computed: {
    precondition() {
      if (this.heightOfBlocksWrapper === 0) {
        return false;
      }
      return !(isUndef(this.startTimeOfRenderArea) || isUndef(this.endTimeOfRenderArea));
    }
  },

  methods: {
    computedRangeList(totalList) {
      if (!this.precondition) {
        return [];
      }
      const { startTimeOfRenderArea, endTimeOfRenderArea } = this;
      return totalList.filter((item) => {
        const { startMs, endMs } = getBlockTimes(item);
        return startMs <= endTimeOfRenderArea && endMs >= startTimeOfRenderArea;
      });
    }
  }
};
</script>
