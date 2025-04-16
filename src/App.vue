<template>
  <a-layout style="min-height: 100vh;">
    <a-layout-sider v-model:collapsed="collapsed" collapsible :width="260" :collapsedWidth="70"
      style=" padding: 0; user-select: none;">

      <div class="close-container" style="height: 10%;">
        <div class="icon-container" @click="toggleCollapsed" :class="{ collapsed: collapsed }">
          <span v-if="!collapsed" class="title">GESeek</span>
          <img src="/收起.svg" alt="close" class="icon" />
        </div>
      </div>

      <div class="add-container" style="height:7%;">
        <!-- 新增对话按钮 -->
        <div v-if="!collapsed">
          <div class="bubble icon-container whitespace-nowrap" :class="{ collapsed: collapsed }" @click="goToHome">
            开启新的对话
            <img src="/新增对话.svg" alt="add" class="icon" />
          </div>
        </div>
        <div v-else>
          <div class="icon-container" :class="{ collapsed: collapsed }" @click="goToHome">
            <img src="/新增对话.svg" alt="add" class="icon" />
          </div>
        </div>
      </div>

      <div class="history-container" style="height:68%; overflow-y: auto;">
        <div class="flex justify-between items-center px-2 py-1">
          <span v-if="!collapsed" class="text-sm font-medium">对话历史</span>
          <a-button type="link" size="small" @click="fetchConversationList">
            1
          </a-button>
        </div>
        <!-- 加载状态 -->
        <div v-if="loadingConversations" class="flex justify-center items-center h-full">
          <a-spin />
        </div>

        <!-- 无数据状态 -->
        <div v-else-if="conversations.length === 0" class="flex justify-center items-center h-full text-gray-400">
          <span v-if="!collapsed">暂无对话历史</span>
          <span v-else>无</span>
        </div>

        <!-- 对话历史列表 -->
        <div v-else>
          <div v-for="conversation in conversations" :key="conversation.id" @click="goToConversation(conversation.id)"
            class="conversation-item" :class="{ 'active': $route.params.id == conversation.id }">
            <div v-if="!collapsed" class="flex flex-col p-2">
              <div class="truncate font-medium">{{ conversation.title }}</div>
              <div class="text-xs text-gray-500 truncate">
                {{ new Date(conversation.createdAt).toLocaleString() }}
              </div>
            </div>
            <div v-else class="flex justify-center p-2">
              <a-tooltip :title="conversation.title">
                <a-avatar size="small">{{ conversation.title.charAt(0) }}</a-avatar>
              </a-tooltip>
            </div>
          </div>
        </div>
      </div>

      <div class="setting-container" style="height: 7%;">
        <a-popover trigger="click">
          <template #content>
            <div class="no-select">
              <div style="display: flex;">
                <h1 style=" font-weight: bold; margin-bottom: 15px;">模型设置</h1>
                <a-popover trigger="click" v-model:open="PopoverVisible">
                  <template #content>
                    <p class="ml-1.5" style="font-weight: bold; margin-bottom: 10px;user-select: none;">场景预设</p>
                    <div v-for="(preset, name) in presets" :key="name" class="preset-option" @click="applyPreset(name)"
                      style="padding: 10px; cursor: pointer; margin-bottom: 5px; border-radius: 20px; transition: all 0.3s;">
                      {{ name }}
                      <div style="font-size: 12px; color: #999; margin-top: 2px;">{{ preset.description }}</div>
                    </div>
                  </template>
                  <div class="size-5 ml-46" style="cursor: pointer; display: flex; "><img src="/预设.svg"></div>
                </a-popover>
              </div>
              <div v-for="model in modelStore.models" :key="model.value">
                <div v-if="modelStore.currentModel === model.value">
                  <label>
                    <a-tooltip title="数值越高，模型可输入与输出文本长度越长；数值越低，模型可输入与输出文本长度越短（该值过低与文本长度不匹配时会导致生成中止）">
                      <span style="cursor: pointer; color: #1890ff;">!</span>
                    </a-tooltip>
                    max_tokens:
                    <a-slider v-model:value="max_tokens" :step="1" :min="0" :max="model.maxTokens"
                      @change="switchSettings" style="width: 250px;" />
                  </label>
                </div>
              </div>
              <label>
                <a-tooltip title="数值越高，模型输出越随机，创造力越强；数值越低，输出越确定">
                  <span style="cursor: pointer; color: #1890ff;">!</span>
                </a-tooltip>
                temperature:
                <a-slider v-model:value="temperature" :step="0.1" :min="0" :max="2" @change="switchSettings" />
              </label>
              <label>
                <a-tooltip title="数值越高，生成的文本多样性越强；数值越低，生成的文本越集中在高概率的词汇上">
                  <span style="cursor: pointer; color: #1890ff;">!</span>
                </a-tooltip>
                top_p:
                <a-slider v-model:value="top_p" :step="0.1" :min="0.1" :max="1" @change="switchSettings" />
              </label>
              <label>
                <a-tooltip title="数值越高，模型从更多候选词中选择词汇，生成的文本可能更丰富；数值越低，模型从较少候选词中选择词汇，生成的文本可能更稳定">
                  <span style="cursor: pointer; color: #1890ff;">!</span>
                </a-tooltip>
                top_k:
                <a-slider v-model:value="top_k" :step="1" :min="0" :max="100" @change="switchSettings" />
              </label>
              <label>
                <a-tooltip title="数值越高，模型越倾向于使用新词而不是重复已用词；数值越低，模型越倾向于重复已用词">
                  <span style="cursor: pointer; color: #1890ff;">!</span>
                </a-tooltip>
                frequency_penalty:
                <a-slider v-model:value="frequency_penalty" :step="0.1" :min="-2" :max="2" @change="switchSettings" />
              </label>
            </div>
          </template>
          <div v-if="!collapsed">
            <div class="bubble icon-container" :class="{ collapsed: collapsed }">
              模型设置
              <img src="/shezhi.svg" alt="user" class="icon" />
            </div>
          </div>
          <div v-else>
            <div class="icon-container" :class="{ collapsed: collapsed }">
              <img src="/shezhi.svg" alt="user" class="icon" />
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
              <img src="/user.svg" alt="user" class="icon" />
            </div>
          </div>
          <div v-else>
            <div class="icon-container" :class="{ collapsed: collapsed }">
              <img src="/user.svg" alt="user" class="icon" />
            </div>
          </div>
        </a-popover>
      </div>

    </a-layout-sider>
    <div class="app-container">
      <router-view />
      <!-- <ChatView/> -->
      <!-- <HomeView /> -->
    </div>
  </a-layout>
</template>

<script>
import HomeView from '@/views/HomeView.vue';
import ChatView from './views/ChatView.vue';
import { useModelStore } from "@/stores/modelStore";
import { message } from 'ant-design-vue';
import * as userService from '@/services/userService';
import { useUserStore } from './stores/userStore';
import { getConversationList } from '@/services/conversationService';

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
      frequency_penalty: modelStore.frequency_penalty,
      modelStore,
      currentModel: modelStore.currentModel,
      PopoverVisible: false,
      conversations: [],
      loadingConversations: false,
      // 添加预设场景配置
      presets: {
        "创意文本": {
          temperature: 0.9,
          top_p: 0.9,
          top_k: 50,
          frequency_penalty: 0.6,
          description: "创造性和多样性高，适合文学创作、故事生成"
        },
        "问答系统": {
          temperature: 0.4,
          top_p: 0.7,
          top_k: 40,
          frequency_penalty: 0.5,
          description: "平衡创造性和准确性，适合回答问题"
        },
        "代码生成": {
          temperature: 0.2,
          top_p: 0.9,
          top_k: 50,
          frequency_penalty: 0.3,
          description: "输出更确定性和精确，适合生成代码"
        },
        "文本摘要": {
          temperature: 0.4,
          top_p: 0.8,
          top_k: 40,
          frequency_penalty: 0.4,
          description: "减少重复，聚焦关键信息"
        }
      }
    };
  },

  created() {
    // 初始化用户
    this.initializeUser();
    // 加载对话列表
    this.fetchConversationList();
  },
  methods: {
    // 添加初始化用户方法
    async initializeUser() {
      try {
        const refreshToken = await userService.refreshToken();

        if (refreshToken.token) {
          console.log('refreshToken', refreshToken.token);
          message.success('用户恢复登录');
          const userStore = useUserStore();
          const userInfo = await userService.getUserInfo();
          userStore.login(userInfo, refreshToken.token);
        }
      } catch (error) {
        console.error('初始化用户失败:', error);
        // 响应拦截器会处理403错误，这里不需要额外处理
      }
    },

    toggleCollapsed() {
      this.collapsed = !this.collapsed;
    },
    switchSettings() {
      this.modelStore.switchSettings({
        max_tokens: this.max_tokens,
        temperature: this.temperature,
        top_p: this.top_p,
        top_k: this.top_k,
        frequency_penalty: this.frequency_penalty,
      });
    },
    applyPreset(presetName) {
      const preset = this.presets[presetName];
      if (!preset) return;
      this.temperature = preset.temperature;
      this.top_p = preset.top_p;
      this.top_k = preset.top_k;
      this.frequency_penalty = preset.frequency_penalty;
      this.switchSettings();
      message.success(`已应用"${presetName}"预设`);
      this.PopoverVisible = false;
    },

    goToHome() {
      this.$router.push('/');  // 导航到首页路由
    },

    goToConversation(id) {
      this.$router.push({
        name: 'chat',
        params: { id: id }
      });
    },

    async fetchConversationList() {
      // 检查用户是否已登录
      if (!localStorage.getItem('token')) return;
      try {
        this.loadingConversations = true;
        const response = await getConversationList();
        console.log("获取的对话列表数据:", response); // 用于调试

        // 修改这里，使用 response.conversations 而不是 response.data
        if (response && response.conversations) {
          this.conversations = response.conversations;
          console.log("设置到组件的对话列表:", this.conversations.length);
        } else {
          console.warn("对话列表数据格式不符合预期:", response);
        }
      } catch (error) {
        console.error("获取对话列表失败:", error);
      } finally {
        this.loadingConversations = false;
      }
    },

  },
}
</script>

<style scoped>
@import url('./assets/styles/views/app.css');

/* 添加到 <style> 部分或导入的 CSS 文件中 */
.conversation-item {
  padding: 0.5rem;
  margin: 0.25rem 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.conversation-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.conversation-item.active {
  background-color: rgba(24, 144, 255, 0.1);
  border-left: 3px solid #1890ff;
}

.history-container {
  overflow-y: auto;
  scrollbar-width: thin;
}

.history-container::-webkit-scrollbar {
  width: 4px;
}

.history-container::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.history-container::-webkit-scrollbar-track {
  background: transparent;
}
</style>