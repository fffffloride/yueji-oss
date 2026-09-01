<template>
  <div class="page-container">
    <el-card class="page-search" shadow="never">
      <el-form :model="params" inline>
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
        <el-button v-hasPerm="'biz:decoration:banner:create'" type="primary" @click="openDrawer()">
          新增 Banner
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
          <el-table-column label="图片" width="180">
            <template #default="{ row }">
              <el-image :src="row.imageUrl" fit="cover" style="width: 140px; height: 70px" />
            </template>
          </el-table-column>
          <el-table-column prop="linkUrl" label="跳转地址" min-width="220" show-overflow-tooltip />
          <el-table-column label="位置" width="150" align="center">
            <template #default="{ row }">
              <SortPositionCell
                v-hasPerm="'biz:decoration:banner:update'"
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
                @change="changeStatus(row as BannerItem, Number($event))"
              />
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button
                v-hasPerm="'biz:decoration:banner:update'"
                link
                type="primary"
                @click="openDrawer(row.id)"
              >
                编辑
              </el-button>
              <el-button
                v-hasPerm="'biz:decoration:banner:delete'"
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

    <el-drawer
      v-model="drawerVisible"
      :title="editingId ? '编辑 Banner' : '新增 Banner'"
      size="520px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="图片" prop="imageUrl">
          <SingleImageUpload v-model="form.imageUrl" />
        </el-form-item>
        <el-form-item label="跳转地址" prop="linkUrl">
          <el-input v-model="form.linkUrl" placeholder="可选，支持站内或完整 URL" />
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
  BannerAPI,
  type BannerForm,
  type BannerItem,
  type DecorationQuery,
} from "@/api/decoration";
import SingleImageUpload from "@/components/Upload/SingleImageUpload.vue";
import SortPositionCell from "@/components/SortPositionCell/index.vue";
import SortSaveStatus from "@/components/SortSaveStatus/index.vue";
import { usePageTable, usePositionSort } from "@/composables";

defineOptions({ name: "BizDecorationBanner" });

const { loading, list, total, params, fetchData, handleQuery, handleResetQuery } = usePageTable<
  BannerItem,
  DecorationQuery
>({
  initialParams: { pageNum: 1, pageSize: 10, status: undefined },
  request: BannerAPI.getPage,
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
  filtered: computed(() => params.status !== undefined),
  request: (row: BannerItem, position) => BannerAPI.movePosition(row.id, position),
  refresh: fetchData,
});
const drawerVisible = ref(false);
const saving = ref(false);
const editingId = ref("");
const formRef = ref<FormInstance>();
const form = reactive<BannerForm>({ imageUrl: "", linkUrl: "", status: 1 });
const rules: FormRules = { imageUrl: [{ required: true, message: "请上传图片" }] };

async function openDrawer(id?: string) {
  Object.assign(form, { imageUrl: "", linkUrl: "", sort: undefined, status: 1 });
  editingId.value = id || "";
  if (id) {
    const item = await BannerAPI.getForm(id);
    Object.assign(form, item, { linkUrl: item.linkUrl || "" });
  }
  drawerVisible.value = true;
}
async function save() {
  if (!(await formRef.value?.validate().catch(() => false))) return;
  saving.value = true;
  try {
    const data = { imageUrl: form.imageUrl, linkUrl: form.linkUrl, status: form.status };
    if (editingId.value) await BannerAPI.update(editingId.value, data);
    else await BannerAPI.create(data);
    ElMessage.success("保存成功");
    drawerVisible.value = false;
    fetchData();
  } finally {
    saving.value = false;
  }
}
async function changeStatus(row: BannerItem, status: number) {
  await BannerAPI.updateStatus(row.id, status);
  row.status = status;
}
async function remove(id: string) {
  await ElMessageBox.confirm("确认删除该 Banner？", "删除确认", { type: "warning" });
  await BannerAPI.delete(id);
  ElMessage.success("删除成功");
  fetchData();
}
onMounted(handleQuery);
</script>
