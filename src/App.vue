<template>
  <a-layout style="min-height: 100vh;">
    <a-layout-sider v-model:collapsed="collapsed" collapsible :width="260" :collapsedWidth="70"
      style=" padding: 0; user-select: none;">

      <div class="close-container" style="height: 10%;">
        <div class="icon-container" @click="toggleCollapsed" :class="{ collapsed: collapsed }">
          <!-- 展开时显示文字 -->
          <span v-if="!collapsed" class="title">GESeek</span>
          <img src="/收起.svg" alt="close" class="icon" />
        </div>
      </div>

      <div class="add-container" style="height:7%;">
        <!-- 新增对话按钮 -->
        <div v-if="!collapsed">
          <div class="bubble icon-container" :class="{ collapsed: collapsed }">
            开启新的对话
            <img src="/新增对话.svg" alt="add" class="icon" />
          </div>
        </div>
        <div v-else>
          <div class="icon-container" :class="{ collapsed: collapsed }">
            <img src="/新增对话.svg" alt="add" class="icon" />
          </div>
        </div>
      </div>

      <div class="history-container" style="height:68%;">

      </div>

      <div class="setting-container" style="height: 7%;">
        <a-popover trigger="click">
          <template #content>
            <div class="no-select">
              <h1 style=" font-weight: bold; margin-bottom: 15px;">模型设置</h1>
              <div v-for="model in modelStore.models" :key="model.value">
                <div v-if="modelStore.currentModel === model.value">
                  <label>
                    <a-tooltip title="数值越高，模型可输入与输出文本长度越长；数值越低，模型可输入与输出文本长度越短（该值过低与生成文本不匹配时会导致生成终止）">
                      <span style="cursor: pointer; color: #1890ff;">!</span>
                    </a-tooltip>
                    最大生成长度:
                    <a-slider v-model:value="max_tokens" :step="1" :min="1024" :max="model.maxTokens"
                      @change="switchSettings" style="width: 250px;" />
                  </label>
                </div>
              </div>
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
          <div v-if="!collapsed">
            <div class="bubble icon-container" :class="{ collapsed: collapsed }">
              模型设置
              <img src="/设置.svg" alt="user" class="icon" />
            </div>
          </div>
          <div v-else>
            <div class="icon-container" :class="{ collapsed: collapsed }">
              <img src="/设置.svg" alt="user" class="icon" />
            </div>
          </div>
        </a-popover>
      </div>

      <div class="user-container" style="height: 8%; align-items: center;">
        <a-popover trigger="click">
          <template #content>
            <div class="no-select">
              <h1 style=" font-weight: bold; margin-bottom: 15px;">修改信息</h1>
              <h1 style=" font-weight: bold; margin-bottom: 15px;">退出登录</h1>
            </div>
          </template>
          <div v-if="!collapsed">
            <div class="bubble icon-container" :class="{ collapsed: collapsed }">
              <a-avatar :size="40" src=""></a-avatar>
              <img src="/用户.svg" alt="user" class="icon" />
            </div>
          </div>
          <div v-else>
            <div class="icon-container" :class="{ collapsed: collapsed }">
              <img src="/用户.svg" alt="user" class="icon" />
            </div>
          </div>
        </a-popover>
      </div>

    </a-layout-sider>
    <div class="app-container">
      <ChatView />
      <!-- <HomeView /> -->
    </div>
  </a-layout>
</template>

<script>
import HomeView from '@/views/HomeView.vue';
import ChatView from './views/ChatView.vue';
import { useModelStore } from "@/stores/modelStore";

export default {
  name: 'App',
  components: {
    HomeView,
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
      currentModel: modelStore.currentModel,
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
</style>