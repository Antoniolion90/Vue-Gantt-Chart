import { createStore } from "vuex";

export default createStore({
  state: {
    filterBlockId: "", // Filtered gantt block ID
    currentBlock: {}, //Currently selected gantt block
    currentRow: {}, //Currently selected gantt row
    cutBlock: {}, //Cut gantt block
    cutRow: {}, //Cut gantt row
    targetBlock: {}, //Target gantt block
    targetRow: {}, //Target gantt row
    handleBlock: {}, //Right-click action gantt block
    handleRow: {}, //Right-click action gantt row
    showRowList: [], // Displayed row data after filtering
    rawRowList: [], // Original row data for reset
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
      state.showRowList = object;
    },
    setRawRowList(state, object) {
      state.rawRowList = object;
    },
    setShowMovedBlock(state, bool) {
      state.showMovedBlock = bool;
    },
    setShowDragConfirm(state, bool) {
      state.showDragConfirm = bool;
    }
  }
});

