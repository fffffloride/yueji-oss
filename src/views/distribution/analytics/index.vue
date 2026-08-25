<template>
  <div class="analytics-page">
    <el-card shadow="never">
      <el-form inline>
        <el-form-item label="统计时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :clearable="false"
          />
        </el-form-item>
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button
          v-hasPerm="'biz:distribution:analytics:export'"
          :loading="exporting"
          @click="handleExport"
        >
          导出 Excel
        </el-button>
      </el-form>
    </el-card>

    <section v-loading="overviewLoading" class="summary-grid">
      <article v-for="item in summaryCards" :key="item.label" class="summary-card">
        <span class="summary-card__label">{{ item.label }}</span>
        <strong class="summary-card__value">{{ item.value }}</strong>
        <span class="summary-card__note">{{ item.note }}</span>
      </article>
    </section>

    <section class="analytics-grid">
      <el-card v-loading="overviewLoading" shadow="never">
        <template #header>
          <div class="card-head">
            <span>销售趋势</span>
            <el-tag effect="plain">{{ granularityLabel }}</el-tag>
          </div>
        </template>
        <ECharts :options="trendOptions" height="320px" />
      </el-card>

      <el-card v-loading="overviewLoading" shadow="never">
        <template #header>层级统计（按当前等级）</template>
        <el-table :data="overview?.levels || []" border height="320">
          <el-table-column prop="levelName" label="等级" min-width="100" />
          <el-table-column prop="agentCount" label="人数" width="70" align="right" />
          <el-table-column label="审核 / 禁用" width="100" align="center">
            <template #default="{ row }">
              {{ row.approvedAgentCount }} / {{ row.disabledAgentCount }}
            </template>
          </el-table-column>
          <el-table-column label="直属销售额" min-width="120" align="right">
            <template #default="{ row }">¥{{ formatYuan(row.salesAmount) }}</template>
          </el-table-column>
          <el-table-column prop="orderCount" label="订单" width="70" align="right" />
          <el-table-column prop="customerCount" label="客户" width="70" align="right" />
        </el-table>
      </el-card>
    </section>

    <el-card shadow="never">
      <template #header>
        <div class="card-head">
          <span>代理业绩排名</span>
          <span class="card-head__tip">只统计直属已核销订单</span>
        </div>
      </template>
      <el-form :model="agentParams" inline>
        <el-form-item label="代理商">
          <el-input
            v-model="agentParams.keywords"
            placeholder="姓名 / 手机号"
            clearable
            @keyup.enter="queryAgents"
          />
        </el-form-item>
        <el-form-item label="当前等级">
          <el-select v-model="agentParams.levelId" clearable style="width: 150px">
            <el-option
              v-for="item in overview?.levels || []"
              :key="item.levelId"
              :label="item.levelName"
              :value="item.levelId"
            />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="queryAgents">查询</el-button>
        <el-button @click="resetAgents()">重置</el-button>
      </el-form>
      <el-table v-loading="agentLoading" :data="agents" border>
        <el-table-column label="排名" width="70" align="center">
          <template #default="{ $index }">
            {{ (agentParams.pageNum! - 1) * agentParams.pageSize! + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="realName" label="代理商" min-width="120" />
        <el-table-column prop="mobile" label="手机号" width="130" />
        <el-table-column prop="levelName" label="当前等级" width="110" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? "已审核" : "已禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="直属销售额" min-width="130" align="right">
          <template #default="{ row }">¥{{ formatYuan(row.salesAmount) }}</template>
        </el-table-column>
        <el-table-column prop="orderCount" label="订单数" width="90" align="right" />
        <el-table-column prop="customerCount" label="客户数" width="90" align="right" />
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openAgent(row as DistributionAgentPerformance)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-if="agentTotal"
        v-model:total="agentTotal"
        v-model:page="agentParams.pageNum"
        v-model:limit="agentParams.pageSize"
        @pagination="fetchAgents"
      />
    </el-card>

    <el-drawer
      v-model="detailVisible"
      :title="`${detail?.agent.realName || ''} - 业绩详情`"
      size="720px"
    >
      <div v-loading="detailLoading">
        <div class="detail-summary">
          <div>
            <span>直属销售额</span>
            <strong>¥{{ formatYuan(detail?.summary.salesAmount || 0) }}</strong>
          </div>
          <div>
            <span>订单数</span>
            <strong>{{ detail?.summary.orderCount || 0 }}</strong>
          </div>
          <div>
            <span>客户数</span>
            <strong>{{ detail?.summary.customerCount || 0 }}</strong>
          </div>
        </div>
        <ECharts :options="agentTrendOptions" height="320px" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { dayjs, ElMessage } from "element-plus";
import {
  DistributionAPI,
  type AnalyticsGranularity,
  type DistributionAgentAnalyticsDetail,
  type DistributionAgentAnalyticsQuery,
  type DistributionAgentPerformance,
  type DistributionAnalyticsOverview,
  type DistributionAnalyticsQuery,
} from "@/api/distribution";
import { downloadFile } from "@/utils";

defineOptions({ name: "BizDistributionAnalytics" });

const defaultRange = (): [string, string] => [
  dayjs().startOf("month").format("YYYY-MM-DD"),
  dayjs().format("YYYY-MM-DD"),
];
const dateRange = ref<[string, string]>(defaultRange());
const overview = ref<DistributionAnalyticsOverview>();
const overviewLoading = ref(false);
const exporting = ref(false);

const dateQuery = (): DistributionAnalyticsQuery => ({
  startDate: dateRange.value[0],
  endDate: dateRange.value[1],
});
const formatYuan = (fen: number) =>
  (fen / 100).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const granularityLabels: Record<AnalyticsGranularity, string> = {
  DAY: "按日",
  MONTH: "按月",
  YEAR: "按年",
};
const granularityLabel = computed(() =>
  overview.value ? granularityLabels[overview.value.granularity] : "按日"
);
const summaryCards = computed(() => [
  {
    label: "全系统已核销销售额",
    value: `¥${formatYuan(overview.value?.summary.totalSalesAmount || 0)}`,
    note: "全部已完成订单",
  },
  {
    label: "已核销订单数",
    value: String(overview.value?.summary.verifiedOrderCount || 0),
    note: "全部已完成订单",
  },
  {
    label: "分销直属销售额",
    value: `¥${formatYuan(overview.value?.summary.distributionSalesAmount || 0)}`,
    note: "直属推荐客户",
  },
  {
    label: "产生业绩代理数",
    value: String(overview.value?.summary.performingAgentCount || 0),
    note: "所选时间范围",
  },
]);

const trendOptions = computed(() => ({
  tooltip: { trigger: "axis" },
  legend: { data: ["全系统销售额", "分销直属销售额"] },
  grid: { left: 24, right: 24, bottom: 20, containLabel: true },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: overview.value?.trend.map((x) => x.period) || [],
  },
  yAxis: { type: "value", axisLabel: { formatter: (value: number) => `¥${value}` } },
  series: [
    {
      name: "全系统销售额",
      type: "line",
      smooth: true,
      data: overview.value?.trend.map((x) => x.totalSalesAmount / 100) || [],
    },
    {
      name: "分销直属销售额",
      type: "line",
      smooth: true,
      data: overview.value?.trend.map((x) => x.distributionSalesAmount / 100) || [],
    },
  ],
}));

const agentParams = reactive<DistributionAgentAnalyticsQuery>({
  pageNum: 1,
  pageSize: 10,
  keywords: "",
  levelId: undefined,
});
const agents = ref<DistributionAgentPerformance[]>([]);
const agentTotal = ref(0);
const agentLoading = ref(false);

async function fetchOverview() {
  overviewLoading.value = true;
  try {
    overview.value = await DistributionAPI.getAnalyticsOverview(dateQuery());
  } finally {
    overviewLoading.value = false;
  }
}

async function fetchAgents() {
  agentLoading.value = true;
  try {
    const page = await DistributionAPI.getAgentAnalyticsPage({ ...agentParams, ...dateQuery() });
    agents.value = page.list;
    agentTotal.value = page.total;
  } finally {
    agentLoading.value = false;
  }
}

function handleQuery() {
  agentParams.pageNum = 1;
  Promise.all([fetchOverview(), fetchAgents()]);
}

function handleReset() {
  dateRange.value = defaultRange();
  resetAgents(false);
  handleQuery();
}

function queryAgents() {
  agentParams.pageNum = 1;
  fetchAgents();
}

function resetAgents(fetch = true) {
  Object.assign(agentParams, { pageNum: 1, pageSize: 10, keywords: "", levelId: undefined });
  if (fetch) fetchAgents();
}

async function handleExport() {
  exporting.value = true;
  try {
    const response = await DistributionAPI.exportAnalytics(dateQuery());
    downloadFile(response, `销售统计_${dateRange.value[0]}_${dateRange.value[1]}.xlsx`);
    ElMessage.success("导出成功");
  } finally {
    exporting.value = false;
  }
}

const detailVisible = ref(false);
const detailLoading = ref(false);
const detail = ref<DistributionAgentAnalyticsDetail>();
const agentTrendOptions = computed(() => ({
  tooltip: { trigger: "axis" },
  grid: { left: 24, right: 24, bottom: 20, containLabel: true },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: detail.value?.trend.map((x) => x.period) || [],
  },
  yAxis: { type: "value", axisLabel: { formatter: (value: number) => `¥${value}` } },
  series: [
    {
      name: "直属销售额",
      type: "line",
      smooth: true,
      areaStyle: {},
      data: detail.value?.trend.map((x) => x.salesAmount / 100) || [],
    },
  ],
}));

async function openAgent(row: DistributionAgentPerformance) {
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    detail.value = await DistributionAPI.getAgentAnalytics(row.agentId, dateQuery());
  } finally {
    detailLoading.value = false;
  }
}

onMounted(handleQuery);
</script>

<style scoped>
.analytics-page {
  display: grid;
  gap: 16px;
  padding: 16px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}

.summary-card__label,
.summary-card__note,
.card-head__tip,
.detail-summary span {
  color: var(--el-text-color-secondary);
}

.summary-card__value {
  font-size: 24px;
}

.summary-card__note,
.card-head__tip {
  font-size: 12px;
}

.analytics-grid {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(420px, 2fr);
  gap: 16px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.detail-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.detail-summary > div {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.detail-summary strong {
  font-size: 20px;
}

@media (max-width: 1100px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .analytics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
