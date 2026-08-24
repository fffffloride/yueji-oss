<template>
  <div class="page-container">
    <el-card class="page-content" shadow="never">
      <div class="page-toolbar">
        <div>
          <strong>代理团队结构</strong>
          <span class="hint">点击节点查看直属业绩</span>
        </div>
        <el-button class="page-icon-btn" @click="fetchTree">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
      <el-row :gutter="20">
        <el-col :span="16">
          <div v-loading="loading" class="tree-panel">
            <el-empty v-if="!tree.length" description="暂无团队数据" />
            <el-tree
              v-else
              :data="tree"
              node-key="id"
              default-expand-all
              :props="{ label: 'realName', children: 'children' }"
              @node-click="selectNode"
            >
              <template #default="{ data }">
                <span class="tree-node">
                  <strong>{{ data.realName }}</strong>
                  <el-tag size="small" :type="data.status === 1 ? 'success' : 'info'">
                    {{ statusLabel(data.status) }}
                  </el-tag>
                  <span>{{ data.memberNickname || "" }}</span>
                </span>
              </template>
            </el-tree>
          </div>
        </el-col>
        <el-col :span="8">
          <el-card v-if="selected" shadow="never">
            <template #header>节点详情</template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="代理商">{{ selected.realName }}</el-descriptions-item>
              <el-descriptions-item label="会员">
                {{ selected.memberNickname || "-" }}
              </el-descriptions-item>
              <el-descriptions-item label="状态">
                {{ statusLabel(selected.status) }}
              </el-descriptions-item>
              <el-descriptions-item label="直属业绩">
                ¥{{ fen(selected.directVerifiedSales) }}
              </el-descriptions-item>
              <el-descriptions-item label="直属代理">
                {{ selected.children.length }} 人
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
          <el-empty v-else description="请选择代理节点" />
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { Refresh } from "@element-plus/icons-vue";
import { DistributionAPI, type TeamNode } from "@/api/distribution";
defineOptions({ name: "BizDistributionTeam" });
const loading = ref(false),
  tree = ref<TeamNode[]>([]),
  selected = ref<TeamNode>();
async function fetchTree() {
  loading.value = true;
  try {
    const result = await DistributionAPI.getTeamTree();
    tree.value = Array.isArray(result) ? result : [result];
    if (selected.value) {
      selected.value = findNode(tree.value, selected.value.id);
    }
  } finally {
    loading.value = false;
  }
}
function findNode(rows: TeamNode[], id: string): TeamNode | undefined {
  for (const row of rows) {
    if (row.id === id) return row;
    const child = findNode(row.children, id);
    if (child) return child;
  }
}
function selectNode(data: TeamNode) {
  selected.value = data;
}
const fen = (v: number) => (v / 100).toFixed(2);
const statusLabel = (s: number) =>
  ({ 0: "待审核", 1: "已通过", 2: "已驳回", 3: "已禁用" })[s] || "未知";
onMounted(fetchTree);
</script>
<style scoped>
.tree-panel {
  min-height: 560px;
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
}
.tree-node {
  display: flex;
  gap: 10px;
  align-items: center;
}
.hint {
  margin-left: 10px;
  font-weight: normal;
  color: var(--el-text-color-secondary);
}
</style>
