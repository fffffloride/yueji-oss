<template>
  <div class="page-container">
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="结算设置" name="config">
        <el-form label-width="130px" class="config-form">
          <el-form-item label="结算周期">
            <el-select v-model="config.cycleType" @change="normalizeDay">
              <el-option label="每周" value="WEEK" />
              <el-option label="每月" value="MONTH" />
              <el-option label="每季度" value="QUARTER" />
              <el-option label="每年" value="YEAR" />
            </el-select>
          </el-form-item>
          <el-form-item :label="config.cycleType === 'WEEK' ? '结算星期' : '结算日期'">
            <el-select v-if="config.cycleType === 'WEEK'" v-model="config.settlementDay">
              <el-option
                v-for="(name, index) in weekdays"
                :key="name"
                :label="name"
                :value="index + 1"
              />
            </el-select>
            <el-input-number v-else v-model="config.settlementDay" :min="1" :max="28" />
          </el-form-item>
          <el-form-item label="提现模式">
            <el-radio-group v-model="config.withdrawalMode">
              <el-radio value="APPLY">代理申请</el-radio>
              <el-radio value="AUTO">系统自动生成</el-radio>
            </el-radio-group>
            <span class="hint">两种模式都必须人工审核后才能打款</span>
          </el-form-item>
          <el-form-item label="单笔提现上限">
            <el-input-number v-model="singleLimitYuan" :min="0.01" :precision="2" :step="100" />
            <span class="unit">元</span>
          </el-form-item>
          <el-form-item label="下一结算日">
            {{ config.nextSettlementDate || "-" }}
          </el-form-item>
          <el-form-item>
            <el-button
              v-hasPerm="'biz:distribution:settlement:config'"
              type="primary"
              :loading="saving"
              @click="saveConfig"
            >
              保存设置
            </el-button>
            <el-button
              v-hasPerm="'biz:distribution:settlement:run'"
              :loading="running"
              @click="runDue"
            >
              执行已到期结算
            </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="结算记录" name="settlements">
        <el-form :model="settlementParams" inline>
          <el-form-item label="代理商">
            <el-select v-model="settlementParams.agentId" clearable filterable style="width: 160px">
              <el-option
                v-for="item in agents"
                :key="item.id"
                :label="item.realName"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="结算周期">
            <el-date-picker v-model="settlementRange" type="daterange" value-format="YYYY-MM-DD" />
          </el-form-item>
          <el-button type="primary" @click="querySettlements">查询</el-button>
          <el-button @click="resetSettlements">重置</el-button>
        </el-form>
        <el-table v-loading="settlementLoading" :data="settlementList" border>
          <el-table-column prop="settlementNo" label="结算单号" min-width="210" />
          <el-table-column label="代理商" min-width="120">
            <template #default="{ row }">{{ row.agentName || row.agentId }}</template>
          </el-table-column>
          <el-table-column label="分润类型" width="120">
            <template #default>产品销售</template>
          </el-table-column>
          <el-table-column label="周期" min-width="330">
            <template #default="{ row }">{{ row.periodStart }} 至 {{ row.periodEnd }}</template>
          </el-table-column>
          <el-table-column prop="commissionCount" label="佣金数" width="90" align="right" />
          <el-table-column label="结算金额" width="130" align="right">
            <template #default="{ row }">¥{{ fen(row.amount) }}</template>
          </el-table-column>
          <el-table-column prop="settledTime" label="结算时间" width="180" />
        </el-table>
        <pagination
          v-if="settlementTotal"
          v-model:total="settlementTotal"
          v-model:page="settlementParams.pageNum"
          v-model:limit="settlementParams.pageSize"
          @pagination="fetchSettlements"
        />
      </el-tab-pane>

      <el-tab-pane label="提现审核" name="withdrawals">
        <el-form :model="withdrawalParams" inline>
          <el-form-item label="关键字">
            <el-input
              v-model="withdrawalParams.keywords"
              clearable
              placeholder="提现单号/代理/会员"
            />
          </el-form-item>
          <el-form-item label="来源">
            <el-select v-model="withdrawalParams.sourceMode" clearable style="width: 120px">
              <el-option label="代理申请" value="APPLY" />
              <el-option label="系统自动" value="AUTO" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="withdrawalParams.status" clearable style="width: 120px">
              <el-option
                v-for="(name, index) in withdrawalStatuses"
                :key="name"
                :label="name"
                :value="index"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="申请时间">
            <el-date-picker v-model="withdrawalRange" type="daterange" value-format="YYYY-MM-DD" />
          </el-form-item>
          <el-button type="primary" @click="queryWithdrawals">查询</el-button>
          <el-button @click="resetWithdrawals">重置</el-button>
        </el-form>
        <el-table v-loading="withdrawalLoading" :data="withdrawalList" border>
          <el-table-column prop="withdrawalNo" label="提现单号" min-width="210" />
          <el-table-column label="代理商 / 会员" min-width="150">
            <template #default="{ row }">
              {{ row.agentName || row.agentId }} / {{ row.memberNickname || row.memberId }}
            </template>
          </el-table-column>
          <el-table-column label="来源" width="100">
            <template #default="{ row }">
              {{ row.sourceMode === "AUTO" ? "系统自动" : "代理申请" }}
            </template>
          </el-table-column>
          <el-table-column label="金额" width="120" align="right">
            <template #default="{ row }">
              <strong>¥{{ fen(row.amount) }}</strong>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="withdrawalTag(row.status)">
                {{ withdrawalStatuses[row.status] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="reviewReason" label="审核理由" min-width="150" />
          <el-table-column prop="transferNo" label="转账流水号" min-width="150" />
          <el-table-column prop="createTime" label="申请时间" width="180" />
          <el-table-column label="操作" width="190" fixed="right">
            <template #default="{ row }">
              <template v-if="row.status === 0">
                <el-button
                  v-hasPerm="'biz:distribution:withdrawal:audit'"
                  link
                  type="primary"
                  @click="audit(row as WithdrawalItem, 1)"
                >
                  通过
                </el-button>
                <el-button
                  v-hasPerm="'biz:distribution:withdrawal:audit'"
                  link
                  type="danger"
                  @click="audit(row as WithdrawalItem, 2)"
                >
                  驳回
                </el-button>
              </template>
              <el-button
                v-if="row.status === 1"
                v-hasPerm="'biz:distribution:withdrawal:paid'"
                link
                type="success"
                @click="markPaid(row as WithdrawalItem)"
              >
                确认打款
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <pagination
          v-if="withdrawalTotal"
          v-model:total="withdrawalTotal"
          v-model:page="withdrawalParams.pageNum"
          v-model:limit="withdrawalParams.pageSize"
          @pagination="fetchWithdrawals"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from "element-plus";
import type { TagProps } from "element-plus";
import {
  DistributionAPI,
  type AgentItem,
  type SettlementConfig,
  type SettlementItem,
  type SettlementQuery,
  type WithdrawalItem,
  type WithdrawalQuery,
} from "@/api/distribution";
import { usePageTable } from "@/composables";

defineOptions({ name: "BizDistributionSettlement" });
const activeTab = ref("config"),
  agents = ref<AgentItem[]>([]),
  saving = ref(false),
  running = ref(false),
  singleLimitYuan = ref(10_000),
  settlementRange = ref<string[]>([]),
  withdrawalRange = ref<string[]>([]);
const weekdays = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"],
  withdrawalStatuses = ["待审核", "待打款", "已驳回", "已打款"];
const config = reactive<SettlementConfig>({
  cycleType: "MONTH",
  settlementDay: 1,
  withdrawalMode: "APPLY",
  singleLimitAmount: 1_000_000,
});
const {
  loading: settlementLoading,
  list: settlementList,
  total: settlementTotal,
  params: settlementParams,
  fetchData: fetchSettlements,
  handleQuery: handleSettlementQuery,
  handleResetQuery: handleSettlementReset,
} = usePageTable<SettlementItem, SettlementQuery>({
  initialParams: { pageNum: 1, pageSize: 10, agentId: undefined, profitPoint: "PRODUCT_SALES" },
  request: DistributionAPI.getSettlementPage,
});
const {
  loading: withdrawalLoading,
  list: withdrawalList,
  total: withdrawalTotal,
  params: withdrawalParams,
  fetchData: fetchWithdrawals,
  handleQuery: handleWithdrawalQuery,
  handleResetQuery: handleWithdrawalReset,
} = usePageTable<WithdrawalItem, WithdrawalQuery>({
  initialParams: {
    pageNum: 1,
    pageSize: 10,
    keywords: "",
    sourceMode: undefined,
    status: undefined,
  },
  request: DistributionAPI.getWithdrawalPage,
});

function normalizeDay() {
  if (config.cycleType === "WEEK" && config.settlementDay > 7) config.settlementDay = 1;
}
async function loadConfig() {
  Object.assign(config, await DistributionAPI.getSettlementConfig());
  singleLimitYuan.value = config.singleLimitAmount / 100;
}
async function saveConfig() {
  saving.value = true;
  try {
    config.singleLimitAmount = Math.round(singleLimitYuan.value * 100);
    Object.assign(config, await DistributionAPI.updateSettlementConfig(config));
    ElMessage.success("结算设置已保存");
  } finally {
    saving.value = false;
  }
}
async function runDue() {
  running.value = true;
  try {
    const result = await DistributionAPI.runDueSettlement();
    ElMessage.success(
      `新增 ${result.settlementsCreated} 张结算单，结算 ¥${fen(result.amountSettled)}`
    );
    await Promise.all([fetchSettlements(), fetchWithdrawals()]);
  } finally {
    running.value = false;
  }
}
function querySettlements() {
  settlementParams.startTime = settlementRange.value[0]
    ? `${settlementRange.value[0]}T00:00:00`
    : undefined;
  settlementParams.endTime = settlementRange.value[1]
    ? `${settlementRange.value[1]}T23:59:59`
    : undefined;
  handleSettlementQuery();
}
function resetSettlements() {
  settlementRange.value = [];
  handleSettlementReset();
}
function queryWithdrawals() {
  withdrawalParams.startTime = withdrawalRange.value[0]
    ? `${withdrawalRange.value[0]}T00:00:00`
    : undefined;
  withdrawalParams.endTime = withdrawalRange.value[1]
    ? `${withdrawalRange.value[1]}T23:59:59`
    : undefined;
  handleWithdrawalQuery();
}
function resetWithdrawals() {
  withdrawalRange.value = [];
  handleWithdrawalReset();
}
async function audit(row: WithdrawalItem, status: 1 | 2) {
  try {
    const { value } = await ElMessageBox.prompt(
      status === 1 ? "请输入审核通过理由" : "请输入驳回理由",
      status === 1 ? "审核通过" : "驳回提现",
      { inputValidator: (text) => Boolean(text?.trim()) || "请输入理由" }
    );
    await DistributionAPI.auditWithdrawal(row.id, status, value);
    ElMessage.success("审核完成");
    fetchWithdrawals();
  } catch {
    // 用户取消操作。
  }
}
async function markPaid(row: WithdrawalItem) {
  try {
    const { value } = await ElMessageBox.prompt("请输入微信转账流水号", "确认已打款", {
      inputValidator: (text) => Boolean(text?.trim()) || "请输入转账流水号",
    });
    await DistributionAPI.markWithdrawalPaid(row.id, value);
    ElMessage.success("已确认打款");
    fetchWithdrawals();
  } catch {
    // 用户取消操作。
  }
}
const fen = (value: number) => (Number(value) / 100).toFixed(2);
const withdrawalTag = (status: number): TagProps["type"] =>
  status === 3 ? "success" : status === 2 ? "danger" : status === 1 ? "primary" : "warning";

onMounted(async () => {
  await Promise.all([loadConfig(), fetchSettlements(), fetchWithdrawals()]);
  agents.value = (await DistributionAPI.getAgentPage({ pageNum: 1, pageSize: 100 })).list;
});
</script>

<style scoped>
.config-form {
  max-width: 620px;
  padding-top: 20px;
}
.hint {
  margin-left: 12px;
  color: var(--el-text-color-secondary);
}
.unit {
  margin-left: 8px;
}
</style>
