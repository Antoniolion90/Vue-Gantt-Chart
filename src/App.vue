<template>
  <div id="app">
    <div class="page-head">
      <h2 class="sub-title">Gantt Chart</h2>
      <div class="operation-box">
        <span class="form-title">Time:</span>
        <el-date-picker
            :id="['start-time', 'end-time']"
            v-model="times"
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
        <el-button type="primary" @click="classifyData">Confirm</el-button>
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
import {cloneDeep} from "lodash-es";
import {debounce} from "@/utils/tool.js";
import {mapMutations, mapState} from "vuex";
import checkAdjust from "./components/demo/checkAdjust.vue";
import {
  getWidthAbout2Times as _getWidthAbout2Times
} from "@/utils/gtUtils.js";
import {checkConflict} from "@/utils/tool.js";
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
  components: {checkAdjust},
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
      times: [
        dayjs()
            .set("hour", 0)
            .set("minute", 0)
            .toString(),
        dayjs()
            .add(6, "day")
            .set("hour", 23)
            .set("minute", 59)
            .toString()
      ],
      rowNum: 500,
      colNum: 25,
      datas: [[]],
      dataKey: "id",
      scaleList: scaleList,
      scrollToTime: dayjs()
          .add(1, "day")
          .toString(),
      hideHeader: false,
      positionB: {},
      positionA: {},
      ganttData: [],
      classifyDialogVisible: false,
      checkDialogVisible: false,
      rowTypes: ["🚅", "🚈", "🚄"],
      speedTypes: ["0~50", "50~100", "100"],
      selectRowTypes: [],
      selectSpeedTypes: [],
      classifyTypeList: [],
      rawData: [],
      findList: [],
      currentFindIndex: 0,
      dataSeed: 0
    };
  },
  watch: {
    showRowList() {
      this.classifyData();
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
      "rawRowList",
      "showMovedBlock",
      "showDragConfirm"
    ])
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
      "setRawRowList",
      "setShowMovedBlock",
      "setShowDragConfirm"
    ]),
    getWidthAbout2Times(start, end) {
      const options = {
        scale: this.scale,
        cellWidth: this.cellWidth
      };
      return _getWidthAbout2Times(start, end, options);
    },
    initData() {
      this.dataSeed = Date.now();
      let list = mockDatas(this.rowNum, this.colNum, this.times, this.dataSeed);
      this.setRawRowList(list);
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
    /* Data grouping */
    classifyData() {

      function combine(arr) {
        let result = [];
        (function f(t, a, n) {
          if (n === 0) return result.push(t);
          for (let i = 0; i < a[n - 1].length; i++) {
            f(t.concat(a[n - 1][i]), a, n - 1);
          }
        })([], arr, arr.length);
        return result;
      }

      let typeList = this.selectRowTypes.length ? this.selectRowTypes : [""];
      let speedList = this.selectSpeedTypes.length ? this.selectSpeedTypes : [""];
      /*
      Mix type and speed attributes
      Example: select 2 types and 2 speed ranges, ["🚅", "🚈"] and ["0~50", "50~100"]. This generates 4 mixed groups. If both selections have 3 options, the result is 9 groups.
     [
        [
          "0~50",
          "🚅"
        ],
        [
          "0~50",
          "🚈"
        ],
        [
          "50~100",
          "🚅"
        ],
        [
          "50~100",
          "🚈"
        ]
    ]

      */

      let resultArr = combine([typeList, speedList]);
      let classifyList = [];
      resultArr.forEach(resultItem => {
        // Create an empty object and assign values to build the final grouped list
        let tempObj = {};
        if (resultItem[0]) {
          tempObj["speed"] = resultItem[0];
        }
        if (resultItem[1]) {
          tempObj["type"] = resultItem[1];
        }
        if (Object.getOwnPropertyNames(tempObj).length) {
          classifyList.push(tempObj);
        }
        /* Convert arrays to objects; the final result contains 4 objects like this
          [
            {
              "speed": "0~50",
              "type": "🚅"
            },
            {
              "speed": "0~50",
              "type": "🚈"
            },
            {
              "speed": "50~100",
              "type": "🚅"
            },
            {
              "speed": "50~100",
              "type": "🚈"
            }
          ]
          */
      });
      this.classifyTypeList = classifyList;
      if (!classifyList.length) {
        this.datas = [
          {
            groupType: {},
            children: [...this.showRowList],
            isOpen: true
          }
        ];
        return false;
      }
      let groupList = [];

      /* Iterate each type object, filter matching rows, and append them to each gantt group children */
      classifyList.forEach(classifyItem => {
        let tempObj = Object.assign({}, classifyItem);
        let blockRowList = this.showRowList;
        for (let filterKey in classifyItem) {
          blockRowList = blockRowList.filter(bridgeItem => {
            if (filterKey === "speed") {
              let speedLimit = classifyItem[filterKey].split("~");
              if (speedLimit.length === 2) {
                return bridgeItem.speed >= speedLimit[0] && bridgeItem.speed < speedLimit[1];
              } else {
                return bridgeItem.speed >= speedLimit[0];
              }
            }
            return bridgeItem[filterKey] == classifyItem[filterKey];
          });
        }
        tempObj["children"] = blockRowList;
        tempObj["groupType"] = classifyItem;
        tempObj["isOpen"] = true;
        groupList.push(tempObj);
      });
      this.datas = groupList;
    },
    /* Search */
    filterSearchValue() {
      if (!this.searchValue) {
        this.$message.warning('ID cannot be empty~');
        return false;
      }
      let findList = this.findList.length ? this.findList : [];
      /* If previous search results exist */
      if (findList.length) {
        this.currentFindIndex += 1;
        if (this.currentFindIndex >= findList.length) this.currentFindIndex = 0;
        for (let i = this.currentFindIndex, len = findList.length; i < len; i++) {
          let blockItem = findList[i];
          this.$bus.$emit("scrollToPosition", {
            x: -blockItem.x,
            y: -blockItem.y
          });
          break;
        }
        return false;
      }
      let preScrollHeight = 0;

      for (let i = 0, len = this.datas.length; i < len; i++) {

        let ganttGroup = this.datas[i];
        ganttGroup.isOpen = true;
        let blockRowList = ganttGroup.children;


        let findRow = blockRowList.filter(row => {
          let blockItemIds = row.gtArray.map(blockItem => blockItem.id).join("~"); // Join all block item IDs in one row into a long string
          return blockItemIds.includes(this.searchValue);
        });
        let scrollTop = 0;
        if (findRow.length) {

          for (let j = 0, len = findRow.length; j < len; j++) {
            let rowItem = findRow[j];
            scrollTop = (rowItem.rawIndex + 1) * this.cellHeight;

            let filterBlockList = rowItem.gtArray.filter(blockItem => {
              return blockItem.id.includes(this.searchValue);
            });
            if (filterBlockList.length) {
              filterBlockList.forEach(blockItem => {
                const containerWidth = window.innerWidth - this.titleWidth;

                let totalTimeWidth = this.getWidthAbout2Times(this.times[0], this.times[1]);

                let calcLeft = this.getWidthAbout2Times(this.times[0], blockItem.start); //

                let scrollLeft = calcLeft > totalTimeWidth - containerWidth ? totalTimeWidth - containerWidth : calcLeft;

                let newBlockItem = {
                  x: scrollLeft,
                  y: scrollTop + preScrollHeight,
                  ...blockItem
                };

                findList.push(newBlockItem);

                // Calculate height and width required for scrolling
              });
            }
          }
        } else {
          this.$message.warning('No results found~');
          return false;
        }
        preScrollHeight += (blockRowList.length + 1) * this.cellHeight;
      }
      this.findList = findList;
      this.$bus.$emit("scrollToPosition", {
        x: -findList[0].x,
        y: -findList[0].y
      });
      this.setFilterBlockId(this.searchValue);
    },
    clearSearch() {
      this.setFilterBlockId('');
      this.currentFindIndex = 0;
      this.findList = [];
    },
    dragTask() {
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
      let adjustList = [];
      if (this.targetRow && this.currentBlock) {
        let adjustOjb = checkConflict(this.currentBlock, this.targetRow, this.targetBlock ? this.targetBlock : null);
        adjustList.push(adjustOjb);
      }
      if (this.currentRow && this.targetBlock) {
        let adjustOjb = checkConflict(this.targetBlock, this.currentRow, this.currentBlock ? this.currentBlock : null);
        adjustList.push(adjustOjb);
      }

      // Check whether conflicts exist
      let hasConflict = adjustList.some(adjustObj => {
        return adjustObj.conflictList.length > 0;
      });
      if (hasConflict) {
        this.$message.error("Task adjustment has time conflicts, please review!");
      }
      let rowList = cloneDeep(this.showRowList);
      adjustList.forEach(adjustItem => {
        let currentRow = rowList.find(row => row.id === adjustItem.blockItem.parentId);

        if (this.showMovedBlock) {
          let movedBeforeBlock = currentRow.gtArray.find(blockItem => {
            return blockItem.id === adjustItem.blockId;
          });
          if (movedBeforeBlock["movedStatus"] === "after") {
            // Filter out items that were already moved once
            currentRow.gtArray = currentRow.gtArray.filter(blockItem => blockItem.id !== adjustItem.blockId);
          } else {
            // Not moved before, set movedStatus to before
            movedBeforeBlock["movedStatus"] = "before";
          }
        } else {
          currentRow.gtArray = currentRow.gtArray.filter(blockItem => blockItem.id !== adjustItem.blockId);
        }
        let newBlock = cloneDeep(adjustItem.blockItem);
        let targetRow = rowList.find(row => row.id === adjustItem.targetRowId);
        newBlock["movedStatus"] = "after";
        newBlock["parentId"] = targetRow.id;
        targetRow.gtArray.push(newBlock);
      });
      this.setCutBlock(null);
      this.setCutRow(null);
      this.setShowRowList(rowList);
    },
    toggleGroupOpen(index) {
      this.datas[index].isOpen = !this.datas[index].isOpen;
    }

  }
};
</script>


