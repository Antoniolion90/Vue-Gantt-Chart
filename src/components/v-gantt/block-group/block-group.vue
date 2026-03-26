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

export default {
  name: "Blocks",
  mixins: [dr],
  props: {
    scrollLeft: Number,
    unVisibleHeight: {
      type: Number,
      required: true
    },
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
      return !(
        isUndef(this.startTimeOfRenderArea) || isUndef(this.endTimeOfRenderArea)
      );
    }
  },

  methods: {
    computedRangeList(totalList) {
      if (!this.precondition) {
        return [];
      }
      const { startTimeOfRenderArea, endTimeOfRenderArea } = this;
      return totalList.filter((item) => {
        const timeStartToMs = new Date(item.start).getTime();
        const timeEndToMs = new Date(item.end).getTime();
        return (
          timeStartToMs <= endTimeOfRenderArea &&
          timeEndToMs >= startTimeOfRenderArea
        );
      });
    }
  }
};
</script>

