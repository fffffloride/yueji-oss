<template>
  <div class="page-container points-page">
    <el-card class="rule-card" shadow="never">
      <template #header><strong>积分规则</strong></template>
      <el-form :model="rule" inline>
        <el-form-item label="每实付1元赠送">
          <el-input-number v-model="rule.earnPerYuan" :min="0" :max="10000" />
          <span class="unit">积分</span>
        </el-form-item>
        <el-form-item label="抵扣1元需要">
          <el-input-number v-model="rule.redeemPointsPerYuan" :min="1" :max="100000" />
          <span class="unit">积分</span>
        </el-form-item>
        <el-form-item label="单笔最高抵扣">
          <el-input-number v-model="maxRatePercent" :min="0" :max="100" :precision="2" />
          <span class="unit">%</span>
        </el-form-item>
        <el-button
          v-hasPerm="'biz:points:rule'"
          type="primary"
          :loading="ruleSaving"
          @click="saveRule"
        >
          保存规则
        </el-button>
      </el-form>
    </el-card>

    <el-card class="page-search" shadow="never">
      <el-form :model="params" inline>
        <el-form-item label="关键字">
          <el-input v-model="params.keywords" placeholder="会员 / 手机 / 订单" clearable />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="params.bizType" clearable placeholder="全部" style="width: 170px">
            <el-option
              v-for="item in bizTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item><el-button type="primary" @click="handleQuery">查询</el-button></el-form-item>
      </el-form>
    </el-card>

    <el-card class="page-content" shadow="never">
      <div class="page-toolbar">
        <strong>积分流水</strong>
        <el-button class="page-icon-btn" @click="fetchData">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
      <div class="page-table-wrapper">
        <el-table v-loading="loading" :data="list" border height="100%">
          <el-table-column label="会员" min-width="160">
            <template #default="{ row }">
              <div>{{ row.memberNickname || row.memberId }}</div>
              <small>{{ row.memberMobile || "-" }}</small>
            </template>
          </el-table-column>
          <el-table-column label="变动" width="100" align="right">
            <template #default="{ row }">
              <span :class="row.changePoints >= 0 ? 'gain' : 'cost'">
                {{ row.changePoints > 0 ? "+" : "" }}{{ row.changePoints }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="balanceAfter" label="变动后" width="100" align="right" />
          <el-table-column label="类型" width="130">
            <template #default="{ row }">{{ bizTypeLabel(row.bizType) }}</template>
          </el-table-column>
          <el-table-column prop="bizId" label="业务ID" min-width="150" />
          <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
          <el-table-column prop="createTime" label="时间" width="180" />
        </el-table>
      </div>
      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="params.pageNum"
        v-model:limit="params.pageSize"
        @pagination="fetchData"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { Refresh } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

import { PointsAPI, type PointsLog, type PointsLogQuery, type PointsRule } from "@/api/marketing";
import { usePageTable } from "@/composables";

defineOptions({ name: "BizPoints" });

const rule = reactive<PointsRule>({
  earnPerYuan: 1,
  redeemPointsPerYuan: 100,
  maxDeductRate: 5000,
});
const maxRatePercent = computed({
  get: () => rule.maxDeductRate / 100,
  set: (value: number) => (rule.maxDeductRate = Math.round(value * 100)),
});
const ruleSaving = ref(false);
const { loading, list, total, params, fetchData, handleQuery } = usePageTable<
  PointsLog,
  PointsLogQuery
>({
  initialParams: { pageNum: 1, pageSize: 10, keywords: "", bizType: "" },
  request: PointsAPI.getLogs,
});

const bizTypes = [
  { value: "INIT", label: "初始积分" },
  { value: "ORDER_DEDUCT", label: "订单抵扣" },
  { value: "ORDER_CANCEL_RETURN", label: "取消返还" },
  { value: "ORDER_REFUND_RETURN", label: "退款返还" },
  { value: "ORDER_EARN", label: "消费赠送" },
];

async function loadRule() {
  Object.assign(rule, await PointsAPI.getRule());
}

async function saveRule() {
  ruleSaving.value = true;
  try {
    await PointsAPI.updateRule(rule);
    ElMessage.success("积分规则已更新，仅影响后续订单");
  } finally {
    ruleSaving.value = false;
  }
}

function bizTypeLabel(value: string) {
  return bizTypes.find((item) => item.value === value)?.label ?? value;
}

loadRule();
</script>

<style scoped>
.points-page {
  display: grid;
  gap: 16px;
}
.rule-card :deep(.el-card__body) {
  padding-bottom: 2px;
}
.unit,
small {
  margin-left: 6px;
  color: var(--el-text-color-secondary);
}
.gain {
  font-weight: 600;
  color: var(--el-color-success);
}
.cost {
  font-weight: 600;
  color: var(--el-color-danger);
}
</style>
