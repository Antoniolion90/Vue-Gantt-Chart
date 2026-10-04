<template>
  <div class="gantt-chart">
    <v-contextmenu ref="blockItemMenu">
      <v-contextmenu-item
        class="right-menu-item"
        :disabled="!canMoveHandleBlock"
        @click="moveCurrentBlock"
        >Cut
      </v-contextmenu-item>
      <v-contextmenu-item
        class="right-menu-item"
        :disabled="!cutBlock || !canMoveHandleBlock"
        @click="switchBlock"
        >Swap
      </v-contextmenu-item>
    </v-contextmenu>
    <v-contextmenu ref="blockRowMenu">
      <v-contextmenu-item class="right-menu-item" :disabled="!cutBlock" @click="pasteBlock"
        >Paste
      </v-contextmenu-item>
    </v-contextmenu>
    <div
      class="gantt-container"
      :style="{
        height: `100%`,
        width: `100%`
      }"
    >
      <div v-show="!hideHeader" class="gantt-header" :style="{ width: `100%` }">
        <div
          class="gantt-header-title"
          :style="{
            'line-height': titleHeight + 'px',
            height: titleHeight + 'px',
            width: titleWidth + 'px'
          }"
        >
          <div class="date-control">
            <button
              type="button"
              class="btn-date-ctrl"
              aria-label="Previous day"
              @click="scrollPreDay"
            >
              ◀
            </button>
            <span class="current-date">{{ currentDay.format("MM-DD") }}</span>
            <button
              type="button"
              class="btn-date-ctrl"
              aria-label="Next day"
              @click="scrollNextDay"
            >
              ▶
            </button>
          </div>
        </div>
        <div class="gantt-header-timeline">
          <div ref="headerTimeline" class="gantt-header-timeline-container" :style="scrollerStyle">
            <timeline
              :start="start"
              :end="end"
              :cellWidth="cellWidth"
              :titleHeight="titleHeight"
              :scale="scale"
              :startTimeOfRenderArea="startDayjsOfRenderArea"
              :endTimeOfRenderArea="endDayjsOfRenderArea"
              :getPositionOffset="getPositionOffset"
            >
              <template v-slot="{ day, getTimeScales }">
                <slot name="timeline" :day="day" :getTimeScales="getTimeScales"> </slot>
              </template>
            </timeline>
          </div>
        </div>
      </div>

      <div class="gantt-body" :style="{ height: `calc(100% - ${actualHeaderHeight}px)` }">
        <div class="gantt-table">
          <div
            ref="marklineArea"
            :style="{ marginLeft: titleWidth + 'px' }"
            class="gantt-markline-area"
          >
            <CurrentTime
              v-if="showCurrentTime"
              :getPositionOffset="getPositionOffset"
              :level="markLineLevels[0]"
            />
            <mark-line
              v-for="(timeConfig, index) in timeLines"
              :key="index"
              :timeConfig="timeConfig"
              :getPositionOffset="getPositionOffset"
              :level="markLineLevels[index + 1]"
            >
              <template v-slot="{ timeConfig, getPosition, level }">
                <slot
                  name="markLine"
                  :timeConfig="timeConfig"
                  :getPosition="getPosition"
                  :level="level"
                ></slot>
              </template>
            </mark-line>
          </div>
          <div
            class="gantt-leftbar-container"
            :style="{
              width: titleWidth + 'px'
            }"
          >
            <div class="left-scroll-wrapper" ref="leftbarWrapper">
              <LeftBar
                v-for="(blockGroup, index) in datas"
                :key="groupKeys[index]"
                :datas="blockGroup.children || []"
                :groupType="blockGroup.groupType || {}"
                :group-index="index"
                :group-top="groupTops[index]"
                :is-open="blockGroup.isOpen"
                :dataKey="dataKey"
                :scrollTop="renderScrollTop"
                :totalHeight="totalHeight"
                :heightOfBlocksWrapper="heightOfBlocksWrapper"
                :cellHeight="cellHeight"
                :preload="preload"
              >
                <template v-slot="{ rowData }">
                  <MenuItem :rowData="rowData"></MenuItem>
                </template>
              </LeftBar>
            </div>
          </div>
          <div ref="blocksWrapper" class="gantt-blocks-wrapper">
            <div class="scroller" :style="scrollerStyle">
              <BlockGroup
                v-for="(blockGroup, index) in datas"
                :key="groupKeys[index]"
                :datas="blockGroup.children || []"
                :group-index="index"
                :group-top="groupTops[index]"
                :is-open="blockGroup.isOpen"
                :scrollTop="renderScrollTop"
                :totalHeight="totalHeight"
                :heightOfBlocksWrapper="heightOfBlocksWrapper"
                :cellWidth="cellWidth"
                :cellHeight="cellHeight"
                :scale="scale"
                :startTimeOfRenderArea="startTimeOfRenderArea"
                :endTimeOfRenderArea="endTimeOfRenderArea"
                :preload="preload"
                :style="scrollerStyle"
              >
                <template v-slot:BlockRow="{ rowData, showList, style }">
                  <BlockRow
                    v-contextmenu:blockRowMenu
                    :cellHeight="cellHeight"
                    :key="rowData.id"
                    :data-row-id="rowData.id"
                    :rowData="rowData"
                    :showList="showList"
                    :style="style"
                    @dragover.prevent
                    @drop="dropToRow($event, rowData)"
                    @mousedown.right.stop="handleRightClickRow($event, rowData)"
                  >
                    <template v-slot:blockItem="{ blockData }">
                      <TaskItem
                        v-contextmenu:blockItemMenu
                        :getPositionOffset="getPositionOffset"
                        :getWidthAbout2Times="getWidthAbout2Times"
                        :currentTime="currentTime"
                        :cellHeight="cellHeight"
                        :scale="scale"
                        :key="blockData.id"
                        :data-block-id="blockData.id"
                        :blockData="blockData"
                        @dragover.prevent
                        @dragstart="handleDragStart($event, rowData, blockData)"
                        @drop.stop="handleDropOnBlock($event, rowData, blockData)"
                        @pointerdown.stop
                        @contextmenu.stop
                        @mousedown.left.stop="handleLeftClickBlock($event, rowData, blockData)"
                        @mousedown.right.stop="handleRightClickBlock($event, rowData, blockData)"
                      />
                    </template>
                  </BlockRow>
                </template>
              </BlockGroup>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations } from "vuex";
import dayjs from "dayjs";
import BScroll from "@better-scroll/core";
import MouseWheel from "@better-scroll/mouse-wheel";
import ScrollBar from "@better-scroll/scroll-bar";

BScroll.use(MouseWheel);
BScroll.use(ScrollBar);

import {
  calcScalesAbout2Times,
  getBeginTimeOfTimeLine,
  isDayScale,
  scaleList
} from "@/utils/timeLineUtils.js";
import { throttle, warn, canMoveBlock } from "@/utils/tool.js";
import {
  getPositionOffset as _getPositionOffset,
  getWidthAbout2Times as _getWidthAbout2Times,
  assignLabelLevels
} from "@/utils/gtUtils.js";

import Timeline from "./time-line/index.vue";
import CurrentTime from "./mark-line/current-time.vue";
import { estimateLabelWidth } from "./mark-line/labels.js";
import LeftBar from "./left-bar/index.vue";
import BlockGroup from "./block-group/block-group.vue";
import BlockRow from "./block-row/block-row.vue";
import MarkLine from "./mark-line/index.vue";
import TaskItem from "@/components/demo/task-item.vue";
import MenuItem from "@/components/demo/menu-item.vue";

// Horizontal render range is rounded to this width, px
const RENDER_CHUNK_WIDTH = 300;
export default {
  name: "Gantt",

  components: {
    Timeline,
    MarkLine,
    CurrentTime,
    BlockGroup,
    BlockRow,
    LeftBar,
    MenuItem,
    TaskItem
  },

  props: {
    currentTime: {
      type: Object,
      default: () => dayjs()
    },
    startTime: {
      default: () => dayjs(),
      validator(date) {
        const ok = dayjs(date).isValid();
        if (!ok) warn(`Invalid start time ${date}`);
        return ok;
      }
    },
    endTime: {
      default: () => dayjs(),
      validator(date) {
        const ok = dayjs(date).isValid();
        if (!ok) warn(`Invalid end time ${date}`);
        return ok;
      }
    },
    cellWidth: {
      type: Number,
      default: 50
    },
    cellHeight: {
      type: Number,
      default: 20
    },
    titleHeight: {
      type: Number,
      default: 40
    },
    titleWidth: {
      type: Number,
      default: 200
    },
    scale: {
      type: Number,
      default: 60,
      validator(value) {
        return scaleList.includes(value) || isDayScale(value);
      }
    },
    datas: {
      type: Array,
      default: () => []
    },
    dataKey: {
      type: String,
      default: undefined
    },
    showCurrentTime: {
      type: Boolean,
      default: false
    },
    timeLines: {
      type: Array
    },
    hideHeader: {
      type: Boolean,
      default: false
    },
    timeRangeCorrection: {
      type: Boolean,
      default: true
    },
    preload: {
      type: Number
    }
  },

  data() {
    return {
      // Cache nodes
      selector: {
        gantt_leftbar: {},
        gantt_table: {},
        gantt_timeline: {},
        gantt_markArea: {}
      },
      scrollTop: 0,
      scrollLeft: 0,
      // Render range required for block area
      // Render an empty frame first, then compute real render range after mounted and render by range to reduce wasted extra rendering
      heightOfBlocksWrapper: 0,
      widthOfBlocksWrapper: 0,
      scroller: null,
      resizeObserver: null,
      onScrollToPosition: null,
      onRefresh: null
    };
  },

  computed: {
    ...mapState([
      "currentBlock",
      "currentRow",
      "cutBlock",
      "cutRow",
      "targetBlock",
      "targetRow",
      "handleBlock",
      "handleRow"
    ]),
    // Blocks that already started (or shadows of moved blocks) can not be cut or swapped
    canMoveHandleBlock() {
      return canMoveBlock(this.handleBlock, this.currentTime);
    },
    start() {
      return dayjs(this.startTime);
    },
    end() {
      const { start, widthOfBlocksWrapper, scale, cellWidth, timeRangeCorrection } = this;
      let end = dayjs(this.endTime);
      const totalWidth = calcScalesAbout2Times(start, end, scale) * cellWidth;
      // Time correction and compensation
      if (timeRangeCorrection && (start.isAfter(end) || totalWidth <= widthOfBlocksWrapper)) {
        end = getBeginTimeOfTimeLine(start, scale).add(
          (widthOfBlocksWrapper / cellWidth) * scale,
          "minute"
        );
      }
      return end;
    },
    totalWidth() {
      const { cellWidth, totalScales } = this;
      return cellWidth * totalScales;
    },
    totalScales() {
      const { start, end, scale } = this;
      return calcScalesAbout2Times(start, end, scale);
    },
    totalHeight() {
      const { datas, cellHeight } = this;
      let height = 0;
      for (let i = 0; i < datas.length; i++) {
        const rowLength = datas[i].isOpen ? (datas[i].children?.length || 0) + 1 : 1;
        height += rowLength * cellHeight;
      }
      return height;
    },
    // Offset of each group from the top of the chart
    groupTops() {
      const { datas, cellHeight } = this;
      const tops = [];
      let top = 0;
      for (let i = 0; i < datas.length; i++) {
        tops.push(top);
        const rowLength = datas[i].isOpen ? (datas[i].children?.length || 0) + 1 : 1;
        top += rowLength * cellHeight;
      }
      return tops;
    },
    // Stable keys for groups: group id or its type, de-duplicated by index
    groupKeys() {
      const seen = new Set();
      return this.datas.map((group, index) => {
        let key = group.id ?? JSON.stringify(group.groupType ?? {});
        if (seen.has(key)) key = `${key}#${index}`;
        seen.add(key);
        return key;
      });
    },
    beginTimeOfTimeLine() {
      return getBeginTimeOfTimeLine(this.start, this.scale);
    },
    beginTimeOfTimeLineToString() {
      return this.beginTimeOfTimeLine.toString();
    },
    actualHeaderHeight() {
      return this.hideHeader ? 0 : this.titleHeight;
    },
    // Scroll positions rounded down, so children re-render only when the visible
    // rows or the horizontal render chunk change, not on every scrolled pixel
    renderScrollTop() {
      const { scrollTop, cellHeight } = this;
      return cellHeight > 0 ? Math.floor(scrollTop / cellHeight) * cellHeight : scrollTop;
    },
    renderScrollLeft() {
      return Math.floor(this.scrollLeft / RENDER_CHUNK_WIDTH) * RENDER_CHUNK_WIDTH;
    },
    scrollerStyle() {
      return { width: this.totalWidth + "px" };
    },
    startTimeOfRenderArea() {
      if (this.heightOfBlocksWrapper === 0) {
        return;
      }
      const { beginTimeOfTimeLine, renderScrollLeft, cellWidth, scale } = this;

      return beginTimeOfTimeLine
        .add((renderScrollLeft / cellWidth) * scale, "minute")
        .toDate()
        .getTime();
    },
    endTimeOfRenderArea() {
      if (this.heightOfBlocksWrapper === 0) {
        return;
      }
      const {
        beginTimeOfTimeLine,
        renderScrollLeft,
        cellWidth,
        scale,
        widthOfBlocksWrapper,
        totalWidth
      } = this;

      const renderWidth = totalWidth < widthOfBlocksWrapper ? totalWidth : widthOfBlocksWrapper;
      // One extra chunk covers the part of the viewport past the rounded scroll position
      const right = renderScrollLeft + renderWidth + RENDER_CHUNK_WIDTH;

      return beginTimeOfTimeLine
        .add((right / cellWidth) * scale, "minute")
        .toDate()
        .getTime();
    },
    // Time at the left edge of the viewport, shown in the header
    currentDay() {
      const { beginTimeOfTimeLine, scrollLeft, cellWidth, scale } = this;
      return beginTimeOfTimeLine.add((scrollLeft / cellWidth) * scale, "minute");
    },
    // Label levels of the current time line (first) and the time lines, so labels do not overlap
    markLineLevels() {
      const lines = [{ time: this.currentTime, text: "" }, ...(this.timeLines || [])];
      return assignLabelLevels(
        lines.map((line) => ({
          x: line.time == null ? -Infinity : this.getPositionOffset(dayjs(line.time).toString()),
          width: estimateLabelWidth(line)
        }))
      );
    },
    startDayjsOfRenderArea() {
      return dayjs(this.startTimeOfRenderArea);
    },
    endDayjsOfRenderArea() {
      return dayjs(this.endTimeOfRenderArea);
    }
  },
  watch: {
    totalHeight() {
      this.$nextTick(() => {
        this.scroller?.refresh();
        this.scrollHandler();
      });
    },
    totalWidth() {
      this.$nextTick(() => {
        this.scroller?.refresh();
        // The scroll position may be clamped to the new width
        this.scrollHandler();
      });
    },
    // Keep the row in the middle of the viewport when the row height changes
    cellHeight(newHeight, oldHeight) {
      const half = this.heightOfBlocksWrapper / 2;
      const rows = (this.scrollTop + half) / oldHeight;
      this.$nextTick(() => {
        this.scroller?.refresh();
        this.scrollToOffset(this.scrollLeft, rows * newHeight - half);
      });
    }
  },

  created() {
    // Keep the time in the middle of the viewport when the timeline is zoomed
    this.$watch(
      () => [this.scale, this.cellWidth],
      (_, [oldScale, oldCellWidth]) => {
        const half = this.widthOfBlocksWrapper / 2;
        const centerTime = getBeginTimeOfTimeLine(this.start, oldScale).add(
          ((this.scrollLeft + half) / oldCellWidth) * oldScale,
          "minute"
        );
        this.$nextTick(() => {
          this.scroller?.refresh();
          this.scrollToOffset(this.getPositionOffset(centerTime.toString()) - half, this.scrollTop);
        });
      }
    );
  },

  mounted() {
    this.cacheSelector();
    // Calculate accurate render area range
    const observeContainer = throttle((entries) => {
      entries.forEach((entry) => {
        const cr = entry.contentRect;
        this.heightOfBlocksWrapper = cr.height;
        this.widthOfBlocksWrapper = cr.width;
      });
      this.$nextTick(() => {
        this.scroller?.refresh();
      });
    });
    this.resizeObserver = new window.ResizeObserver(observeContainer);
    this.resizeObserver.observe(this.$refs.blocksWrapper);

    this.scroller = new BScroll(this.$refs.blocksWrapper, {
      probeType: 3,
      click: true,
      scrollX: true,
      scrollY: true,
      freeScroll: true,
      mouseWheel: true,
      scrollbar: true,
      useTransition: true
    });
    this.scroller.on("scroll", throttle(this.scrollHandler));
    this.onScrollToPosition = (position) => {
      // Content may have changed (e.g. groups opened), so update the scroll range first
      this.scroller?.refresh();
      this.scrollToOffset(-position.x, -position.y, 600);
    };
    this.onRefresh = () => {
      this.scroller?.refresh();
    };

    this.$bus.$on("scrollToPosition", this.onScrollToPosition);
    this.$bus.$on("refresh", this.onRefresh);
    window.addEventListener("keydown", this.handleKeydown);
  },
  beforeUnmount() {
    this.$bus.$off("scrollToPosition", this.onScrollToPosition);
    this.$bus.$off("refresh", this.onRefresh);
    window.removeEventListener("keydown", this.handleKeydown);

    if (this.scroller) {
      this.scroller.destroy();
      this.scroller = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.releaseSelector();
  },

  methods: {
    ...mapMutations([
      "setCurrentBlock",
      "setCurrentRow",
      "setCutBlock",
      "setCutRow",
      "setTargetBlock",
      "setTargetRow",
      "setHandleBlock",
      "setHandleRow"
    ]),
    scrollHandler() {
      if (!this.scroller) return;
      const { x, y } = this.scroller;
      this.selector.gantt_timeline.style.transform = `translateX(${x}px)`;
      this.selector.gantt_leftbar.style.transform = `translateY(${y}px)`;
      this.selector.gantt_markArea.style.left = x + "px";
      this.scrollLeft = -x;
      this.scrollTop = -y;
    },
    // Scroll to a position (positive offsets), kept inside the scroll range
    scrollToOffset(left, top, time = 0) {
      const scroller = this.scroller;
      if (!scroller) return;
      const x = Math.min(0, Math.max(scroller.maxScrollX, -left));
      const y = Math.min(0, Math.max(scroller.maxScrollY, -top));
      scroller.scrollTo(x, y, time);
      if (!time) this.scrollHandler();
    },
    /* Scroll to the start of the previous day, or to the start of the timeline */
    scrollPreDay() {
      const day = this.currentDay.subtract(1, "day").startOf("day");
      this.scrollToOffset(Math.max(0, this.getPositionOffset(day.toString())), this.scrollTop, 400);
    },
    /* Scroll to the start of the next day */
    scrollNextDay() {
      const day = this.currentDay.add(1, "day").startOf("day");
      if (day.isAfter(this.end)) return;
      this.scrollToOffset(this.getPositionOffset(day.toString()), this.scrollTop, 400);
    },
    getWidthAbout2Times(start, end) {
      const options = {
        scale: this.scale,
        cellWidth: this.cellWidth
      };
      return _getWidthAbout2Times(start, end, options);
    },
    /**
     * Calculate offset for timeline
     */
    getPositionOffset(date) {
      const options = {
        scale: this.scale,
        cellWidth: this.cellWidth
      };

      return _getPositionOffset(date, this.beginTimeOfTimeLineToString, options);
    },
    // Cache nodes
    cacheSelector() {
      this.selector.gantt_leftbar = this.$refs.leftbarWrapper;
      this.selector.gantt_table = this.$refs.blocksWrapper;
      this.selector.gantt_timeline = this.$refs.headerTimeline;
      this.selector.gantt_markArea = this.$refs.marklineArea;
    },
    releaseSelector() {
      let key;
      for (key in this.selector) {
        this.selector[key] = null;
      }
    },
    handleLeftClickBlock(event, rowData, blockItem) {
      this.setCurrentRow(rowData);
      this.setCurrentBlock(blockItem);
    },
    handleDragStart(event, rowData, blockItem) {
      this.setCurrentRow(rowData);
      this.setCurrentBlock(blockItem);
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", blockItem.id);
      }
    },
    handleRightClickBlock(event, rowData, blockItem) {
      this.setHandleRow(rowData);
      this.setHandleBlock(blockItem);
    },
    handleRightClickRow(event, blockRow) {
      this.$refs.blockItemMenu.hide();
      this.setTargetBlock(null);
      this.setTargetRow(blockRow);
    },
    handleDropOnBlock(event, rowData, blockItem) {
      this.setTargetBlock(blockItem);
      this.setTargetRow(rowData);
      this.$bus.$emit("dragTask");
    },
    // Escape cancels a copied block
    handleKeydown(event) {
      if (event.key === "Escape" && this.cutBlock) {
        this.setCutBlock(null);
        this.setCutRow(null);
      }
    },
    moveCurrentBlock() {
      this.setCutBlock(this.handleBlock);
      this.setCutRow(this.handleRow);
    },
    /*Paste*/
    pasteBlock() {
      if (this.cutBlock) {
        this.setCurrentBlock(this.cutBlock);
        this.setCurrentRow(this.cutRow);
        this.$bus.$emit("dragTask");
      }
    },
    /*Swap*/
    switchBlock() {
      if (this.cutBlock && this.handleBlock) {
        this.setCurrentBlock(this.cutBlock);
        this.setCurrentRow(this.cutRow);
        this.setTargetBlock(this.handleBlock);
        this.setTargetRow(this.handleRow);
        this.$bus.$emit("dragTask");
      }
    },
    dropToRow(event, rowData) {
      if (!this.currentBlock) return false;
      if (this.currentRow && rowData.id === this.currentRow.id) return false;
      this.setCurrentRow(null);
      this.setTargetBlock(null);
      this.setTargetRow(rowData);
      this.$bus.$emit("dragTask");
    }
  }
};
</script>

<style lang="scss">
@use "gantt";
</style>
