<template>
  <div class="page-container">
    <el-card class="page-content" shadow="never">
      <div class="page-toolbar">
        <div class="page-toolbar__left">
          <el-button v-hasPerm="'biz:member-level:create'" type="primary" @click="openDialog()">
            新增等级
          </el-button>
        </div>
        <el-button class="page-icon-btn" @click="fetchData">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
      <div class="page-table-wrapper">
        <el-table v-loading="loading" :data="list" border height="100%">
          <el-table-column prop="name" label="等级名称" min-width="150" />
          <el-table-column label="累计实付门槛" min-width="140">
            <template #default="{ row }">¥{{ formatFen(row.thresholdAmount) }}</template>
          </el-table-column>
          <el-table-column label="会员折扣" width="120">
            <template #default="{ row }">{{ formatDiscount(row.discountRate) }}</template>
          </el-table-column>
          <el-table-column prop="sort" label="排序" width="90" align="center" />
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'">
                {{ row.status === 1 ? "启用" : "停用" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button
                v-hasPerm="'biz:member-level:update'"
                type="primary"
                link
                @click="openDialog(row as MemberLevel)"
              >
                编辑
              </el-button>
              <el-button
                v-hasPerm="'biz:member-level:delete'"
                type="danger"
                link
                @click="remove(row.id)"
              >
                删除
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

    <el-dialog v-model="visible" :title="form.id ? '编辑等级' : '新增等级'" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="等级名称" prop="name"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="累计实付门槛" prop="thresholdYuan">
          <el-input-number v-model="form.thresholdYuan" :min="0" :precision="2" />
          <span class="unit">元</span>
        </el-form-item>
        <el-form-item label="折扣" prop="discountRate">
          <el-input-number v-model="form.discountRate" :min="1" :max="100" :precision="2" />
          <span class="unit">%（100% 为无折扣）</span>
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
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Refresh } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";

import { MemberLevelAPI, type MemberLevel } from "@/api/marketing";
import { usePageTable } from "@/composables";

defineOptions({ name: "BizMemberLevel" });

const { loading, list, total, params, fetchData } = usePageTable<MemberLevel, BasePage>({
  initialParams: { pageNum: 1, pageSize: 10 },
  request: MemberLevelAPI.getPage,
});
const visible = ref(false);
const saving = ref(false);
const formRef = ref<FormInstance>();
const form = reactive({
  id: "",
  name: "",
  thresholdYuan: 0,
  discountRate: 100,
  status: 1,
  sort: 0,
});
const rules: FormRules = {
  name: [{ required: true, message: "请输入等级名称", trigger: "blur" }],
};

function openDialog(row?: MemberLevel) {
  Object.assign(form, {
    id: row?.id ?? "",
    name: row?.name ?? "",
    thresholdYuan: (row?.thresholdAmount ?? 0) / 100,
    discountRate: (row?.discountRate ?? 10000) / 100,
    status: row?.status ?? 1,
    sort: row?.sort ?? 0,
  });
  visible.value = true;
}

async function save() {
  if (!(await formRef.value?.validate().catch(() => false))) return;
  saving.value = true;
  try {
    const data = {
      name: form.name.trim(),
      thresholdAmount: Math.round(form.thresholdYuan * 100),
      discountRate: Math.round(form.discountRate * 100),
      status: form.status,
      sort: form.sort,
    };
    if (form.id) await MemberLevelAPI.update(form.id, data);
    else await MemberLevelAPI.create(data);
    ElMessage.success("保存成功");
    visible.value = false;
    fetchData();
  } finally {
    saving.value = false;
  }
}

async function remove(id: string) {
  await ElMessageBox.confirm("确认删除该会员等级？", "删除确认", { type: "warning" });
  await MemberLevelAPI.delete(id);
  ElMessage.success("删除成功");
  fetchData();
}

function formatFen(value: number) {
  return (value / 100).toFixed(2);
}

function formatDiscount(value: number) {
  return value === 10000 ? "无折扣" : `${(value / 1000).toFixed(1)} 折`;
}

interface BasePage {
  pageNum: number;
  pageSize: number;
}
</script>

<style scoped>
.unit {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
}
</style>
