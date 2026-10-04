<template>
  <!-- One popover for all blocks: it is attached to the block that was clicked -->
  <el-popover
    v-if="reference"
    :visible="!!blockData"
    :virtual-ref="reference"
    virtual-triggering
    placement="bottom"
    :width="280"
  >
    <div class="detail" v-if="blockData">
      <ul>
        <li>
          <span>Departure time: </span><span>{{ formatTime(blockData.start) }}</span>
        </li>
        <li>
          <span>Arrival time: </span><span>{{ formatTime(blockData.end) }}</span>
        </li>
        <li>
          <span>Passenger count: </span><span>{{ blockData.passenger }}</span>
        </li>
        <li>
          <span>ID：</span><span>{{ blockData.id }}</span>
        </li>
      </ul>
    </div>
  </el-popover>
</template>

<script>
import { markRaw } from "vue"
import dayjs from "dayjs"

export default {
  name: "task-detail",
  data() {
    return {
      blockData: null,
      reference: null
    }
  },
  mounted() {
    this.$bus.$on("showTaskDetail", this.show)
    this.$bus.$on("hideTaskDetail", this.hide)
  },
  beforeUnmount() {
    this.$bus.$off("showTaskDetail", this.show)
    this.$bus.$off("hideTaskDetail", this.hide)
  },
  methods: {
    show({ blockData, el }) {
      this.reference = markRaw(el)
      this.blockData = blockData
    },
    // Hide only if the details belong to the given block element
    hide(el) {
      if (el === this.reference) this.blockData = null
    },
    formatTime(time) {
      return dayjs(time).format("MM-DD HH:mm")
    }
  }
}
</script>

<style lang="scss" scoped>
.detail {
  user-select: none;
}
.detail ul {
  list-style: none;
  padding: 0;
  li {
    display: flex;
    margin-bottom: 5px;
    span {
      display: inline-block;
      color: #777777;
      font-size: 0.8rem;
      vertical-align: top;
    }
    span:first-child {
      width: 120px;
      text-align: right;
      padding-right: 8px;
      box-sizing: border-box;
      white-space: nowrap;
    }
    span:last-child {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #333;
      text-align: left;
    }
  }
}
</style>
