<template>
  <div class="page-container">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <span>协议管理</span>
          <el-button :loading="loading" @click="load">刷新</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="list" border>
        <el-table-column prop="typeLabel" label="协议类型" min-width="140" />
        <el-table-column prop="draftTitle" label="草稿标题" min-width="220" />
        <el-table-column label="发布状态" width="110" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.published ? 'success' : 'info'">
              {{ scope.row.published ? "已发布" : "未发布" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="最近编辑时间" width="180" />
        <el-table-column prop="publishTime" label="最近发布时间" width="180">
          <template #default="scope">{{ scope.row.publishTime || "-" }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="scope">
            <el-button
              v-hasPerm="'content:agreement:update'"
              type="primary"
              link
              @click="openEditor(scope.row.type)"
            >
              编辑
            </el-button>
            <el-button
              v-hasPerm="'content:agreement:publish'"
              type="success"
              link
              :loading="publishing === scope.row.type"
              @click="handlePublish(scope.row)"
            >
              发布
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="`编辑${form.typeLabel}`" width="75%">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="正文" prop="content">
          <WangEditor v-model="form.content" height="420px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveDraft">保存草稿</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import AgreementAPI, { AgreementType, type AgreementItem } from "@/api/agreement";
import WangEditor from "@/components/WangEditor/index.vue";

defineOptions({ name: "AgreementManagement" });

const list = ref<AgreementItem[]>([]);
const loading = ref(false);
const saving = ref(false);
const publishing = ref<AgreementType>();
const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const form = reactive({
  type: AgreementType.USER_AGREEMENT,
  typeLabel: "用户协议",
  title: "",
  content: "",
});
const rules: FormRules = {
  title: [{ required: true, message: "请输入协议标题", trigger: "blur" }],
  content: [{ required: true, message: "请输入协议正文", trigger: "change" }],
};

async function load() {
  loading.value = true;
  try {
    list.value = await AgreementAPI.getList();
  } finally {
    loading.value = false;
  }
}

async function openEditor(type: AgreementType) {
  const data = await AgreementAPI.getForm(type);
  form.type = type;
  form.typeLabel = list.value.find((item) => item.type === type)?.typeLabel || "协议";
  form.title = data.title;
  form.content = data.content;
  dialogVisible.value = true;
}

async function saveDraft() {
  if (!(await formRef.value?.validate())) return;
  saving.value = true;
  try {
    await AgreementAPI.saveDraft(form.type, { title: form.title, content: form.content });
    ElMessage.success("草稿已保存");
    dialogVisible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function publish(item: AgreementItem) {
  await ElMessageBox.confirm(
    `确定发布“${item.draftTitle}”吗？发布后小程序立即读取新内容。`,
    "发布协议",
    { type: "warning", confirmButtonText: "发布", cancelButtonText: "取消" }
  );
  publishing.value = item.type;
  try {
    await AgreementAPI.publish(item.type);
    ElMessage.success("发布成功");
    await load();
  } finally {
    publishing.value = undefined;
  }
}

function handlePublish(item: unknown) {
  return publish(item as AgreementItem);
}

onMounted(load);
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
