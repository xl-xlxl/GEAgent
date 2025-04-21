<template>
  <a-layout style="min-height: 100vh;">
    <div v-if="screenWidth < 768 && !collapsed" class="sidebar-overlay" @click="toggleCollapsed">
    </div>
    <a-layout-sider :class="{ 'floating-sider': screenWidth < 768 }"
      style="padding: 0; user-select: none; height: 100vh;" v-model:collapsed="collapsed" collapsible
      :trigger="!collapsed ? null : undefined" :width="screenWidth < 768 ? '70%' : '20%'"
      :collapsedWidth="screenWidth < 768 ? 0 : 70" :zeroWidthTriggerStyle="{ background: 'transparent', top: '2%', }">

      <div class="close-container" style="height: 10vh;">
        <div class="icon-container" @click="toggleCollapsed" :class="{ collapsed: collapsed }">
          <span v-if="!collapsed" class="title">GEAgent</span>
          <img src="/收起.svg" alt="close" class="icon" />
        </div>
      </div>

      <div class="add-container" style="height:5vh;">
        <!-- 新增对话按钮 -->
        <div v-if="!collapsed">
          <div class="bubble icon-container whitespace-nowrap" :class="{ collapsed: collapsed }"
            @click="$router.push('/')">
            开启新的对话
            <img src="/新增对话.svg" alt="add" class="icon" />
          </div>
        </div>
        <div v-else>
          <div class="icon-container" :class="{ collapsed: collapsed }" @click="$router.push('/')">
            <img src="/新增对话.svg" alt="add" class="icon" />
          </div>
        </div>
      </div>

      <div class="history-container" style="height:68vh;padding-top: 0.5em;" @scroll.passive="handleScroll">
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
                <a-popover trigger="click" placement="topRight" v-model:open="morePopoverVisible[conversation.id]">
                  <template #content>
                    <div class="no-select">
                      <div class="preset-option preset-text" @click="deleteConversation(conversation.id)">
                        删除对话
                      </div>
                      <a-popover trigger="click" placement="right" v-model:open="renamePopoverVisible[conversation.id]">
                        <template #content>
                          <div class="no-select" style="display: flex; flex-direction: column; align-items: center;"
                            @click.stop>
                            <div class="xs-input">
                              <a-input v-model:value="newTitle" :bordered="false" placeholder="输入新标题" @click.stop
                                @keyup.enter="confirmRename(conversation.id)" />
                            </div>
                            <div style="display: flex; gap: 1em;">
                              <div class="preset-option preset-text"
                                style="color: #FF7F7F; cursor: pointer; margin: 0; padding: 1em 3em;"
                                @click.stop="confirmRename(conversation.id)">
                                确定
                              </div>
                              <div class="preset-option preset-text"
                                style="cursor: pointer; margin: 0; padding: 1em 3em;"
                                @click.stop="cancelRename(conversation.id)">
                                取消
                              </div>
                            </div>
                          </div>
                        </template>
                        <div class="preset-option preset-text" @click.stop>
                          重新命名
                        </div>
                      </a-popover>
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
                      @click="deletePopoverVisible = false">
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

      <div class="setting-container" style="height: 8vh; padding-top: 0.5em;">
        <a-popover trigger="click" v-model:open="settingPopoverVisible" @openChange="handleSettingPopoverChange">
          <template #content>
            <div class="no-select">
              <div style="display: flex;">
                <h1 style=" font-weight: bold; margin-bottom: 15px;">模型设置</h1>
                <a-popover trigger="click" v-model:open="PopoverVisible">
                  <template #content>
                    <p class="ml-1.5" style="font-weight: bold; margin-bottom: 10px;user-select: none;">场景预设</p>
                    <div v-for="(preset, name) in presets" :key="name" class="preset-option" @click="applyPreset(name)"
                      style="padding: 10px; cursor: pointer; margin-bottom: 5px; border-radius: 16px; transition: all 0.3s;">
                      {{ name }}
                      <div style="font-size: 12px; color: #999; margin-top: 2px;">{{ preset.description }}</div>
                    </div>
                  </template>
                  <div class="size-5 ml-46" style="cursor: pointer; display: flex; "><img src="/预设.svg"></div>
                </a-popover>
              </div>
              <div v-for="model in modelStore.models" :key="model.value">
                <div v-if="modelStore.currentModel === model.LLMID">
                  <label>
                    max_tokens
                    <a-tooltip title="数值越高，模型可输入与输出文本长度越长；数值越低，模型可输入与输出文本长度越短（该值过低与文本长度不匹配时会导致生成中止）">
                      <span style="cursor: pointer; color: #777777;">✿</span>
                    </a-tooltip>
                    <a-slider v-model:value="maxTokens" :step="1" :min="0" :max="model.maxTokens" />
                  </label>
                </div>
              </div>
              <label>
                temperature
                <a-tooltip title="数值越高，模型输出越随机，创造力越强；数值越低，输出越确定">
                  <span style="cursor: pointer; color: #777777;">✿</span>
                </a-tooltip>
                <a-slider v-model:value="temperature" :step="0.1" :min="0.1" :max="1.5" />
              </label>
              <label>
                top_p
                <a-tooltip title="数值越高，生成的文本多样性越强；数值越低，生成的文本越集中在高概率的词汇上">
                  <span style="cursor: pointer; color: #777777;">✿</span>
                </a-tooltip>
                <a-slider v-model:value="top_p" :step="0.1" :min="0.1" :max="1" />
              </label>
              <label>
                top_k
                <a-tooltip title="数值越高，模型从更多候选词中选择词汇，生成的文本可能更丰富；数值越低，模型从较少候选词中选择词汇，生成的文本可能更稳定">
                  <span style="cursor: pointer; color: #777777;">✿</span>
                </a-tooltip>
                <a-slider v-model:value="top_k" :step="1" :min="5" :max="80" />
              </label>
              <label>
                frequent_penalty
                <a-tooltip title="数值越高，模型越倾向于使用新词而不是重复已用词；数值越低，模型越倾向于重复已用词">
                  <span style="cursor: pointer; color: #777777;">✿</span>
                </a-tooltip>
                <a-slider v-model:value="frequent_penalty" :step="0.1" :min="-0.5" :max="1" />
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
        <a-popover v-if="userStore.loggedIn" trigger="click" placement="topRight" :overlayStyle="{ width: '300px' }">
          <template #content>
            <div class="no-select user-info-card">
              <div class="user-info-header">
                <a-avatar :size="60" :src="userStore.getUserInfo.avatarUrl || '/default-avatar.png'"></a-avatar>
                <div class="user-info-name">
                  <h3>{{ userStore.getUserInfo.fullName || '用户' }}</h3>
                  <p>{{ userStore.getUserInfo.email || '' }}</p>
                </div>
              </div>
              
              <div class="user-info-details">
                <div class="info-item">
                  <span class="info-label">用户名:</span>
                  <span class="info-value">{{ userStore.getUserInfo.userName || '未设置' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">邮箱:</span>
                  <span class="info-value">{{ userStore.getUserInfo.email || '未设置' }}</span>
                </div>
              </div>
              
              <div class="user-actions">
                <div class="preset-option preset-text action-button">
                  修改信息
                </div>
                <div class="preset-option preset-text action-button" @click="handleLogout">
                  退出登录
                </div>
              </div>
            </div>
          </template>
          <!-- 已登录状态显示 -->
          <div v-if="!collapsed">
            <div class="bubble icon-container" :class="{ collapsed: collapsed }">
              <a-avatar :size="40" :src="userStore.getUserInfo.avatarUrl || '/default-avatar.png'"></a-avatar>
              <span class="username-text">{{ userStore.getUserInfo.userName || '用户' }}</span>
              <img src="/user.svg" alt="user" class="icon" />
            </div>
          </div>
          <div v-else>
            <div class="icon-container" :class="{ collapsed: collapsed }">
              <a-avatar :size="40" :src="userStore.getUserInfo.avatarUrl || '/default-avatar.png'"></a-avatar>
            </div>
          </div>
        </a-popover>
        <div v-else @click="goToHomeForLogin">
          <div v-if="!collapsed">
            <div class="bubble icon-container" :class="{ collapsed: collapsed }">
              <a-avatar :size="40" src="/default-avatar.png"></a-avatar>
              <span class="username-text">未登录</span>
              <img src="/user.svg" alt="user" class="icon" />
            </div>
          </div>
          <div v-else>
            <div class="icon-container" :class="{ collapsed: collapsed }">
              <img src="/user.svg" alt="user" class="icon" />
            </div>
          </div>
        </div>
      </div>

    </a-layout-sider>
    <div class="app-container">
      <router-view />
    </div>
  </a-layout>
</template>

<script>
import { mapWritableState } from 'pinia';
import { useModelStore } from "@/stores/modelStore";
import { message } from 'ant-design-vue';
import { useUserStore } from './stores/userStore';
import { getConversationList, deleteConversations, deleteAllConversations, updateConversationTitle } from '@/services/conversationService';
import { modelConfigService } from '@/services/modelConfigService';
import { ref } from 'vue';
const value = ref('');

export default {
  name: 'App',

  data() {
    const modelStore = useModelStore();
    const userStore = useUserStore();
    return {
      currentPage: 1,
      hasMorePages: true,
      isLoading: false,
      screenWidth: window.innerWidth,
      modelStore,
      userStore,
      currentModel: modelStore.currentModel,
      PopoverVisible: false,
      conversations: [],
      deletePopoverVisible: false,
      collapsed: true,
      newTitle: "",
      renamePopoverVisible: {},
      morePopoverVisible: {},
      settingPopoverVisible: false,
      userPopoverVisible: false,
      originalSettings: {
        max_tokens: 0,
        temperature: 0,
        top_p: 0,
        top_k: 0,
        frequent_penalty: 0
      },
      presets: {
        "创意文本": {
          temperature: 0.9,
          top_p: 0.9,
          top_k: 50,
          frequent_penalty: 0.6,
          description: "创造性和多样性高，适合文学创作、故事生成"
        },
        "问答系统": {
          temperature: 0.4,
          top_p: 0.7,
          top_k: 40,
          frequent_penalty: 0.5,
          description: "平衡创造性和准确性，适合回答问题"
        },
        "代码生成": {
          temperature: 0.2,
          top_p: 0.9,
          top_k: 50,
          frequent_penalty: 0.3,
          description: "输出更确定性和精确，适合生成代码"
        },
        "文本摘要": {
          temperature: 0.4,
          top_p: 0.8,
          top_k: 40,
          frequent_penalty: 0.4,
          description: "减少重复，聚焦关键信息"
        }
      }
    };
  },


  created() {
    this.initializeUser();
    this.fetchConversationList();
    this.loadModelConfig(this.modelStore.currentModel);
  },

  watch: {
    $route(to) {
      if (to.path.includes('/chat/') && to.params.id) {
        this.fetchConversationList();
      }
    },
    'modelStore.currentModel': {
      immediate: true,
      handler(newcurrentModel) {
        if (newcurrentModel !== undefined) {
          this.loadModelConfig(newcurrentModel);
        }
      }
    }
  },

  computed: {
    ...mapWritableState(useModelStore, {
      maxTokens: 'max_tokens',
      temperature: 'temperature',
      top_p: 'top_p',
      top_k: 'top_k',
      frequent_penalty: 'frequent_penalty'
    })
  },

  mounted() {
    // 添加窗口大小变化监听
    this.handleResize();
    window.addEventListener('resize', this.handleResize);

    // 屏幕较小时自动折叠菜单
    if (this.screenWidth < 768 && !this.collapsed) {
      this.collapsed = true;
    }
  },

  beforeUnmount() {
    // 清理事件监听器
    window.removeEventListener('resize', this.handleResize);
  },

  methods: {
    // 添加处理窗口大小变化的方法
    handleResize() {
      this.screenWidth = window.innerWidth;

      // 在小屏幕上自动折叠侧边栏
      if (this.screenWidth < 768 && !this.collapsed) {
        this.collapsed = true;
      }
    },

    async initializeUser() {
      try {
        const refreshToken = await this.userStore.refreshToken();
        if (refreshToken) {
          console.log('refreshToken', refreshToken);
          await this.userStore.refreshUserInfo();
          message.success('用户恢复登录');
        }
      } catch (error) {
        console.error('初始化用户失败:', error);
      }
    },

    toggleCollapsed() {
      this.collapsed = !this.collapsed;
    },

    async loadModelConfig(currentModel) {
      try {
        if (!localStorage.getItem('token')) {
          console.log('用户未登录，使用默认模型配置');
          return;
        }
        const configs = await modelConfigService.getModelConfig(currentModel);
        if (configs) {
          console.log(`成功获取模型${currentModel}配置:`, configs);
          this.modelStore.switchSettings({
            max_tokens: configs.max_tokens,
            temperature: configs.temperature,
            top_p: configs.top_p,
            top_k: configs.top_k,
            frequent_penalty: configs.frequent_penalty
          });
          console.log(`已从后端加载并更新模型${currentModel}的配置`);
        }
      } catch (error) {
        console.error(`加载模型${currentModel}配置时出错:`, error);
      }
    },

    async settingsChange() {
      if (
        this.originalSettings.max_tokens !== this.modelStore.max_tokens ||
        this.originalSettings.temperature !== this.modelStore.temperature ||
        this.originalSettings.top_p !== this.modelStore.top_p ||
        this.originalSettings.top_k !== this.modelStore.top_k ||
        this.originalSettings.frequent_penalty !== this.modelStore.frequent_penalty
      ) {
        console.log('参数已修改，同步到后端...');
        await this.modelStore.syncSettingsToBackend();
      } else {
        console.log('参数未变更，无需同步');
      }
    },

    async applyPreset(presetName) {
      const preset = this.presets[presetName];
      if (!preset) return;

      this.modelStore.switchSettings({
        temperature: preset.temperature,
        top_p: preset.top_p,
        top_k: preset.top_k,
        frequent_penalty: preset.frequent_penalty,
      });
    },

    handleSettingPopoverChange(visible) {
      if (visible) {
        this.originalSettings = {
          max_tokens: this.modelStore.max_tokens,
          temperature: this.modelStore.temperature,
          top_p: this.modelStore.top_p,
          top_k: this.modelStore.top_k,
          frequent_penalty: this.modelStore.frequent_penalty,
        };
      } else {
        this.settingsChange();
      }
    },

    goToHomeForLogin() {
      this.$router.push('/');
      this.userStore.showLogin = true;
    },

    handleLogout() {
      this.userStore.logout();
      localStorage.removeItem('token');
      message.success('已退出登录');
      this.$router.push('/');
    },

    async goToConversation(id) {
      try {
        if (!id) {
          console.error("会话ID为空或无效");
          message.error("无效的会话ID");
          return;
        }
        if (Number(this.$route.params.id) === id) {
          console.log("已在当前会话页面");
          return;
        }
        // 查找对话标题
        const conversation = this.conversations.find(conv => conv.id === id);
        if (conversation) {
          console.log(`跳转到会话: ${conversation.title} (ID: ${id})`);
          this.$router.push({
            path: `/chat/${id}`,
            query: { title: conversation.title }
          });
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
          this.pagination = response.pagination;
          this.conversations = response.conversations.map(conv => ({
            ...conv,
            id: conv.conversationId
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
        const isCurrentChat = Number(this.$route.params.id) === id;
        const result = await deleteConversations([id]);
        if (result.success) {
          message.success('已删除对话');
          this.conversations = this.conversations.filter(conv => conv.id !== id);
          isCurrentChat && this.$router.push('/');
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
          this.deletePopoverVisible = false;
          this.conversations = [];
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

    // 确认重命名
    async confirmRename(conversationId) {
      if (!this.newTitle.trim()) {
        this.renamePopoverVisible[conversationId] = false;
        this.morePopoverVisible[conversationId] = false;
        return;
      }
      try {
        const result = await updateConversationTitle(conversationId, this.newTitle);
        if (result.success) {
          message.success("重命名成功");
          this.renamePopoverVisible[conversationId] = false;
          this.morePopoverVisible[conversationId] = false;
          // 更新本地对话列表中的标题
          const conversation = this.conversations.find(conversation => conversation.id === conversationId);
          if (conversation) {
            conversation.title = this.newTitle;
          }
          // 更新路由参数
          if (Number(this.$route.params.id) === conversationId) {
            this.$router.replace({
              path: this.$route.path,
              query: { ...this.$route.query, title: this.newTitle }
            });
          }
          this.newTitle = "";
        } else {
          message.error(result.error?.message || "重命名失败");
        }
      } catch (error) {
        console.error("重命名对话失败:", error);
        message.error("重命名对话失败");
      }
    },

    // 取消重命名
    cancelRename(conversationId) {
      this.renamePopoverVisible[conversationId] = false;
      this.morePopoverVisible[conversationId] = false;
      this.newTitle = "";
    },

    handleScroll(event) {
      if (this.settingPopoverVisible) {
        this.settingPopoverVisible = false;
      }
      if (this.PopoverVisible) {
        this.PopoverVisible = false;
      }
      if (this.userPopoverVisible) {
        this.userPopoverVisible = false;
      }
      if (this.deletePopoverVisible) {
        this.deletePopoverVisible = false;
      }
      for (const conversationId in this.morePopoverVisible) {
        if (this.morePopoverVisible[conversationId]) {
          this.morePopoverVisible[conversationId] = false;
        }
      }
      for (const conversationId in this.renamePopoverVisible) {
        if (this.renamePopoverVisible[conversationId]) {
          this.renamePopoverVisible[conversationId] = false;
        }
      }
      // 检测滚动更多历史数据
      const { scrollHeight, scrollTop, clientHeight } = event.target;
      const scrollBottom = scrollHeight - scrollTop - clientHeight;
      if (scrollBottom < 100 && this.hasMorePages && !this.isLoading) {
        this.loadMoreConversations();
      }
    },

    async loadMoreConversations() {
      this.isLoading = true;
      this.currentPage += 1;
      try {
        const response = await getConversationList(this.currentPage, 20);
        if (response.success && response.conversations.length > 0) {
          const newConversations = response.conversations.map(conv => ({
            ...conv,
            id: conv.conversationId
          })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          this.conversations = [...this.conversations, ...newConversations];
          this.hasMorePages = this.currentPage < response.pagination.totalPages;
        } else {
          this.hasMorePages = false;
        }
      } catch (error) {
        console.error("加载更多对话失败:", error);
        this.hasMorePages = false;
      } finally {
        this.isLoading = false;
      }
    }

  },
}
</script>

<style scoped>
@import url('./assets/styles/views/app.css');
</style>