<template>
  <div class="page-container">
    <el-card class="page-search" shadow="never">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="关键字" prop="keywords">
          <el-input
            v-model="queryParams.keywords"
            placeholder="商品名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-tree-select
            v-model="queryParams.categoryId"
            placeholder="全部"
            :data="categoryOptions"
            filterable
            clearable
            check-strictly
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 100px">
            <el-option :value="1" label="上架" />
            <el-option :value="0" label="下架" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="handleResetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="page-content" shadow="never">
      <div class="page-toolbar">
        <div class="page-toolbar__left">
          <el-button v-hasPerm="'biz:product:create'" type="primary" @click="openDrawer()">
            新增商品
          </el-button>
          <SortSaveStatus :status="sortStatus" />
        </div>
        <div class="page-toolbar__right">
          <el-tooltip content="刷新" placement="top">
            <el-button class="page-icon-btn" @click="handleQuery">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <div class="page-table-wrapper">
        <el-table v-loading="loading" :data="list" class="page-table" border height="100%">
          <el-table-column label="主图" width="90">
            <template #default="scope">
              <el-image
                v-if="scope.row.mainImage"
                :src="scope.row.mainImage"
                style="width: 56px; height: 56px"
                fit="cover"
                :preview-src-list="[scope.row.mainImage]"
                preview-teleported
              />
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="商品名称" min-width="180" show-overflow-tooltip />
          <el-table-column prop="categoryName" label="分类" width="120" />
          <el-table-column label="标签" width="150">
            <template #default="scope">
              <el-tag
                v-for="tag in parseTags(scope.row.tags)"
                :key="tag"
                size="small"
                style="margin-right: 4px"
              >
                {{ tag }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="疼痛友好" width="100" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.painFriendly ? 'success' : 'info'" size="small">
                {{ scope.row.painFriendly ? "是" : "否" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="价格(元)" width="110" align="right">
            <template #default="scope">
              {{ toYuan(scope.row.price) }}
            </template>
          </el-table-column>
          <el-table-column prop="sales" label="销量" width="80" align="center" />
          <el-table-column prop="stock" label="库存" width="80" align="center" />
          <el-table-column label="上架状态" width="100" align="center">
            <template #default="scope">
              <el-switch
                v-hasPerm="'biz:product:status'"
                :model-value="scope.row.status === 1"
                @change="
                  (val: string | number | boolean) =>
                    handleStatusChange(scope.row as ProductItem, Boolean(val))
                "
              />
            </template>
          </el-table-column>
          <el-table-column label="位置" width="140" align="center">
            <template #default="{ row }">
              <SortPositionCell
                v-hasPerm="'biz:product:update'"
                :position="row.sort"
                :total="scopeTotal(row)"
                drag-disabled
                @move="(position) => enqueueMove(row, position, false)"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="130">
            <template #default="scope">
              <el-button
                v-hasPerm="'biz:product:update'"
                type="primary"
                link
                size="small"
                @click="openDrawer(scope.row.id)"
              >
                编辑
              </el-button>
              <el-button
                v-hasPerm="'biz:product:delete'"
                type="danger"
                link
                size="small"
                @click="handleDelete(scope.row.id)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="page-pagination">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <!-- 商品编辑抽屉 -->
    <el-drawer
      v-model="drawerState.visible"
      :title="drawerState.title"
      size="720px"
      :close-on-click-modal="false"
      @closed="closeDrawer"
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="90px">
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入商品名称" maxlength="100" />
        </el-form-item>
        <el-form-item label="所属分类" prop="categoryId">
          <el-tree-select
            v-model="formData.categoryId"
            placeholder="选择分类"
            :data="categoryOptions"
            filterable
            check-strictly
            :render-after-expand="false"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="副标题" prop="subTitle">
          <el-input v-model="formData.subTitle" placeholder="请输入副标题" maxlength="255" />
        </el-form-item>
        <el-form-item label="商品标签" prop="tagList">
          <el-checkbox-group v-model="tagList">
            <el-checkbox value="推荐">推荐</el-checkbox>
            <el-checkbox value="新品">新品</el-checkbox>
            <el-checkbox value="热卖">热卖</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="疼痛友好">
          <el-switch v-model="formData.painFriendly" />
        </el-form-item>
        <el-form-item label="主图" prop="mainImage" required>
          <div>
            <SingleImageUpload v-model="formData.mainImage" />
            <p class="form-tip">建议比例 10:9</p>
          </div>
        </el-form-item>
        <el-form-item label="轮播图" prop="album" required>
          <div>
            <MultiImageUpload v-model="formData.album" :limit="6" />
            <p class="form-tip">建议比例 6:5</p>
          </div>
        </el-form-item>
        <el-form-item label="划线原价" prop="originalPriceYuan" required>
          <el-input-number
            v-model="formData.originalPriceYuan"
            :min="0"
            :precision="2"
            controls-position="right"
            style="width: 160px"
          />
          <span style="margin-left: 8px; color: var(--el-text-color-secondary)">元</span>
        </el-form-item>
        <el-form-item label="上架状态">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">上架</el-radio>
            <el-radio :value="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="规格SKU" prop="skus">
          <el-table :data="formData.skus" border size="small" class="mb-8px">
            <el-table-column label="规格名称" min-width="140">
              <template #default="scope">
                <el-input
                  v-model="scope.row.name"
                  placeholder="如：1ml装"
                  size="small"
                  @change="validateSkus"
                />
              </template>
            </el-table-column>
            <el-table-column label="售价(元)" width="130">
              <template #default="scope">
                <el-input-number
                  v-model="scope.row.priceYuan"
                  :min="0"
                  :precision="2"
                  size="small"
                  controls-position="right"
                  style="width: 110px"
                  @change="validateSkus"
                />
              </template>
            </el-table-column>
            <el-table-column label="原价(元)" width="130">
              <template #default="scope">
                <el-input-number
                  v-model="scope.row.originalPriceYuan"
                  :min="0"
                  :precision="2"
                  size="small"
                  controls-position="right"
                  style="width: 110px"
                />
              </template>
            </el-table-column>
            <el-table-column label="库存" width="110">
              <template #default="scope">
                <el-input-number
                  v-model="scope.row.stock"
                  :min="0"
                  size="small"
                  controls-position="right"
                  style="width: 90px"
                />
              </template>
            </el-table-column>
            <el-table-column label="启用" width="70" align="center">
              <template #default="scope">
                <el-switch
                  :model-value="scope.row.status !== 0"
                  size="small"
                  @change="(val: string | number | boolean) => (scope.row.status = val ? 1 : 0)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="60" align="center">
              <template #default="scope">
                <el-button
                  type="danger"
                  link
                  size="small"
                  :disabled="formData.skus.length <= 1"
                  @click="removeSku(scope.$index)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button size="small" @click="addSku">+ 添加规格</el-button>
        </el-form-item>

        <el-form-item label="商品详情" prop="detail" required>
          <WangEditor v-model="formData.detail" height="300px" />
        </el-form-item>
        <el-form-item label="产品说明" prop="usageNote">
          <el-input
            v-model="formData.usageNote"
            type="textarea"
            :rows="3"
            placeholder="适用人群、注意事项等"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
          <el-button @click="closeDrawer">取消</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import { Refresh } from "@element-plus/icons-vue";

import SingleImageUpload from "@/components/Upload/SingleImageUpload.vue";
import MultiImageUpload from "@/components/Upload/MultiImageUpload.vue";
import WangEditor from "@/components/WangEditor/index.vue";
import SortPositionCell from "@/components/SortPositionCell/index.vue";
import SortSaveStatus from "@/components/SortSaveStatus/index.vue";
import { ProductAPI, ProductCategoryAPI } from "@/api/product";
import type { CategoryNode, ProductForm, ProductItem, ProductQueryParams } from "@/api/product";
import type { OptionItem } from "@/api/common";
import { usePositionSort } from "@/composables";

defineOptions({
  name: "ProductGoods",
  inheritAttrs: false,
});

/** 分转元（展示） */
const toYuan = (cents?: number | null) =>
  cents === undefined || cents === null ? "-" : (cents / 100).toFixed(2);
/** 元转分（提交） */
const toCents = (yuan?: number | null) =>
  yuan === undefined || yuan === null ? undefined : Math.round(yuan * 100);

const parseTags = (tags?: string) => (tags ? tags.split(",").filter(Boolean) : []);

function isBlankHtml(html?: string): boolean {
  if (!html) return true;
  return (
    html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/gi, " ")
      .trim().length === 0
  );
}

function hasUploadedUrl(url?: string | null): boolean {
  return !!url?.trim();
}

function hasUploadedUrls(urls?: string[] | null): boolean {
  return !!urls?.some((url) => url?.trim());
}

type SkuRow = {
  id?: string;
  name: string;
  priceYuan?: number;
  originalPriceYuan?: number;
  stock: number;
  status: number;
};

const queryFormRef = ref<FormInstance>();
const formRef = ref<FormInstance>();

const loading = ref(false);
const submitting = ref(false);
const list = ref<ProductItem[]>([]);
const total = ref(0);
const categoryOptions = ref<OptionItem[]>([]);

const {
  status: sortStatus,
  scopeTotal,
  enqueueMove,
} = usePositionSort({
  rows: list,
  total,
  request: (row: ProductItem, position) => ProductAPI.movePosition(row.id, position),
  refresh: fetchData,
});

const queryParams = reactive<ProductQueryParams>({
  pageNum: 1,
  pageSize: 10,
  keywords: "",
  categoryId: undefined,
  status: undefined,
});

const drawerState = reactive({ title: "", visible: false });

type FormState = Omit<ProductForm, "skus" | "album" | "originalPrice"> & {
  skus: SkuRow[];
  album: string[];
  originalPriceYuan?: number;
};

const initialFormData: FormState = {
  painFriendly: false,
  status: 0,
  skus: [],
  album: [],
  mainImage: "",
  detail: "",
};

const formData = reactive<FormState>({ ...initialFormData, skus: [], album: [] });
const tagList = ref<string[]>([]);

const rules: FormRules = {
  name: [{ required: true, message: "商品名称不能为空", trigger: "blur" }],
  categoryId: [{ required: true, message: "请选择分类", trigger: "change" }],
  mainImage: [
    {
      required: true,
      validator: (_rule, value, callback) => {
        if (!hasUploadedUrl(value)) callback(new Error("请上传主图"));
        else callback();
      },
      trigger: "change",
    },
  ],
  album: [
    {
      type: "array",
      required: true,
      validator: (_rule, value, callback) => {
        if (!hasUploadedUrls(value)) callback(new Error("请至少上传一张轮播图"));
        else callback();
      },
      trigger: "change",
    },
  ],
  originalPriceYuan: [{ required: true, message: "请填写划线原价", trigger: "change" }],
  skus: [
    {
      type: "array",
      required: true,
      validator: (_rule, value, callback) => {
        if (!Array.isArray(value) || value.length === 0) {
          callback(new Error("至少需要一个SKU"));
          return;
        }
        const incomplete = value.some((sku: SkuRow) => !sku.name?.trim() || sku.priceYuan == null);
        if (incomplete) callback(new Error("请完整填写SKU的规格名称和售价"));
        else callback();
      },
      trigger: "change",
    },
  ],
  detail: [
    {
      required: true,
      validator: (_rule, value, callback) => {
        if (isBlankHtml(value)) callback(new Error("请填写商品详情"));
        else callback();
      },
      trigger: "change",
    },
  ],
};

function toOptions(nodes: CategoryNode[]): OptionItem[] {
  return nodes.map((n) => ({
    value: n.id,
    label: n.name,
    children: n.children ? toOptions(n.children) : undefined,
  }));
}

async function loadCategoryOptions(): Promise<void> {
  const tree = await ProductCategoryAPI.getTree();
  categoryOptions.value = toOptions(tree);
}

async function fetchData(): Promise<void> {
  loading.value = true;
  try {
    const result = await ProductAPI.getPage(queryParams);
    list.value = result.list;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

function handleQuery(): void {
  queryParams.pageNum = 1;
  fetchData();
}

function handleResetQuery(): void {
  queryFormRef.value?.resetFields();
  queryParams.pageNum = 1;
  fetchData();
}

function createSkuRow(): SkuRow {
  return { name: "", priceYuan: undefined, stock: 0, status: 1 };
}

function validateSkus(): void {
  formRef.value?.validateField("skus");
}

function addSku(): void {
  formData.skus.push(createSkuRow());
  validateSkus();
}

function removeSku(index: number): void {
  if (formData.skus.length <= 1) return;
  formData.skus.splice(index, 1);
  validateSkus();
}

function resetForm(): void {
  tagList.value = [];
  Object.assign(formData, {
    ...initialFormData,
    id: undefined,
    name: "",
    categoryId: undefined,
    subTitle: "",
    mainImage: "",
    album: [],
    originalPriceYuan: undefined,
    painFriendly: false,
    detail: "",
    usageNote: "",
    skus: [createSkuRow()],
  });
  formRef.value?.clearValidate();
}

async function openDrawer(productId?: string): Promise<void> {
  await loadCategoryOptions();
  resetForm();
  drawerState.visible = true;

  if (productId) {
    drawerState.title = "编辑商品";
    const data = await ProductAPI.getFormData(productId);
    Object.assign(formData, {
      id: data.id,
      name: data.name,
      categoryId: data.categoryId ? String(data.categoryId) : undefined,
      subTitle: data.subTitle ?? undefined,
      mainImage: data.mainImage ?? "",
      album: ((data.album as string[]) ?? []).filter((url) => url?.trim()),
      videoUrl: data.videoUrl ?? undefined,
      painFriendly: Boolean(data.painFriendly),
      originalPriceYuan: data.originalPrice != null ? data.originalPrice / 100 : undefined,
      detail: data.detail ?? "",
      usageNote: data.usageNote ?? undefined,
      status: data.status,
      skus: data.skus?.length
        ? data.skus.map((s) => ({
            id: s.id,
            name: s.name,
            priceYuan: s.price / 100,
            originalPriceYuan: s.originalPrice != null ? s.originalPrice / 100 : undefined,
            stock: s.stock,
            status: s.status ?? 1,
          }))
        : [createSkuRow()],
    });
    tagList.value = parseTags(data.tags);
  } else {
    drawerState.title = "新增商品";
  }
}

async function handleSubmit(): Promise<void> {
  const valid = await formRef.value?.validate().then(
    () => true,
    () => false
  );
  if (!valid) return;
  if (!hasUploadedUrl(formData.mainImage) || !hasUploadedUrls(formData.album)) {
    await Promise.all([
      formRef.value?.validateField("mainImage"),
      formRef.value?.validateField("album"),
    ]);
    return;
  }
  if (formData.status === 1 && !formData.skus.some((sku) => sku.status !== 0)) {
    ElMessage.warning("上架商品至少需要一个启用的SKU");
    return;
  }

  const payload: ProductForm = {
    name: formData.name,
    categoryId: formData.categoryId,
    subTitle: formData.subTitle || undefined,
    mainImage: formData.mainImage,
    album: formData.album.filter((url) => url?.trim()),
    videoUrl: formData.videoUrl || undefined,
    tags: tagList.value.length ? tagList.value.join(",") : undefined,
    painFriendly: Boolean(formData.painFriendly),
    originalPrice: toCents(formData.originalPriceYuan),
    detail: formData.detail,
    usageNote: formData.usageNote || undefined,
    status: formData.status,
    skus: formData.skus.map((s) => ({
      id: s.id,
      name: s.name,
      price: toCents(s.priceYuan)!,
      originalPrice: toCents(s.originalPriceYuan),
      stock: s.stock ?? 0,
      status: s.status,
    })),
  };

  submitting.value = true;
  try {
    if (formData.id) {
      await ProductAPI.update(formData.id, payload);
      ElMessage.success("修改成功");
    } else {
      await ProductAPI.create(payload);
      ElMessage.success("新增成功");
    }
    closeDrawer();
    fetchData();
  } finally {
    submitting.value = false;
  }
}

async function handleStatusChange(row: ProductItem, val: boolean): Promise<void> {
  const action = val ? "上架" : "下架";
  try {
    await ElMessageBox.confirm(`确认${action}「${row.name}」?`, "提示", { type: "warning" });
  } catch {
    return;
  }
  await ProductAPI.updateStatus(row.id, val ? 1 : 0);
  ElMessage.success(`${action}成功`);
  fetchData();
}

async function handleDelete(id: string): Promise<void> {
  try {
    await ElMessageBox.confirm("确认删除该商品?", "警告", { type: "warning" });
  } catch {
    return;
  }
  await ProductAPI.deleteById(id);
  ElMessage.success("删除成功");
  fetchData();
}

function closeDrawer(): void {
  drawerState.visible = false;
  resetForm();
}

onMounted(() => {
  loadCategoryOptions();
  fetchData();
});
</script>

<style scoped>
.form-tip {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}
</style>
