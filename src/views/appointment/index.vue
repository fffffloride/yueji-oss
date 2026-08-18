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
        <div class="page-toolbar__left"></div>
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
  </div>
</template>

<script setup lang="ts">
import { Refresh } from "@element-plus/icons-vue";
import type { FormInstance } from "element-plus";

import AppointmentAPI from "@/api/appointment";
import type { AppointmentItem, AppointmentQueryParams } from "@/api/appointment";
import { usePageTable } from "@/composables";

defineOptions({ name: "BizAppointment" });

const queryFormRef = ref<FormInstance>();
const { loading, list, total, params, fetchData, handleQuery, handleResetQuery } = usePageTable<
  AppointmentItem,
  AppointmentQueryParams
>({
  initialParams: { pageNum: 1, pageSize: 10, keywords: "", appointmentDate: "" },
  request: AppointmentAPI.getPage,
  onBeforeReset: () => queryFormRef.value?.resetFields(),
});

onMounted(handleQuery);
</script>
