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
                <a-avatar :size="40" src=""></a-avatar>
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
        <textarea class="message-input" placeholder="给 GEAgent 发送消息" v-model="userInput" @keydown="handleKeyDown"
          :disabled="loading" :auto-size="{ minRows: 3, maxRows: 8 }"></textarea>
        <div style="display: flex; justify-content: space-between">
          <div class="model-select">
            <!-- 模型选择 -->
            <a-select :default-value="currentModel" v-model="currentModel" @change="switchModel" style="width: 150px"
              size="small" :disabled="loading">
              <a-select-option v-for="model in models" :key="model.value" :value="model.value">
                {{ model.alias }}
              </a-select-option>
            </a-select>
          </div>
          <div class="input-actions">
            <!-- 联网搜索按钮 -->
            <button class="webServe-button" :class="{ 'active-search': webSearch }" @click="switchWebSearch"
              :disabled="loading">
              <span class="webServe-icon"><img src="/互联网搜索.svg" /></span>
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
import { chatService } from "@/services/aiService";
import { qianfanService } from "@/services/qianfanService";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { useModelStore } from "@/stores/modelStore";
import { Flex, Select, Button, message } from "ant-design-vue";
import { Sender } from "ant-design-x-vue";
import { SendOutlined } from "@ant-design/icons-vue";
import { Avatar } from "ant-design-vue";
import { createConversation, continueConversation, getConversationHistory, getConversationList } from "@/services/conversationService";
import { message as messageApi } from "ant-design-vue";
import { useConversationStore } from '@/stores/conversationStore';
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import "highlight.js/styles/github.css"

export default {
  name: "ChatView",
  components: {
    Flex,
    Select,
    Button,
    Sender,
    SendOutlined,
    Avatar,
  },
  data() {
    const modelStore = useModelStore();
    return {
      currentModel: modelStore.currentModel,
      messages: [],
      userInput: "",
      loading: false,
      webSearch: true,
      models: modelStore.models,
      modelStore,
      autoScroll: true,
      conversationId: null,
      userInput: '',
      messages: [],
      title: "新对话",
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
          // 如果有初始消息，自动发送
          if (this.$route.query.initialMessage) {
            this.userInput = this.$route.query.initialMessage;
            this.sendMessage();
          }
          try {
            const response = await getConversationHistory(newId);
            if (response.success && response.conversation.messages) {
              this.messages = [];
              this.title = response.conversation.title || "新对话";
              // 提取 role、content 和 reasoning_content 并添加到消息列表
              response.conversation.messages.forEach((msg) => {
                this.messages.push({
                  id: `${msg.id}-thinking`,
                  role: "thinking",
                  thinking: msg.reasoning_content,
                });
                this.messages.push({
                  id: msg.id,
                  role: msg.role,
                  content: msg.content,
                  thinking: msg.reasoning_content,
                });
              });
            } else {
              console.error("获取对话历史失败:", response);
              message.error("无法加载对话历史");
            }
          } catch (error) {
            console.error("加载对话历史失败:", error);
            message.error("加载对话历史失败");
          }
        }
      },
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
    frequency_penalty() {
      return useModelStore().frequency_penalty;
    },
  },

  methods: {

    handleScroll() {
      const scrollArea = this.$refs.scrollArea;
      if (!scrollArea) return;
      const isAtBottom =
        scrollArea.scrollTop >= scrollArea.scrollHeight - scrollArea.clientHeight - 5;
      this.autoScroll = isAtBottom;
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

    switchModel(value) {
      this.currentModel = value;
      this.modelStore.switchModel(value);
    },

    switchWebSearch() {
      this.webSearch = !this.webSearch;
      console.log("联网模式: " + (this.webSearch ? "开启" : "关闭"));
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
          return ""; // 如果语言不支持，返回空字符串
        },
      });
      // 解析 Markdown 文本为 HTML
      return md.render(text);
    },


    // 处理思考过程回调的辅助函数
    handleReasoningCallback(thinkingMessage, loadHide) {
      return (reasoning) => {
        const thinkingIndex = this.messages.findIndex(
          (msg) => msg.id === thinkingMessage.id
        );
        if (thinkingIndex !== -1) {
          if (!this.firstResponseReceived) {
            loadHide(); // 收到第一个回复时隐藏加载提示
            this.firstResponseReceived = true;
          }
          const currentThinking = this.messages[thinkingIndex].thinking || "";
          const newThinking = currentThinking + reasoning;
          this.messages[thinkingIndex].thinking = newThinking;
        }
      };
    },

    // 处理回答内容回调的辅助函数
    handleReplyCallback(aiMessage, loadHide) {
      return (reply) => {
        const aiIndex = this.messages.findIndex(
          (msg) => msg.id === aiMessage.id
        );
        if (aiIndex !== -1) {
          if (!this.firstResponseReceived) {
            loadHide();
            this.firstResponseReceived = true;
          }
          const currentContent = this.messages[aiIndex].content || "";
          const newContent = currentContent + reply;
          this.messages[aiIndex].content = newContent;
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

      // 创建用户消息
      const userMessage = {
        id: Date.now() + "-user",
        role: "user",
        content: this.userInput,
      };

      // 保存用户输入并清空输入框
      const userQuery = this.userInput;
      this.userInput = "";

      // 添加用户消息到消息列表
      this.messages.push(userMessage);

      // 创建思考消息
      const thinkingMessage = {
        id: Date.now() + "-thinking",
        role: "thinking",
        thinking: "",
      };

      // 创建AI回复消息
      const aiMessage = {
        id: Date.now() + "-assistant",
        role: "assistant",
        content: "",
      };

      // 添加思考消息和AI消息到消息列表
      this.messages.push(thinkingMessage);
      this.messages.push(aiMessage);

      try {
        const params = {
          message: userQuery,
          LLMID: 3,
          webSearch: this.webSearch,
          MCP: false,
        };

        // 如果没有会话ID，则创建新会话
        if (!this.conversationId) {
          params.title = this.getTitleFromMessage(userQuery);
          // 创建新会话
          const response = await createConversation(
            params,
            this.handleReasoningCallback(thinkingMessage, loadHide),
            this.handleReplyCallback(aiMessage, loadHide)
          );

          // 保存会话ID到组件状态
          this.conversationId = response?.conversationId;
          this.title = params.title; // 提取会话标题

          await getConversationList();
          console.log("创建新会话完成，会话ID:", this.conversationId);
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
  },
};
</script>

<style scoped>
@import "@/assets/styles/views/chat.css";
</style>