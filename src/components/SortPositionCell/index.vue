<template>
  <div class="sort-position-cell">
    <el-button
      class="sort-position-cell__handle"
      link
      :disabled="disabled || dragDisabled"
      :draggable="!disabled && !dragDisabled"
      :aria-label="dragDisabled ? '筛选状态不可拖拽' : `拖动第 ${position} 位`"
      @dragstart="emit('dragstart', $event)"
    >
      <el-icon><Rank /></el-icon>
    </el-button>
    <span>第 {{ position }} 位</span>
    <el-dropdown :disabled="disabled" trigger="click" @command="handleCommand">
      <el-button link aria-label="调整位置">
        <el-icon><MoreFilled /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="top" :disabled="position <= 1">置顶</el-dropdown-item>
          <el-dropdown-item command="up" :disabled="position <= 1">上移一位</el-dropdown-item>
          <el-dropdown-item command="down" :disabled="position >= total">下移一位</el-dropdown-item>
          <el-dropdown-item command="move">移至第 N 位</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { MoreFilled, Rank } from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";

const props = defineProps<{
  position: number;
  total: number;
  disabled?: boolean;
  dragDisabled?: boolean;
}>();

const emit = defineEmits<{
  move: [position: number];
  dragstart: [event: DragEvent];
}>();

async function handleCommand(command: string) {
  if (command === "top") return emit("move", 1);
  if (command === "up") return emit("move", Math.max(1, props.position - 1));
  if (command === "down") return emit("move", Math.min(props.total, props.position + 1));

  let value: string;
  try {
    ({ value } = await ElMessageBox.prompt(`请输入 1-${props.total} 之间的位置`, "移至指定位置", {
      inputValue: String(props.position),
      inputPattern: /^\d+$/,
      inputErrorMessage: "请输入有效位置",
      confirmButtonText: "移动",
      cancelButtonText: "取消",
    }));
  } catch {
    return;
  }
  const position = Number(value);
  if (position < 1 || position > props.total) {
    await ElMessageBox.alert(`位置必须在 1-${props.total} 之间`, "无法移动");
    return;
  }
  emit("move", position);
}
</script>

<style scoped>
.sort-position-cell {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  white-space: nowrap;
}

.sort-position-cell__handle {
  cursor: grab;
}

.sort-position-cell__handle:active {
  cursor: grabbing;
}
</style>
