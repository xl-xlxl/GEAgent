<template>
  <div class="chat-container">
    <div class="chat-header" style="user-select: none">
      <div class="title">
        {{ title }}
      </div>
    </div>
    <div class="scroll-container" ref="scrollArea" @scroll="handleScroll">
      <!-- 消息区域 -->
      <div class="messages-area">
        <template v-for="message in messages" :key="message.id">
          <div v-if="
            message.role === 'user' ||
            message.role === 'thinking' ||
            (message.role === 'assistant' && (message.content || message.emojiUrls || message.mcpData))
          " :class="{
            message: true,
            'user-message': message.role === 'user',
            'ai-message': message.role === 'assistant',
            'thinking-message': message.role === 'thinking',
            [`round-${message.round || 1}`]: true,
            'round-start': isRoundStart(message),
            'round-end': isRoundEnd(message),
          }" :data-round="message.round || 1" :data-group="message.groupId">
            <!-- 用户消息 -->
            <div v-if="message.role === 'user'" class="user-message-container">
              <div class="user-bubble">
                {{ message.content }}
              </div>
              <div class="avatar-container">
                <a-avatar :size="40" :src="userStore.getUserInfo.avatarUrl || '/defaultAvatar.gif'"></a-avatar>
              </div>
            </div>
            <!-- 思考过程消息 -->
            <div v-if="
              message.role === 'thinking' &&
              message.thinking &&
              message.thinking.trim().length > 0
            " class="thinking-message-container">
              <div class="avatar-container">
                <a-avatar v-if="!message.round || message.round === 1" :size="40" src=""></a-avatar>
                <div v-else class="avatar-placeholder"></div>
              </div>
              <div class="thinking-bubble">
                <div v-html="renderMarkdown(message.thinking)"></div>
              </div>
            </div>
            <!-- AI回复消息 -->
            <div v-if="message.role === 'assistant' && message.content && message.content.trim().length"
              class="ai-message-container">
              <div class="avatar-container">
                <a-avatar v-if="!hasThinkingBefore(message)" :size="40" src=""></a-avatar>
                <div v-else class="avatar-placeholder"></div>
              </div>
              <!-- 文本内容气泡 -->
              <div v-if="message.content && message.content.trim().length" class="ai-bubble">
                <div v-html="renderMarkdown(message.content)"></div>
              </div>
            </div>
            <!-- 表情包 -->
            <div v-if="message.role === 'assistant' && message.emojiUrls && message.emojiUrls.length"
              class="ai-message-container emoji-message-container">
              <div class="avatar-container">
                <div class="avatar-placeholder"></div>
              </div>
              <div class="ai-bubble">
                <div class="emoji-container">
                  <img v-for="(url, index) in message.emojiUrls" :key="`emoji-${message.id}-${index}`" :src="url"
                    alt="表情包" class="emoji-image" />
                </div>
              </div>
            </div>
            <!-- MCP 状态卡片 -->
            <div
              v-if="message.role === 'assistant' && message.mcpData && (message.hideMcp === undefined || message.hideMcp === false)"
              class="ai-message-container">
              <div class="avatar-container">
                <div v-if="!hasThinkingBefore(message)" class="avatar-placeholder">
                  <a-avatar :size="40" src=""></a-avatar>
                </div>
                <div v-else class="avatar-placeholder"></div>
              </div>
              <div class="ai-bubble mcp-card">
                <div v-if="message.mcpData.fnCall && message.mcpData.fnCall.length" class="mcp-calls">
                  <div v-for="(call, idx) in message.mcpData.fnCall" :key="idx" class="mcp-call-item">
                    <div class="mcp-call-name">{{ call.name }}</div>
                    <span class="mcp-description" v-if="mcpServiceDescriptions[call.name]">
                      {{ mcpServiceDescriptions[call.name] }}
                    </span>
                    <div class="mcp-call-args">
                      <pre>{{ JSON.stringify(call.arguments) }}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
    <!-- 输入框区域 -->
    <div class="input-area">
      <div class="input-container">
        <!-- 输入框 -->
        <textarea class="message-input" :placeholder="loading ? ' GEAgent 思考中，请稍后 . . .' : '给 GEAgent 发送消息'"
          v-model="userInput" @keydown="handleKeyDown" :disabled="loading"
          :auto-size="{ minRows: 3, maxRows: 8 }"></textarea>
        <div style="display: flex; justify-content: flex-end ;gap: 10px;">
          <!-- 大屏幕显示的功能区域 -->
          <div class="model-select desktop-only">
            <!-- 模型选择 -->
            <a-select style="width: 150px" size="small" :disabled="loading" v-model:value="modelStore.currentModel">
              <a-select-option v-for="model in modelStore.models" :key="model.value" :value="model.LLMID">
                {{ model.value }}
              </a-select-option>
            </a-select>
          </div>
          <div class="input-actions desktop-only">
            <!-- MCP按钮 -->
            <button class="feature-button" :class="{ 'active-feature': enableMCPService }" 
              @click="() => featureStore.enableMCPService = !featureStore.enableMCPService" :disabled="loading">
              <span class="MCP-icon"><img src="/mcp.svg" /></span>
              MCP Services
            </button>
            <!-- 联网搜索按钮 -->
            <button class="feature-button" :class="{ 'active-feature': webSearch }"
              @click="() => featureStore.webSearch = !featureStore.webSearch" :disabled="loading">
              <span class="web-icon"><img src="/互联网搜索.svg" /></span>
              联网搜索
            </button>
          </div>
          <!-- 小屏幕功能按钮和弹出层 -->
          <div class="mobile-only mobile-tools">
            <a-popover placement="topRight" trigger="click" v-model:open="showFeaturePopover"
              :overlayStyle="{ width: '200px' }">
              <template #content>
                <div class="popover-content">
                  <!-- 模型选择 -->
                  <div class="popover-item">
                    <div class="popover-label">模型选择</div>
                    <a-select style="width: 100%" size="small" :disabled="loading"
                      v-model:value="modelStore.currentModel">
                      <a-select-option v-for="model in modelStore.models" :key="model.value" :value="model.LLMID">
                        {{ model.value }}
                      </a-select-option>
                    </a-select>
                  </div>
                  <!-- 功能按钮 -->
                  <div class="popover-item">
                    <div class="popover-label">功能选项</div>
                    <div class="popover-buttons">
                      <!-- MCP按钮 -->
                      <button class="feature-button popover-button" :class="{ 'active-feature': enableMCPService }"
                        @click="() => { featureStore.enableMCPService = !featureStore.enableMCPService; showFeaturePopover = false }">
                        <span class="MCP-icon"><img src="/mcp.svg" /></span>
                        MCP Services
                      </button>
                      <!-- 联网搜索按钮 -->
                      <button class="feature-button popover-button" :class="{ 'active-feature': webSearch }"
                        @click="() => { featureStore.webSearch = !featureStore.webSearch; showFeaturePopover = false }">
                        <span class="web-icon"><img src="/互联网搜索.svg" /></span>
                        联网搜索
                      </button>
                    </div>
                  </div>
                </div>
              </template>
              <button class="feature-button settings-button">
                <img src="/功能设置.svg" alt="功能设置" style="width: 12px; height: 12px;" />
              </button>
            </a-popover>
          </div>
          <!-- 发送按钮 - 在任何屏幕尺寸下都显示 -->
          <button class="send-button" @click="sendMessage" :disabled="!userInput.trim() || loading">
            <span class="send-icon"><img src="/发送.svg" /></span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useModelStore } from "@/stores/modelStore";
import { useFeatureStore } from "@/stores/featureStore";
import { message, Avatar } from "ant-design-vue";
import { createConversation, continueConversation, getConversationHistory, getConversationList } from "@/services/conversationService";
import { message as messageApi } from "ant-design-vue";
import { useConversationStore } from '@/stores/conversationStore';
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import "highlight.js/styles/github.css"
import { useUserStore } from "@/stores/userStore";

export default {
  name: "ChatView",
  components: {
    Avatar,
  },
  data() {
    const featureStore = useFeatureStore();
    const modelStore = useModelStore();
    return {
      messages: [],
      userInput: "",
      loading: false,
      userStore: useUserStore(),
      modelStore,
      featureStore,
      autoScroll: true,
      conversationId: null,
      title: "新对话",
      pagination: null,
      loadingHistory: false,
      showFeaturePopover: false,
      mcpServiceDescriptions: {
        "biliSearch_get_extra_keywords": "在bilibili广泛获取搜索词的推荐关键词",
        "biliSearch": "在bilibili以关键词检索信息，获取网络上的综合信息",
        "biliSearch_cheese": "在bilibili搜索网络上的课程相关内容",
        "getGEInfo": "获取GE酱以及GEAgent的详细信息",
      },
    };
  },

  mounted() {
    const conversationStore = useConversationStore();
    if (conversationStore.initialMessage) {
      this.userInput = conversationStore.initialMessage;
      this.sendMessage();
      conversationStore.clearInitialMessage();
    }
  },

  watch: {
    '$route.params.id': {
      immediate: true,
      async handler(newId) {
        if (newId) {
          this.conversationId = newId;
          // 使用路由查询参数中的标题
          if (this.$route.query.title) {
            this.title = this.$route.query.title;
          }
          try {
            const response = await getConversationHistory(newId);
            if (response.success && response.conversation.messages) {
              this.messages = [];
              // 直接使用API层处理好的消息格式
              this.messages = response.conversation.messages;
              // 更新分页信息
              this.pagination = response.pagination;
            } else {
              console.error("获取对话历史失败:", response);
              message.error("无法加载对话历史");
            }
          } catch (error) {
            console.error("加载对话历史失败:", error);
            message.error("加载对话历史失败");
          }
        }
      }
    },
    '$route.query.title': {
      immediate: true,
      handler(newTitle) {
        if (newTitle) {
          this.title = newTitle;
        }
      }
    },
    messages: {
      handler() {
        this.scrollToBottom();
      },
      deep: true,
    },
  },

  computed: {
    max_tokens() {
      return useModelStore().max_tokens;
    },
    temperature() {
      return useModelStore().temperature;
    },
    top_p() {
      return useModelStore().top_p;
    },
    top_k() {
      return useModelStore().top_k;
    },
    frequent_penalty() {
      return useModelStore().frequent_penalty;
    },
    webSearch() {
      return this.featureStore.webSearch;
    },
    enableMCPService() {
      return this.featureStore.enableMCPService;
    },
  },

  methods: {
    isRoundStart(message) {
      const index = this.messages.findIndex(msg => msg.id === message.id);
      if (index <= 0) return true;

      const prevMsg = this.messages[index - 1];
      return prevMsg.groupId !== message.groupId ||
        (prevMsg.round || 1) !== (message.round || 1);
    },

    isRoundEnd(message) {
      const index = this.messages.findIndex(msg => msg.id === message.id);
      if (index >= this.messages.length - 1) return true;

      const nextMsg = this.messages[index + 1];
      return nextMsg.groupId !== message.groupId ||
        (nextMsg.round || 1) !== (message.round || 1);
    },

    updateMessageOrder(groupId) {
      if (!groupId || !this.messages || this.messages.length === 0) return;

      // 一次性查找所有属于该组的消息及其索引
      const groupMessagesWithIndices = this.messages
        .map((msg, index) => ({ msg, index }))
        .filter(item => item.msg.groupId === groupId);

      // 如果没有找到消息或只有一条消息，无需排序
      if (groupMessagesWithIndices.length <= 1) return;

      // 获取组的索引范围
      const indices = groupMessagesWithIndices.map(item => item.index);
      const startIndex = Math.min(...indices);
      const endIndex = Math.max(...indices);

      // 获取需要排序的消息
      const groupMessages = groupMessagesWithIndices.map(item => item.msg);

      // 排序当前组的消息
      groupMessages.sort((a, b) => {
        // 优先按回合排序
        const roundA = a.round || 1;
        const roundB = b.round || 1;
        if (roundA !== roundB) return roundA - roundB;

        // 同一回合内按类型顺序排列
        if (a.role !== b.role) {
          const roleOrder = { user: 1, thinking: 2, assistant: 3 };
          return roleOrder[a.role] - roleOrder[b.role];
        }
      });

      // 原地替换排序后的消息
      for (let i = 0; i < groupMessages.length; i++) {
        this.messages[startIndex + i] = groupMessages[i];
      }
    },

    handleScroll() {
      const scrollArea = this.$refs.scrollArea;
      if (!scrollArea) return;
      const isAtBottom = scrollArea.scrollTop >= scrollArea.scrollHeight - scrollArea.clientHeight - 5;
      this.autoScroll = isAtBottom;

      // 历史消息加载逻辑（分页）
      const scrollPercent = scrollArea.scrollTop / (scrollArea.scrollHeight - scrollArea.clientHeight) * 100;
      if (this.loadingHistory || !this.pagination?.hasNextPage) return;
      if (scrollPercent <= 10) {
        this.loadingHistory = true;
        this.loadMoreHistory(this.pagination.nextPage)
          .finally(() => this.loadingHistory = false);
      }
    },

    scrollToBottom() {
      if (this.autoScroll) {
        this.$nextTick(() => {
          const scrollArea = this.$refs.scrollArea;
          if (scrollArea) {
            scrollArea.scrollTop = scrollArea.scrollHeight;
          }
        });
      }
    },

    hasThinkingBefore(currentMessage) {
      const currentIndex = this.messages.findIndex(
        (msg) => msg.id === currentMessage.id
      );
      if (currentIndex === -1) return false;
      for (let i = currentIndex - 1; i >= 0; i--) {
        const msg = this.messages[i];
        if (msg.role === "user") {
          return false;
        }
        if (
          msg.role === "thinking" &&
          msg.thinking &&
          msg.thinking.trim().length > 0
        ) {
          return true;
        }
      }
      return false;
    },

    handleKeyDown(event) {
      if (event.key === "Enter") {
        if (!event.shiftKey) {
          event.preventDefault();
          this.sendMessage();
        }
        // 按下Shift+Enter时浏览器默认行为生效(插入换行符)
      }
    },

    renderMarkdown(text) {
      if (!text) return "";
      // 创建 MarkdownIt 实例，启用代码高亮
      const md = new MarkdownIt({
        highlight: function (str, lang) {
          if (lang && hljs.getLanguage(lang)) {
            try {
              // 使用 highlight.js 高亮代码
              return hljs.highlight(str, { language: lang }).value;
            } catch (__) {
              console.error("代码高亮失败:", __);
            }
          }
          return "";
        },
      });
      // 解析 Markdown 文本为 HTML
      return md.render(text);
    },


    // 处理思考过程回调的辅助函数
    handleReasoningCallback(messageObject, loadHide) {
      const groupId = messageObject.groupId;
      const baseId = messageObject.id;

      return (content, round = 0) => {
        // 处理首次响应
        if (!this.firstResponseReceived) {
          loadHide();
          this.firstResponseReceived = true;
        }

        const actualRound = round || 1;
        const messageId = `${baseId}-round-${actualRound}`;

        // 查找是否已存在消息
        let existingIndex = this.messages.findIndex(msg => msg.id === messageId);

        // 简化思考处理逻辑
        if (existingIndex === -1) {
          // 创建新消息，无论哪个回合
          this.messages.push({
            id: messageId,
            role: 'thinking',
            thinking: content,
            round: actualRound,
            groupId
          });
        } else {
          // 更新现有消息
          this.messages[existingIndex].thinking = (this.messages[existingIndex].thinking || "") + content;
        }

        this.updateMessageOrder(groupId);
      };
    },

    handleReplyCallback(aiMessage, loadHide) {
      const groupId = aiMessage.groupId;

      return (reply, round = 0) => {
        if (!this.firstResponseReceived) {
          loadHide();
          this.firstResponseReceived = true;
        }

        // 明确处理 round 信息，确保每个 round 都有专属消息
        const actualRound = round || 1; // 如果没有提供 round，默认为第 1 轮
        const aiId = `${aiMessage.id}-round-${actualRound}`;
        const aiIndex = this.messages.findIndex((msg) => msg.id === aiId);

        // 处理表情包数据
        if (typeof reply === "object" && reply.type === "emoji") {
          const emojiRound = reply.round || actualRound;
          const emojiAiId = `${aiMessage.id}-round-${emojiRound}`;
          const emojiAiIndex = this.messages.findIndex((msg) => msg.id === emojiAiId);

          if (emojiAiIndex === -1) {
            // 创建新回合的表情包消息
            const newEmojiMsg = {
              id: emojiAiId,
              role: "assistant",
              content: "",
              emojiUrls: [reply.url],
              round: emojiRound,
              groupId: groupId, // 保持组 ID 一致
            };

            // 找到同一组内对应回合的思考消息
            const thinkingId = `${this.thinkingMessage.id}-round-${emojiRound}`;
            const thinkingIndex = this.messages.findIndex(
              (msg) => msg.id === thinkingId && msg.groupId === groupId
            );

            // 如果找到了对应回合的思考消息，就在其后插入
            if (thinkingIndex !== -1) {
              this.messages.splice(thinkingIndex + 1, 0, newEmojiMsg);
            } else {
              // 如果没有找到思考消息，则直接插入到消息列表末尾
              this.messages.push(newEmojiMsg);
            }
          } else {
            // 更新现有表情包消息
            if (!this.messages[emojiAiIndex].emojiUrls) {
              this.messages[emojiAiIndex].emojiUrls = [];
            }
            this.messages[emojiAiIndex].emojiUrls.push(reply.url);
          }
          return;
        }

        // 处理 MCP 状态数据
        else if (typeof reply === "object" && reply.type === "mcp") {
          console.log("MCP数据:", reply);  // 添加调试日志
          const mcpRound = reply.round || actualRound;
          // 修改ID格式，确保同一round的MCP只有一个卡片
          const mcpAiId = `${aiMessage.id}-round-${mcpRound}-mcp`;
          const mcpAiIndex = this.messages.findIndex((msg) => msg.id === mcpAiId);

          if (mcpAiIndex === -1) {
            // 创建新回合的 MCP 消息，先设置为不可见
            const newMcpMsg = {
              id: mcpAiId,
              role: "assistant",
              content: "",
              mcpData: reply.mcpData,
              round: mcpRound,
              groupId: groupId, // 保持组 ID 一致
              hideMcp: true // 初始状态为隐藏
            };

            // 寻找最佳插入位置：同一round的表情包之后
            let insertIndex = -1;

            // 查找同一组、同一round的所有消息
            const sameRoundMessages = this.messages.filter(msg =>
              msg.groupId === groupId && msg.round === mcpRound
            );

            // 如果找到了同一round的表情包消息，在它之后插入
            const emojiMessage = sameRoundMessages.find(msg =>
              msg.role === 'assistant' && msg.emojiUrls && msg.emojiUrls.length
            );

            if (emojiMessage) {
              insertIndex = this.messages.findIndex(msg => msg.id === emojiMessage.id) + 1;
            } else {
              // 如果没有表情包，则查找同一round的AI文本回复，在它之后插入
              const textMessage = sameRoundMessages.find(msg =>
                msg.role === 'assistant' && msg.content && typeof msg.content === 'string' && msg.content.trim().length > 0
              );

              if (textMessage) {
                insertIndex = this.messages.findIndex(msg => msg.id === textMessage.id) + 1;
              } else {
                // 如果没有AI回复，找到思考消息后插入
                const thinkingId = `${this.thinkingMessage.id}-round-${mcpRound}`;
                const thinkingIndex = this.messages.findIndex(
                  (msg) => msg.id === thinkingId && msg.groupId === groupId
                );

                if (thinkingIndex !== -1) {
                  insertIndex = thinkingIndex + 1;
                }
              }
            }

            // 插入到找到的位置，如果没找到位置则添加到末尾
            if (insertIndex !== -1) {
              this.messages.splice(insertIndex, 0, newMcpMsg);
            } else {
              this.messages.push(newMcpMsg);
            }

            setTimeout(() => {
              const updatedIndex = this.messages.findIndex(msg => msg.id === mcpAiId);
              if (updatedIndex !== -1) {
                this.messages[updatedIndex].hideMcp = false;
              }
            }, 500);
          } else {
            // 更新现有 MCP 消息
            this.messages[mcpAiIndex].mcpData = reply.mcpData;
            // 已存在的MCP消息也需要延迟显示
            this.messages[mcpAiIndex].hideMcp = true;

            setTimeout(() => {
              const updatedIndex = this.messages.findIndex(msg => msg.id === mcpAiId);
              if (updatedIndex !== -1) {
                this.messages[updatedIndex].hideMcp = false;
              }
            }, 500);
          }

          this.updateMessageOrder(groupId);
          return;
        }

        // 处理文本内容
        else if (typeof reply === "string") {
          const isReplyEmpty = reply.trim() === "";
          if (aiIndex === -1) {
            // 创建新的 AI 消息
            const newAiMsg = {
              id: aiId,
              role: "assistant",
              content: isReplyEmpty ? "" : reply,
              round: actualRound,
              groupId: groupId, // 保持组 ID 一致
            };

            // 找到同一组内对应回合的思考消息
            const thinkingId = `${this.thinkingMessage.id}-round-${actualRound}`;
            const thinkingIndex = this.messages.findIndex(
              (msg) => msg.id === thinkingId && msg.groupId === groupId
            );

            if (thinkingIndex !== -1) {
              // 如果有对应回合的思考消息，在其后插入
              this.messages.splice(thinkingIndex + 1, 0, newAiMsg);
            } else {
              // 如果没有找到思考消息，则直接插入到消息列表末尾
              this.messages.push(newAiMsg);
            }
          } else {
            // 更新现有回合的 AI 消息
            const currentContent = this.messages[aiIndex].content || "";
            this.messages[aiIndex].content = isReplyEmpty ? currentContent : currentContent + reply;
          }
          this.updateMessageOrder(groupId);
        }
      };
    },

    getTitleFromMessage(message) {
      // 截取前20个字符，如果不足20个则使用整个消息
      return message.length > 20 ? message.substring(0, 17) + '...' : message;
    },

    async sendMessage() {
      // 防止空消息或重复发送
      if (!this.userInput.trim() || this.loading) return;

      // 设置加载状态
      this.loading = true;
      const loadHide = messageApi.loading("正在思考中...", 0);
      this.firstResponseReceived = false;

      // 创建一个唯一的对话组ID，用于关联此次用户提问及其相关回复
      const conversationGroupId = Date.now();

      // 创建用户消息
      const userMessage = {
        id: `${conversationGroupId}-user`,
        role: "user",
        content: this.userInput,
        groupId: conversationGroupId  // 添加组ID
      };

      // 保存用户输入并清空输入框
      const userQuery = this.userInput;
      this.userInput = "";

      // 添加用户消息到消息列表
      this.messages.push(userMessage);

      // 为第一个回合创建思考消息
      const thinkingMessage = {
        id: `${conversationGroupId}-thinking`,
        role: "thinking",
        thinking: "",
        groupId: conversationGroupId  // 添加组ID
      };

      // AI回复消息的基础信息
      const aiMessage = {
        id: `${conversationGroupId}-assistant`,
        role: "assistant",
        content: "",
        groupId: conversationGroupId  // 添加组ID
      };

      // 添加思考消息到消息列表
      this.messages.push(thinkingMessage);
      this.messages.push(aiMessage);

      // 保存消息引用及groupId供回调使用
      this.thinkingMessage = thinkingMessage;
      this.aiMessage = aiMessage;
      this.currentGroupId = conversationGroupId;


      try {
        const params = {
          message: userQuery,
          LLMID: this.modelStore.currentModel,
          webSearch: this.featureStore.webSearch,
          enableMCPService: this.featureStore.enableMCPService,
        };

        // 如果没有会话ID，则创建新会话
        if (!this.conversationId) {
          params.title = this.getTitleFromMessage(userQuery);

          try {
            // 创建新会话
            const response = await createConversation(
              params,
              this.handleReasoningCallback(thinkingMessage, loadHide),
              this.handleReplyCallback(aiMessage, loadHide)
            );

            // 保存会话ID到组件状态
            if (response && response.conversationId) {
              this.conversationId = response.conversationId;
              this.title = params.title;

              await getConversationList();

              // 如果当前路由不是新创建的会话，则跳转
              if (this.$route.params.id !== String(this.conversationId)) {
                this.$router.push(`/chat/${this.conversationId}?title=${encodeURIComponent(this.title)}`);
              }

              console.log("创建新会话完成，会话ID:", this.conversationId);
            } else {
              console.error("未能获取到有效的会话ID");
              messageApi.error("创建会话失败");
            }
          } catch (error) {
            console.error("创建会话失败:", error);
            messageApi.error(error.message || "创建会话失败");
          }
        } else {
          // 继续现有对话
          const response = await continueConversation(
            params,
            this.conversationId,
            this.handleReasoningCallback(thinkingMessage, loadHide),
            this.handleReplyCallback(aiMessage, loadHide)
          );
          console.log("继续对话完成，会话ID:", this.conversationId);
        }
      } catch (error) {
        console.error("聊天操作-UI层错误:", error);
        if (error.error?.isShowable) {
          messageApi.error("服务暂时不可用，请稍后再试");
        }
        const aiIndex = this.messages.findIndex(msg => msg.id === aiMessage.id);
        if (aiIndex !== -1) {
          this.messages[aiIndex].content = "抱歉，我暂时无法回答您的问题。";
        }
      } finally {
        this.loading = false;
        loadHide();
        this.scrollToBottom();
      }
    },

    // 加载更多历史消息的方法
    async loadMoreHistory(page) {
      if (!this.conversationId) return;
      try {
        const response = await getConversationHistory(this.conversationId, page);
        if (response.success && response.conversation.messages) {
          const historyMessages = response.conversation.messages;
          // 将历史消息添加到当前消息列表的开头
          this.messages.unshift(...historyMessages);
          // 更新分页信息
          this.pagination = response.pagination;
          return {
            success: true,
            hasMore: response.pagination.hasNextPage
          };
        }
      } catch (error) {
        console.error("加载更多对话历史失败:", error);
        message.error("加载更多历史失败");
        return {
          success: false,
          error
        };
      }
    },

  },
};
</script>

<style scoped>
@import "@/assets/styles/views/chat.css";
</style>