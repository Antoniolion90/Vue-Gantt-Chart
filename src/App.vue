<template>
  <div id="app">
    <div class="page-head">
      <h2 class="sub-title">Gantt Chart</h2>
      <div class="operation-box">
        <span class="form-title">Time:</span>
        <el-date-picker
            :id="['start-time', 'end-time']"
            v-model="timeRange"
            :clearable="false"
            type="daterange"
            start-placeholder="Start date"
            end-placeholder="End date"
            class="time-picker"
        >
        </el-date-picker>
        <span class="form-title">Rows:</span>
        <el-input
            v-model.number="rowNum"
            class="num-input"
        />
        <span class="form-title">Columns:</span>
        <el-input
            v-model.number="colNum"
            class="num-input"
        />
        <el-button type="primary" @click="initData">Generate</el-button>
        <el-input
            v-model="searchValue"
            placeholder="ID"
            aria-label="Search ID"
            clearable
            class="id-input"
            @clear="clearSearch"
        />
        <el-button type="primary" @click="filterSearchValue">Search
          <template v-if="findList.length">
            {{ `${currentFindIndex + 1}/${findList.length}` }}
          </template>
        </el-button>
        <el-button type="primary" @click="classifyDialogVisible=true">Grouping</el-button>
      </div>
      <el-popover
          placement="right"
          width="400"
          trigger="click">
        <div class="gantt-config-options">
          <el-form :inline="true" size="small">
            <el-form-item label="Row height">
              <el-input-number
                  v-model="cellHeight"
                  :min="20"
                  :max="100"
                  style="width:100px"
                  size="small"
              ></el-input-number>
            </el-form-item>
            <el-form-item label="Scale width">
              <el-input-number
                  v-model="cellWidth"
                  :min="20"
                  :max="100"
                  style="width:100px"
                  size="small"
              ></el-input-number>
            </el-form-item>
            <el-form-item label="Minutes per scale">
              <el-select
                  v-model="scale"
                  placeholder=""
                  style="width:100px"
                  size="small"
              >
                <el-option
                    v-for="item in scaleList"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                >
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-checkbox v-model="hideHeader">Hide header</el-checkbox>
            </el-form-item>
            <el-form-item>
              <el-checkbox :model-value="showMovedBlock" @change="setShowMovedBlock" title="Show the task state before dragging. If enabled, it is shown as a black shadow.">
                Show pre-adjust task
              </el-checkbox>
            </el-form-item>
            <el-form-item>
              <el-checkbox :model-value="showDragConfirm" @change="setShowDragConfirm" title="Show confirmation dialog when adjusting task">Show adjustment confirmation dialog
              </el-checkbox>
            </el-form-item>
          </el-form>

        </div>
        <template #reference>
          <el-button type="primary" style="margin-left: 10px;">Settings</el-button>
        </template>
      </el-popover>

    </div>
    <div class="page-body">
      <v-gantt-chart
          :currentTime="currentTime"
          :startTime="times[0]"
          :endTime="times[1]"
          :cellWidth="cellWidth"
          :cellHeight="cellHeight"
          :timeLines="timeLines"
          :titleHeight="titleHeight"
          :scale="scale"
          :titleWidth="titleWidth"
          showCurrentTime
          :hideHeader="hideHeader"
          :dataKey="dataKey"
          :datas="datas"
      >
      </v-gantt-chart>
      <task-detail />

    </div>
    <el-dialog
        title="Data grouping"
        v-model="classifyDialogVisible">
      <el-form class="classify-form">
        <el-form-item label="Type:">
          <el-checkbox-group v-model="selectRowTypes">
            <el-checkbox
                v-for="(rowType,index) in rowTypes"
                :key="index"
                :label="rowType">{{ rowType }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="Speed:">
          <el-checkbox-group v-model="selectSpeedTypes">
            <el-checkbox
                v-for="(speed,index) in speedTypes"
                :key="index"
                :label="speed">{{ speed }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <div style="text-align: right;padding-top: 25px;">
        <el-button @click="classifyDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="confirmClassify">Confirm</el-button>
      </div>
    </el-dialog>
    <el-dialog
        title="Task adjustment"
        v-model="checkDialogVisible"
        width="1000px">

      <check-adjust ref="checkAdjust" @closeDialog="checkDialogVisible=false"/>

    </el-dialog>
  </div>
</template>

<script>
import dayjs from "dayjs";
import {debounce, buildAdjustList, applyAdjustList} from "@/utils/tool.js";
import {mapMutations, mapState} from "vuex";
import checkAdjust from "./components/demo/checkAdjust.vue";
import TaskDetail from "./components/demo/task-detail.vue";
import {normalizeDateRange, findBlocks, getTimeOffset, groupRows} from "@/utils/demoUtils.js";
import {mockDatas} from "@/api/mock-data";

const scaleList = `1,2,3,4,5,6,10,12,15,20,30,60,120,180,240,360,720,1440,2880,4320`
    .split(",")
    .map(n => {
      let value = parseInt(n);
      let label;
      if (value < 60) {
        label = value + "minute";
      } else if (value >= 60 && value < 1440) {
        label = value / 60 + "hour";
      } else {
        label = value / 1440 + "day";
      }
      return {
        value,
        label
      };
    });
export default {
  name: "App",
  components: {checkAdjust, TaskDetail},
  data() {
    return {
      searchValue: "",
      timeLines: [
        {
          time: dayjs()
              .add(2, "hour")
              .toString(),
          text: "~~"
        },
        {
          time: dayjs()
              .add(5, "hour")
              .toString(),
          text: "try",
          color: "#747E80"
        }
      ],
      currentTime: dayjs(),
      cellWidth: 60,
      cellHeight: 50,
      titleHeight: 60,
      titleWidth: 250,
      scale: 60,
      times: normalizeDateRange([dayjs(), dayjs().add(6, "day")]),
      rowNum: 500,
      colNum: 25,
      datas: [],
      dataKey: "id",
      scaleList: scaleList,
      hideHeader: false,
      classifyDialogVisible: false,
      checkDialogVisible: false,
      rowTypes: ["🚅", "🚈", "🚄"],
      speedTypes: ["0~50", "50~100", "100"],
      selectRowTypes: [],
      selectSpeedTypes: [],
      findList: [],
      currentFindIndex: 0,
      dataSeed: 0
    };
  },
  watch: {
    showRowList() {
      this.classifyData();
    },
    searchValue() {
      // A new query starts from the first match
      this.currentFindIndex = 0;
      this.findList = [];
    },
    cellWidth: debounce(function() {
      this.$bus.$emit("refresh");
    }, 300),
    scale: debounce(function() {
      this.$bus.$emit("refresh");
    }, 300)
  },
  computed: {
    ...mapState([
      "filterBlockId",
      "currentBlock",
      "currentRow",
      "targetBlock",
      "targetRow",
      "showRowList",
      "showMovedBlock",
      "showDragConfirm"
    ]),
    timeRange: {
      get() {
        return this.times;
      },
      set(range) {
        const times = normalizeDateRange(range);
        if (times) this.times = times;
      }
    }
  },
  mounted() {
    this.initData();
    this.onUpdateTimeLines = (timeParam) => {
      this.updateTimeLines(timeParam.start, timeParam.end);
    };
    this.onToggleGroupOpen = (index) => {
      this.toggleGroupOpen(index);
    };
    this.onUpdateCurrentTime = (time) => {
      this.currentTime = time;
    };
    this.onDragTask = () => {
      this.dragTask();
    };

    this.$bus.$on("updateTimeLines", this.onUpdateTimeLines);
    this.$bus.$on("toggleGroupOpen", this.onToggleGroupOpen);
    this.$bus.$on("updateCurrentTime", this.onUpdateCurrentTime);
    this.$bus.$on("dragTask", this.onDragTask);
  },
  beforeUnmount() {
    this.$bus.$off("updateTimeLines", this.onUpdateTimeLines);
    this.$bus.$off("toggleGroupOpen", this.onToggleGroupOpen);
    this.$bus.$off("updateCurrentTime", this.onUpdateCurrentTime);
    this.$bus.$off("dragTask", this.onDragTask);
  },
  methods: {
    ...mapMutations([
      "setFilterBlockId",
      "setCurrentBlock",
      "setCurrentRow",
      "setCutBlock",
      "setCutRow",
      "setShowRowList",
      "setShowMovedBlock",
      "setShowDragConfirm"
    ]),
    getTimeOffset(time) {
      return getTimeOffset(time, this.times[0], {
        scale: this.scale,
        cellWidth: this.cellWidth
      });
    },
    initData() {
      this.dataSeed = Date.now();
      let list = mockDatas(this.rowNum, this.colNum, this.times, this.dataSeed);
      this.setShowRowList([...list]);
      this.classifyData();
    },
    updateTimeLines(timeA, timeB) {
      this.timeLines = [
        {
          time: timeA,
          text: "Custom"
        },
        {
          time: timeB,
          text: "Test",
          color: "#747E80"
        }
      ];
    },
    /* Data grouping by every combination of selected types and speed ranges */
    classifyData() {
      this.datas = groupRows(this.showRowList, this.selectRowTypes, this.selectSpeedTypes, this.datas);
    },
    confirmClassify() {
      this.classifyData();
      this.classifyDialogVisible = false;
    },
    /* Search: the first press jumps to the first match, next presses go to the next one */
    async filterSearchValue() {
      if (!this.searchValue) {
        this.$message.warning('ID cannot be empty~');
        return false;
      }
      // Positions are recalculated on every press, since groups may be toggled or data changed
      const {matches, groupIndexes} = findBlocks(this.datas, this.searchValue, this.cellHeight);
      if (!matches.length) {
        this.$message.warning('No results found~');
        this.findList = [];
        this.currentFindIndex = 0;
        return false;
      }
      this.currentFindIndex = this.findList.length
          ? (this.currentFindIndex + 1) % matches.length
          : 0;
      this.findList = matches;
      groupIndexes.forEach(index => {
        this.datas[index].isOpen = true;
      });
      this.setFilterBlockId(this.searchValue);

      // Wait until opened groups are rendered, so the scroll range is up to date
      await this.$nextTick();
      const {block, y} = matches[this.currentFindIndex];
      this.$bus.$emit("scrollToPosition", {
        x: -this.getTimeOffset(block.start),
        y: -y
      });
    },
    clearSearch() {
      this.setFilterBlockId('');
      this.currentFindIndex = 0;
      this.findList = [];
    },
    dragTask() {
      // Nothing to do, e.g. a drop into the row the block is already in
      if (!buildAdjustList(this).length) return;
      if (this.showDragConfirm) {
        this.checkAssign();
      } else {
        this.dragBlock();
      }
    },
    checkAssign() {
      this.checkDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.checkAdjust.calcConflictList();
      });
    },
    dragBlock() {
      let adjustList = buildAdjustList(this);

      // Check whether conflicts exist
      let hasConflict = adjustList.some(adjustObj => {
        return adjustObj.conflictList.length > 0;
      });
      if (hasConflict) {
        this.$message.error("Task adjustment has time conflicts, please review!");
        return;
      }
      this.setCutBlock(null);
      this.setCutRow(null);
      this.setShowRowList(applyAdjustList(this.showRowList, adjustList, this.showMovedBlock));
    },
    toggleGroupOpen(index) {
      this.datas[index].isOpen = !this.datas[index].isOpen;
    }

  }
};
</script>


