<template>
  <mark-line
    :timeConfig="{ time: currentTime, color: 'rgba(255,0,0,.4)' }"
    :getPositionOffset="getPositionOffset"
    :level="level"
  ></mark-line>
</template>

<script>
import dayjs from "dayjs";
import MarkLine from "./index.vue";
export default {
  name: "CurrentTime",
  components: { MarkLine },
  props: {
    level: {
      type: Number,
      default: 0
    },
    getPositionOffset: {
      type: Function,
      required: true
    }
  },
  data() {
    return {
      currentTime: dayjs().toString(),
      timer: null
    };
  },
  mounted() {
    let lastMinute = dayjs().startOf("minute").valueOf();
    this.timer = setInterval(() => {
      const now = dayjs();
      this.currentTime = now.toString();
      // Task statuses only need minute precision, so notify listeners once per minute
      const minute = now.startOf("minute").valueOf();
      if (minute !== lastMinute) {
        lastMinute = minute;
        this.$bus.$emit("updateCurrentTime", now);
      }
    }, 1000);
  },
  beforeUnmount() {
    clearInterval(this.timer);
    this.timer = null;
  }
};
</script>
