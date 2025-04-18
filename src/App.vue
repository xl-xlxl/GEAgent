<template>
  <a-layout style="min-height: 100vh;">
    <a-layout-sider v-model:collapsed="collapsed" collapsible :width="260" :collapsedWidth="70"
      style=" padding: 0; user-select: none; height: 100vh;">

      <div class="close-container" style="height: 10vh;">
        <div class="icon-container" @click="toggleCollapsed" :class="{ collapsed: collapsed }">
          <span v-if="!collapsed" class="title">GEAgent</span>
          <img src="/收起.svg" alt="close" class="icon" />
        </div>
      </div>

      <div class="add-container" style="height:5vh;">
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

      <div class="history-container" style="height:70vh;">
        <div v-if="!collapsed">
          <!-- 对话历史列表 -->
          <div class="history-list">
            <div v-for="conversation in conversations" :key="conversation.id" @click="goToConversation(conversation.id)"
              class="conversation-item" :class="{ 'active': Number($route.params.id) === conversation.id }">
              <div>
                <div class="truncate" style="font-weight: bold;">{{ conversation.title }}</div>
                <div class="text-xs truncate">
                  {{ new Date(conversation.createdAt).toLocaleString() }}
                </div>
              </div>
              <div class="-mt-9">
                <a-popover trigger="click" placement="topRight">
                  <template #content>
                    <div class="no-select">
                      <div class="preset-option preset-text" @click="deleteConversation(conversation.id)">
                        删除对话
                      </div>
                      <div class="preset-option preset-text" @click="renameConversation(conversation.id)">
                        重新命名
                      </div>
                    </div>
                  </template>
                  <div class="icon"><img src="/更多.svg" alt="more"></div>
                </a-popover>
              </div>
            </div>
          </div>

          <div class="clear-all-container" v-if="conversations.length > 1">
            <a-popover trigger="click" v-model:open="deletePopoverVisible">
              <template #content>
                <div class="no-select" style="display: flex; flex-direction: column; align-items: center;">
                  <div class="preset-text" style="text-align: center; user-select: none; cursor: default; margin: 0;">
                    确定要删除所有对话记录吗
                  </div>
                  <div style="display: flex; gap: 1em;">
                    <div class="preset-option preset-text"
                      style="color: #FF7F7F; cursor: pointer; margin: 0; padding: 1em 3em ;"
                      @click="deleteAllConversations">
                      删除
                    </div>
                    <div class="preset-option preset-text" style="cursor: pointer; margin: 0; padding: 1em 3em ;"
                      @click="closeDeletePopover">
                      取消
                    </div>
                  </div>
                </div>
              </template>
              <div class="delete-all-button">
                <img src="/全部删除.svg" alt="删除全部对话" />
              </div>
            </a-popover>
          </div>

        </div>
        <div v-else>
        </div>
      </div>

      <div class="setting-container" style="height: 7vh; padding-top: 0.5em;">
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

      <div class="user-container" style="height: 8vh; align-items: center;">
        <a-popover trigger="click" placement="topRight">
          <template #content>
            <div class="no-select">
              <div class="preset-option preset-text">
                修改信息
              </div>
              <div class="preset-option preset-text">
                退出登录
              </div>
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
import { getConversationList, deleteConversations, deleteAllConversations } from '@/services/conversationService';


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
      deletePopoverVisible: false,
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

  watch: {
    // 监听路由变化
    $route(to, from) {
      console.log("路由变化:", from.fullPath, "->", to.fullPath);
      this.fetchConversationList(); // 每次路由变化时调用
    },
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
      this.$router.push('/');
    },

    async goToConversation(id) {
      try {
        console.log("尝试跳转到会话，ID:", id);

        if (!id) {
          console.error("会话ID为空或无效");
          message.error("无效的会话ID");
          return;
        }

        // 转换路由参数为数字进行比较
        if (Number(this.$route.params.id) === id) {
          console.log("已在当前会话页面");
          return;
        }

        // 查找对话标题
        const conversation = this.conversations.find(conv => conv.id === id);
        if (conversation) {
          // 带上标题参数进行路由跳转
          console.log(`跳转到会话: ${conversation.title} (ID: ${id})`);
          this.$router.push({
            path: `/chat/${id}`,
            query: { title: conversation.title }
          });
        } else {
          // 如果找不到对话信息，直接跳转
          console.log("跳转到会话路径:", `/chat/${id}`);
          this.$router.push(`/chat/${id}`);
        }
      } catch (error) {
        console.error("跳转到会话失败:", error);
        message.error("跳转到会话失败");
      }
    },

    async fetchConversationList(page = 1, pageSize = 20) {
      if (!localStorage.getItem('token')) return;

      try {
        const response = await getConversationList(page, pageSize);

        if (response.success) {
          // 更新分页信息
          this.pagination = response.pagination;

          // 直接使用conversationId作为id，保持整数类型
          this.conversations = response.conversations.map(conv => ({
            ...conv,
            id: conv.conversationId // 保留整数类型
          })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          console.log("处理后的会话列表:", this.conversations);
        } else {
          console.error("获取对话列表失败:", response.error);
        }
      } catch (error) {
        console.error("获取对话列表失败:", error);
      }
    },

    async deleteConversation(id) {
      try {
        const result = await deleteConversations([id]);
        if (result.success) {
          message.success(`已删除对话`);
          await this.fetchConversationList();

          // 使用Number()转换路由参数进行比较
          if (Number(this.$route.params.id) === id) {
            this.$router.push('/');
          }
        } else {
          message.error(result.error?.message || "删除对话失败");
        }
      } catch (error) {
        console.error("删除对话失败:", error);
        message.error("删除对话失败");
      }
    },

    async deleteAllConversations() {
      try {
        const result = await deleteAllConversations();
        if (result.success) {
          message.success(`成功删除了${result.deletedCount}个对话`);

          // 关闭弹窗 - 提前关闭以提升用户体验
          this.deletePopoverVisible = false;

          // 强制清空当前对话列表
          this.conversations = [];

          // 如果当前在某个对话页，返回首页
          if (this.$route.path.startsWith('/chat/')) {
            this.$router.push('/');
          }
        } else {
          message.error(result.error?.message || "删除所有对话失败");
        }
      } catch (error) {
        console.error("删除所有对话失败:", error);
        message.error("删除所有对话失败");
      }
    },

    // 添加关闭弹窗方法
    closeDeletePopover() {
      // 这里可以通过v-model控制弹窗关闭
      this.deletePopoverVisible = false;
    }

  },
}
</script>

<style scoped>
@import url('./assets/styles/views/app.css');
</style>