<template>
  <div class="page-container">
    <el-card class="page-search" shadow="never">
      <el-form :model="params" inline>
        <el-form-item label="名称">
          <el-input v-model="params.keywords" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="params.status" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="handleResetQuery">重置</el-button>
      </el-form>
    </el-card>
    <el-card class="page-content" shadow="never">
      <div class="page-toolbar">
        <el-button v-hasPerm="'biz:distribution:level:create'" type="primary" @click="openDrawer()">
          新增等级
        </el-button>
        <el-button class="page-icon-btn" @click="fetchData">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
      <div class="page-table-wrapper">
        <el-table v-loading="loading" :data="list" border height="100%">
          <el-table-column prop="name" label="等级名称" min-width="140" />
          <el-table-column prop="rank" label="级别" width="80" align="center" />
          <el-table-column label="升级门槛" width="140">
            <template #default="{ row }">¥{{ fen(row.upgradeSalesAmount) }}</template>
          </el-table-column>
          <el-table-column label="分销深度" width="100">
            <template #default="{ row }">{{ row.distributionDepth }} 级</template>
          </el-table-column>
          <el-table-column label="一级比例" width="100">
            <template #default="{ row }">{{ rate(row.level1RateBps) }}</template>
          </el-table-column>
          <el-table-column label="二级比例" width="100">
            <template #default="{ row }">{{ rate(row.level2RateBps) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-switch
                :model-value="row.status"
                :active-value="1"
                :inactive-value="0"
                @change="changeStatus(row as DistributionLevelItem, Number($event))"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button
                v-hasPerm="'biz:distribution:level:update'"
                link
                type="primary"
                @click="openDrawer(row.id)"
              >
                编辑
              </el-button>
              <el-button
                v-hasPerm="'biz:distribution:level:delete'"
                link
                type="danger"
                @click="remove(row.id)"
              >
                删除
              </el-button>
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
    <el-drawer v-model="visible" :title="editingId ? '编辑分销等级' : '新增分销等级'" size="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="等级名称" prop="name"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="级别顺序" prop="rank">
          <el-input-number v-model="form.rank" :min="1" />
        </el-form-item>
        <el-form-item label="升级门槛">
          <el-input-number v-model="form.upgradeSalesYuan" :min="0" :precision="2" />
          <span class="unit">元</span>
        </el-form-item>
        <el-form-item label="分销深度">
          <el-radio-group v-model="form.distributionDepth" @change="depthChanged">
            <el-radio :value="1">一级</el-radio>
            <el-radio :value="2">二级</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="一级比例">
          <el-input-number v-model="form.level1RatePercent" :min="0" :max="100" :precision="2" />
          <span class="unit">%</span>
        </el-form-item>
        <el-form-item label="二级比例">
          <el-input-number
            v-model="form.level2RatePercent"
            :min="0"
            :max="100"
            :precision="2"
            :disabled="form.distributionDepth === 1"
          />
          <span class="unit">%</span>
        </el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { Refresh } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import {
  DistributionAPI,
  type DistributionConfigQuery,
  type DistributionLevelItem,
} from "@/api/distribution";
import { usePageTable } from "@/composables";

defineOptions({ name: "BizDistributionLevel" });
const { loading, list, total, params, fetchData, handleQuery, handleResetQuery } = usePageTable<
  DistributionLevelItem,
  DistributionConfigQuery
>({
  initialParams: { pageNum: 1, pageSize: 10, keywords: "", status: undefined },
  request: DistributionAPI.getLevelPage,
});
const visible = ref(false),
  saving = ref(false),
  editingId = ref("");
const formRef = ref<FormInstance>();
const empty = () => ({
  name: "",
  rank: 1,
  upgradeSalesYuan: 0,
  distributionDepth: 1,
  level1RatePercent: 0,
  level2RatePercent: 0,
  status: 1,
  sort: 0,
});
const form = reactive(empty());
const rules: FormRules = {
  name: [{ required: true, message: "请输入等级名称" }],
  rank: [{ required: true, message: "请输入级别顺序" }],
};
async function openDrawer(id?: string) {
  Object.assign(form, empty());
  editingId.value = id || "";
  if (id) {
    const row = await DistributionAPI.getLevelForm(id);
    Object.assign(form, row, {
      upgradeSalesYuan: row.upgradeSalesAmount / 100,
      level1RatePercent: row.level1RateBps / 100,
      level2RatePercent: row.level2RateBps / 100,
    });
  }
  visible.value = true;
}
function depthChanged() {
  if (form.distributionDepth === 1) form.level2RatePercent = 0;
}
async function save() {
  if (!(await formRef.value?.validate().catch(() => false))) return;
  saving.value = true;
  try {
    const data = {
      name: form.name.trim(),
      rank: form.rank,
      upgradeSalesAmount: Math.round(form.upgradeSalesYuan * 100),
      distributionDepth: form.distributionDepth,
      level1RateBps: Math.round(form.level1RatePercent * 100),
      level2RateBps: Math.round(form.level2RatePercent * 100),
      status: form.status,
      sort: form.sort,
    };
    if (editingId.value) await DistributionAPI.updateLevel(editingId.value, data);
    else await DistributionAPI.createLevel(data);
    ElMessage.success("保存成功");
    visible.value = false;
    fetchData();
  } finally {
    saving.value = false;
  }
}
async function changeStatus(row: DistributionLevelItem, status: number) {
  await DistributionAPI.updateLevelStatus(row.id, status);
  row.status = status;
}
async function remove(id: string) {
  await ElMessageBox.confirm("仅未被使用的等级可以删除，确认继续？", "删除确认", {
    type: "warning",
  });
  await DistributionAPI.deleteLevel(id);
  ElMessage.success("删除成功");
  fetchData();
}
const fen = (value: number) => (value / 100).toFixed(2);
const rate = (value: number) => `${(value / 100).toFixed(2)}%`;
onMounted(handleQuery);
</script>
<style scoped>
.unit {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
}
</style>
