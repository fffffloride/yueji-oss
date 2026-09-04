<template>
  <div class="page-container">
    <el-card v-loading="loading" shadow="never">
      <template #header>
        <div class="cards-header">
          <span>首页卡片（{{ cards.length }}/10）</span>
          <div v-hasPerm="'biz:decoration:cards:update'">
            <el-button :disabled="!loaded || saving || cards.length >= 10" @click="addCard">
              新增卡片
            </el-button>
            <el-button type="primary" :disabled="!loaded" :loading="saving" @click="save">
              保存
            </el-button>
          </div>
        </div>
      </template>
      <el-alert
        title="首页按下方顺序展示背景图，点击后展示标题和富文本。修改后请保存。建议图片尺寸 702 × 272 像素。"
        type="info"
        :closable="false"
      />
      <el-result v-if="loadError" icon="error" title="卡片加载失败">
        <template #extra><el-button @click="load">重新加载</el-button></template>
      </el-result>
      <el-empty v-else-if="loaded && !cards.length" description="暂无卡片，首页将隐藏此区域" />
      <el-collapse v-model="activeCard" accordion class="cards-list">
        <el-collapse-item v-for="(card, index) in cards" :key="index" :name="String(index)">
          <template #title>{{ index + 1 }}. {{ card.title || "未命名卡片" }}</template>
          <template v-if="activeCard === String(index)">
            <el-form label-width="90px" :disabled="saving">
              <el-form-item label="标题" required>
                <el-input v-model="card.title" maxlength="100" show-word-limit />
              </el-form-item>
              <el-form-item label="背景图" required>
                <SingleImageUpload
                  v-model="card.imageUrl"
                  :style="{ width: '280px', height: '108px' }"
                />
              </el-form-item>
              <el-form-item label="富文本" required>
                <div class="cards-editor"><WangEditor v-model="card.content" height="320px" /></div>
              </el-form-item>
              <el-form-item v-hasPerm="'biz:decoration:cards:update'">
                <el-button :disabled="index === 0" @click="moveCard(index, -1)">上移</el-button>
                <el-button :disabled="index === cards.length - 1" @click="moveCard(index, 1)">
                  下移
                </el-button>
                <el-button type="danger" plain @click="removeCard(index)">移除卡片</el-button>
              </el-form-item>
            </el-form>
          </template>
        </el-collapse-item>
      </el-collapse>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from "element-plus";
import { HomeCardsAPI, type HomeCard } from "@/api/decoration";
import SingleImageUpload from "@/components/Upload/SingleImageUpload.vue";
import WangEditor from "@/components/WangEditor/index.vue";

defineOptions({ name: "BizDecorationCards" });
const cards = ref<HomeCard[]>([]);
const activeCard = ref("");
const loading = ref(false);
const loaded = ref(false);
const loadError = ref(false);
const saving = ref(false);

async function load() {
  loading.value = true;
  loadError.value = false;
  try {
    cards.value = (await HomeCardsAPI.get()).cards;
    loaded.value = true;
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}
function addCard() {
  if (cards.value.length >= 10) return;
  cards.value.push({ title: "", imageUrl: "", content: "" });
  activeCard.value = String(cards.value.length - 1);
}
function moveCard(index: number, offset: number) {
  const target = index + offset;
  if (target < 0 || target >= cards.value.length) return;
  const [card] = cards.value.splice(index, 1);
  cards.value.splice(target, 0, card);
  activeCard.value = String(target);
}
async function removeCard(index: number) {
  try {
    await ElMessageBox.confirm("移除该卡片？保存后首页将不再展示。", "移除卡片", {
      type: "warning",
    });
  } catch {
    return;
  }
  cards.value.splice(index, 1);
  activeCard.value = "";
}
async function save() {
  if (!loaded.value || saving.value) return;
  const invalid = cards.value.findIndex((card) => {
    const document = new DOMParser().parseFromString(card.content, "text/html");
    return (
      !card.title.trim() ||
      !card.imageUrl ||
      (!document.body.textContent?.trim() && !document.querySelector("img"))
    );
  });
  if (invalid !== -1) {
    activeCard.value = String(invalid);
    ElMessage.warning(`请完善第 ${invalid + 1} 张卡片的标题、背景图和富文本`);
    return;
  }
  saving.value = true;
  try {
    await HomeCardsAPI.save({
      cards: cards.value.map((card) => ({ ...card, title: card.title.trim() })),
    });
    ElMessage.success("保存成功，首页卡片已更新");
  } finally {
    saving.value = false;
  }
}
onMounted(load);
</script>

<style scoped>
.cards-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cards-list {
  margin-top: 20px;
}
.cards-editor {
  width: 100%;
  min-width: 0;
}
</style>
