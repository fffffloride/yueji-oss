<template>
  <div class="page-container">
    <el-card v-loading="loading" shadow="never">
      <template #header><span>品牌背书</span></template>
      <WangEditor v-model="content" height="420px" />
      <div class="actions">
        <el-button
          v-hasPerm="'biz:decoration:brand:update'"
          type="primary"
          :loading="saving"
          @click="save"
        >
          保存
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { BrandAPI } from "@/api/decoration";
import WangEditor from "@/components/WangEditor/index.vue";

defineOptions({ name: "BizDecorationBrand" });
const content = ref("");
const loading = ref(false);
const saving = ref(false);
async function load() {
  loading.value = true;
  try {
    content.value = (await BrandAPI.get()).content || "";
  } finally {
    loading.value = false;
  }
}
async function save() {
  saving.value = true;
  try {
    await BrandAPI.save(content.value);
    ElMessage.success("保存成功");
  } finally {
    saving.value = false;
  }
}
onMounted(load);
</script>

<style scoped>
.actions {
  margin-top: 20px;
  text-align: right;
}
</style>
