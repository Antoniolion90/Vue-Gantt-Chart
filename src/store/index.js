import { markRaw } from "vue";
import { createStore } from "vuex";

export default createStore({
  state: {
    filterBlockId: "", // Filtered gantt block ID
    currentBlock: null, //Currently selected gantt block
    currentRow: null, //Currently selected gantt row
    cutBlock: null, //Cut gantt block
    cutRow: null, //Cut gantt row
    targetBlock: null, //Target gantt block
    targetRow: null, //Target gantt row
    handleBlock: null, //Right-click action gantt block
    handleRow: null, //Right-click action gantt row
    showRowList: [], // Displayed row data after filtering
    showMovedBlock: true, // Whether to show state before dragging
    showDragConfirm: false // Whether to show confirmation dialog when adjusting tasks
  },
  mutations: {
    setFilterBlockId(state, str) {
      state.filterBlockId = str;
    },
    setCurrentBlock(state, object) {
      state.currentBlock = object;
    },
    setCurrentRow(state, object) {
      state.currentRow = object;
    },
    setCutBlock(state, object) {
      state.cutBlock = object;
    },
    setCutRow(state, object) {
      state.cutRow = object;
    },
    setTargetBlock(state, object) {
      state.targetBlock = object;
    },
    setTargetRow(state, object) {
      state.targetRow = object;
    },
    setHandleBlock(state, object) {
      state.handleBlock = object;
    },
    setHandleRow(state, object) {
      state.handleRow = object;
    },
    setShowRowList(state, object) {
      // Rows are replaced, never mutated, so they are kept out of deep reactivity
      state.showRowList = markRaw(object);
    },
    setShowMovedBlock(state, bool) {
      state.showMovedBlock = bool;
    },
    setShowDragConfirm(state, bool) {
      state.showDragConfirm = bool;
    }
  }
});

