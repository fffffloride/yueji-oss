<!-- 单图上传组件 -->
<template>
  <el-upload
    class="single-upload"
    list-type="picture-card"
    :show-file-list="false"
    :accept="props.accept"
    :before-upload="handleBeforeUpload"
    :http-request="handleUpload"
    :on-success="onSuccess"
    :on-error="onError"
  >
    <template #default>
      <template v-if="modelValue">
        <img class="single-upload__image" :src="modelValue" />
        <span class="single-upload__actions" @click.stop>
          <span @click="openPreview">
            <el-icon><ZoomIn /></el-icon>
          </span>
          <span @click="handleDelete">
            <el-icon><Delete /></el-icon>
          </span>
        </span>
      </template>
      <el-icon v-else>
        <Plus />
      </el-icon>
    </template>
  </el-upload>
  <el-image-viewer
    v-if="previewVisible"
    :url-list="[modelValue]"
    teleported
    @close="previewVisible = false"
  />
</template>

<script setup lang="ts">
import { UploadRawFile, UploadRequestOptions } from "element-plus";
import FileAPI from "@/api/file";
import type { FileInfo } from "@/api/file";

const props = defineProps({
  /**
   * 请求携带的额外参数
   */
  data: {
    type: Object,
    default: () => {
      return {};
    },
  },
  /**
   * 上传文件的参数名
   */
  name: {
    type: String,
    default: "file",
  },
  /**
   * 最大文件大小（单位：MB）
   */
  maxFileSize: {
    type: Number,
    default: 10,
  },

  /**
   * 上传图片格式，默认支持所有图片 (image/*)，指定格式示例：'.png,.jpg,.jpeg,.gif,.bmp'
   */
  accept: {
    type: String,
    default: "image/*",
  },

  /**
   * 自定义样式，用于设置组件的宽度和高度等其他样式
   */
  style: {
    type: Object,
    default: () => {
      return {
        width: "150px",
        height: "150px",
      };
    },
  },
});

const modelValue = defineModel<string>({ default: "" });
const previewVisible = ref(false);

/**
 * 限制用户上传文件的格式和大小
 */
function handleBeforeUpload(file: UploadRawFile) {
  // 校验文件类型：虽然 accept 属性限制了用户在文件选择器中可选的文件类型，但仍需在上传时再次校验文件实际类型，确保符合 accept 的规则
  const acceptTypes = props.accept.split(",").map((type) => type.trim());

  // 检查文件格式是否符合 accept
  const isValidType = acceptTypes.some((type) => {
    if (type === "image/*") {
      // 如果是 image/*，检查 MIME 类型是否以 "image/" 开头
      return file.type.startsWith("image/");
    } else if (type.startsWith(".")) {
      // 如果是扩展名 (.png, .jpg)，检查文件名是否以指定扩展名结尾
      return file.name.toLowerCase().endsWith(type);
    } else {
      // 如果是具体的 MIME 类型 (image/png, image/jpeg)，检查是否完全匹配
      return file.type === type;
    }
  });

  if (!isValidType) {
    ElMessage.warning("上传文件的格式不正确，仅支持 " + props.accept);
    return false;
  }

  // 限制文件大小
  if (file.size > props.maxFileSize * 1024 * 1024) {
    ElMessage.warning("上传图片不能大于" + props.maxFileSize + "M");
    return false;
  }
  return true;
}

/*
 * 上传图片
 */
function handleUpload(options: UploadRequestOptions) {
  return new Promise((resolve, reject) => {
    const file = options.file;

    const formData = new FormData();
    formData.append(props.name, file);

    // 处理附加参数
    Object.keys(props.data).forEach((key) => {
      formData.append(key, props.data[key]);
    });

    FileAPI.upload(formData).then(
      (data) => {
        resolve(data);
      },
      (error) => {
        reject(error);
      }
    );
  });
}

/**
 * 删除图片
 */
function handleDelete() {
  modelValue.value = "";
}

function openPreview() {
  previewVisible.value = true;
}

/**
 * 上传成功回调
 *
 * @param fileInfo 上传成功后的文件信息
 */
const onSuccess = (fileInfo: FileInfo) => {
  ElMessage.success("上传成功");
  modelValue.value = fileInfo.url;
};

/**
 * 上传失败回调
 */
const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const onError = (error: unknown) => {
  ElMessage.error("上传失败: " + getErrorMessage(error));
};
</script>

<style scoped lang="scss">
:deep(.el-upload--picture-card) {
  position: relative;
  width: v-bind("props.style.width ?? '150px'");
  height: v-bind("props.style.height ?? '150px'");
  overflow: hidden;
}

.single-upload {
  &__image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__actions {
    position: absolute;
    inset: 0;
    display: flex;
    gap: 15px;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: var(--el-color-white);
    cursor: default;
    background: var(--el-overlay-color-lighter);
    opacity: 0;
    transition: opacity var(--el-transition-duration);

    span {
      cursor: pointer;
    }
  }
}

:deep(.el-upload--picture-card:hover) .single-upload__actions {
  opacity: 1;
}
</style>
