<template>
  <div class="page-container">
    <el-card class="page-search" shadow="never">
      <el-form :model="params" inline>
        <el-form-item label="关键字">
          <el-input
            v-model="params.keywords"
            clearable
            placeholder="订单号/代理/会员"
            @keyup.enter="query"
          />
        </el-form-item>
        <el-form-item label="代理商">
          <el-select v-model="params.agentId" clearable filterable style="width: 150px">
            <el-option
              v-for="item in agents"
              :key="item.id"
              :label="item.realName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="层级">
          <el-select v-model="params.depth" clearable style="width: 100px">
            <el-option label="一级" :value="1" />
            <el-option label="二级" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="params.status" clearable style="width: 120px">
            <el-option label="待结算" :value="0" />
            <el-option label="可提现" :value="1" />
            <el-option label="已冲销" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付时间">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            value-format="YYYY-MM-DDTHH:mm:ss"
            start-placeholder="开始"
            end-placeholder="结束"
          />
        </el-form-item>
        <el-button type="primary" @click="query">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </el-form>
    </el-card>
    <el-card class="page-content" shadow="never">
      <div class="page-toolbar">
        <div>
          <strong>佣金明细</strong>
          <span class="hint">金额与比例均为支付时快照，不可修改</span>
        </div>
        <el-button class="page-icon-btn" @click="fetchData">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
      <div class="page-table-wrapper">
        <el-table v-loading="loading" :data="list" border height="100%">
          <el-table-column prop="orderNo" label="订单号" min-width="190" />
          <el-table-column label="买家" min-width="130">
            <template #default="{ row }">{{ row.buyerNickname || row.buyerMemberId }}</template>
          </el-table-column>
          <el-table-column label="受益代理" min-width="130">
            <template #default="{ row }">
              {{ row.beneficiaryName || row.beneficiaryAgentId }}
            </template>
          </el-table-column>
          <el-table-column label="层级" width="80">
            <template #default="{ row }">{{ row.depth }} 级</template>
          </el-table-column>
          <el-table-column label="实付基数" width="120">
            <template #default="{ row }">¥{{ fen(row.baseAmount) }}</template>
          </el-table-column>
          <el-table-column label="比例" width="100">
            <template #default="{ row }">{{ rate(row.rateBps) }}</template>
          </el-table-column>
          <el-table-column label="佣金" width="120">
            <template #default="{ row }">
              <strong>¥{{ fen(row.commissionAmount) }}</strong>
            </template>
          </el-table-column>
          <el-table-column prop="agentLevelName" label="等级快照" width="120" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="tag(row.status)">{{ status(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="paidTime" label="支付时间" width="180" />
          <el-table-column label="状态时间" width="180">
            <template #default="{ row }">
              {{ row.reversedTime || row.availableTime || "-" }}
            </template>
          </el-table-column>
        </el-table>
      </div>
      <pagination
        v-if="total"
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
import type { TagProps } from "element-plus";
import {
  DistributionAPI,
  type AgentItem,
  type CommissionItem,
  type CommissionQuery,
} from "@/api/distribution";
import { usePageTable } from "@/composables";
defineOptions({ name: "BizDistributionCommission" });
const { loading, list, total, params, fetchData } = usePageTable<CommissionItem, CommissionQuery>({
  initialParams: {
    pageNum: 1,
    pageSize: 10,
    keywords: "",
    agentId: undefined,
    depth: undefined,
    status: undefined,
    startTime: undefined,
    endTime: undefined,
  },
  request: DistributionAPI.getCommissionPage,
});
const timeRange = ref<string[]>([]),
  agents = ref<AgentItem[]>([]);
function query() {
  params.startTime = timeRange.value?.[0];
  params.endTime = timeRange.value?.[1];
  params.pageNum = 1;
  fetchData();
}
function reset() {
  Object.assign(params, {
    pageNum: 1,
    keywords: "",
    agentId: undefined,
    depth: undefined,
    status: undefined,
    startTime: undefined,
    endTime: undefined,
  });
  timeRange.value = [];
  fetchData();
}
const fen = (v: number) => (v / 100).toFixed(2),
  rate = (v: number) => `${(v / 100).toFixed(2)}%`,
  status = (s: number) => ["待结算", "可提现", "已冲销"][s] || "未知",
  tag = (s: number): TagProps["type"] => (s === 1 ? "success" : s === 2 ? "danger" : "warning");
onMounted(async () => {
  fetchData();
  agents.value = (await DistributionAPI.getAgentPage({ pageNum: 1, pageSize: 100 })).list;
});
</script>
<style scoped>
.hint {
  margin-left: 10px;
  font-weight: normal;
  color: var(--el-text-color-secondary);
}
</style>
