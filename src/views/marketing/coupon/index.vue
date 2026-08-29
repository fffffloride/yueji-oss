<template>
  <div class="page-container">
    <el-card class="page-search" shadow="never">
      <el-form :model="params" inline>
        <el-form-item label="关键字"><el-input v-model="params.keywords" clearable /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="params.type" clearable style="width: 140px">
            <el-option
              v-for="item in couponTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="params.status" clearable style="width: 110px">
            <el-option :value="0" label="草稿" />
            <el-option :value="1" label="启用" />
            <el-option :value="2" label="停用" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="handleResetQuery">重置</el-button>
      </el-form>
    </el-card>

    <el-card class="page-content" shadow="never">
      <div class="page-toolbar">
        <div class="page-toolbar__left">
          <el-button v-hasPerm="'biz:coupon:create'" type="primary" @click="openDrawer()">
            新增优惠券
          </el-button>
          <el-button v-hasPerm="'biz:coupon:list'" @click="openRecords()">领取使用记录</el-button>
        </div>
        <el-button class="page-icon-btn" @click="fetchData">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
      <div class="page-table-wrapper">
        <el-table v-loading="loading" :data="list" border height="100%">
          <el-table-column prop="name" label="优惠券" min-width="180" />
          <el-table-column label="类型" width="110">
            <template #default="{ row }">
              <el-tag>{{ typeLabel((row as CouponItem).type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="优惠内容" min-width="160">
            <template #default="{ row }">{{ benefitLabel(row as CouponItem) }}</template>
          </el-table-column>
          <el-table-column label="适用范围" width="110">
            <template #default="{ row }">{{ scopeLabel(row as CouponItem) }}</template>
          </el-table-column>
          <el-table-column label="发放" width="110" align="center">
            <template #default="{ row }">
              {{ row.issuedQuantity }} / {{ row.totalQuantity }}
            </template>
          </el-table-column>
          <el-table-column label="有效期" min-width="200">
            <template #default="{ row }">{{ row.validStart }} 至 {{ row.validEnd }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : row.status === 0 ? 'info' : 'warning'">
                {{ ["草稿", "启用", "停用"][row.status] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="190" fixed="right">
            <template #default="{ row }">
              <el-button
                v-hasPerm="'biz:coupon:update'"
                type="primary"
                link
                @click="openDrawer(row.id)"
              >
                编辑
              </el-button>
              <el-button
                v-hasPerm="'biz:coupon:issue'"
                type="success"
                link
                @click="openIssue(row as CouponItem)"
              >
                发放
              </el-button>
              <el-button v-hasPerm="'biz:coupon:delete'" type="danger" link @click="remove(row.id)">
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

    <el-drawer v-model="drawerVisible" :title="form.id ? '编辑优惠券' : '新增优惠券'" size="680px">
      <el-alert
        v-if="editingFrozen"
        title="已有领取记录，仅可修改名称、结束时间和状态"
        type="warning"
        show-icon
        :closable="false"
      />
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" class="coupon-form">
        <el-form-item label="优惠券名称" prop="name">
          <el-input v-model="form.name" maxlength="100" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="form.type" :disabled="editingFrozen">
            <el-radio v-for="item in couponTypes" :key="item.value" :value="item.value">
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <template v-if="form.type !== 'EXCHANGE'">
          <el-form-item label="适用范围" prop="scopeType">
            <el-radio-group v-model="form.scopeType" :disabled="editingFrozen">
              <el-radio value="ALL">全场</el-radio>
              <el-radio value="CATEGORY">指定分类</el-radio>
              <el-radio value="PRODUCT">指定商品</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="form.scopeType === 'CATEGORY'" label="选择分类" prop="scopeIds">
            <el-tree-select
              v-model="form.scopeIds"
              :data="categoryOptions"
              multiple
              check-strictly
              style="width: 100%"
              :disabled="editingFrozen"
            />
          </el-form-item>
          <el-form-item v-if="form.scopeType === 'PRODUCT'" label="选择商品" prop="scopeIds">
            <el-select
              v-model="form.scopeIds"
              multiple
              filterable
              style="width: 100%"
              :disabled="editingFrozen"
            >
              <el-option
                v-for="item in productOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="使用门槛">
            <el-input-number
              v-model="form.thresholdYuan"
              :min="0"
              :precision="2"
              :disabled="editingFrozen"
            />
            <span class="unit">元</span>
          </el-form-item>
        </template>
        <el-form-item v-if="form.type === 'FULL_REDUCTION'" label="满减金额">
          <el-input-number
            v-model="form.discountYuan"
            :min="0.01"
            :precision="2"
            :disabled="editingFrozen"
          />
          <span class="unit">元</span>
        </el-form-item>
        <template v-if="form.type === 'DISCOUNT'">
          <el-form-item label="折扣比例">
            <el-input-number
              v-model="form.discountPercent"
              :min="0.01"
              :max="99.99"
              :precision="2"
              :disabled="editingFrozen"
            />
            <span class="unit">%</span>
          </el-form-item>
          <el-form-item label="最高优惠">
            <el-input-number
              v-model="form.maxDiscountYuan"
              :min="0"
              :precision="2"
              :disabled="editingFrozen"
            />
            <span class="unit">元，0 表示不封顶</span>
          </el-form-item>
        </template>
        <el-form-item v-if="form.type === 'EXCHANGE'" label="兑换SKU" prop="exchangeSkuId">
          <el-select
            v-model="form.exchangeSkuId"
            filterable
            style="width: 100%"
            :disabled="editingFrozen"
          >
            <el-option
              v-for="item in skuOptions"
              :key="item.id"
              :label="`${item.label}（¥${formatFen(item.price)}）`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="领取时间" prop="claimRange">
          <el-date-picker
            v-model="form.claimRange"
            type="datetimerange"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
            :disabled="editingFrozen"
          />
        </el-form-item>
        <el-form-item label="有效时间" prop="validRange">
          <el-date-picker
            v-if="!editingFrozen"
            v-model="form.validRange"
            type="datetimerange"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
          />
          <div v-else class="valid-range-edit">
            <el-input :model-value="form.validRange[0]" disabled />
            <span>至</span>
            <el-date-picker
              v-model="form.validRange[1]"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ss"
              placeholder="延长结束时间"
            />
          </div>
        </el-form-item>
        <el-form-item label="发放总量">
          <el-input-number v-model="form.totalQuantity" :min="1" :disabled="editingFrozen" />
        </el-form-item>
        <el-form-item label="每人限领">
          <el-input-number v-model="form.perMemberLimit" :min="1" :disabled="editingFrozen" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="0">草稿</el-radio>
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="2">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-drawer>

    <el-dialog v-model="issueVisible" :title="`定向发放：${issueCoupon?.name || ''}`" width="560px">
      <el-select
        v-model="issueMemberIds"
        multiple
        filterable
        placeholder="选择会员"
        style="width: 100%"
      >
        <el-option
          v-for="item in memberOptions"
          :key="item.id"
          :label="`${item.nickname} ${item.mobile || ''}`"
          :value="item.id"
        />
      </el-select>
      <template #footer>
        <el-button @click="issueVisible = false">取消</el-button>
        <el-button type="primary" @click="issue">确认发放</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="recordsVisible" title="优惠券领取与使用记录" size="760px">
      <el-table v-loading="recordsLoading" :data="records" border>
        <el-table-column prop="couponName" label="优惠券" min-width="160" />
        <el-table-column label="会员" min-width="150">
          <template #default="{ row }">
            {{ row.memberNickname || row.memberId }}
            <br />
            <small>{{ row.memberMobile }}</small>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">{{ recordStatus(row.status) }}</template>
        </el-table-column>
        <el-table-column prop="orderId" label="订单ID" min-width="120" />
        <el-table-column prop="claimedAt" label="领取时间" width="180" />
        <el-table-column prop="usedAt" label="使用时间" width="180" />
      </el-table>
      <pagination
        v-if="recordsTotal > 0"
        v-model:total="recordsTotal"
        v-model:page="recordQuery.pageNum"
        v-model:limit="recordQuery.pageSize"
        @pagination="loadRecords"
      />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { Refresh } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";

import {
  CouponAPI,
  type CouponForm,
  type CouponItem,
  type CouponQuery,
  type CouponType,
  type MemberCouponRecord,
} from "@/api/marketing";
import {
  ProductAPI,
  ProductCategoryAPI,
  type CategoryNode,
  type ProductItem,
  type SkuOption,
} from "@/api/product";
import MemberAPI, { type MemberItem } from "@/api/member";
import { usePageTable } from "@/composables";

defineOptions({ name: "BizCoupon" });

const couponTypes: Array<{ value: CouponType; label: string }> = [
  { value: "FULL_REDUCTION", label: "满减券" },
  { value: "DISCOUNT", label: "折扣券" },
  { value: "EXCHANGE", label: "兑换券" },
];
const { loading, list, total, params, fetchData, handleQuery, handleResetQuery } = usePageTable<
  CouponItem,
  CouponQuery
>({
  initialParams: { pageNum: 1, pageSize: 10, keywords: "", type: undefined, status: undefined },
  request: CouponAPI.getPage,
});
const drawerVisible = ref(false);
const saving = ref(false);
const formRef = ref<FormInstance>();
const categoryOptions = ref<Array<{ value: string; label: string; children?: unknown[] }>>([]);
const productOptions = ref<ProductItem[]>([]);
const skuOptions = ref<SkuOption[]>([]);
const memberOptions = ref<MemberItem[]>([]);
const form = reactive(createForm());
const editingFrozen = computed(() => Boolean(form.id && form.issuedQuantity > 0));
const rules: FormRules = {
  name: [{ required: true, message: "请输入优惠券名称", trigger: "blur" }],
  type: [{ required: true }],
  claimRange: [{ required: true, message: "请选择领取时间" }],
  validRange: [{ required: true, message: "请选择有效时间" }],
};

function createForm() {
  return {
    id: "",
    issuedQuantity: 0,
    name: "",
    type: "FULL_REDUCTION" as CouponType,
    scopeType: "ALL" as CouponForm["scopeType"],
    scopeIds: [] as string[],
    thresholdYuan: 0,
    discountYuan: 0,
    discountPercent: 90,
    maxDiscountYuan: 0,
    exchangeSkuId: "",
    claimRange: [] as string[],
    validRange: [] as string[],
    totalQuantity: 100,
    perMemberLimit: 1,
    status: 0,
  };
}
function treeOptions(
  nodes: CategoryNode[]
): Array<{ value: string; label: string; children?: unknown[] }> {
  return nodes.map((n) => ({
    value: n.id,
    label: n.name,
    children: n.children ? treeOptions(n.children) : undefined,
  }));
}
async function loadOptions() {
  const [categories, products, skus, members] = await Promise.all([
    ProductCategoryAPI.getTree(),
    ProductAPI.getPage({ pageNum: 1, pageSize: 100 }),
    ProductAPI.getSkuOptions(),
    MemberAPI.getPage({ pageNum: 1, pageSize: 100 }),
  ]);
  categoryOptions.value = treeOptions(categories);
  productOptions.value = products.list;
  skuOptions.value = skus;
  memberOptions.value = members.list;
}
async function openDrawer(id?: string) {
  Object.assign(form, createForm());
  if (id) {
    const item = await CouponAPI.getDetail(id);
    Object.assign(form, {
      ...item,
      thresholdYuan: item.thresholdAmount / 100,
      discountYuan: item.discountAmount / 100,
      discountPercent: item.discountRate / 100,
      maxDiscountYuan: (item.maxDiscountAmount || 0) / 100,
      exchangeSkuId: item.exchangeSkuId || "",
      claimRange: [item.claimStart, item.claimEnd],
      validRange: [item.validStart, item.validEnd],
    });
  }
  drawerVisible.value = true;
}
async function save() {
  if (!(await formRef.value?.validate().catch(() => false))) return;
  if (form.type !== "EXCHANGE" && form.scopeType !== "ALL" && !form.scopeIds.length)
    return ElMessage.warning("请选择适用范围");
  if (form.type === "EXCHANGE" && !form.exchangeSkuId) return ElMessage.warning("请选择兑换SKU");
  saving.value = true;
  try {
    const data: CouponForm = {
      name: form.name.trim(),
      type: form.type,
      scopeType: form.scopeType,
      scopeIds: form.scopeIds,
      thresholdAmount: Math.round(form.thresholdYuan * 100),
      discountAmount: Math.round(form.discountYuan * 100),
      discountRate: Math.round(form.discountPercent * 100),
      maxDiscountAmount: form.maxDiscountYuan ? Math.round(form.maxDiscountYuan * 100) : null,
      exchangeSkuId: form.exchangeSkuId || null,
      claimStart: form.claimRange[0],
      claimEnd: form.claimRange[1],
      validStart: form.validRange[0],
      validEnd: form.validRange[1],
      totalQuantity: form.totalQuantity,
      perMemberLimit: form.perMemberLimit,
      status: form.status,
    };
    if (form.id) await CouponAPI.update(form.id, data);
    else await CouponAPI.create(data);
    ElMessage.success("保存成功");
    drawerVisible.value = false;
    fetchData();
  } finally {
    saving.value = false;
  }
}
async function remove(id: string) {
  await ElMessageBox.confirm("仅未发放的优惠券可以删除，确认继续？", "删除确认", {
    type: "warning",
  });
  await CouponAPI.delete(id);
  ElMessage.success("删除成功");
  fetchData();
}
const issueVisible = ref(false);
const issueCoupon = ref<CouponItem>();
const issueMemberIds = ref<string[]>([]);
function openIssue(row: CouponItem) {
  issueCoupon.value = row;
  issueMemberIds.value = [];
  issueVisible.value = true;
}
async function issue() {
  if (!issueCoupon.value || !issueMemberIds.value.length) return ElMessage.warning("请选择会员");
  const result = await CouponAPI.issue(issueCoupon.value.id, issueMemberIds.value);
  ElMessage.success(`发放完成：成功 ${result.issued} 人，跳过 ${result.skipped} 人`);
  issueVisible.value = false;
  fetchData();
}
const recordsVisible = ref(false);
const recordsLoading = ref(false);
const records = ref<MemberCouponRecord[]>([]);
const recordsTotal = ref(0);
const recordQuery = reactive({ pageNum: 1, pageSize: 10 });
async function openRecords() {
  recordsVisible.value = true;
  await loadRecords();
}
async function loadRecords() {
  recordsLoading.value = true;
  try {
    const data = await CouponAPI.getRecords(recordQuery);
    records.value = data.list;
    recordsTotal.value = data.total;
  } finally {
    recordsLoading.value = false;
  }
}
function typeLabel(type: CouponType) {
  return couponTypes.find((item) => item.value === type)?.label || type;
}
function benefitLabel(row: CouponItem) {
  if (row.type === "FULL_REDUCTION")
    return `满 ¥${formatFen(row.thresholdAmount)} 减 ¥${formatFen(row.discountAmount)}`;
  if (row.type === "DISCOUNT")
    return `${(row.discountRate / 1000).toFixed(1)} 折${row.maxDiscountAmount ? `，封顶 ¥${formatFen(row.maxDiscountAmount)}` : ""}`;
  return "兑换指定 SKU 一件";
}
function scopeLabel(row: CouponItem) {
  if (row.type === "EXCHANGE") return "指定 SKU";
  return ({ ALL: "全场", CATEGORY: "指定分类", PRODUCT: "指定商品" } as const)[row.scopeType];
}
function formatFen(value: number) {
  return (Number(value || 0) / 100).toFixed(2);
}
function recordStatus(status: number) {
  return ["未使用", "已锁定", "已使用", "已过期"][status] || status;
}
onMounted(() => {
  loadOptions();
  handleQuery();
});
</script>

<style scoped>
.coupon-form {
  margin-top: 18px;
}
.valid-range-edit {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 8px;
  align-items: center;
  width: 100%;
}
.unit,
small {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
}
</style>
