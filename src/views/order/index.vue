<template>
  <div class="page-container">
    <el-card class="page-search" shadow="never">
      <el-form ref="queryFormRef" :model="params" :inline="true" label-suffix=":">
        <el-form-item label="关键字" prop="keywords">
          <el-input
            v-model="params.keywords"
            placeholder="订单号 / 手机号 / 会员昵称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="params.status" clearable placeholder="全部" style="width: 140px">
            <el-option :value="0" label="待付款" />
            <el-option :value="1" label="待核销" />
            <el-option :value="2" label="已核销" />
            <el-option :value="3" label="已完成" />
            <el-option :value="4" label="已取消" />
            <el-option :value="5" label="已退款" />
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
        <div class="page-toolbar__left">
          <el-button v-hasPerm="'biz:order:verify'" type="primary" @click="openVerifyDialog">
            核销码核销
          </el-button>
          <el-button v-hasPerm="'biz:order:export'" @click="handleExport">导出</el-button>
        </div>
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
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column label="订单号" prop="orderNo" min-width="180" />
          <el-table-column label="会员" min-width="140">
            <template #default="{ row }">
              <div>{{ row.memberNickname || "-" }}</div>
              <div class="text-gray-400">{{ row.memberMobile || row.contactMobile || "-" }}</div>
            </template>
          </el-table-column>
          <el-table-column label="实付" width="110" align="right">
            <template #default="{ row }">¥{{ formatFen(row.payAmount) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)" size="small">{{ row.statusLabel }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="下单时间" prop="createTime" width="180" />
          <el-table-column fixed="right" label="操作" width="210">
            <template #default="{ row }">
              <el-button type="primary" size="small" link @click="openDetail(row.id)">
                详情
              </el-button>
              <el-button
                v-if="row.status === 1"
                v-hasPerm="'biz:order:verify'"
                type="primary"
                size="small"
                link
                @click="handleVerify(row.id)"
              >
                核销
              </el-button>
              <el-button
                v-if="row.status === 1"
                v-hasPerm="'biz:payment:refund'"
                type="danger"
                size="small"
                link
                @click="handleRefund(row.id, row.orderNo)"
              >
                退款
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

    <el-drawer v-model="detailVisible" title="订单详情" size="520px">
      <template v-if="detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单号">{{ detail.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ detail.statusLabel }}</el-descriptions-item>
          <el-descriptions-item label="会员">
            {{ detail.memberNickname }} {{ detail.memberMobile }}
          </el-descriptions-item>
          <el-descriptions-item label="联系人">
            {{ detail.contactName || "-" }} {{ detail.contactMobile || "" }}
          </el-descriptions-item>
          <el-descriptions-item label="商品总额">
            ¥{{ formatFen(detail.totalAmount) }}
          </el-descriptions-item>
          <el-descriptions-item label="优惠">
            ¥{{ formatFen(detail.discountAmount) }}
          </el-descriptions-item>
          <el-descriptions-item label="会员折扣">
            -¥{{ formatFen(detail.pricing.memberDiscount) }}
          </el-descriptions-item>
          <el-descriptions-item label="优惠券">
            -¥{{ formatFen(detail.pricing.couponAmount) }}
          </el-descriptions-item>
          <el-descriptions-item label="积分抵扣">
            {{ detail.pricing.pointsUsed }} 积分 / -¥{{ formatFen(detail.pricing.pointsDeduct) }}
          </el-descriptions-item>
          <el-descriptions-item label="实付">
            ¥{{ formatFen(detail.payAmount) }}
          </el-descriptions-item>
          <el-descriptions-item label="核销码">{{ detail.verifyCode || "-" }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ detail.remark || "-" }}</el-descriptions-item>
        </el-descriptions>
        <el-table :data="detail.items" border class="mt-4" size="small">
          <el-table-column label="商品" prop="productName" min-width="140" />
          <el-table-column label="规格" prop="skuName" width="100" />
          <el-table-column label="单价" width="90" align="right">
            <template #default="{ row }">¥{{ formatFen(row.price) }}</template>
          </el-table-column>
          <el-table-column label="数量" prop="quantity" width="70" align="center" />
        </el-table>
      </template>
    </el-drawer>

    <el-dialog v-model="verifyVisible" title="核销码核销" width="400px">
      <el-input v-model="verifyCode" placeholder="请输入8位核销码" maxlength="32" />
      <template #footer>
        <el-button @click="verifyVisible = false">取消</el-button>
        <el-button type="primary" @click="submitVerifyCode">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox, type FormInstance } from "element-plus";
import { Refresh, FullScreen } from "@element-plus/icons-vue";

import OrderAPI from "@/api/order";
import type { OrderDetail, OrderListItem, OrderQueryParams } from "@/api/order";
import { usePageTable } from "@/composables";
import { downloadFile } from "@/utils/download";

defineOptions({
  name: "BizOrder",
  inheritAttrs: false,
});

const route = useRoute();
const tableWrapperRef = ref<HTMLElement | null>(null);
const { toggle: toggleFullscreen } = useFullscreen(tableWrapperRef);
const queryFormRef = ref<FormInstance>();

const { loading, list, total, params, fetchData, handleQuery, handleResetQuery } = usePageTable<
  OrderListItem,
  OrderQueryParams
>({
  initialParams: {
    pageNum: 1,
    pageSize: 10,
    keywords: typeof route.query.keywords === "string" ? route.query.keywords : "",
    status: undefined,
  },
  request: OrderAPI.getPage,
  onBeforeReset: () => queryFormRef.value?.resetFields(),
});

const detailVisible = ref(false);
const detail = ref<OrderDetail | null>(null);
const verifyVisible = ref(false);
const verifyCode = ref("");

function formatFen(fen: number): string {
  return (Number(fen || 0) / 100).toFixed(2);
}

function statusType(status: number) {
  if (status === 0) return "warning";
  if (status === 1) return "primary";
  if (status === 2 || status === 3) return "success";
  return "info";
}

async function openDetail(id: string) {
  detail.value = await OrderAPI.getDetail(id);
  detailVisible.value = true;
}

function openVerifyDialog() {
  verifyCode.value = "";
  verifyVisible.value = true;
}

async function submitVerifyCode() {
  if (!verifyCode.value.trim()) {
    ElMessage.warning("请输入核销码");
    return;
  }
  await OrderAPI.verifyByCode(verifyCode.value.trim());
  ElMessage.success("核销成功");
  verifyVisible.value = false;
  fetchData();
}

async function handleVerify(id: string) {
  await ElMessageBox.confirm("确认核销该订单？核销后不可撤销。", "核销确认", {
    type: "warning",
  });
  await OrderAPI.verifyById(id);
  ElMessage.success("核销成功");
  fetchData();
}

async function handleRefund(orderId: string, orderNo: string) {
  const { value: reason } = await ElMessageBox.prompt(
    `确认对订单 ${orderNo} 整单退款？退款后不可核销。`,
    "退款确认",
    {
      confirmButtonText: "确认退款",
      cancelButtonText: "取消",
      inputPlaceholder: "请输入退款原因",
      inputValidator: (value) => {
        const text = value.trim();
        if (!text) return "请输入退款原因";
        if (new Blob([text]).size > 80) return "退款原因不能超过80字节（约26个中文）";
        return true;
      },
      type: "warning",
    }
  );
  const payment = await OrderAPI.getPayment(orderId);
  const refund = await OrderAPI.refund(payment.paymentNo, reason.trim());
  showRefundResult(refund.status);
  if (detail.value?.id === orderId) {
    detail.value = await OrderAPI.getDetail(orderId);
  }
  fetchData();
}

function showRefundResult(status: number) {
  switch (status) {
    case 0:
      ElMessage.info("退款申请已提交，微信处理中，请稍后关注退款状态");
      break;
    case 1:
      ElMessage.success("退款成功");
      break;
    case 2:
      ElMessage.error("退款失败，请核实微信支付渠道状态后处理");
      break;
    case 3:
      ElMessage.warning("退款已关闭，系统将更换退款单号重试，请持续关注");
      break;
    case 4:
      ElMessage.error("退款异常，需登录微信支付商户平台人工处理");
      break;
    default:
      ElMessage.warning("退款状态未知，请刷新后核实");
  }
}

async function handleExport() {
  const response = await OrderAPI.export(params);
  downloadFile(response, "订单列表.xlsx");
}

watch(
  () => (route.name === "BizOrder" ? route.fullPath : ""),
  (path) => {
    if (!path) return;
    params.keywords = typeof route.query.keywords === "string" ? route.query.keywords : "";
    handleQuery();
    if (typeof route.query.id === "string") openDetail(route.query.id);
  },
  { immediate: true }
);
</script>
