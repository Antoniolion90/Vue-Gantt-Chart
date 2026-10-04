<template>
  <div
    class="gantt-block-item"
    :draggable="canDrag"
    :style="{
        'margin-top': 0.1 * cellHeight + 'px',
        height: '80%',
        left: positionOffset + 'px',
        width: blockWidth + 'px',
        zIndex: zIndex
      }"
  >
    <div
      ref="plan"
      :class="['plan',{
      'highlight':isHighlight
    },
    timeStatusClass,
    cutClass,
    movedStatusClass
    ]"
      @dblclick="changeZIndex"
      @mousedown.left="showDetailInfo"
      @mouseleave="hideDetailInfo"
      @dragleave="hideDetailInfo"
    >
      <div class="runTime">
        <span>S:{{ startToString }}</span>
        <span>E:{{ endToString }}</span>
      </div>
      <div class="middle">ID{{ blockData.id }}</div>
      <div class="passenger">{{blockData.passenger}} pax</div>
    </div>
  </div>

</template>

<script>
import { mapState } from "vuex"
import dayjs from "dayjs"

// Block currently sent to back by double click
let loweredItem = null

export default {
  name: "task-item",
  props: {
    blockData: Object,
    currentTime: Object,
    cellHeight: Number,
    getPositionOffset: Function,
    getWidthAbout2Times: Function
    // startTimeOfRenderArea: Number
  },
  data() {
    return {
      zIndex: 2
    }
  },
  computed: {
    ...mapState([
      "filterBlockId",
      "cutBlock",
    ]),
    canDrag() {
      // Draggable only if not moved yet and not in progress/completed
      let { blockData, currentTime } = this
      let start = dayjs(blockData.start)
      return start.isAfter(currentTime) && this.blockData.movedStatus !== "before"
    },
    positionOffset() {
      const { blockData } = this
      return this.getPositionOffset(blockData.start)
    },
    blockWidth() {
      const { blockData } = this
      return this.getWidthAbout2Times(blockData.start, blockData.end)
    },
    isHighlight() {
      if (!this.filterBlockId) return false
      return this.blockData.id.includes(this.filterBlockId)
    },
    startToString() {
      return dayjs(this.blockData.start).format("HH:mm")
    },
    endToString() {
      return dayjs(this.blockData.end).format("HH:mm")
    },
    cutClass() {
      const isCutBlock = this.cutBlock ? this.cutBlock.id === this.blockData.id : false
      if (isCutBlock) {
        return 'cut'
      }
      return ''
    },
    timeStatusClass() {
      let { blockData, currentTime } = this
      let start = dayjs(blockData.start)
      let end = dayjs(blockData.end)
      if (start.isBefore(currentTime) && end.isAfter(currentTime)) {
        return "NOW_PLAN" // NOW
      } else if (end.isBefore(currentTime)) {
        return "PAST_PLAN" // PAST
      } else {
        return "FURTHER_PLAN" // Future
      }
    },
    movedStatusClass() {
      let statusClassStr = ""
      if (this.blockData.movedStatus === "before") {
        statusClassStr += "moved-before "
      } else if (this.blockData.movedStatus === "after") {
        statusClassStr += "moved-after "
      }
      return statusClassStr
    }
  },
  methods: {
    // Details are shown in one shared popover (task-detail.vue)
    showDetailInfo() {
      this.$bus.$emit("showTaskDetail", { blockData: this.blockData, el: this.$refs.plan })
      this.$bus.$emit("updateTimeLines", {
        start: this.blockData.start,
        end: this.blockData.end
      })
    },
    hideDetailInfo() {
      this.$bus.$emit("hideTaskDetail", this.$refs.plan)
    },
    // Send this block to back; only the previously lowered block needs restoring
    changeZIndex() {
      if (loweredItem && loweredItem !== this) {
        loweredItem.zIndex = 2
      }
      loweredItem = this
      this.zIndex = 1
    },
  },
  beforeUnmount() {
    if (loweredItem === this) loweredItem = null
    // The block may be scrolled out of the render range while its details are shown
    this.hideDetailInfo()
  }
}
</script>

<style lang="scss" scoped>
.middle {
  flex: 1;
  text-align: center;
  padding-left: 5px;
}
.runTime {
  display: flex;
  flex-direction: column;
}
.plan {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  height: 100%;
  border: 1px solid #CCCCCC;
  border-radius: 10px;
  color: #333333;
  padding-left: 5px;
  font-size: 0.8rem;
  &.cut {
    border-color: #FF3F3E;
    opacity: .6;
  }
  &.NOW_PLAN {
    background-color: #D5F8EA;
  }
  &.PAST_PLAN {
    background-color: #F2F2F2;
  }
  &.FURTHER_PLAN {
    background-color: #BFF2FE;
  }
  &.moved-before {
    background-color: #FFFFFF;
    background-image: linear-gradient(135deg, #EEEEEE 25%, rgba(#000, .1) 0, rgba(#000, .1) 50%, #EEEEEE 0, #EEEEEE 75%, rgba(#000, .1) 0);
    background-size: 10px 10px;
  }
  &.moved-after {
    background-image: linear-gradient(135deg, rgba(#3693b3, .5) 25%, transparent 0, transparent 50%, rgba(#3693b3, .5) 0, rgba(#3693b3, .5) 75%, transparent 0);
    background-size: 10px 10px;
  }
  // opacity: 0.8;
}
.highlight {
  color: #FFFFFF;
  animation: colorful 1s linear alternate infinite;
}
</style>

