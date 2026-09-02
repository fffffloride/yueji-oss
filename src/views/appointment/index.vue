<template>
  <div class="page-container">
    <section v-loading="summaryLoading" class="summary-grid" aria-label="预约状态统计">
      <button
        v-for="card in summaryCards"
        :key="card.tab"
        type="button"
        class="summary-card"
        :class="{ 'is-active': params.tab === card.tab }"
        :aria-pressed="params.tab === card.tab"
        @click="selectSummary(card.tab)"
      >
        <span class="summary-card__value">{{ card.count }}</span>
        <span class="summary-card__label">{{ card.label }}</span>
      </button>
    </section>

    <el-card v-loading="configLoading" class="page-search" shadow="never">
      <el-form :inline="true" label-suffix=":">
        <el-form-item label="每时段预约上限">
          <el-input-number v-model="slotCapacity" :min="1" :precision="0" />
        </el-form-item>
        <el-form-item>
          <el-button
            v-hasPerm="'biz:appointment:config'"
            type="primary"
            :loading="configSaving"
            @click="saveConfig"
          >
            保存配置
          </el-button>
        </el-form-item>
        <span class="config-tip">每天 10:00–18:00 的整点时段统一使用此容量</span>
      </el-form>
    </el-card>

    <el-card class="page-search" shadow="never">
      <el-form ref="queryFormRef" :model="params" :inline="true" label-suffix=":">
        <el-form-item label="预约状态" prop="tab">
          <el-select
            v-model="params.tab"
            placeholder="请选择状态"
            style="width: 140px"
            @change="handleTabChange"
          >
            <el-option
              v-for="option in tabOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="会员" prop="keywords">
          <el-input
            v-model="params.keywords"
            placeholder="昵称 / 手机号"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="场景" prop="sceneType">
          <el-select v-model="params.sceneType" clearable placeholder="全部" style="width: 130px">
            <el-option label="面诊预约" value="CONSULTATION" />
            <el-option label="订单预约" value="ORDER" />
          </el-select>
        </el-form-item>
        <el-form-item label="预约日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :disabled="params.tab === AppointmentTab.PENDING_BOOKING"
            clearable
            style="width: 250px"
          />
        </el-form-item>
        <el-form-item label="订单号" prop="orderNo">
          <el-input
            v-model="params.orderNo"
            placeholder="请输入订单号"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="page-content" shadow="never">
      <div class="page-toolbar">
        <div class="page-toolbar__left">
          <el-button v-hasPerm="'biz:appointment:query'" @click="openCalendar">
            查看日历图
          </el-button>
        </div>
        <el-tooltip content="刷新" placement="top">
          <el-button class="page-icon-btn" @click="refreshPage">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-tooltip>
      </div>

      <div class="page-table-wrapper">
        <el-table v-loading="loading" :data="list" border height="100%">
          <el-table-column label="预约ID" min-width="100">
            <template #default="{ row }">{{ appointmentIdOf(row) || "-" }}</template>
          </el-table-column>
          <el-table-column label="状态" width="105" align="center">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row)" effect="plain">
                {{ statusLabel(row) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="预约场景" width="110">
            <template #default="{ row }">
              <el-tag :type="row.sceneType === 'ORDER' ? 'primary' : 'info'" effect="plain">
                {{ sceneLabel(row) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="会员" min-width="170">
            <template #default="{ row }">
              <div>{{ row.memberNickname || row.memberId }}</div>
              <small class="muted">{{ row.memberMobile || "-" }}</small>
            </template>
          </el-table-column>
          <el-table-column label="预约时间" min-width="165">
            <template #default="{ row }">{{ appointmentTimeText(row) }}</template>
          </el-table-column>
          <el-table-column label="订单 / 服务" min-width="260">
            <template #default="{ row }">
              <template v-if="row.sceneType === 'ORDER'">
                <div>{{ row.orderNo || `订单 ${row.orderId}` }}</div>
                <small class="scene-products">{{ productText(row) }}</small>
              </template>
              <span v-else>面诊咨询</span>
            </template>
          </el-table-column>
          <el-table-column label="最近变更" min-width="170">
            <template #default="{ row }">{{ lastChangedAt(row) }}</template>
          </el-table-column>
          <el-table-column fixed="right" label="操作" min-width="300">
            <template #default="{ row }">
              <el-button v-if="appointmentIdOf(row)" type="primary" link @click="openDetail(row)">
                详情
              </el-button>
              <el-button
                v-if="row.orderId"
                v-hasPerm="'biz:order:list'"
                type="primary"
                link
                @click="viewOrder(row)"
              >
                查看订单
              </el-button>
              <el-button
                v-if="row.canReschedule"
                v-hasPerm="'biz:appointment:reschedule'"
                type="primary"
                link
                @click="openReschedule(row)"
              >
                改期
              </el-button>
              <el-button
                v-if="row.canCancel"
                v-hasPerm="'biz:appointment:cancel'"
                type="danger"
                link
                :loading="isActionLoading('cancel', row)"
                @click="cancelAppointment(row)"
              >
                取消
              </el-button>
              <el-button
                v-if="row.canComplete"
                v-hasPerm="'biz:appointment:complete'"
                type="success"
                link
                :loading="isActionLoading('complete', row)"
                @click="completeAppointment(row)"
              >
                完成服务
              </el-button>
            </template>
          </el-table-column>
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

    <el-drawer v-model="detailVisible" title="预约详情" size="600px">
      <div v-loading="detailLoading">
        <template v-if="detail">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="预约状态">
              <el-tag :type="statusTagType(detail)" effect="plain">
                {{ statusLabel(detail) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="会员">
              {{ detail.memberNickname || detail.memberId }} {{ detail.memberMobile || "" }}
            </el-descriptions-item>
            <el-descriptions-item label="预约场景">
              {{ sceneLabel(detail) }}
            </el-descriptions-item>
            <el-descriptions-item label="当前时间">
              {{ appointmentTimeText(detail) }}
            </el-descriptions-item>
            <el-descriptions-item v-if="detail.orderId" label="关联订单">
              <el-button
                v-hasPerm="'biz:order:list'"
                type="primary"
                link
                @click="viewOrder(detail)"
              >
                {{ detail.orderNo || detail.orderId }}
              </el-button>
              <div class="scene-products">{{ productText(detail) }}</div>
            </el-descriptions-item>
            <el-descriptions-item v-if="detail.completeTime" label="完成时间">
              {{ detail.completeTime }}
            </el-descriptions-item>
            <el-descriptions-item v-if="detail.cancelTime" label="取消时间">
              {{ detail.cancelTime }}
            </el-descriptions-item>
            <el-descriptions-item v-if="detail.cancelReason" label="取消原因">
              {{ detail.cancelReason }}
            </el-descriptions-item>
          </el-descriptions>

          <section class="operation-section">
            <h3>操作记录</h3>
            <el-empty
              v-if="!detail.operationLogs.length"
              description="暂无历史操作记录"
              :image-size="72"
            />
            <el-timeline v-else>
              <el-timeline-item
                v-for="log in detail.operationLogs"
                :key="log.id"
                :timestamp="log.createTime"
                placement="top"
              >
                <strong>{{ operationLabel(log.action) }}</strong>
                <div class="operation-description">{{ operationDescription(log) }}</div>
                <small class="muted">{{ operatorText(log) }}</small>
              </el-timeline-item>
            </el-timeline>
          </section>
        </template>
      </div>

      <template #footer>
        <div v-if="detail" class="drawer-actions">
          <el-button
            v-if="detail.canReschedule"
            v-hasPerm="'biz:appointment:reschedule'"
            type="primary"
            @click="openReschedule(detail)"
          >
            客服改期
          </el-button>
          <el-button
            v-if="detail.canCancel"
            v-hasPerm="'biz:appointment:cancel'"
            type="danger"
            plain
            :loading="isActionLoading('cancel', detail)"
            @click="cancelAppointment(detail)"
          >
            取消预约
          </el-button>
          <el-button
            v-if="detail.canComplete"
            v-hasPerm="'biz:appointment:complete'"
            type="success"
            :loading="isActionLoading('complete', detail)"
            @click="completeAppointment(detail)"
          >
            完成面诊服务
          </el-button>
        </div>
      </template>
    </el-drawer>

    <el-dialog v-model="rescheduleVisible" title="预约改期" width="480px" @closed="resetReschedule">
      <el-form label-width="90px">
        <el-form-item label="原预约时间">
          <span>{{ rescheduleTarget ? appointmentTimeText(rescheduleTarget) : "-" }}</span>
        </el-form-item>
        <el-form-item label="新日期" required>
          <el-date-picker
            v-model="rescheduleForm.appointmentDate"
            type="date"
            value-format="YYYY-MM-DD"
            :disabled-date="disablePastDate"
            placeholder="请选择日期"
            style="width: 100%"
            @change="loadSlots(true)"
          />
        </el-form-item>
        <el-form-item label="新时间" required>
          <el-select
            v-model="rescheduleForm.appointmentTime"
            v-loading="slotLoading"
            placeholder="请选择可用时段"
            style="width: 100%"
          >
            <el-option
              v-for="slot in slots"
              :key="slot.time"
              :value="slot.time"
              :label="slotLabel(slot)"
              :disabled="!slot.available || isOriginalSlot(slot.time)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="改期原因">
          <el-input
            v-model="rescheduleForm.reason"
            type="textarea"
            :rows="3"
            maxlength="255"
            show-word-limit
            placeholder="选填，将记录在操作日志中"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rescheduleVisible = false">取消</el-button>
        <el-button type="primary" :loading="rescheduleSubmitting" @click="submitReschedule">
          确认改期
        </el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="calendarVisible" title="预约日历" size="880px">
      <div v-loading="calendarLoading" class="calendar-panel">
        <el-calendar v-model="calendarDate">
          <template #date-cell="{ data }">
            <div
              class="cal-cell"
              :class="{
                'is-other': data.type !== 'current-month',
                'has-items': countOf(data.day) > 0,
              }"
            >
              <span class="cal-cell__day">{{ Number(data.day.slice(8)) }}</span>
              <span v-if="countOf(data.day)" class="cal-cell__count">
                {{ countOf(data.day) }}
              </span>
            </div>
          </template>
        </el-calendar>

        <section class="day-panel">
          <header class="day-panel__head">
            <strong>{{ selectedDate }}</strong>
            <span>{{ selectedItems.length }} 条记录，{{ countOf(selectedDate) }} 条占用容量</span>
            <el-button type="primary" link @click="viewInList(selectedDate)">
              查看待到店列表
            </el-button>
          </header>
          <el-empty v-if="!selectedItems.length" description="当天暂无预约" :image-size="64" />
          <ul v-else class="day-list">
            <li v-for="item in selectedItems" :key="calendarItemKey(item)">
              <strong>{{ item.appointmentTime || "-" }}</strong>
              <span>
                {{ item.memberNickname || item.memberId }} · {{ sceneLabel(item) }}
                <small v-if="item.sceneType === 'ORDER'" class="scene-products">
                  {{ item.orderNo || `订单 ${item.orderId}` }} · {{ productText(item) }}
                </small>
              </span>
              <el-tag :type="statusTagType(item)" effect="plain" size="small">
                {{ statusLabel(item) }}
              </el-tag>
              <el-button type="primary" link @click="openDetail(item)">详情</el-button>
            </li>
          </ul>
        </section>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { Refresh } from "@element-plus/icons-vue";
import { dayjs, ElMessage, ElMessageBox, type FormInstance } from "element-plus";

import AppointmentAPI, {
  AppointmentStatus,
  AppointmentTab,
  type AppointmentDetail,
  type AppointmentItem,
  type AppointmentOperationAction,
  type AppointmentOperationLog,
  type AppointmentQueryParams,
  type AppointmentRescheduleForm,
  type AppointmentSlot,
  type AppointmentSummary,
  type AppointmentTabValue,
} from "@/api/appointment";
import { usePageTable } from "@/composables";

defineOptions({ name: "BizAppointment" });

const router = useRouter();
const today = dayjs().format("YYYY-MM-DD");
const tabOptions: Array<{ label: string; value: AppointmentTabValue }> = [
  { label: "待预约", value: AppointmentTab.PENDING_BOOKING },
  { label: "待到店", value: AppointmentTab.PENDING_ARRIVAL },
  { label: "服务记录", value: AppointmentTab.SERVICE_RECORD },
  { label: "已取消", value: AppointmentTab.CANCELLED },
];

const queryFormRef = ref<FormInstance>();
const dateRange = ref<[string, string] | undefined>([today, today]);
const slotCapacity = ref(1);
const savedSlotCapacity = ref(1);
const configLoading = ref(false);
const configSaving = ref(false);
const summaryLoading = ref(false);
const summary = ref<AppointmentSummary | null>(null);

const { loading, list, total, params, fetchData, handleQuery, handleResetQuery } = usePageTable<
  AppointmentItem,
  AppointmentQueryParams
>({
  initialParams: {
    pageNum: 1,
    pageSize: 10,
    tab: AppointmentTab.PENDING_ARRIVAL,
    keywords: "",
    sceneType: undefined,
    startDate: today,
    endDate: today,
    orderNo: "",
  },
  request: AppointmentAPI.getPage,
  onBeforeReset: () => {
    queryFormRef.value?.resetFields();
    dateRange.value = [today, today];
  },
});

const summaryCards = computed(() => [
  {
    tab: AppointmentTab.PENDING_BOOKING,
    label: "待预约订单",
    count: summary.value?.pendingBooking ?? "—",
  },
  {
    tab: AppointmentTab.PENDING_ARRIVAL,
    label: "待到店",
    count: summary.value?.pendingArrival ?? "—",
  },
  {
    tab: AppointmentTab.SERVICE_RECORD,
    label: "服务记录",
    count: summary.value?.serviceRecord ?? "—",
  },
  {
    tab: AppointmentTab.CANCELLED,
    label: "已取消",
    count: summary.value?.cancelled ?? "—",
  },
]);

const detailVisible = ref(false);
const detailLoading = ref(false);
const detail = ref<AppointmentDetail | null>(null);
const actionLoading = ref("");

const rescheduleVisible = ref(false);
const rescheduleSubmitting = ref(false);
const rescheduleTarget = ref<Partial<AppointmentItem> | null>(null);
const rescheduleForm = reactive<AppointmentRescheduleForm>({
  appointmentDate: "",
  appointmentTime: "",
  reason: "",
});
const slotLoading = ref(false);
const slots = ref<AppointmentSlot[]>([]);

const calendarVisible = ref(false);
const calendarLoading = ref(false);
const calendarDate = ref(new Date());
const calendarItems = ref<AppointmentItem[]>([]);
const calendarMonth = computed(() => dayjs(calendarDate.value).format("YYYY-MM"));
const selectedDate = computed(() => dayjs(calendarDate.value).format("YYYY-MM-DD"));
const itemsByDate = computed(() => {
  const map: Record<string, AppointmentItem[]> = {};
  for (const item of calendarItems.value) {
    if (!item.appointmentDate) continue;
    (map[item.appointmentDate] ??= []).push(item);
  }
  return map;
});
const selectedItems = computed(() => itemsByDate.value[selectedDate.value] ?? []);

function appointmentIdOf(item: Partial<AppointmentItem>): string | null {
  return item.appointmentId || item.id || null;
}

function calendarItemKey(item: AppointmentItem): string {
  return appointmentIdOf(item) || `order-${item.orderId || "unknown"}`;
}

function sceneLabel(item: Partial<AppointmentItem>): string {
  return item.sceneType === "ORDER" ? "订单预约" : "面诊预约";
}

function productText(item: Partial<AppointmentItem>): string {
  return item.productNames?.length ? item.productNames.join("、") : "商品信息不可用";
}

function statusLabel(item: Partial<AppointmentItem>): string {
  if (item.status == null && item.canBook) return "待预约";
  if (item.status === AppointmentStatus.BOOKED) return "待到店";
  if (item.status === AppointmentStatus.COMPLETED) return "已完成";
  if (item.status === AppointmentStatus.CANCELLED) return "已取消";
  return "-";
}

function statusTagType(item: Partial<AppointmentItem>): "primary" | "success" | "info" | "warning" {
  if (item.status == null && item.canBook) return "warning";
  if (item.status === AppointmentStatus.BOOKED) return "primary";
  if (item.status === AppointmentStatus.COMPLETED) return "success";
  return "info";
}

function appointmentTimeText(item: Partial<AppointmentItem>): string {
  if (!item.appointmentDate || !item.appointmentTime) return "-";
  return `${item.appointmentDate} ${String(item.appointmentTime).slice(0, 5)}`;
}

function lastChangedAt(item: Partial<AppointmentItem>): string {
  return (
    item.lastChangedAt ||
    item.cancelTime ||
    item.completeTime ||
    item.updateTime ||
    item.createTime ||
    "-"
  );
}

function countOf(date: string): number {
  return (itemsByDate.value[date] ?? []).filter(
    (item) => item.occupiesCapacity ?? item.status === AppointmentStatus.BOOKED
  ).length;
}

function isStarted(item: Partial<AppointmentItem>): boolean {
  if (!item.appointmentDate || !item.appointmentTime) return false;
  return !dayjs(
    `${item.appointmentDate} ${String(item.appointmentTime).slice(0, 5)}`,
    "YYYY-MM-DD HH:mm"
  ).isAfter(dayjs());
}

async function loadSummary(): Promise<void> {
  summaryLoading.value = true;
  try {
    summary.value = await AppointmentAPI.getSummary();
  } catch {
    summary.value = null;
  } finally {
    summaryLoading.value = false;
  }
}

async function loadConfig(): Promise<void> {
  configLoading.value = true;
  try {
    const config = await AppointmentAPI.getConfig();
    slotCapacity.value = config.slotCapacity;
    savedSlotCapacity.value = config.slotCapacity;
  } finally {
    configLoading.value = false;
  }
}

async function saveConfig(): Promise<void> {
  if (slotCapacity.value === savedSlotCapacity.value) {
    ElMessage.info("配置未变化");
    return;
  }
  await ElMessageBox.confirm(
    `确认将每时段预约上限从 ${savedSlotCapacity.value} 人修改为 ${slotCapacity.value} 人？`,
    "确认修改预约上限",
    { type: "warning", confirmButtonText: "确认修改", cancelButtonText: "取消" }
  );
  configSaving.value = true;
  try {
    const config = await AppointmentAPI.updateConfig({ slotCapacity: slotCapacity.value });
    slotCapacity.value = config.slotCapacity;
    savedSlotCapacity.value = config.slotCapacity;
    ElMessage.success("保存成功");
  } finally {
    configSaving.value = false;
  }
}

function syncDateParams(): void {
  if (params.tab === AppointmentTab.PENDING_BOOKING || !dateRange.value) {
    params.startDate = undefined;
    params.endDate = undefined;
    return;
  }
  [params.startDate, params.endDate] = dateRange.value;
}

function handleSearch(): void {
  syncDateParams();
  handleQuery();
}

function resetQuery(): void {
  handleResetQuery();
}

function handleTabChange(): void {
  if (params.tab === AppointmentTab.PENDING_BOOKING) {
    dateRange.value = undefined;
    params.startDate = undefined;
    params.endDate = undefined;
  }
}

function selectSummary(tab: AppointmentTabValue): void {
  params.tab = tab;
  dateRange.value = undefined;
  params.startDate = undefined;
  params.endDate = undefined;
  handleQuery();
}

async function refreshPage(): Promise<void> {
  await Promise.all([
    loadSummary(),
    fetchData(),
    calendarVisible.value ? loadCalendar() : Promise.resolve(),
  ]);
}

async function openDetail(item: Partial<AppointmentItem>): Promise<void> {
  const id = appointmentIdOf(item);
  if (!id) return;
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    detail.value = await AppointmentAPI.getDetail(id);
  } finally {
    detailLoading.value = false;
  }
}

function viewOrder(item: Partial<AppointmentItem>): void {
  if (!item.orderId) return;
  router.push({
    name: "BizOrder",
    query: { id: item.orderId, keywords: item.orderNo || undefined },
  });
}

function actionKey(action: "cancel" | "complete", item: Partial<AppointmentItem>): string {
  return `${action}-${appointmentIdOf(item) || ""}`;
}

function isActionLoading(action: "cancel" | "complete", item: Partial<AppointmentItem>): boolean {
  return actionLoading.value === actionKey(action, item);
}

async function afterMutation(updated: AppointmentDetail): Promise<void> {
  if (detailVisible.value && appointmentIdOf(detail.value || {}) === appointmentIdOf(updated)) {
    detail.value = updated;
  }
  await refreshPage();
}

async function cancelAppointment(item: Partial<AppointmentItem>): Promise<void> {
  const id = appointmentIdOf(item);
  if (!id) return;
  const resultTip =
    item.sceneType === "ORDER" ? "取消后，该订单会重新进入待预约。" : "取消后将释放当前预约时段。";
  const warning = isStarted(item)
    ? `该预约时间已经开始，仍要由后台取消吗？${resultTip}`
    : resultTip;
  const { value } = await ElMessageBox.prompt(warning, "取消预约", {
    type: "warning",
    confirmButtonText: "确认取消",
    cancelButtonText: "暂不取消",
    inputPlaceholder: "取消原因（选填）",
    inputValidator: (input) => input.length <= 255 || "取消原因不能超过255个字符",
  });
  actionLoading.value = actionKey("cancel", item);
  try {
    const reason = value.trim();
    const updated = await AppointmentAPI.cancel(id, reason ? { reason } : {});
    ElMessage.success("预约已取消");
    await afterMutation(updated);
  } finally {
    actionLoading.value = "";
  }
}

async function completeAppointment(item: Partial<AppointmentItem>): Promise<void> {
  const id = appointmentIdOf(item);
  if (!id) return;
  await ElMessageBox.confirm("确认该面诊预约已经完成服务？完成后不可改期或取消。", "完成服务", {
    type: "warning",
    confirmButtonText: "确认完成",
    cancelButtonText: "取消",
  });
  actionLoading.value = actionKey("complete", item);
  try {
    const updated = await AppointmentAPI.complete(id);
    ElMessage.success("服务已完成");
    await afterMutation(updated);
  } finally {
    actionLoading.value = "";
  }
}

async function openReschedule(item: Partial<AppointmentItem>): Promise<void> {
  const id = appointmentIdOf(item);
  if (!id) return;
  if (isStarted(item)) {
    await ElMessageBox.confirm("该预约时间已经开始，仍要由后台改期吗？", "已开始预约改期", {
      type: "warning",
      confirmButtonText: "继续改期",
      cancelButtonText: "取消",
    });
  }
  rescheduleTarget.value = item;
  rescheduleForm.appointmentDate =
    item.appointmentDate && !dayjs(item.appointmentDate).isBefore(dayjs(), "day")
      ? item.appointmentDate
      : today;
  rescheduleForm.appointmentTime = "";
  rescheduleForm.reason = "";
  rescheduleVisible.value = true;
  await loadSlots(false);
}

function resetReschedule(): void {
  rescheduleTarget.value = null;
  slots.value = [];
  rescheduleForm.appointmentDate = "";
  rescheduleForm.appointmentTime = "";
  rescheduleForm.reason = "";
}

function disablePastDate(date: Date): boolean {
  return dayjs(date).isBefore(dayjs(), "day");
}

async function loadSlots(clearSelection = true): Promise<void> {
  if (clearSelection) rescheduleForm.appointmentTime = "";
  if (!rescheduleForm.appointmentDate) {
    slots.value = [];
    return;
  }
  slotLoading.value = true;
  try {
    slots.value = await AppointmentAPI.getSlots(rescheduleForm.appointmentDate);
  } finally {
    slotLoading.value = false;
  }
}

function isOriginalSlot(time: string): boolean {
  return Boolean(
    rescheduleTarget.value?.appointmentDate === rescheduleForm.appointmentDate &&
    String(rescheduleTarget.value?.appointmentTime).slice(0, 5) === time
  );
}

function slotLabel(slot: AppointmentSlot): string {
  if (isOriginalSlot(slot.time)) return `${slot.time}（当前时段）`;
  if (!slot.available) return `${slot.time}（不可用）`;
  return `${slot.time}（剩余 ${slot.availableCapacity ?? slot.remainingCount}）`;
}

async function submitReschedule(): Promise<void> {
  const target = rescheduleTarget.value;
  const id = target && appointmentIdOf(target);
  if (!id || !rescheduleForm.appointmentDate || !rescheduleForm.appointmentTime) {
    ElMessage.warning("请选择新的预约日期和时间");
    return;
  }
  if (isOriginalSlot(rescheduleForm.appointmentTime)) {
    ElMessage.warning("请选择不同于原预约的时间");
    return;
  }
  rescheduleSubmitting.value = true;
  try {
    const reason = rescheduleForm.reason?.trim();
    const updated = await AppointmentAPI.reschedule(id, {
      appointmentDate: rescheduleForm.appointmentDate,
      appointmentTime: rescheduleForm.appointmentTime,
      ...(reason ? { reason } : {}),
    });
    ElMessage.success("改期成功");
    rescheduleVisible.value = false;
    await afterMutation(updated);
  } catch (error) {
    if (String(error).includes("约满")) await loadSlots(false);
  } finally {
    rescheduleSubmitting.value = false;
  }
}

function operationLabel(action: AppointmentOperationAction): string {
  return {
    CREATE: "创建预约",
    RESCHEDULE: "预约改期",
    CANCEL: "取消预约",
    COMPLETE: "完成服务",
  }[action];
}

function operationDescription(log: AppointmentOperationLog): string {
  const before =
    log.beforeDate && log.beforeTime
      ? `${log.beforeDate} ${String(log.beforeTime).slice(0, 5)}`
      : "";
  const after =
    log.afterDate && log.afterTime ? `${log.afterDate} ${String(log.afterTime).slice(0, 5)}` : "";
  if (log.action === "RESCHEDULE") {
    return `${before || "-"} → ${after || "-"}${log.reason ? `；${log.reason}` : ""}`;
  }
  if (log.action === "CREATE") return after ? `预约时间：${after}` : "已创建预约";
  if (log.action === "CANCEL") return log.reason ? `原因：${log.reason}` : "未填写取消原因";
  return "服务已完成";
}

function operatorText(log: AppointmentOperationLog): string {
  if (log.operatorType === "SYSTEM") return "系统操作";
  const label = log.operatorType === "ADMIN" ? "管理员" : "会员";
  return log.operatorId ? `${label} ${log.operatorId}` : label;
}

function openCalendar(): void {
  calendarDate.value = dateRange.value?.[0] ? dayjs(dateRange.value[0]).toDate() : new Date();
  calendarVisible.value = true;
}

function viewInList(date: string): void {
  params.tab = AppointmentTab.PENDING_ARRIVAL;
  dateRange.value = [date, date];
  params.startDate = date;
  params.endDate = date;
  calendarVisible.value = false;
  handleQuery();
}

async function loadCalendar(): Promise<void> {
  calendarLoading.value = true;
  try {
    calendarItems.value = await AppointmentAPI.getCalendar(calendarMonth.value);
  } finally {
    calendarLoading.value = false;
  }
}

watch(
  () => (calendarVisible.value ? calendarMonth.value : ""),
  (month) => {
    if (month) loadCalendar();
  }
);

onMounted(() => {
  handleQuery();
  loadSummary();
  loadConfig();
});
</script>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  padding: 18px 20px;
  color: var(--el-text-color-primary);
  cursor: pointer;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-light);
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.summary-card:hover,
.summary-card.is-active {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px var(--el-color-primary-light-7);
}

.summary-card__value {
  font-size: 28px;
  font-weight: 600;
  line-height: 1;
}

.summary-card__label,
.muted,
.operation-description,
.config-tip,
.scene-products {
  color: var(--el-text-color-secondary);
}

.config-tip {
  font-size: 13px;
}

.scene-products {
  display: block;
  margin-top: 2px;
}

.operation-section {
  margin-top: 24px;
}

.operation-section h3 {
  margin: 0 0 18px;
  font-size: 16px;
}

.operation-description {
  margin: 4px 0;
}

.drawer-actions {
  display: flex;
  justify-content: flex-end;
}

.calendar-panel {
  display: grid;
  gap: 16px;
}

.calendar-panel :deep(.el-calendar-day) {
  min-height: 72px;
  padding: 6px;
}

.cal-cell {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  justify-content: space-between;
  height: 100%;
}

.cal-cell.is-other {
  opacity: 0.4;
}

.cal-cell__day {
  font-size: 14px;
}

.cal-cell__count {
  min-width: 18px;
  padding: 0 5px;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-color-primary);
  text-align: center;
  background: var(--el-color-primary-light-9);
  border-radius: 9px;
}

.cal-cell.has-items .cal-cell__day {
  font-weight: 600;
  color: var(--el-color-primary);
}

.day-panel {
  padding: 12px 14px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
}

.day-panel__head {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.day-panel__head span {
  color: var(--el-text-color-secondary);
}

.day-panel__head .el-button {
  margin-left: auto;
}

.day-list {
  padding: 0;
  margin: 0;
  list-style: none;
}

.day-list li {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) 80px 44px;
  gap: 12px;
  align-items: center;
  padding: 8px 0;
  border-top: 1px solid var(--el-border-color-lighter);
}

@media (width <= 960px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
