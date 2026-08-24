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
        <el-button v-hasPerm="'biz:distribution:type:create'" type="primary" @click="openDrawer()">
          新增类型
        </el-button>
        <el-button class="page-icon-btn" @click="fetchData">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
      <div class="page-table-wrapper">
        <el-table v-loading="loading" :data="list" border height="100%">
          <el-table-column prop="name" label="类型名称" min-width="180" />
          <el-table-column prop="sort" label="排序" width="100" align="center" />
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-switch
                :model-value="row.status"
                :active-value="1"
                :inactive-value="0"
                @change="changeStatus(row as AgentTypeItem, Number($event))"
              />
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button
                v-hasPerm="'biz:distribution:type:update'"
                link
                type="primary"
                @click="openDrawer(row.id)"
              >
                编辑
              </el-button>
              <el-button
                v-hasPerm="'biz:distribution:type:delete'"
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
    <el-drawer v-model="visible" :title="editingId ? '编辑代理类型' : '新增代理类型'" size="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="类型名称" prop="name">
          <el-input v-model="form.name" maxlength="64" />
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
  type AgentTypeForm,
  type AgentTypeItem,
  type DistributionConfigQuery,
} from "@/api/distribution";
import { usePageTable } from "@/composables";

defineOptions({ name: "BizDistributionType" });
const { loading, list, total, params, fetchData, handleQuery, handleResetQuery } = usePageTable<
  AgentTypeItem,
  DistributionConfigQuery
>({
  initialParams: { pageNum: 1, pageSize: 10, keywords: "", status: undefined },
  request: DistributionAPI.getTypePage,
});
const visible = ref(false),
  saving = ref(false),
  editingId = ref("");
const formRef = ref<FormInstance>();
const form = reactive<AgentTypeForm>({ name: "", status: 1, sort: 0 });
const rules: FormRules = { name: [{ required: true, message: "请输入类型名称" }] };
async function openDrawer(id?: string) {
  Object.assign(form, { name: "", status: 1, sort: 0 });
  editingId.value = id || "";
  if (id) Object.assign(form, await DistributionAPI.getTypeForm(id));
  visible.value = true;
}
async function save() {
  if (!(await formRef.value?.validate().catch(() => false))) return;
  saving.value = true;
  try {
    if (editingId.value) await DistributionAPI.updateType(editingId.value, form);
    else await DistributionAPI.createType(form);
    ElMessage.success("保存成功");
    visible.value = false;
    fetchData();
  } finally {
    saving.value = false;
  }
}
async function changeStatus(row: AgentTypeItem, status: number) {
  await DistributionAPI.updateTypeStatus(row.id, status);
  row.status = status;
}
async function remove(id: string) {
  await ElMessageBox.confirm("仅未被代理使用的类型可以删除，确认继续？", "删除确认", {
    type: "warning",
  });
  await DistributionAPI.deleteType(id);
  ElMessage.success("删除成功");
  fetchData();
}
onMounted(handleQuery);
</script>
