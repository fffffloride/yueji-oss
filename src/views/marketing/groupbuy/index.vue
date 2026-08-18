<template>
  <div class="page-container">
    <el-card class="page-content" shadow="never">
      <el-tabs v-model="activeTab" @tab-change="changeTab">
        <el-tab-pane label="拼团活动" name="activity">
          <el-form :model="activityParams" inline>
            <el-form-item label="关键字">
              <el-input
                v-model="activityParams.keywords"
                clearable
                @keyup.enter="queryActivities"
              />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="activityParams.status" clearable style="width: 120px">
                <el-option label="上线" :value="1" />
                <el-option label="下线" :value="0" />
              </el-select>
            </el-form-item>
            <el-button type="primary" @click="queryActivities">查询</el-button>
            <el-button @click="resetActivities">重置</el-button>
          </el-form>
          <div class="page-toolbar">
            <el-button
              v-hasPerm="'biz:group-buy:activity:create'"
              type="primary"
              @click="openDrawer()"
            >
              新增活动
            </el-button>
            <el-button class="page-icon-btn" @click="fetchActivities">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </div>
          <el-table v-loading="activityLoading" :data="activities" border>
            <el-table-column prop="name" label="活动名称" min-width="180" />
            <el-table-column label="商品 / SKU" min-width="220">
              <template #default="{ row }">{{ row.productName }} / {{ row.skuName }}</template>
            </el-table-column>
            <el-table-column label="价格" width="150">
              <template #default="{ row }">
                ¥{{ formatFen(row.groupPrice) }} / ¥{{ formatFen(row.skuPrice) }}
              </template>
            </el-table-column>
            <el-table-column label="成团人数" prop="requiredPeople" width="100" align="center" />
            <el-table-column label="活动时间" min-width="300">
              <template #default="{ row }">{{ row.startTime }} 至 {{ row.endTime }}</template>
            </el-table-column>
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-switch
                  :model-value="row.status"
                  :active-value="1"
                  :inactive-value="0"
                  @change="changeStatus(row as GroupBuyActivityItem, Number($event))"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-hasPerm="'biz:group-buy:activity:update'"
                  link
                  type="primary"
                  @click="openDrawer(row.id)"
                >
                  编辑
                </el-button>
                <el-button
                  v-hasPerm="'biz:group-buy:activity:delete'"
                  link
                  type="danger"
                  @click="removeActivity(row.id)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <pagination
            v-if="activityTotal > 0"
            v-model:total="activityTotal"
            v-model:page="activityParams.pageNum"
            v-model:limit="activityParams.pageSize"
            @pagination="fetchActivities"
          />
        </el-tab-pane>

        <el-tab-pane label="拼团记录" name="group">
          <el-form :model="groupParams" inline>
            <el-form-item label="活动">
              <el-select v-model="groupParams.activityId" clearable filterable style="width: 220px">
                <el-option
                  v-for="item in activityOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="groupParams.status" clearable style="width: 120px">
                <el-option label="拼团中" :value="0" />
                <el-option label="成功" :value="1" />
                <el-option label="失败" :value="2" />
              </el-select>
            </el-form-item>
            <el-button type="primary" @click="queryGroups">查询</el-button>
            <el-button @click="resetGroups">重置</el-button>
          </el-form>
          <el-table v-loading="groupLoading" :data="groups" border>
            <el-table-column prop="id" label="团ID" min-width="130" />
            <el-table-column prop="activityName" label="活动" min-width="180" />
            <el-table-column label="进度" width="120" align="center">
              <template #default="{ row }">
                {{ row.paidPeople }} / {{ row.requiredPeople }}
              </template>
            </el-table-column>
            <el-table-column label="拼团价" width="100">
              <template #default="{ row }">¥{{ formatFen(row.groupPrice) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="groupTag(row.status)">{{ groupStatus(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="expireTime" label="截止时间" width="180" />
            <el-table-column prop="createTime" label="开团时间" width="180" />
            <el-table-column label="操作" width="90" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openDetail(row.id)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <pagination
            v-if="groupTotal > 0"
            v-model:total="groupTotal"
            v-model:page="groupParams.pageNum"
            v-model:limit="groupParams.pageSize"
            @pagination="fetchGroups"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-drawer
      v-model="drawerVisible"
      :title="form.id ? '编辑拼团活动' : '新增拼团活动'"
      size="620px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="活动名称" prop="name">
          <el-input v-model="form.name" maxlength="100" />
        </el-form-item>
        <el-form-item label="商品 SKU" prop="skuId">
          <el-select v-model="form.skuId" filterable style="width: 100%">
            <el-option
              v-for="item in skuOptions"
              :key="item.id"
              :label="`${item.label}（¥${formatFen(item.price)}）`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="拼团价" prop="groupPriceYuan">
          <el-input-number v-model="form.groupPriceYuan" :min="0.01" :precision="2" />
          <span class="unit">元</span>
        </el-form-item>
        <el-form-item label="成团人数" prop="requiredPeople">
          <el-input-number v-model="form.requiredPeople" :min="2" :max="100" />
        </el-form-item>
        <el-form-item label="活动时间" prop="timeRange">
          <el-date-picker
            v-model="form.timeRange"
            type="datetimerange"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="成团时限" prop="groupDurationMinutes">
          <el-input-number v-model="form.groupDurationMinutes" :min="1" :max="10080" />
          <span class="unit">分钟</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">上线</el-radio>
            <el-radio :value="0">下线</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveActivity">保存</el-button>
      </template>
    </el-drawer>

    <el-drawer v-model="detailVisible" title="拼团详情" size="760px">
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="活动">{{ detail.activityName }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ groupStatus(detail.status) }}</el-descriptions-item>
        <el-descriptions-item label="付款进度">
          {{ detail.paidPeople }} / {{ detail.requiredPeople }}
        </el-descriptions-item>
        <el-descriptions-item label="截止时间">{{ detail.expireTime }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="detail?.members || []" border style="margin-top: 20px">
        <el-table-column label="会员" min-width="150">
          <template #default="{ row }">
            {{ row.nickname || row.memberId }}
            <br />
            <small>{{ row.mobile || "-" }}</small>
          </template>
        </el-table-column>
        <el-table-column prop="orderNo" label="订单号" min-width="180" />
        <el-table-column label="参团状态" width="100">
          <template #default="{ row }">{{ memberStatus(row.status) }}</template>
        </el-table-column>
        <el-table-column prop="paidTime" label="支付时间" width="180" />
      </el-table>
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
  GroupBuyAPI,
  type GroupBuyActivityItem,
  type GroupBuyGroupDetail,
  type GroupBuyGroupItem,
} from "@/api/group-buy";
import { ProductAPI, type SkuOption } from "@/api/product";

defineOptions({ name: "BizGroupBuy" });
const activeTab = ref("activity");
const activityLoading = ref(false);
const activities = ref<GroupBuyActivityItem[]>([]);
const activityTotal = ref(0);
const activityParams = reactive({
  pageNum: 1,
  pageSize: 10,
  keywords: "",
  status: undefined as number | undefined,
});
const groupLoading = ref(false);
const groups = ref<GroupBuyGroupItem[]>([]);
const groupTotal = ref(0);
const groupParams = reactive({
  pageNum: 1,
  pageSize: 10,
  activityId: undefined as string | undefined,
  status: undefined as number | undefined,
});
const activityOptions = ref<GroupBuyActivityItem[]>([]);
const skuOptions = ref<SkuOption[]>([]);

async function fetchActivities() {
  activityLoading.value = true;
  try {
    const result = await GroupBuyAPI.getActivityPage(activityParams);
    activities.value = result.list;
    activityTotal.value = result.total;
  } finally {
    activityLoading.value = false;
  }
}
function queryActivities() {
  activityParams.pageNum = 1;
  fetchActivities();
}
function resetActivities() {
  Object.assign(activityParams, { pageNum: 1, keywords: "", status: undefined });
  fetchActivities();
}
async function fetchGroups() {
  groupLoading.value = true;
  try {
    const result = await GroupBuyAPI.getGroupPage(groupParams);
    groups.value = result.list;
    groupTotal.value = result.total;
  } finally {
    groupLoading.value = false;
  }
}
function queryGroups() {
  groupParams.pageNum = 1;
  fetchGroups();
}
function resetGroups() {
  Object.assign(groupParams, { pageNum: 1, activityId: undefined, status: undefined });
  fetchGroups();
}
function changeTab(name: string | number) {
  if (name === "group") fetchGroups();
}

const drawerVisible = ref(false);
const saving = ref(false);
const formRef = ref<FormInstance>();
const form = reactive(createForm());
function createForm() {
  return {
    id: "",
    name: "",
    skuId: "",
    groupPriceYuan: 0,
    requiredPeople: 2,
    timeRange: [] as string[],
    groupDurationMinutes: 1440,
    status: 1,
  };
}
const rules: FormRules = {
  name: [{ required: true, message: "请输入活动名称" }],
  skuId: [{ required: true, message: "请选择 SKU" }],
  groupPriceYuan: [{ required: true, message: "请输入拼团价" }],
  timeRange: [{ required: true, message: "请选择活动时间" }],
};
async function openDrawer(id?: string) {
  Object.assign(form, createForm());
  if (id) {
    const item = await GroupBuyAPI.getActivityForm(id);
    Object.assign(form, {
      ...item,
      groupPriceYuan: item.groupPrice / 100,
      timeRange: [item.startTime, item.endTime],
    });
  }
  drawerVisible.value = true;
}
async function saveActivity() {
  if (!(await formRef.value?.validate().catch(() => false))) return;
  const data = {
    skuId: form.skuId,
    name: form.name.trim(),
    groupPrice: Math.round(form.groupPriceYuan * 100),
    requiredPeople: form.requiredPeople,
    startTime: form.timeRange[0],
    endTime: form.timeRange[1],
    groupDurationMinutes: form.groupDurationMinutes,
    status: form.status,
  };
  saving.value = true;
  try {
    if (form.id) await GroupBuyAPI.updateActivity(form.id, data);
    else await GroupBuyAPI.createActivity(data);
    ElMessage.success("保存成功");
    drawerVisible.value = false;
    await fetchActivities();
    await loadOptions();
  } finally {
    saving.value = false;
  }
}
async function changeStatus(row: GroupBuyActivityItem, status: number) {
  await GroupBuyAPI.updateActivityStatus(row.id, status);
  row.status = status;
}
async function removeActivity(id: string) {
  await ElMessageBox.confirm("仅无拼团记录的活动可以删除，确认继续？", "删除确认", {
    type: "warning",
  });
  await GroupBuyAPI.deleteActivity(id);
  ElMessage.success("删除成功");
  fetchActivities();
}

const detailVisible = ref(false);
const detail = ref<GroupBuyGroupDetail>();
async function openDetail(id: string) {
  detail.value = await GroupBuyAPI.getGroupDetail(id);
  detailVisible.value = true;
}
const formatFen = (value: number) => (value / 100).toFixed(2);
const groupStatus = (status: number) => ["拼团中", "成功", "失败"][status] || "未知";
const memberStatus = (status: number) => ["待支付", "已支付", "已退款", "已取消"][status] || "未知";
const groupTag = (status: number): TagProps["type"] =>
  status === 1 ? "success" : status === 2 ? "danger" : "warning";
async function loadOptions() {
  const [skus, result] = await Promise.all([
    ProductAPI.getSkuOptions(),
    GroupBuyAPI.getActivityPage({ pageNum: 1, pageSize: 100 }),
  ]);
  skuOptions.value = skus;
  activityOptions.value = result.list;
}
onMounted(() => {
  fetchActivities();
  loadOptions();
});
</script>

<style scoped>
.unit {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
}
</style>
