<template>
  <mark-line
    :timeConfig="{ time: currentTime, color: 'rgba(255,0,0,.4)' }"
    :getPositionOffset="getPositionOffset"
  ></mark-line>
</template>

<script>
import dayjs from "dayjs";
import MarkLine from "./index.vue";
export default {
  name: "CurrentTime",
  components: { MarkLine },
  props: {
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
    this.timer = setInterval(() => {
      this.currentTime = dayjs().toString();
      this.$bus.$emit("updateCurrentTime", dayjs());
    }, 1000);
  },
  beforeUnmount() {
    clearInterval(this.timer);
    this.timer = null;
  }
};
</script>
