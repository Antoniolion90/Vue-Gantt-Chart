<template>
  <div class="name" :class="[matchClass]" :style="{ background: rowData.colorPair.light }">
    <div class="colorBar" :style="{ background: rowData.colorPair.dark }" />
    <div class="type">{{ rowData.type }}</div>
    <div class="carId">{{ rowData.name }}{{ rowData.id }}</div>
    <div class="speed">{{ rowData.speed }}km/s</div>
  </div>
</template>

<script>
import {mapState} from 'vuex'

export default {
  name: "TestLeft",
  props: {
    rowData: Object
  },
  computed:{
    ...mapState([
      'filterBlockId',
    ]),
    /* Filter class */
    matchClass() {
      const { filterBlockId } = this;
      if (!filterBlockId) return '';
      const isMatch = this.rowData.gtArray.some(blockItem => blockItem.id.includes(filterBlockId));
      return isMatch ? 'match-item' : '';
    }
  }
};
</script>

<style scoped>
.name {
  display: flex;
  box-sizing: border-box;
  overflow: hidden;
  height: 100%;
  width: 100%;
  padding: 0 5px 0 0;
  border-radius: 8px 0 0 8px;
  align-items: center;
}
.match-item{
  color: #ffffff;
  opacity: 0.7;
  animation: colorful 1s linear alternate infinite;
}
.colorBar {
  width: 10px;
  height: 100%;
}
.carId {
  flex: 1;
}
.type {
  padding: 0 5px 0 0;
  font-size: 1.2rem;
}
</style>

