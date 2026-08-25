<template>
  <div class="page-container">
    <el-card class="page-search" shadow="never">
      <el-form :model="params" inline>
        <el-form-item label="任务名称">
          <el-input v-model="params.keywords" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="任务状态">
          <el-select v-model="params.displayStatus" clearable style="width: 130px">
            <el-option
              v-for="(label, value) in displayLabels"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="完成指标">
          <el-select v-model="params.metricType" clearable style="width: 150px">
            <el-option label="已核销销售额" value="SALES_AMOUNT" />
            <el-option label="已核销订单数" value="ORDER_COUNT" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="handleResetQuery">重置</el-button>
      </el-form>
    </el-card>

    <el-card class="page-content" shadow="never">
      <div class="page-toolbar">
        <el-button v-hasPerm="'biz:distribution:task:create'" type="primary" @click="openForm()">
          新增任务
        </el-button>
        <el-button class="page-icon-btn" @click="fetchData">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
      <div class="page-table-wrapper">
        <el-table v-loading="loading" :data="list" border height="100%">
          <el-table-column prop="name" label="任务名称" min-width="180" />
          <el-table-column label="指标 / 目标" min-width="170">
            <template #default="{ row }">
              {{ metricLabel(row.metricType) }}：{{ targetText(row as DistributionTaskItem) }}
            </template>
          </el-table-column>
          <el-table-column label="分配范围" width="110">
            <template #default="{ row }">{{ scopeLabel(row.assignmentScope) }}</template>
          </el-table-column>
          <el-table-column label="有效期" min-width="330">
            <template #default="{ row }">{{ row.startTime }} 至 {{ row.endTime }}</template>
          </el-table-column>
          <el-table-column label="完成情况" width="120" align="center">
            <template #default="{ row }">
              {{ row.completedCount }} / {{ row.totalAssignees }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="displayTag(row.displayStatus)">
                {{ displayLabel(row.displayStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="280" fixed="right">
            <template #default="{ row }">
              <template v-if="row.status === 0">
                <el-button
                  v-hasPerm="'biz:distribution:task:update'"
                  link
                  type="primary"
                  @click="openForm(row.id)"
                >
                  编辑
                </el-button>
                <el-button
                  v-hasPerm="'biz:distribution:task:publish'"
                  link
                  type="success"
                  @click="publish(row as DistributionTaskItem)"
                >
                  发布
                </el-button>
                <el-button
                  v-hasPerm="'biz:distribution:task:delete'"
                  link
                  type="danger"
                  @click="remove(row as DistributionTaskItem)"
                >
                  删除
                </el-button>
              </template>
              <template v-else>
                <el-button link type="primary" @click="openProgress(row as DistributionTaskItem)">
                  完成情况
                </el-button>
                <el-button
                  v-if="row.status === 1"
                  v-hasPerm="'biz:distribution:task:cancel'"
                  link
                  type="danger"
                  @click="cancel(row as DistributionTaskItem)"
                >
                  取消
                </el-button>
              </template>
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

    <el-drawer v-model="formVisible" :title="editingId ? '编辑任务' : '新增任务'" size="620px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="110px">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="form.name" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="任务描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="完成指标">
          <el-radio-group v-model="form.metricType">
            <el-radio value="SALES_AMOUNT">已核销销售额</el-radio>
            <el-radio value="ORDER_COUNT">已核销订单数</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="目标值">
          <template v-if="form.metricType === 'SALES_AMOUNT'">
            <el-input-number v-model="form.targetYuan" :min="0.01" :precision="2" :step="100" />
            <span class="unit">元</span>
          </template>
          <template v-else>
            <el-input-number v-model="form.targetCount" :min="1" :precision="0" />
            <span class="unit">单</span>
          </template>
        </el-form-item>
        <el-form-item label="有效期" prop="period">
          <el-date-picker
            v-model="form.period"
            type="datetimerange"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="分配范围">
          <el-select v-model="form.assignmentScope" style="width: 100%" @change="resetTarget">
            <el-option label="全部已审核代理" value="ALL" />
            <el-option label="指定等级" value="LEVEL" />
            <el-option label="指定代理" value="AGENT" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.assignmentScope === 'LEVEL'" label="分销等级">
          <el-select v-model="form.targetLevelId" style="width: 100%">
            <el-option v-for="item in levels" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.assignmentScope === 'AGENT'" label="指定代理">
          <el-select
            v-model="form.targetAgentIds"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            style="width: 100%"
          >
            <el-option
              v-for="item in agents"
              :key="item.id"
              :label="`${item.realName}${item.mobile ? `（${item.mobile}）` : ''}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-alert
          title="发布时生成固定代理名单；发布后任务内容和名单不可修改"
          type="info"
          :closable="false"
        />
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveTask">保存草稿</el-button>
      </template>
    </el-drawer>

    <el-drawer
      v-model="progressVisible"
      :title="`${selectedTask?.name || ''} - 完成情况`"
      size="820px"
    >
      <el-form :model="assigneeParams" inline>
        <el-form-item label="代理商">
          <el-input v-model="assigneeParams.keywords" clearable />
        </el-form-item>
        <el-form-item label="完成状态">
          <el-select v-model="assigneeParams.completed" clearable style="width: 120px">
            <el-option label="未完成" :value="0" />
            <el-option label="已完成" :value="1" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="queryAssignees">查询</el-button>
      </el-form>
      <el-table v-loading="assigneeLoading" :data="assignees" border>
        <el-table-column prop="agentName" label="代理商" min-width="130" />
        <el-table-column prop="mobile" label="手机号" width="130" />
        <el-table-column label="当前进度" min-width="160" align="right">
          <template #default="{ row }">
            {{ progressText(row as DistributionTaskAssigneeItem) }}
          </template>
        </el-table-column>
        <el-table-column label="完成比例" width="200">
          <template #default="{ row }">
            <el-progress :percentage="row.progressRateBps / 100" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.completed ? 'success' : 'info'">
              {{ row.completed ? "已完成" : "未完成" }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-if="assigneeTotal"
        v-model:total="assigneeTotal"
        v-model:page="assigneeParams.pageNum"
        v-model:limit="assigneeParams.pageSize"
        @pagination="fetchAssignees"
      />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { Refresh } from "@element-plus/icons-vue";
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
  type TagProps,
} from "element-plus";
import {
  DistributionAPI,
  type AgentItem,
  type DistributionLevelItem,
  type DistributionTaskAssigneeItem,
  type DistributionTaskAssigneeQuery,
  type DistributionTaskDisplayStatus,
  type DistributionTaskForm,
  type DistributionTaskItem,
  type DistributionTaskMetric,
  type DistributionTaskQuery,
  type DistributionTaskScope,
} from "@/api/distribution";
import { usePageTable } from "@/composables";

defineOptions({ name: "BizDistributionTask" });

const metricLabels: Record<DistributionTaskMetric, string> = {
  SALES_AMOUNT: "已核销销售额",
  ORDER_COUNT: "已核销订单数",
};
const scopeLabels: Record<DistributionTaskScope, string> = {
  ALL: "全部代理",
  LEVEL: "指定等级",
  AGENT: "指定代理",
};
const displayLabels: Record<DistributionTaskDisplayStatus, string> = {
  DRAFT: "草稿",
  NOT_STARTED: "未开始",
  IN_PROGRESS: "进行中",
  FINISHED: "已结束",
  CANCELLED: "已取消",
};
const displayTag = (status: DistributionTaskDisplayStatus): TagProps["type"] =>
  status === "IN_PROGRESS"
    ? "success"
    : status === "NOT_STARTED"
      ? "primary"
      : status === "CANCELLED"
        ? "danger"
        : status === "DRAFT"
          ? "warning"
          : "info";
const metricLabel = (value: DistributionTaskMetric) => metricLabels[value];
const scopeLabel = (value: DistributionTaskScope) => scopeLabels[value];
const displayLabel = (value: DistributionTaskDisplayStatus) => displayLabels[value];
const fen = (value: number) => (value / 100).toFixed(2);
const targetText = (row: DistributionTaskItem) =>
  row.metricType === "SALES_AMOUNT" ? `¥${fen(row.targetValue)}` : `${row.targetValue} 单`;

const { loading, list, total, params, fetchData, handleQuery, handleResetQuery } = usePageTable<
  DistributionTaskItem,
  DistributionTaskQuery
>({
  initialParams: {
    pageNum: 1,
    pageSize: 10,
    keywords: "",
    displayStatus: undefined,
    metricType: undefined,
  },
  request: DistributionAPI.getTaskPage,
});

type TaskFormView = {
  name: string;
  description: string;
  metricType: DistributionTaskMetric;
  targetYuan: number;
  targetCount: number;
  period: Date[];
  assignmentScope: DistributionTaskScope;
  targetLevelId: string;
  targetAgentIds: string[];
};
const emptyForm = (): TaskFormView => {
  const start = new Date(Date.now() + 5 * 60_000);
  return {
    name: "",
    description: "",
    metricType: "SALES_AMOUNT",
    targetYuan: 1000,
    targetCount: 1,
    period: [start, new Date(start.getTime() + 30 * 24 * 60 * 60_000)],
    assignmentScope: "ALL",
    targetLevelId: "",
    targetAgentIds: [],
  };
};
const formVisible = ref(false),
  saving = ref(false),
  editingId = ref(""),
  formRef = ref<FormInstance>();
const form = reactive<TaskFormView>(emptyForm());
const formRules: FormRules = {
  name: [{ required: true, message: "请输入任务名称", trigger: "blur" }],
  period: [{ type: "array", required: true, message: "请选择有效期", trigger: "change" }],
};
const levels = ref<DistributionLevelItem[]>([]),
  agents = ref<AgentItem[]>([]);

async function loadOptions() {
  const [levelPage, agentPage] = await Promise.all([
    DistributionAPI.getLevelPage({ pageNum: 1, pageSize: 100, status: 1 }),
    DistributionAPI.getAgentPage({ pageNum: 1, pageSize: 100, status: 1 }),
  ]);
  levels.value = levelPage.list;
  agents.value = agentPage.list;
}

function parseDate(value: string) {
  return new Date(value.includes("T") ? value : value.replace(" ", "T"));
}

async function openForm(id?: string) {
  editingId.value = id || "";
  Object.assign(form, emptyForm());
  if (id) {
    const row = await DistributionAPI.getTaskDetail(id);
    Object.assign(form, {
      name: row.name,
      description: row.description || "",
      metricType: row.metricType,
      targetYuan: row.metricType === "SALES_AMOUNT" ? row.targetValue / 100 : 1000,
      targetCount: row.metricType === "ORDER_COUNT" ? row.targetValue : 1,
      period: [parseDate(row.startTime), parseDate(row.endTime)],
      assignmentScope: row.assignmentScope,
      targetLevelId: row.targetLevelId || "",
      targetAgentIds: row.targetAgentIds || [],
    });
  }
  formVisible.value = true;
}

function resetTarget() {
  form.targetLevelId = "";
  form.targetAgentIds = [];
}

async function saveTask() {
  if (!formRef.value) return;
  await formRef.value.validate();
  if (form.period.length !== 2 || form.period[0] >= form.period[1]) {
    ElMessage.warning("请选择正确的任务有效期");
    return;
  }
  if (form.assignmentScope === "LEVEL" && !form.targetLevelId) {
    ElMessage.warning("请选择分销等级");
    return;
  }
  if (form.assignmentScope === "AGENT" && !form.targetAgentIds.length) {
    ElMessage.warning("请选择至少一个代理商");
    return;
  }
  const data: DistributionTaskForm = {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    metricType: form.metricType,
    targetValue:
      form.metricType === "SALES_AMOUNT" ? Math.round(form.targetYuan * 100) : form.targetCount,
    startTime: form.period[0].toISOString(),
    endTime: form.period[1].toISOString(),
    assignmentScope: form.assignmentScope,
    targetLevelId: form.assignmentScope === "LEVEL" ? form.targetLevelId : undefined,
    targetAgentIds: form.assignmentScope === "AGENT" ? form.targetAgentIds : undefined,
  };
  saving.value = true;
  try {
    if (editingId.value) await DistributionAPI.updateTask(editingId.value, data);
    else await DistributionAPI.createTask(data);
    ElMessage.success("草稿已保存");
    formVisible.value = false;
    fetchData();
  } finally {
    saving.value = false;
  }
}

async function publish(row: DistributionTaskItem) {
  await ElMessageBox.confirm("发布后任务和名单不可修改，确认发布？", "发布任务", {
    type: "warning",
  });
  await DistributionAPI.publishTask(row.id);
  ElMessage.success("任务已发布");
  fetchData();
}

async function cancel(row: DistributionTaskItem) {
  await ElMessageBox.confirm("取消后不再统计新的核销订单，确认取消？", "取消任务", {
    type: "warning",
  });
  await DistributionAPI.cancelTask(row.id);
  ElMessage.success("任务已取消");
  fetchData();
}

async function remove(row: DistributionTaskItem) {
  await ElMessageBox.confirm(`确认删除草稿“${row.name}”？`, "删除任务", { type: "warning" });
  await DistributionAPI.deleteTask(row.id);
  ElMessage.success("草稿已删除");
  fetchData();
}

const progressVisible = ref(false),
  selectedTask = ref<DistributionTaskItem>(),
  assigneeLoading = ref(false),
  assignees = ref<DistributionTaskAssigneeItem[]>([]),
  assigneeTotal = ref(0);
const assigneeParams = reactive<DistributionTaskAssigneeQuery>({
  pageNum: 1,
  pageSize: 10,
  keywords: "",
  completed: undefined,
});

async function openProgress(row: DistributionTaskItem) {
  selectedTask.value = row;
  Object.assign(assigneeParams, { pageNum: 1, pageSize: 10, keywords: "", completed: undefined });
  progressVisible.value = true;
  fetchAssignees();
}

function queryAssignees() {
  assigneeParams.pageNum = 1;
  fetchAssignees();
}

async function fetchAssignees() {
  if (!selectedTask.value) return;
  assigneeLoading.value = true;
  try {
    const page = await DistributionAPI.getTaskAssigneePage(selectedTask.value.id, assigneeParams);
    assignees.value = page.list;
    assigneeTotal.value = page.total;
  } finally {
    assigneeLoading.value = false;
  }
}

function progressText(row: DistributionTaskAssigneeItem) {
  if (!selectedTask.value) return "-";
  return selectedTask.value.metricType === "SALES_AMOUNT"
    ? `¥${fen(row.salesAmount)} / ¥${fen(selectedTask.value.targetValue)}`
    : `${row.orderCount} / ${selectedTask.value.targetValue} 单`;
}

onMounted(() => {
  handleQuery();
  loadOptions();
});
</script>

<style scoped>
.unit {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
}
</style>
