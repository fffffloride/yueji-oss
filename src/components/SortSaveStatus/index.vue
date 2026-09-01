<template>
  <span v-if="status !== 'idle'" class="sort-save-status" role="status" aria-live="polite">
    <el-icon v-if="status === 'saving'" class="is-loading"><Loading /></el-icon>
    <el-icon v-else><CircleCheck /></el-icon>
    {{ status === "saving" ? "排序保存中…" : "排序已保存" }}
  </span>
</template>

<script setup lang="ts">
import { CircleCheck, Loading } from "@element-plus/icons-vue";

defineProps<{ status: "idle" | "saving" | "saved" }>();
</script>

<style scoped>
.sort-save-status {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
