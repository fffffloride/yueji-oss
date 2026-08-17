<template>
  <div class="page-container">
    <el-card class="page-search" shadow="never">
      <el-form ref="queryFormRef" :model="params" :inline="true" label-suffix=":">
        <el-form-item label="关键字" prop="keywords">
          <el-input
            v-model="params.keywords"
            placeholder="昵称 / 手机号"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="params.status" clearable placeholder="全部" style="width: 120px">
            <el-option :value="1" label="正常" />
            <el-option :value="0" label="禁用" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="handleResetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card ref="tableWrapperRef" class="page-content" shadow="never">
      <div class="page-toolbar">
        <div class="page-toolbar__left"></div>
        <div class="page-toolbar__right">
          <el-tooltip content="刷新" placement="top">
            <el-button class="page-icon-btn" @click="fetchData">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="全屏" placement="top">
            <el-button class="page-icon-btn" @click="toggleFullscreen">
              <el-icon><FullScreen /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <div class="page-table-wrapper">
        <el-table
          v-loading="loading"
          :data="list"
          class="page-table"
          border
          height="100%"
          highlight-current-row
        >
          <el-table-column label="会员" min-width="170" fixed="left">
            <template #default="{ row }">
              <div class="member-cell">
                <el-avatar :src="row.avatar || undefined" :size="36">
                  <el-icon><UserFilled /></el-icon>
                </el-avatar>
                <span>{{ row.nickname || "-" }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="手机号" prop="mobile" width="130">
            <template #default="{ row }">{{ row.mobile || "-" }}</template>
          </el-table-column>
          <el-table-column label="积分" prop="points" width="100" align="right" />
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                {{ row.status === 1 ? "正常" : "禁用" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="注册时间" prop="createTime" width="180">
            <template #default="{ row }">{{ row.createTime || "-" }}</template>
          </el-table-column>
          <el-table-column label="最后登录" prop="lastLoginTime" width="180">
            <template #default="{ row }">{{ row.lastLoginTime || "-" }}</template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="110">
            <template #default="{ row }">
              <el-button
                v-hasPerm="'biz:member:list'"
                type="primary"
                size="small"
                link
                @click="open360(row.id)"
              >
                360视图
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

    <el-drawer v-model="drawerVisible" title="会员360视图" size="680px">
      <div v-loading="detailLoading" class="member-drawer">
        <template v-if="detail">
          <div class="profile-header">
            <el-avatar :src="detail.profile.avatar || undefined" :size="64">
              <el-icon :size="28"><UserFilled /></el-icon>
            </el-avatar>
            <div class="profile-header__main">
              <div class="profile-header__name">
                {{ detail.profile.nickname || "-" }}
                <el-tag :type="detail.profile.status === 1 ? 'success' : 'danger'" size="small">
                  {{ detail.profile.status === 1 ? "正常" : "禁用" }}
                </el-tag>
              </div>
              <div class="profile-header__meta">
                {{ detail.profile.mobile || "未绑定手机号" }}
                <span>积分 {{ detail.profile.points }}</span>
              </div>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <span>订单数</span>
              <strong>{{ detail.stats.orderCount }}</strong>
            </div>
            <div class="stat-card">
              <span>累计实付</span>
              <strong>¥{{ formatFen(detail.stats.totalPaid) }}</strong>
            </div>
            <div class="stat-card">
              <span>平均实付</span>
              <strong>¥{{ formatFen(detail.stats.avgPaid) }}</strong>
            </div>
          </div>

          <div v-if="statusCountEntries.length" class="status-summary">
            <span>订单状态</span>
            <el-tag
              v-for="[status, count] in statusCountEntries"
              :key="status"
              :type="orderStatusType(Number(status))"
              effect="plain"
              size="small"
            >
              {{ orderStatusLabel(Number(status)) }} {{ count }}
            </el-tag>
          </div>

          <el-tabs v-model="activeTab">
            <el-tab-pane label="资料" name="profile">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="会员ID" :span="2">
                  {{ detail.profile.id }}
                </el-descriptions-item>
                <el-descriptions-item label="性别">
                  {{ genderLabel(detail.profile.gender) }}
                </el-descriptions-item>
                <el-descriptions-item label="会员等级">
                  {{ detail.profile.levelName || "普通会员" }}
                </el-descriptions-item>
                <el-descriptions-item label="累计完成实付">
                  ¥{{ formatFen(detail.profile.totalSpent || 0) }}
                </el-descriptions-item>
                <el-descriptions-item label="注册时间">
                  {{ detail.profile.createTime || "-" }}
                </el-descriptions-item>
                <el-descriptions-item label="最后登录">
                  {{ detail.profile.lastLoginTime || "-" }}
                </el-descriptions-item>
              </el-descriptions>

              <el-form label-position="top" class="member-form">
                <el-form-item label="标签">
                  <el-input
                    v-model="editForm.tags"
                    maxlength="255"
                    placeholder="多个标签用逗号分隔"
                  />
                </el-form-item>
                <el-form-item label="备注">
                  <el-input
                    v-model="editForm.remark"
                    type="textarea"
                    :rows="4"
                    maxlength="255"
                    show-word-limit
                    placeholder="请输入会员备注"
                  />
                </el-form-item>
                <el-button
                  v-hasPerm="'biz:member:update'"
                  type="primary"
                  :loading="saving"
                  @click="saveMember"
                >
                  保存
                </el-button>
              </el-form>
            </el-tab-pane>

            <el-tab-pane label="最近订单" name="orders">
              <el-table :data="detail.recentOrders" border size="small">
                <el-table-column label="订单号" prop="orderNo" min-width="170" />
                <el-table-column label="实付" width="100" align="right">
                  <template #default="{ row }">¥{{ formatFen(row.payAmount) }}</template>
                </el-table-column>
                <el-table-column label="状态" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag :type="orderStatusType(row.status)" size="small">
                      {{ row.statusLabel || orderStatusLabel(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="下单时间" prop="createTime" width="170">
                  <template #default="{ row }">{{ row.createTime || "-" }}</template>
                </el-table-column>
                <template #empty>暂无最近订单</template>
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { FullScreen, Refresh, UserFilled } from "@element-plus/icons-vue";
import { ElMessage, type FormInstance, type TagProps } from "element-plus";

import MemberAPI from "@/api/member";
import type { Member360, MemberItem, MemberQueryParams, MemberUpdateForm } from "@/api/member";
import { usePageTable } from "@/composables";

defineOptions({
  name: "BizMember",
  inheritAttrs: false,
});

const queryFormRef = ref<FormInstance>();
const tableWrapperRef = ref<HTMLElement | null>(null);
const { toggle: toggleFullscreen } = useFullscreen(tableWrapperRef);

const { loading, list, total, params, fetchData, handleQuery, handleResetQuery } = usePageTable<
  MemberItem,
  MemberQueryParams
>({
  initialParams: { pageNum: 1, pageSize: 10, keywords: "", status: undefined },
  request: MemberAPI.getPage,
  onBeforeReset: () => queryFormRef.value?.resetFields(),
});

const drawerVisible = ref(false);
const detailLoading = ref(false);
const saving = ref(false);
const detail = ref<Member360 | null>(null);
const activeTab = ref("profile");
const editForm = reactive<Required<MemberUpdateForm>>({
  tags: "",
  remark: "",
});

const statusCountEntries = computed(() => Object.entries(detail.value?.stats.statusCounts ?? {}));

function formatFen(fen: number): string {
  return (Number(fen || 0) / 100).toFixed(2);
}

function genderLabel(gender: number): string {
  if (gender === 1) return "男";
  if (gender === 2) return "女";
  return "保密";
}

function orderStatusLabel(status: number): string {
  return ["待付款", "待核销", "已核销", "已完成", "已取消", "已退款"][status] ?? `状态${status}`;
}

function orderStatusType(status: number): TagProps["type"] {
  if (status === 0) return "warning";
  if (status === 1) return "primary";
  if (status === 2 || status === 3) return "success";
  return "info";
}

async function open360(id: string): Promise<void> {
  drawerVisible.value = true;
  activeTab.value = "profile";
  detail.value = null;
  detailLoading.value = true;
  try {
    const data = await MemberAPI.get360(id);
    detail.value = data;
    editForm.tags = data.profile.tags ?? "";
    editForm.remark = data.profile.remark ?? "";
  } finally {
    detailLoading.value = false;
  }
}

async function saveMember(): Promise<void> {
  if (!detail.value) return;
  saving.value = true;
  try {
    await MemberAPI.update(detail.value.profile.id, {
      tags: editForm.tags.trim(),
      remark: editForm.remark.trim(),
    });
    ElMessage.success("会员资料保存成功");
    await Promise.all([open360(detail.value.profile.id), fetchData()]);
  } finally {
    saving.value = false;
  }
}

onMounted(handleQuery);
</script>

<style scoped lang="scss">
.member-cell {
  display: flex;
  gap: 10px;
  align-items: center;
}

.member-drawer {
  min-height: 240px;
}

.profile-header {
  display: flex;
  gap: 16px;
  align-items: center;
  padding-bottom: 18px;

  &__main {
    min-width: 0;
  }

  &__name {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
  }

  &__meta {
    display: flex;
    gap: 16px;
    margin-top: 8px;
    color: var(--el-text-color-secondary);
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  padding: 14px;
  background: var(--el-fill-color-light);
  border-radius: 6px;

  span {
    display: block;
    margin-bottom: 8px;
    color: var(--el-text-color-secondary);
  }

  strong {
    font-size: 20px;
  }
}

.status-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
  color: var(--el-text-color-secondary);
}

.member-form {
  margin-top: 18px;
}
</style>
