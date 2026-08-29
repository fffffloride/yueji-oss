<template>
  <div class="page-container">
    <el-card class="page-search" shadow="never">
      <el-form ref="queryFormRef" :model="params" :inline="true" label-suffix=":">
        <el-form-item label="关键字" prop="keywords">
          <el-input
            v-model="params.keywords"
            placeholder="会员昵称 / 手机号"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="预约日期" prop="appointmentDate">
          <el-date-picker
            v-model="params.appointmentDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择日期"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleResetQuery">重置</el-button>
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
          <el-button class="page-icon-btn" @click="fetchData">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-tooltip>
      </div>

      <div class="page-table-wrapper">
        <el-table v-loading="loading" :data="list" border height="100%">
          <el-table-column prop="id" label="预约ID" min-width="100" />
          <el-table-column label="会员" min-width="160">
            <template #default="{ row }">{{ row.memberNickname || row.memberId }}</template>
          </el-table-column>
          <el-table-column label="手机号" min-width="130">
            <template #default="{ row }">{{ row.memberMobile || "-" }}</template>
          </el-table-column>
          <el-table-column prop="appointmentDate" label="预约日期" width="130" />
          <el-table-column prop="appointmentTime" label="预约时间" width="110" />
          <el-table-column label="提交时间" prop="createTime" width="180">
            <template #default="{ row }">{{ row.createTime || "-" }}</template>
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
              <span v-if="countOf(data.day)" class="cal-cell__count">{{ countOf(data.day) }}</span>
            </div>
          </template>
        </el-calendar>

        <section class="day-panel">
          <header class="day-panel__head">
            <strong>{{ selectedDate }}</strong>
            <span>{{ selectedItems.length }} 条预约</span>
            <el-button type="primary" link @click="viewInList(selectedDate)">
              在列表中查看
            </el-button>
          </header>
          <el-empty v-if="!selectedItems.length" description="当天暂无预约" :image-size="64" />
          <ul v-else class="day-list">
            <li v-for="item in selectedItems" :key="item.id">
              <strong>{{ item.appointmentTime }}</strong>
              <span>{{ item.memberNickname || item.memberId }}</span>
              <small>{{ item.memberMobile || "-" }}</small>
            </li>
          </ul>
        </section>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { Refresh } from "@element-plus/icons-vue";
import { dayjs, type FormInstance } from "element-plus";

import AppointmentAPI from "@/api/appointment";
import type { AppointmentItem, AppointmentQueryParams } from "@/api/appointment";
import { usePageTable } from "@/composables";

defineOptions({ name: "BizAppointment" });

const today = dayjs().format("YYYY-MM-DD");
const queryFormRef = ref<FormInstance>();
const { loading, list, total, params, fetchData, handleQuery, handleResetQuery } = usePageTable<
  AppointmentItem,
  AppointmentQueryParams
>({
  initialParams: { pageNum: 1, pageSize: 10, keywords: "", appointmentDate: today },
  request: AppointmentAPI.getPage,
  onBeforeReset: () => queryFormRef.value?.resetFields(),
});

const calendarVisible = ref(false);
const calendarLoading = ref(false);
const calendarDate = ref(new Date());
const calendarItems = ref<AppointmentItem[]>([]);
const calendarMonth = computed(() => dayjs(calendarDate.value).format("YYYY-MM"));
const selectedDate = computed(() => dayjs(calendarDate.value).format("YYYY-MM-DD"));
const itemsByDate = computed(() => {
  const map: Record<string, AppointmentItem[]> = {};
  for (const item of calendarItems.value) {
    (map[item.appointmentDate] ??= []).push(item);
  }
  return map;
});
const selectedItems = computed(() => itemsByDate.value[selectedDate.value] ?? []);

function countOf(date: string) {
  return itemsByDate.value[date]?.length ?? 0;
}

function openCalendar() {
  calendarDate.value = params.appointmentDate ? dayjs(params.appointmentDate).toDate() : new Date();
  calendarVisible.value = true;
}

function viewInList(date: string) {
  params.appointmentDate = date;
  calendarVisible.value = false;
  handleQuery();
}

async function loadCalendar() {
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

onMounted(handleQuery);
</script>

<style scoped>
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
  grid-template-columns: 64px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 8px 0;
  border-top: 1px solid var(--el-border-color-lighter);
}

.day-list small {
  color: var(--el-text-color-secondary);
}
</style>
