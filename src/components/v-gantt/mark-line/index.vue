<template>
  <slot :timeConfig="timeConfig" :getPosition="getPosition" :level="level">
    <div
      class="gantt-markline"
      :style="{
        backgroundColor: timeConfig.color || '#0ca30a',
        left: getPosition() + 'px'
      }"
    >
      <div
        class="gantt-markline-label"
        :style="{
          backgroundColor: timeConfig.color || '#0ca30a',
          marginTop: level * LABEL_HEIGHT + 'px'
        }"
      >
        <template v-if="timeConfig.text">{{ timeConfig.text }} </template
        >{{ dayjs(timeConfig.time).format("HH:mm:ss") }}
      </div>
    </div>
  </slot>
</template>
<script>
import dayjs from "dayjs";
import { LABEL_HEIGHT } from "./labels.js";

export default {
  name: "MarkLine",
  props: {
    timeConfig: {
      type: Object,
      required: true
    },
    getPositionOffset: {
      type: Function,
      required: true
    },
    // Labels of close lines are stacked; level 0 is the top
    level: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      dayjs: dayjs,
      LABEL_HEIGHT
    };
  },
  computed: {
    visible() {
      return !(this.timeConfig.time == null || false);
    }
  },
  methods: {
    getPosition() {
      if (!this.visible) {
        return 0;
      } else {
        return this.getPositionOffset(this.timeConfig.time);
      }
    }
  }
};
</script>
