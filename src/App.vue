<template>
  <a-layout style="min-height: 100vh; user-select: none;">
    <a-layout-sider v-model:collapsed="collapsed" collapsible :width="260" :collapsedWidth="70">
      <div class="icon-container" @click="toggleCollapsed" :class="{ collapsed: collapsed }">
        <!-- 展开时显示文字 -->
        <span v-if="!collapsed" class="title">GESeek</span>
        <img src="/收起.svg" alt="logo" class="icon -mb-1" />
      </div>
      <!-- 新增按钮 -->
      <div class="icon-container" :class="{ collapsed: collapsed }">
        <img src="/新增对话.svg" alt="add" class="icon" />
      </div>

      <a-popover trigger="click">
        <template #content>
          <div class="no-select">
            <h1 style=" font-weight: bold; margin-bottom: 15px;">模型设置</h1>
            <label>
              <a-tooltip title="数值越高，模型可输入与输出文本长度越长；数值越低，模型可输入与输出文本长度越短">
                <span style="cursor: pointer; color: #1890ff;">!</span>
              </a-tooltip>
              最大生成长度:
              <a-slider v-model:value="max_tokens" :step="1" :min="1000" :max="10000" @change="switchSettings" style="width: 250px;" />
            </label>
            <label>
              <a-tooltip title="数值越高，模型输出越随机，创造力越强；数值越低，输出越确定">
                <span style="cursor: pointer; color: #1890ff;">!</span>
              </a-tooltip>
              创造力:
              <a-slider v-model:value="temperature" :step="0.1" :min="0" :max="1" @change="switchSettings" />
            </label>
            <label>
              <a-tooltip title="数值越高，生成的文本多样性越强；数值越低，生成的文本越集中在高概率的词汇上">
                <span style="cursor: pointer; color: #1890ff;">!</span>
              </a-tooltip>
              多样性:
              <a-slider v-model:value="top_p" :step="0.1" :min="0" :max="1" @change="switchSettings" />
            </label>
            <label>
              <a-tooltip title="数值越大，模型从更多候选词中选择词汇，生成的文本可能更丰富；数值越小，模型从较少候选词中选择词汇，生成的文本可能更稳定">
                <span style="cursor: pointer; color: #1890ff;">!</span>
              </a-tooltip>
              候选词范围:
              <a-slider v-model:value="top_k" :step="1" :min="10" :max="100" @change="switchSettings" />
            </label>
          </div>
        </template>
        <div class="icon-container fixed-bottom settings" :class="{ collapsed: collapsed }">
          <img src="/设置.svg" alt="settings" class="icon" />
        </div>
      </a-popover>

      <a-popover trigger="click">
        <template #content>
          <p>Content</p>
          <p>Content</p>
        </template>
        <div class="icon-container fixed-bottom user" :class="{ collapsed: collapsed }">
          <img src="/用户.svg" alt="user" class="icon" />
        </div>
      </a-popover>

    </a-layout-sider>
    <div class="app-container">
      <ChatView />
      <!-- <HomeView /> -->
    </div>
  </a-layout>
</template>

<script>
// import HomeView from '@/views/HomeView.vue';
import ChatView from './views/ChatView.vue';
import { ref } from 'vue';
import { useModelStore } from "@/stores/modelStore";

export default {
  name: 'App',
  components: {
    // HomeView,
    ChatView,
  },

  data() {
    const modelStore = useModelStore();
    return {
      collapsed: true,
      max_tokens: modelStore.max_tokens,
      temperature: modelStore.temperature,
      top_p: modelStore.top_p,
      top_k: modelStore.top_k,
      modelStore,
    };
  },
  methods: {
    toggleCollapsed() {
      this.collapsed = !this.collapsed;
    },
    switchSettings() {
      this.modelStore.switchSettings({
        max_tokens: this.max_tokens,
        temperature: this.temperature,
        top_p: this.top_p,
        top_k: this.top_k,
      });
    },
  },
}
</script>

<style scoped>
@import url('./assets/styles/views/app.css');

.no-select {
  user-select: none;
  /* 禁止用户选择文字 */
}

/* Logo容器样式 */
.icon-container {
  display: flex;
  align-items: center;
  padding: 16px;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  /* 鼠标悬停时显示手型光标 */
}

/* 收起时的样式 */
.icon-container.collapsed {
  justify-content: center;
  /* 居中对齐 */
  padding: 8px;
  /* 缩小内边距 */
}

/* Logo样式 */
.icon {
  width: 25px;
  height: auto;
  margin-left: auto;
  transition: all 0.3s ease;
  /* 添加过渡效果 */
}

/* 收起时隐藏文字的间距 */
.icon-container.collapsed .icon {
  margin-left: 0;
}

/* 标题样式 */
.title {
  font-size: 30px;
  font-weight: bold;
  color: #777777;
}

/* 固定在底部的样式 */
.fixed-bottom {
  position: absolute;
  width: 100%;
  /* 占满宽度 */
  justify-content: center;
  /* 居中对齐 */
}

/* 设置按钮样式 */
.fixed-bottom.settings {
  bottom: 56px;
  /* 设置按钮距离底部的间距 */
}

/* 用户按钮样式 */
.fixed-bottom.user {
  bottom: 16px;
  /* 用户按钮距离底部的间距 */
}

::v-deep(.ant-layout-sider) {
  background-color: #f0f0f0 !important;
}

::v-deep(.ant-slider-handle) {
  border-color: #E8F8FF !important;
  /* 滑块的边框颜色 */
}

::v-deep(.ant-slider-handle:hover) {
  border-color: #E8F8FF !important;
  /* 滑块悬停时的边框颜色 */
}

::v-deep(.ant-slider-handle:focus) {
  border-color: #E8F8FF !important;
  /* 滑块聚焦时的边框颜色 */
}

::v-deep(.ant-slider-handle:active) {
  border-color: #E8F8FF !important;
  /* 滑块拖动时的边框颜色 */
}

::v-deep(.ant-slider-track) {
  background-color: #E8F8FF !important;
  /* 滑动条选中部分的颜色 */
}
</style>