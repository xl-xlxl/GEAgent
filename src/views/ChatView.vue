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
            (message.role === 'assistant' && message.content)
          " :class="{
            message: true,
            'user-message': message.role === 'user',
            'ai-message': message.role === 'assistant',
            'thinking-message': message.role === 'thinking',
          }">
            <!-- 用户消息 -->
            <div v-if="message.role === 'user'" class="user-message-container">
              <div class="user-bubble">
                {{ message.content }}
              </div>
              <div class="avatar-container">
                <a-avatar :size="40" src=""></a-avatar>
              </div>
            </div>
            <!-- 思考过程消息 -->
            <div v-if="
              message.role === 'thinking' &&
              message.thinking &&
              message.thinking.trim().length > 0
            " class="thinking-message-container">
              <div class="avatar-container">
                <a-avatar v-if="isFirstRoundThinking(message)" :size="40" src=""></a-avatar>
                <div v-else class="avatar-placeholder"></div>
              </div>
              <div class="thinking-bubble">
                <div v-html="renderMarkdown(message.thinking)"></div>
              </div>
            </div>
            <!-- AI回复消息 -->
            <div v-if="message.role === 'assistant'" class="ai-message-container">
              <div class="avatar-container">
                <a-avatar v-if="!hasThinkingBefore(message)" :size="40" src=""></a-avatar>
                <div v-else class="avatar-placeholder"></div>
              </div>
              <div class="ai-bubble">
                <div v-html="renderMarkdown(message.content)"></div>
                <!-- 显示表情包 -->
                <div v-if="message.emojiUrls && message.emojiUrls.length" class="emoji-container">
                  <img v-for="(url, index) in message.emojiUrls" :key="`emoji-${message.id}-${index}`" :src="url"
                    alt="表情包" class="emoji-image" />
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
        <div style="display: flex; justify-content: space-between">
          <div class="model-select">
            <!-- 模型选择 -->
            <a-select style="width: 150px" size="small" :disabled="loading" v-model:value="modelStore.currentModel"
              @change="modelStore.switchModel">
              <a-select-option v-for="model in modelStore.models" :key="model.value" :value="model.LLMID">
                {{ model.value }}
              </a-select-option>
            </a-select>
          </div>
          <div class="input-actions">
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
            <!-- 发送按钮 -->
            <button class="send-button" @click="sendMessage" :disabled="!userInput.trim() || loading">
              <span class="send-icon"><img src="/发送.svg" /></span>
            </button>
          </div>
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
      modelStore,
      featureStore,
      autoScroll: true,
      conversationId: null,
      title: "新对话",
      pagination: null,
      loadingHistory: false,
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
    groupedMessages() {
      if (!this.messages || this.messages.length === 0) return [];
      
      const groups = {};
      
      // 首先按groupId分组
      this.messages.forEach(msg => {
        const groupId = msg.groupId || `fallback-${msg.interactionId || Date.now()}`;
        
        if (!groups[groupId]) {
          groups[groupId] = {
            groupId,
            userMessage: null,
            rounds: {}
          };
        }
        
        // 按角色分类处理
        if (msg.role === 'user') {
          groups[groupId].userMessage = msg;
        } else {
          const round = msg.round || 1;
          if (!groups[groupId].rounds[round]) {
            groups[groupId].rounds[round] = {
              roundNumber: round,
              thinking: null,
              assistant: null
            };
          }
          
          if (msg.role === 'thinking') {
            groups[groupId].rounds[round].thinking = msg;
          } else if (msg.role === 'assistant') {
            groups[groupId].rounds[round].assistant = msg;
          }
        }
      });
      
      // 转换为数组并排序
      const result = Object.values(groups);
      
      // 为每个组整理rounds为数组并按回合排序
      result.forEach(group => {
        group.rounds = Object.values(group.rounds).sort((a, b) => a.roundNumber - b.roundNumber);
      });
      
      // 按交互ID排序
      return result.sort((a, b) => {
        const idA = a.userMessage?.interactionId || 0;
        const idB = b.userMessage?.interactionId || 0;
        return idA - idB;
      });
    }
  },

  methods: {
    // 判断是否为第一轮思考，只有第一轮显示头像
    isFirstRoundThinking(message) {
      // 如果消息没有round属性或round为1，显示头像
      if (!message.round || message.round === 1) {
        return true;
      }

      // 其他情况（round > 1）不显示头像
      return false;
    },

    ensureRoundOrder(groupId) {
      if (!groupId) return;

      // 1. 找到当前组的用户消息索引
      const userMsgIndex = this.messages.findIndex(msg => msg.role === 'user' && msg.groupId === groupId);
      if (userMsgIndex === -1) return;

      // 2. 提取同组消息
      const groupMessages = this.messages.filter(msg => msg.groupId === groupId && msg !== this.messages[userMsgIndex]);

      // 3. 按round排序组内消息
      const sortedMessages = groupMessages.sort((a, b) => {
        // 确保有round属性的消息按round排序
        if (a.round && b.round) {
          if (a.round !== b.round) {
            return a.round - b.round; // 按round升序排列
          }

          // 如果round相同，thinking消息应该在assistant消息之前
          if (a.role !== b.role) {
            return a.role === 'thinking' ? -1 : 1;
          }
        }
        return 0;
      });

      // 4. 移除旧的组内消息
      this.messages = this.messages.filter(msg => msg.groupId !== groupId || msg === this.messages[userMsgIndex]);

      // 5. 在用户消息后插入排序好的消息
      this.messages.splice(userMsgIndex + 1, 0, ...sortedMessages);
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
    handleReasoningCallback(thinkingMessage, loadHide) {
      // 保存this引用以及从消息中获取groupId
      const self = this;
      const groupId = thinkingMessage.groupId;

      return (reasoning, round = 0) => {
        if (!this.firstResponseReceived) {
          loadHide(); // 收到第一个回复时隐藏加载提示
          this.firstResponseReceived = true;
        }

        const actualRound = round || 1; // 确保有有效的round值
        // 创建回合特定的思考消息ID
        const thinkingId = `${thinkingMessage.id}-round-${actualRound}`;
        let thinkingIndex = this.messages.findIndex(msg => msg.id === thinkingId);

        if (thinkingIndex === -1) {
          // 如果是新回合但不是第一个回合，则创建新的思考消息
          if (actualRound > 1) {
            const newThinkingMsg = {
              id: thinkingId,
              role: 'thinking',
              thinking: reasoning,
              round: actualRound,
              groupId: groupId  // 保持组ID一致
            };

            // 找到合适的插入位置 - 使用改进的位置查找方法
            const insertIndex = this.findInsertPositionForRound(actualRound);
            this.messages.splice(insertIndex + 1, 0, newThinkingMsg);
          } else {
            // 更新第一轮思考
            thinkingIndex = self.messages.findIndex(msg =>
              msg.id === thinkingMessage.id && msg.groupId === groupId);
            if (thinkingIndex !== -1) {
              const currentThinking = self.messages[thinkingIndex].thinking || "";
              self.messages[thinkingIndex].thinking = currentThinking + reasoning;
              self.messages[thinkingIndex].round = actualRound;
              self.messages[thinkingIndex].id = thinkingId;
            }
          }
        } else {
          // 更新现有回合的思考消息
          const currentThinking = self.messages[thinkingIndex].thinking || "";
          self.messages[thinkingIndex].thinking = currentThinking + reasoning;
        }
        self.ensureRoundOrder(groupId);
      };
    },

    // 处理回答内容回调的辅助函数
    handleReplyCallback(aiMessage, loadHide) {
      // 保存this引用以及从消息中获取groupId
      const self = this;
      const groupId = aiMessage.groupId;

      return (reply, round = 0) => {
        if (!self.firstResponseReceived) {
          loadHide();
          self.firstResponseReceived = true;
        }

        // 明确处理round信息，确保每个round都有专属消息
        const actualRound = round || 1; // 如果没有提供round，默认为第1轮
        const aiId = `${aiMessage.id}-round-${actualRound}`;
        let aiIndex = self.messages.findIndex(msg => msg.id === aiId);

        // 处理表情包数据
        if (typeof reply === 'object' && reply.type === 'emoji') {
          const emojiRound = reply.round || actualRound;
          const emojiAiId = `${aiMessage.id}-round-${emojiRound}`;
          let emojiAiIndex = self.messages.findIndex(msg => msg.id === emojiAiId);

          if (emojiAiIndex === -1) {
            // 创建新回合的AI消息
            const newAiMsg = {
              id: emojiAiId,
              role: 'assistant',
              content: '',
              emojiUrls: [reply.url],
              round: emojiRound,
              groupId: groupId  // 保持组ID一致
            };

            // 找到同一组内对应回合的思考消息
            const thinkingId = `${self.thinkingMessage.id}-round-${emojiRound}`;
            const thinkingIndex = self.messages.findIndex(msg =>
              msg.id === thinkingId && msg.groupId === groupId);

            // 如果找到了对应回合的思考消息，就在其后插入
            if (thinkingIndex !== -1) {
              self.messages.splice(thinkingIndex + 1, 0, newAiMsg);
            } else {
              // 否则使用通用定位逻辑
              const insertIndex = self.findInsertPositionForRound(emojiRound);
              self.messages.splice(insertIndex + 1, 0, newAiMsg);
            }
          } else {
            // 更新现有emoji消息
            if (!self.messages[emojiAiIndex].emojiUrls) {
              self.messages[emojiAiIndex].emojiUrls = [];
            }
            self.messages[emojiAiIndex].emojiUrls.push(reply.url);
          }
          return;
        }

        // 处理文本内容
        if (aiIndex === -1) {
          // 创建新的AI消息
          const newAiMsg = {
            id: aiId,
            role: 'assistant',
            content: reply,
            round: actualRound,
            groupId: groupId  // 保持组ID一致
          };

          // 找到同一组内对应回合的思考消息
          const thinkingId = `${self.thinkingMessage.id}-round-${actualRound}`;
          const thinkingIndex = self.messages.findIndex(msg =>
            msg.id === thinkingId && msg.groupId === groupId);

          if (thinkingIndex !== -1) {
            // 如果有对应回合的思考消息，在其后插入
            self.messages.splice(thinkingIndex + 1, 0, newAiMsg);
          } else {
            // 否则使用通用定位逻辑
            const insertIndex = self.findInsertPositionForRound(actualRound);
            self.messages.splice(insertIndex + 1, 0, newAiMsg);
          }
        } else {
          // 更新现有回合的AI消息
          const currentContent = self.messages[aiIndex].content || "";
          self.messages[aiIndex].content = currentContent + reply;
        }
        self.ensureRoundOrder(groupId);
      };
    },

    // 查找特定回合消息应该插入的位置
    findInsertPositionForRound(round, groupId) {
      // 只在当前对话组内寻找合适的位置

      // 1. 尝试找到同一组同一回合的最后一条消息
      for (let i = this.messages.length - 1; i >= 0; i--) {
        const msg = this.messages[i];
        if (msg.groupId === groupId && msg.round === round) {
          return i;
        }
      }

      // 2. 在同一组内寻找小于当前回合的最大回合消息
      let maxRound = 0;
      let maxRoundIndex = -1;

      for (let i = this.messages.length - 1; i >= 0; i--) {
        const msg = this.messages[i];
        if (msg.groupId === groupId && msg.round && msg.round < round && msg.round > maxRound) {
          maxRound = msg.round;
          maxRoundIndex = i;
        }
      }

      if (maxRoundIndex !== -1) {
        return maxRoundIndex;
      }

      // 3. 找到当前组的用户消息
      for (let i = this.messages.length - 1; i >= 0; i--) {
        const msg = this.messages[i];
        if (msg.groupId === groupId && msg.role === 'user') {
          return i;
        }
      }

      // 4. 如果都找不到，找到最近的消息位置
      return this.messages.length - 1;
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