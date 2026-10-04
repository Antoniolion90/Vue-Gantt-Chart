<template>
  <div class="gantt-leftbar">
    <div
      class="gannt-group-menu"
      :style="{
        width: '100%',
        height: cellHeight + 'px'
      }"
    >
      <div class="type-title">
        <p>Group type:</p>
        <p>Count: {{ datas.length }}</p>
      </div>
      <div class="classify-tags">
        <template v-if="Object.keys(groupType).length">
          <div class="classify-tag" v-if="groupType.type">
            {{ groupType.type }}
          </div>
          <div class="classify-tag" v-if="groupType.speed">
            {{ groupType.speed }}
          </div>
        </template>
        <template v-else>
          <div class="classify-tag">
            All
          </div>
        </template>
      </div>
      <button
        type="button"
        class="btn-toggle"
        :aria-expanded="isOpen"
        :aria-label="isOpen ? 'Collapse group' : 'Expand group'"
        @click="toggleOpen(groupIndex)"
      >
        {{ isOpen ? "▼" : "▶" }}
      </button>
    </div>
    <div
      v-show="isOpen"
      ref="wrapperElement"
      class="left-bar-wrapper"
      :style="{
        height: datas.length * cellHeight + 'px'
      }"
    >
      <div
        class="gantt-leftbar-item"
        :style="{
          top: (startRenderNum + index) * cellHeight + 'px',
          height: `${cellHeight}px`
        }"
        v-for="(data, index) in showDatas"
        :key="dataKey ? data[dataKey] : index"
      >
        <slot :rowData="data">
          <div class="gantt-leftbar-defalutItem">need slot</div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script>
import dr from "../mixin/dynamic-render.js";

export default {
  name: "LeftBar",
  mixins: [dr],
  props: {
    dataKey: String,
    datas: {
      type: Array,
      required: true
    },
    groupType: {
      type: Object,
      default: () => ({})
    },
    groupIndex: {
      type: Number,
      default: () => 0
    }
  },
  methods: {
    toggleOpen(groupIndex) {
      this.$bus.$emit("toggleGroupOpen", groupIndex);
    }
  }
};
</script>

