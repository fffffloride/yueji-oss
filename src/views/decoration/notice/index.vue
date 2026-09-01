<template>
  <div class="page-container">
    <el-card class="page-search" shadow="never">
      <el-form :model="params" inline>
        <el-form-item label="标题">
          <el-input v-model="params.keywords" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="params.status" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="handleResetQuery">重置</el-button>
      </el-form>
    </el-card>
    <el-card class="page-content" shadow="never">
      <div class="page-toolbar">
        <el-button v-hasPerm="'biz:decoration:notice:create'" type="primary" @click="openDrawer()">
          新增公告
        </el-button>
        <SortSaveStatus :status="sortStatus" />
        <el-button class="page-icon-btn" @click="fetchData">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
      <div class="page-table-wrapper" @dragover.prevent @drop="handleDrop">
        <el-table
          v-loading="loading"
          :data="list"
          :row-class-name="rowClassName"
          border
          height="100%"
        >
          <el-table-column prop="title" label="标题" min-width="200" />
          <el-table-column prop="content" label="内容" min-width="280" show-overflow-tooltip />
          <el-table-column label="位置" width="150" align="center">
            <template #default="{ row }">
              <SortPositionCell
                v-hasPerm="'biz:decoration:notice:update'"
                :position="row.sort"
                :total="scopeTotal(row)"
                :drag-disabled="dragDisabled"
                @move="(position) => enqueueMove(row, position)"
                @dragstart="(event) => handleDragStart(row, event)"
              />
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-switch
                :model-value="row.status"
                :active-value="1"
                :inactive-value="0"
                @change="changeStatus(row as NoticeItem, Number($event))"
              />
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button
                v-hasPerm="'biz:decoration:notice:update'"
                link
                type="primary"
                @click="openDrawer(row.id)"
              >
                编辑
              </el-button>
              <el-button
                v-hasPerm="'biz:decoration:notice:delete'"
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
        v-if="total > 0"
        v-model:total="total"
        v-model:page="params.pageNum"
        v-model:limit="params.pageSize"
        @pagination="fetchData"
      />
    </el-card>

    <el-drawer v-model="drawerVisible" :title="editingId ? '编辑公告' : '新增公告'" size="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="8"
            maxlength="10000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { Refresh } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import {
  NoticeAPI,
  type DecorationQuery,
  type NoticeForm,
  type NoticeItem,
} from "@/api/decoration";
import SortPositionCell from "@/components/SortPositionCell/index.vue";
import SortSaveStatus from "@/components/SortSaveStatus/index.vue";
import { usePageTable, usePositionSort } from "@/composables";

defineOptions({ name: "BizDecorationNotice" });
const { loading, list, total, params, fetchData, handleQuery, handleResetQuery } = usePageTable<
  NoticeItem,
  DecorationQuery
>({
  initialParams: { pageNum: 1, pageSize: 10, keywords: "", status: undefined },
  request: NoticeAPI.getPage,
});
const {
  status: sortStatus,
  dragDisabled,
  scopeTotal,
  enqueueMove,
  rowClassName,
  handleDragStart,
  handleDrop,
} = usePositionSort({
  rows: list,
  total,
  filtered: computed(() => Boolean(params.keywords || params.status !== undefined)),
  request: (row: NoticeItem, position) => NoticeAPI.movePosition(row.id, position),
  refresh: fetchData,
});
const drawerVisible = ref(false);
const saving = ref(false);
const editingId = ref("");
const formRef = ref<FormInstance>();
const form = reactive<NoticeForm>({ title: "", content: "", status: 1 });
const rules: FormRules = {
  title: [{ required: true, message: "请输入标题" }],
  content: [{ required: true, message: "请输入内容" }],
};

async function openDrawer(id?: string) {
  Object.assign(form, { title: "", content: "", sort: undefined, status: 1 });
  editingId.value = id || "";
  if (id) Object.assign(form, await NoticeAPI.getForm(id));
  drawerVisible.value = true;
}
async function save() {
  if (!(await formRef.value?.validate().catch(() => false))) return;
  saving.value = true;
  try {
    const data = { title: form.title, content: form.content, status: form.status };
    if (editingId.value) await NoticeAPI.update(editingId.value, data);
    else await NoticeAPI.create(data);
    ElMessage.success("保存成功");
    drawerVisible.value = false;
    fetchData();
  } finally {
    saving.value = false;
  }
}
async function changeStatus(row: NoticeItem, status: number) {
  await NoticeAPI.updateStatus(row.id, status);
  row.status = status;
}
async function remove(id: string) {
  await ElMessageBox.confirm("确认删除该公告？", "删除确认", { type: "warning" });
  await NoticeAPI.delete(id);
  ElMessage.success("删除成功");
  fetchData();
}
onMounted(handleQuery);
</script>
