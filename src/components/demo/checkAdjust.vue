<template>
  <div class="check-container">
    <div class="left-check">
      <el-table
          ref="singleTable"
          :data="adjustList"
          tooltip-effect="dark"
          style="width: 100%"
          highlight-current-row
          @current-change="handleCurrentChange"
          @selection-change="handleSelectionChange">
        <el-table-column
            type="selection"
            align="center"
            width="55"
        >
        </el-table-column>
        <el-table-column
            :label="'Selected ('+ tableSelection.length+'/'+ adjustList.length+')'">
          <template #default="scope">
            <el-tag :type="scope.row.conflictList.length===0?'success':'danger'" size="middle">
              {{ scope.row.conflictList.length === 0 ? "No conflict" : "Has conflict" }}
            </el-tag>
            {{ scope.row.blockId }}
          </template>
        </el-table-column>
        <el-table-column
            label="Action type"
            width="80"
            align="center">
          <template #default="scope">{{ scope.row.adjustType }}</template>
        </el-table-column>
        <el-table-column
            label="Target"
            width="80"
            align="center">
          <template #default="scope">{{ scope.row.targetRowId }}</template>
        </el-table-column>
        <el-table-column
            label="Validation result"
            width="80"
            align="center">
          <template #default="scope">{{ scope.row.conflictList.length }}</template>
        </el-table-column>
      </el-table>
    </div>
    <div class="right-check" v-if="selectRow">
      <div class="terms-info clearfix">
        Conflict list({{ selectRow.conflictList.length }})
        <el-button type="primary" class="conflict-btn" @click="ignoreConflictAll">Ignore all</el-button>
        <el-button type="primary" class="conflict-btn" @click="checkAdjustResult">Revalidate</el-button>
      </div>
      <div class="terms-list">
        <el-scrollbar class="modify-scroll" style="height:100%">
          <div class="term-item" v-for="(conflictItem,index) in selectRow.conflictList" :key="index">
            <h3 class="conflict-title">{{ index + 1 + "." + conflictItem.conflictType }}</h3>
            <p class="conflict-desc">{{ conflictItem.conflictDesc }}</p>

            <el-button :disabled="conflictItem.isIgnore" class="btn-ignore" type="primary"
                       @click="ignoreConflictItem(conflictItem)">{{ conflictItem.isIgnore ? "Ignored" : "Ignore" }}
            </el-button>
          </div>
        </el-scrollbar>

      </div>

      <div class="check-result-info clearfix">
        <el-tag :type="selectRow.conflictList.length===0?'success':'danger'" size="middle">
          {{ selectRow.conflictList.length === 0 ? "Validation passed" : "Validation failed" }}
        </el-tag>
        <el-button type="primary" class="btn-check" @click="checkAndInsert">Confirm adjustment</el-button>


      </div>
    </div>
  </div>
</template>

<script>
import {mapState, mapMutations} from "vuex";
import {buildAdjustList, applyAdjustList, revalidateAdjust} from "@/utils/tool.js";

export default {
  name: "checkAdjust",
  emits: ["closeDialog"],
  data() {
    return {
      adjustList: [],
      tableSelection: [],
      selectRow: null
    };
  },
  computed: {
    ...mapState([
      "currentBlock",
      "currentRow",
      "targetBlock",
      "targetRow",
      "showRowList",
      "showMovedBlock"
    ])
  },
  methods: {
    ...mapMutations([
      "setShowRowList",
      "setCutBlock",
      "setCutRow"
    ]),
    calcConflictList() {

      this.selectRow = null;
      this.adjustList = buildAdjustList(this);

      if (this.adjustList.length) {
        this.$nextTick(() => {
          this.$refs.singleTable.setCurrentRow(this.adjustList[0]);
          this.$refs.singleTable.toggleAllSelection();
        });
      }
    },
    handleSelectionChange(val) {
      this.tableSelection = val;
    },
    handleCurrentChange(val) {
      this.selectRow = val;
    },
    ignoreConflictItem(item) {
      item.isIgnore = true;
    },
    ignoreConflictAll() {
      if (this.selectRow) {
        this.selectRow.conflictList.map(conflictItem => {
          conflictItem.isIgnore = true;
        });
      }
    },
    checkAdjustResult() {
      if (!this.tableSelection.length) {
        this.$message.error("Select at least one item to revalidate!");
        return;
      }
      // Check the selected adjustments again; ignored conflicts are dropped
      this.tableSelection.forEach(adjustObj => {
        adjustObj.conflictList = revalidateAdjust(adjustObj, this.showRowList);
      });
    },
    checkAndInsert() {
      this.checkAdjustResult();
      if (!this.tableSelection.length) {
        return false;
      }
      /* Check whether conflicts exist */
      let hasConflict = this.tableSelection.some(adjustObj => {
        return adjustObj.conflictList.length > 0;
      });
      if (hasConflict) {
        this.$message.error("Task adjustment has time conflicts, please review!");
        return false;
      } else {
        this.setShowRowList(applyAdjustList(this.showRowList, this.tableSelection, this.showMovedBlock));
        // The cut block is placed now, so it can not be pasted again
        this.setCutBlock(null);
        this.setCutRow(null);
        this.$emit("closeDialog");
      }
    }
  }
};
</script>

<style lang="scss" scoped>

.check-container {
  display: flex;
  .left-check {
    width: 450px;
    padding-right: 10px;
    border-right: 2px solid #DDDDDD;
  }
  .right-check {
    flex: 1;
    padding-left: 15px;
    .adjust-blockItem {
      font-size: 16px;
    }
    .adjust-desc {
      font-size: 14px;
    }
    .terms-info {
      padding: 5px 0;
    }
    .conflict-btn {
      float: right;
      margin-left: 10px;
    }
    .terms-list {
      border: 1px solid #666666;
      height: 350px;
    }
    .term-item {
      padding: 10px 120px 10px 10px;
      position: relative;
      &:nth-child(2n+1) {
        background-color: #F4F4F4;
      }
    }
    .conflict-title {
      margin: 0;
      line-height: 1.5;
      font-size: 12px;
    }
    .conflict-desc {
      font-size: 12px;
      line-height: 1.5;
      margin: 0;
    }
    .btn-ignore {
      position: absolute;
      top: 20px;
      right: 20px;
    }
  }
  .check-result-info {
    padding-top: 15px;
    .btn-check {
      float: right;
    }
  }
}

</style>


