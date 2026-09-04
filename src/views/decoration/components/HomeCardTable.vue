<template>
  <div class="page-container">
    <el-card class="page-content" shadow="never">
      <div class="page-toolbar">
        <el-button
          v-if="canEdit"
          type="primary"
          :disabled="!loaded || busy || cards.length >= limit"
          @click="openDrawer()"
        >
          新增卡片
        </el-button>
        <span>{{ title }}（{{ cards.length }}/{{ limit }}）</span>
        <el-button class="page-icon-btn" :disabled="busy" aria-label="刷新列表" @click="load">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
      <el-alert v-if="loadError" title="卡片加载失败，请刷新重试" type="error" :closable="false" />
      <div class="page-table-wrapper">
        <el-table
          v-loading="loading || saving"
          :data="cards"
          border
          height="100%"
          empty-text="暂无卡片，请点击新增卡片"
        >
          <el-table-column label="背景图" width="180">
            <template #default="{ row }">
              <el-image
                :src="row.imageUrl"
                fit="cover"
                :preview-src-list="[row.imageUrl]"
                preview-teleported
                style="width: 140px; height: 70px"
              />
            </template>
          </el-table-column>
          <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
          <el-table-column
            v-if="isPromo"
            prop="linkUrl"
            label="跳转地址"
            min-width="240"
            show-overflow-tooltip
          />
          <el-table-column label="位置" width="150" align="center">
            <template #default="{ $index }">
              <SortPositionCell
                v-if="canEdit"
                :position="$index + 1"
                :total="cards.length"
                :disabled="busy"
                drag-disabled
                @move="(position) => moveCard($index, position)"
              />
              <span v-else>{{ $index + 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ $index }">
              <template v-if="canEdit">
                <el-button link type="primary" :disabled="busy" @click="openDrawer($index)">
                  编辑
                </el-button>
                <el-button link type="danger" :disabled="busy" @click="removeCard($index)">
                  删除
                </el-button>
              </template>
              <span v-else>只读</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <el-drawer
      v-model="drawerVisible"
      :title="editingIndex === -1 ? `新增${title}` : `编辑${title}`"
      :size="isPromo ? '520px' : '760px'"
      destroy-on-close
      :close-on-click-modal="!saving"
      :close-on-press-escape="!saving"
      :show-close="!saving"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" :disabled="saving">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="背景图" prop="imageUrl">
          <div>
            <SingleImageUpload
              v-model="form.imageUrl"
              :style="{ width: '280px', height: isPromo ? '160px' : '108px' }"
            />
            <div class="upload-hint">
              建议尺寸 {{ isPromo ? "343 × 200" : "702 × 272" }} 像素，首页仅展示图片。
            </div>
          </div>
        </el-form-item>
        <el-form-item v-if="isPromo" label="跳转地址" prop="linkUrl">
          <el-input
            v-model="form.linkUrl"
            maxlength="500"
            placeholder="/pages/product/index 或 https://example.com"
          />
        </el-form-item>
        <el-form-item v-else label="富文本" prop="content">
          <div class="card-editor">
            <WangEditor v-if="drawerVisible" v-model="form.content" height="420px" />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="saving" @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { Refresh } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import { HomeCardsAPI, PromoCardsAPI, type HomeCard, type PromoCard } from "@/api/decoration";
import SingleImageUpload from "@/components/Upload/SingleImageUpload.vue";
import WangEditor from "@/components/WangEditor/index.vue";
import SortPositionCell from "@/components/SortPositionCell/index.vue";
import { hasPerm } from "@/utils/auth";

type CardForm = HomeCard & PromoCard;
const props = defineProps<{ kind: "content" | "promo" }>();
const isPromo = props.kind === "promo";
const title = isPromo ? "首页活动卡片" : "首页卡片";
const limit = isPromo ? 4 : 10;
const canEdit = computed(() =>
  hasPerm(`biz:decoration:${isPromo ? "promo-cards" : "cards"}:update`)
);
const cards = ref<CardForm[]>([]);
const loading = ref(false);
const loaded = ref(false);
const loadError = ref(false);
const saving = ref(false);
const drawerVisible = ref(false);
const editingIndex = ref(-1);
const busy = computed(() => loading.value || saving.value || drawerVisible.value);
const formRef = ref<FormInstance>();
const form = reactive<CardForm>({ title: "", imageUrl: "", content: "", linkUrl: "" });
const rules: FormRules = {
  title: [{ required: true, whitespace: true, message: "请输入标题" }],
  imageUrl: [{ required: true, message: "请上传背景图" }],
  linkUrl: [{ required: true, whitespace: true, message: "请输入跳转地址" }],
  content: [
    {
      validator: (_rule, value, callback) => {
        const doc = new DOMParser().parseFromString(value || "", "text/html");
        callback(
          doc.body.textContent?.trim() || doc.querySelector("img")
            ? undefined
            : new Error("请输入富文本内容")
        );
      },
    },
  ],
};

async function load() {
  if (busy.value) return;
  loading.value = true;
  loaded.value = false;
  loadError.value = false;
  try {
    const result = await (isPromo ? PromoCardsAPI.get() : HomeCardsAPI.get());
    cards.value = result.cards.map((card) => ({ content: "", linkUrl: "", ...card }));
    loaded.value = true;
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}
function openDrawer(index = -1) {
  if (
    !canEdit.value ||
    !loaded.value ||
    busy.value ||
    (index === -1 && cards.value.length >= limit)
  )
    return;
  editingIndex.value = index;
  Object.assign(
    form,
    index === -1 ? { title: "", imageUrl: "", content: "", linkUrl: "" } : cards.value[index]
  );
  drawerVisible.value = true;
  nextTick(() => formRef.value?.clearValidate());
}
async function persist(next: CardForm[]) {
  if (saving.value || !canEdit.value) return false;
  saving.value = true;
  try {
    if (isPromo) {
      await PromoCardsAPI.save({
        cards: next.map(({ title, imageUrl, linkUrl }) => ({ title, imageUrl, linkUrl })),
      });
    } else {
      await HomeCardsAPI.save({
        cards: next.map(({ title, imageUrl, content }) => ({ title, imageUrl, content })),
      });
    }
    cards.value = next;
    ElMessage.success("保存成功");
    return true;
  } catch {
    return false;
  } finally {
    saving.value = false;
  }
}
async function save() {
  if (saving.value || !(await formRef.value?.validate().catch(() => false))) return;
  const next = [...cards.value];
  const card = { ...form, title: form.title.trim(), linkUrl: form.linkUrl.trim() };
  if (editingIndex.value === -1) next.push(card);
  else next[editingIndex.value] = card;
  if (await persist(next)) drawerVisible.value = false;
}
async function removeCard(index: number) {
  if (busy.value) return;
  try {
    await ElMessageBox.confirm(`确认删除「${cards.value[index].title}」？`, "删除确认", {
      type: "warning",
    });
  } catch {
    return;
  }
  await persist(cards.value.filter((_card, i) => i !== index));
}
async function moveCard(index: number, position: number) {
  if (busy.value || position < 1 || position > cards.value.length || position === index + 1) return;
  const next = [...cards.value];
  const [card] = next.splice(index, 1);
  next.splice(position - 1, 0, card);
  await persist(next);
}
onMounted(load);
</script>

<style scoped>
.card-editor {
  width: 100%;
  min-width: 0;
}
.upload-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
