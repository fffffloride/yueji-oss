<template>
  <div class="page-container">
    <el-card class="page-search" shadow="never">
      <el-form :model="params" inline>
        <el-form-item label="关键字">
          <el-input v-model="params.keywords" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="params.typeId" clearable style="width: 140px">
            <el-option v-for="item in types" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="等级">
          <el-select v-model="params.levelId" clearable style="width: 140px">
            <el-option v-for="item in levels" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="params.status" clearable style="width: 120px">
            <el-option
              v-for="(label, value) in statusLabels"
              :key="value"
              :label="label"
              :value="Number(value)"
            />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="handleResetQuery">重置</el-button>
      </el-form>
    </el-card>
    <el-card class="page-content" shadow="never">
      <div class="page-toolbar">
        <el-button v-hasPerm="'biz:distribution:agent:create'" type="primary" @click="openForm()">
          新增代理商
        </el-button>
        <el-button class="page-icon-btn" @click="fetchData">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
      <div class="page-table-wrapper">
        <el-table v-loading="loading" :data="list" border height="100%">
          <el-table-column label="代理商" min-width="160">
            <template #default="{ row }">
              <strong>{{ row.realName }}</strong>
              <br />
              <small>{{ row.memberNickname || row.memberId }}</small>
            </template>
          </el-table-column>
          <el-table-column prop="mobile" label="手机号" width="130" />
          <el-table-column prop="typeName" label="代理类型" width="120" />
          <el-table-column prop="levelName" label="分销等级" width="120" />
          <el-table-column prop="inviteCode" label="邀请码" width="130" />
          <el-table-column label="直属业绩" width="130">
            <template #default="{ row }">¥{{ fen(row.directVerifiedSales) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="statusTag(row.status)">{{ statusLabels[row.status] }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="390" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetail(row.id)">详情</el-button>
              <el-button
                v-hasPerm="'biz:distribution:agent:update'"
                link
                type="primary"
                @click="openForm(row.id)"
              >
                编辑
              </el-button>
              <template v-if="row.status === 0 || row.status === 2">
                <el-button
                  v-hasPerm="'biz:distribution:agent:audit'"
                  link
                  type="success"
                  @click="openAudit(row as AgentItem, 1)"
                >
                  通过
                </el-button>
                <el-button
                  v-hasPerm="'biz:distribution:agent:audit'"
                  link
                  type="danger"
                  @click="openAudit(row as AgentItem, 2)"
                >
                  驳回
                </el-button>
              </template>
              <template v-else>
                <el-button
                  v-hasPerm="'biz:distribution:agent:update'"
                  link
                  type="warning"
                  @click="changeAccountStatus(row as AgentItem)"
                >
                  {{ row.status === 1 ? "禁用" : "启用" }}
                </el-button>
                <el-button
                  v-hasPerm="'biz:distribution:agent:update'"
                  link
                  @click="openLevel(row as AgentItem)"
                >
                  调级
                </el-button>
                <el-button
                  v-hasPerm="'biz:distribution:agent:update'"
                  link
                  @click="openRates(row as AgentItem)"
                >
                  比例
                </el-button>
              </template>
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

    <el-drawer v-model="formVisible" :title="editingId ? '编辑代理商' : '新增代理商'" size="580px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="关联会员" prop="memberId">
          <el-select v-model="form.memberId" filterable :disabled="!!editingId" style="width: 100%">
            <el-option
              v-for="item in members"
              :key="item.id"
              :label="`${item.nickname}（${item.mobile || item.id}）`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="form.realName" />
        </el-form-item>
        <el-form-item label="手机号"><el-input v-model="form.mobile" /></el-form-item>
        <el-form-item label="微信号"><el-input v-model="form.wechat" /></el-form-item>
        <el-form-item label="代理类型" prop="typeId">
          <el-select v-model="form.typeId" style="width: 100%">
            <el-option
              v-for="item in activeTypes"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="分销等级" prop="levelId">
          <el-select v-model="form.levelId" style="width: 100%">
            <el-option
              v-for="item in activeLevels"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="上级代理">
          <el-select v-model="form.parentAgentId" clearable filterable style="width: 100%">
            <el-option
              v-for="item in approvedAgents"
              :key="item.id"
              :label="item.realName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="联系备注">
          <el-input v-model="form.contactRemark" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveAgent">保存</el-button>
      </template>
    </el-drawer>

    <el-dialog
      v-model="auditVisible"
      :title="audit.status === 1 ? '审核通过' : '审核驳回'"
      width="520px"
    >
      <el-form :model="audit" label-width="100px">
        <template v-if="audit.status === 1">
          <el-form-item label="代理类型">
            <el-select v-model="audit.typeId" style="width: 100%">
              <el-option
                v-for="item in activeTypes"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="分销等级">
            <el-select v-model="audit.levelId" style="width: 100%">
              <el-option
                v-for="item in activeLevels"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="上级代理">
            <el-select v-model="audit.parentAgentId" clearable style="width: 100%">
              <el-option
                v-for="item in approvedAgents"
                :key="item.id"
                :label="item.realName"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </template>
        <el-form-item label="原因">
          <el-input v-model="audit.reason" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAudit">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="levelVisible" title="手动调整等级" width="460px">
      <el-form label-width="90px">
        <el-form-item label="新等级">
          <el-select v-model="levelForm.levelId" style="width: 100%">
            <el-option
              v-for="item in activeLevels"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="levelForm.reason" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="levelVisible = false">取消</el-button>
        <el-button type="primary" @click="submitLevel">确认</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="rateVisible" title="设置专属佣金比例" width="500px">
      <el-alert title="留空表示跟随当前等级比例；只影响新支付订单" type="info" :closable="false" />
      <el-form label-width="110px" style="margin-top: 16px">
        <el-form-item label="一级比例">
          <el-input-number v-model="rateForm.level1" :min="0" :max="100" :precision="2" />
          <span class="unit">%</span>
        </el-form-item>
        <el-form-item label="二级比例">
          <el-input-number v-model="rateForm.level2" :min="0" :max="100" :precision="2" />
          <span class="unit">%</span>
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="rateForm.reason" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rateVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRates">确认</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" title="代理详情与操作日志" size="760px">
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="姓名">{{ detail.realName }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusLabels[detail.status] }}</el-descriptions-item>
        <el-descriptions-item label="类型 / 等级">
          {{ detail.typeName || "-" }} / {{ detail.levelName || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="上级">{{ detail.parentName || "-" }}</el-descriptions-item>
        <el-descriptions-item label="直属业绩">
          ¥{{ fen(detail.directVerifiedSales) }}
        </el-descriptions-item>
        <el-descriptions-item label="邀请码">{{ detail.inviteCode }}</el-descriptions-item>
        <el-descriptions-item label="待结算">
          ¥{{ fen(detail.commissionSummary?.pending || 0) }}
        </el-descriptions-item>
        <el-descriptions-item label="可提现">
          ¥{{ fen(detail.commissionSummary?.available || 0) }}
        </el-descriptions-item>
      </el-descriptions>
      <h3>操作日志</h3>
      <el-table :data="logs" border>
        <el-table-column prop="action" label="操作" width="120" />
        <el-table-column prop="reason" label="原因" min-width="200" />
        <el-table-column prop="operatorId" label="操作人" width="100" />
        <el-table-column prop="createTime" label="时间" width="180" />
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
  DistributionAPI,
  type AgentForm,
  type AgentItem,
  type AgentLogItem,
  type AgentQuery,
  type AgentTypeItem,
  type DistributionLevelItem,
} from "@/api/distribution";
import MemberAPI, { type MemberItem } from "@/api/member";
import { usePageTable } from "@/composables";

defineOptions({ name: "BizDistributionAgent" });
const statusLabels: Record<number, string> = { 0: "待审核", 1: "已通过", 2: "已驳回", 3: "已禁用" };
const statusTag = (status: number): TagProps["type"] =>
  status === 1 ? "success" : status === 2 ? "danger" : status === 3 ? "info" : "warning";
const fen = (v: number) => (v / 100).toFixed(2);
const { loading, list, total, params, fetchData, handleQuery, handleResetQuery } = usePageTable<
  AgentItem,
  AgentQuery
>({
  initialParams: {
    pageNum: 1,
    pageSize: 10,
    keywords: "",
    status: undefined,
    typeId: undefined,
    levelId: undefined,
  },
  request: DistributionAPI.getAgentPage,
});
const types = ref<AgentTypeItem[]>([]),
  levels = ref<DistributionLevelItem[]>([]),
  members = ref<MemberItem[]>([]),
  agentOptions = ref<AgentItem[]>([]);
const activeTypes = computed(() => types.value.filter((x) => x.status === 1));
const activeLevels = computed(() => levels.value.filter((x) => x.status === 1));
const approvedAgents = computed(() => agentOptions.value.filter((x) => x.status === 1));
async function loadOptions() {
  const [t, l, m, a] = await Promise.all([
    DistributionAPI.getTypePage({ pageNum: 1, pageSize: 100 }),
    DistributionAPI.getLevelPage({ pageNum: 1, pageSize: 100 }),
    MemberAPI.getPage({ pageNum: 1, pageSize: 100 }),
    DistributionAPI.getAgentPage({ pageNum: 1, pageSize: 100, status: 1 }),
  ]);
  types.value = t.list;
  levels.value = l.list;
  members.value = m.list;
  agentOptions.value = a.list;
}
const formVisible = ref(false),
  saving = ref(false),
  editingId = ref("");
const formRef = ref<FormInstance>();
const emptyForm = (): AgentForm => ({
  memberId: "",
  realName: "",
  mobile: "",
  wechat: "",
  contactRemark: "",
  typeId: "",
  levelId: "",
  parentAgentId: undefined,
});
const form = reactive<AgentForm>(emptyForm());
const formRules: FormRules = {
  memberId: [{ required: true, message: "请选择会员" }],
  realName: [{ required: true, message: "请输入姓名" }],
  typeId: [{ required: true, message: "请选择类型" }],
  levelId: [{ required: true, message: "请选择等级" }],
};
async function openForm(id?: string) {
  Object.assign(form, emptyForm());
  editingId.value = id || "";
  if (id) {
    const row = await DistributionAPI.getAgentDetail(id);
    Object.assign(form, row, {
      mobile: row.mobile || "",
      wechat: row.wechat || "",
      contactRemark: row.contactRemark || "",
      typeId: row.typeId || "",
      levelId: row.levelId || "",
      parentAgentId: row.parentAgentId || undefined,
    });
  }
  formVisible.value = true;
}
async function saveAgent() {
  if (!(await formRef.value?.validate().catch(() => false))) return;
  saving.value = true;
  try {
    if (editingId.value) await DistributionAPI.updateAgent(editingId.value, form);
    else await DistributionAPI.createAgent(form);
    ElMessage.success("保存成功");
    formVisible.value = false;
    await Promise.all([fetchData(), loadOptions()]);
  } finally {
    saving.value = false;
  }
}
const auditVisible = ref(false);
const audit = reactive({
  id: "",
  status: 1,
  typeId: "",
  levelId: "",
  parentAgentId: undefined as string | undefined,
  reason: "",
});
function openAudit(row: AgentItem, status: number) {
  Object.assign(audit, {
    id: row.id,
    status,
    typeId: row.typeId || activeTypes.value[0]?.id || "",
    levelId: row.levelId || activeLevels.value[0]?.id || "",
    parentAgentId: row.parentAgentId || undefined,
    reason: "",
  });
  auditVisible.value = true;
}
async function submitAudit() {
  if (!audit.reason.trim() || (audit.status === 1 && (!audit.typeId || !audit.levelId))) {
    ElMessage.warning("请完整填写审核信息");
    return;
  }
  await DistributionAPI.auditAgent(audit.id, {
    status: audit.status,
    typeId: audit.typeId,
    levelId: audit.levelId,
    parentAgentId: audit.parentAgentId,
    reason: audit.reason.trim(),
  });
  ElMessage.success("审核完成");
  auditVisible.value = false;
  await Promise.all([fetchData(), loadOptions()]);
}
async function changeAccountStatus(row: AgentItem) {
  const target = row.status === 1 ? 3 : 1;
  const { value } = await ElMessageBox.prompt(
    `请输入${target === 3 ? "禁用" : "启用"}原因`,
    "账号状态",
    { inputValidator: (v) => !!v.trim() || "请输入原因" }
  );
  await DistributionAPI.updateAgentStatus(row.id, target, value);
  ElMessage.success("状态已更新");
  await Promise.all([fetchData(), loadOptions()]);
}
const levelVisible = ref(false),
  levelForm = reactive({ id: "", levelId: "", reason: "" });
function openLevel(row: AgentItem) {
  Object.assign(levelForm, { id: row.id, levelId: row.levelId || "", reason: "" });
  levelVisible.value = true;
}
async function submitLevel() {
  if (!levelForm.levelId || !levelForm.reason.trim()) {
    ElMessage.warning("请选择等级并填写原因");
    return;
  }
  await DistributionAPI.adjustAgentLevel(levelForm.id, levelForm.levelId, levelForm.reason.trim());
  ElMessage.success("等级已调整");
  levelVisible.value = false;
  fetchData();
}
const rateVisible = ref(false),
  rateForm = reactive<{ id: string; level1: number | null; level2: number | null; reason: string }>(
    { id: "", level1: null, level2: null, reason: "" }
  );
async function openRates(row: AgentItem) {
  const detail = await DistributionAPI.getAgentDetail(row.id);
  Object.assign(rateForm, {
    id: row.id,
    level1: detail.customLevel1RateBps == null ? null : detail.customLevel1RateBps / 100,
    level2: detail.customLevel2RateBps == null ? null : detail.customLevel2RateBps / 100,
    reason: "",
  });
  rateVisible.value = true;
}
async function submitRates() {
  if (!rateForm.reason.trim()) {
    ElMessage.warning("请填写调整原因");
    return;
  }
  await DistributionAPI.adjustAgentRates(
    rateForm.id,
    rateForm.level1 == null ? null : Math.round(rateForm.level1 * 100),
    rateForm.level2 == null ? null : Math.round(rateForm.level2 * 100),
    rateForm.reason.trim()
  );
  ElMessage.success("专属比例已更新");
  rateVisible.value = false;
}
const detailVisible = ref(false),
  detail = ref<AgentItem>(),
  logs = ref<AgentLogItem[]>([]);
async function openDetail(id: string) {
  const [d, l] = await Promise.all([
    DistributionAPI.getAgentDetail(id),
    DistributionAPI.getAgentLogs(id, { pageNum: 1, pageSize: 100 }),
  ]);
  detail.value = d;
  logs.value = l.list;
  detailVisible.value = true;
}
onMounted(() => {
  handleQuery();
  loadOptions();
});
</script>
<style scoped>
.unit {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
}
small {
  color: var(--el-text-color-secondary);
}
</style>
