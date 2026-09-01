<template>
  <div class="page-container">
    <el-card ref="tableWrapperRef" class="page-content" shadow="never">
      <div class="page-toolbar">
        <div class="page-toolbar__left">
          <el-button v-hasPerm="'biz:product-category:create'" type="primary" @click="openDialog()">
            新增分类
          </el-button>
          <SortSaveStatus :status="sortStatus" />
        </div>
        <div class="page-toolbar__right">
          <el-tooltip content="刷新" placement="top">
            <el-button class="page-icon-btn" @click="fetchData">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <div class="page-table-wrapper" @dragover.prevent @drop="handleDrop">
        <el-table
          v-loading="loading"
          :data="list"
          class="page-table"
          row-key="id"
          :row-class-name="rowClassName"
          default-expand-all
          border
          height="100%"
        >
          <el-table-column prop="name" label="分类名称" min-width="200" />
          <el-table-column label="图标" width="100">
            <template #default="scope">
              <el-image
                v-if="scope.row.icon"
                :src="scope.row.icon"
                style="width: 40px; height: 40px"
                fit="cover"
              />
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="level" label="层级" width="80" align="center" />
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.status === 1" type="success">启用</el-tag>
              <el-tag v-else type="info">禁用</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="位置" width="150" align="center">
            <template #default="{ row }">
              <SortPositionCell
                v-hasPerm="'biz:product-category:update'"
                :position="row.sort"
                :total="scopeTotal(row)"
                :drag-disabled="dragDisabled"
                @move="(position) => enqueueMove(row, position)"
                @dragstart="(event) => handleDragStart(row, event)"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="200">
            <template #default="scope">
              <el-button
                v-if="scope.row.level < 3"
                v-hasPerm="'biz:product-category:create'"
                type="primary"
                link
                size="small"
                @click.stop="openDialog(scope.row.id, undefined)"
              >
                新增下级
              </el-button>
              <el-button
                v-hasPerm="'biz:product-category:update'"
                type="primary"
                link
                size="small"
                @click.stop="openDialog(undefined, scope.row as CategoryNode)"
              >
                编辑
              </el-button>
              <el-button
                v-hasPerm="'biz:product-category:delete'"
                type="danger"
                link
                size="small"
                @click.stop="handleDelete(scope.row.id)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <el-dialog
      v-model="dialogState.visible"
      :title="dialogState.title"
      width="600px"
      @closed="closeDialog"
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="90px">
        <el-form-item label="上级分类" prop="parentId">
          <el-tree-select
            v-model="formData.parentId"
            placeholder="选择上级分类"
            :data="categoryOptions"
            filterable
            check-strictly
            :render-after-expand="false"
          />
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类图标" prop="icon">
          <SingleImageUpload v-model="formData.icon" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleSubmit">确定</el-button>
          <el-button @click="closeDialog">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import { Refresh } from "@element-plus/icons-vue";

import SingleImageUpload from "@/components/Upload/SingleImageUpload.vue";
import SortPositionCell from "@/components/SortPositionCell/index.vue";
import SortSaveStatus from "@/components/SortSaveStatus/index.vue";
import { ProductCategoryAPI } from "@/api/product";
import type { CategoryForm, CategoryNode } from "@/api/product";
import type { OptionItem } from "@/api/common";
import { usePositionSort } from "@/composables";

defineOptions({
  name: "ProductCategory",
  inheritAttrs: false,
});

const tableWrapperRef = ref<HTMLElement | null>(null);
const formRef = ref<FormInstance>();

const loading = ref(false);
const list = ref<CategoryNode[]>([]);

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
  request: (row: CategoryNode, position) =>
    ProductCategoryAPI.movePosition(row.id, position, String(row.parentId ?? "0")),
  refresh: fetchData,
});

const dialogState = reactive({
  title: "",
  visible: false,
});

const categoryOptions = ref<OptionItem[]>([]);

const initialFormData: CategoryForm = {
  parentId: "0",
  status: 1,
};

const formData = reactive<CategoryForm>({ ...initialFormData });

const rules: FormRules<CategoryForm> = {
  parentId: [{ required: true, message: "上级分类不能为空", trigger: "change" }],
  name: [{ required: true, message: "分类名称不能为空", trigger: "blur" }],
};

async function fetchData(): Promise<void> {
  loading.value = true;
  try {
    list.value = await ProductCategoryAPI.getTree();
  } finally {
    loading.value = false;
  }
}

/** 分类树转选项（编辑时排除自身，且只允许选到二级作为父级） */
function toOptions(nodes: CategoryNode[], excludeId?: string): OptionItem[] {
  return nodes
    .filter((n) => String(n.id) !== String(excludeId))
    .map((n) => ({
      value: n.id,
      label: n.name,
      children: n.level < 2 && n.children ? toOptions(n.children, excludeId) : undefined,
    }));
}

async function openDialog(parentId?: string, row?: CategoryNode): Promise<void> {
  categoryOptions.value = [
    { value: "0", label: "顶级分类", children: toOptions(list.value, row?.id) },
  ];

  dialogState.visible = true;
  if (row) {
    dialogState.title = "修改分类";
    Object.assign(formData, {
      id: row.id,
      name: row.name,
      parentId: String(row.parentId),
      icon: row.icon ?? undefined,
      status: row.status,
    });
  } else {
    dialogState.title = "新增分类";
    formData.parentId = parentId || "0";
  }
}

async function handleSubmit(): Promise<void> {
  const valid = await formRef.value?.validate().then(
    () => true,
    () => false
  );
  if (!valid) return;

  loading.value = true;
  try {
    if (formData.id) {
      await ProductCategoryAPI.update(formData.id, formData);
      ElMessage.success("修改成功");
    } else {
      await ProductCategoryAPI.create(formData);
      ElMessage.success("新增成功");
    }
    closeDialog();
    fetchData();
  } finally {
    loading.value = false;
  }
}

async function handleDelete(id: string): Promise<void> {
  try {
    await ElMessageBox.confirm("确认删除该分类?", "警告", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
  } catch {
    return;
  }

  loading.value = true;
  try {
    await ProductCategoryAPI.deleteById(id);
    ElMessage.success("删除成功");
    fetchData();
  } finally {
    loading.value = false;
  }
}

function closeDialog(): void {
  dialogState.visible = false;
  formRef.value?.resetFields();
  Object.keys(formData).forEach((key) => {
    delete (formData as Record<string, unknown>)[key];
  });
  Object.assign(formData, initialFormData);
}

onMounted(() => {
  fetchData();
});
</script>
