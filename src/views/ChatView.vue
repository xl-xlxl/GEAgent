<template>
  <div class="chat-container">
    <div class="chat-header" style="user-select: none">
      <h1>title</h1>
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
        <textarea class="message-input" placeholder="给 GESeek 发送消息" v-model="userInput" @keydown="handleKeyDown"
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
import { createConversation, continueConversation } from "@/services/conversationService";
import { message as messageApi } from "ant-design-vue";

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
      conversationId: null,
      models: modelStore.models,
      modelStore,
      autoScroll: true,
      firstResponseReceived: false,
    };
  },

  created() {
    try {
      // 安全地访问路由参数
      this.conversationId = this.$route?.params?.id || null;
      console.log("当前对话ID:", this.conversationId);

    } catch (error) {
      console.error("获取路由参数出错:", error);
      this.conversationId = null;
    }
  },

  watch: {
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

  mounted() {
    // 如果没有conversationId，可能是直接访问的，重定向到首页
    if (!this.conversationId) {
      console.warn('没有有效的会话ID，重定向到首页');
      this.$router.replace('/');
      return;
    }

    this.setupInitialMessages();
  },

  methods: {
    setupInitialMessages() {
      // 从路由查询参数获取用户消息
      const userMessageText = this.$route.query.userMessage
        ? decodeURIComponent(this.$route.query.userMessage)
        : null;
      if (userMessageText) {
        // 创建并显示消息
        this.displayUserMessage(userMessageText);
      }
      // 建立WebSocket连接获取流式响应
      this.setupWebSocketConnection();
    },

    handleScroll() {
      const scrollArea = this.$refs.scrollArea;
      if (!scrollArea) return;
      const isAtBottom =
        Math.abs(
          scrollArea.scrollHeight -
          scrollArea.scrollTop -
          scrollArea.clientHeight
        ) < 5;
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
      const rawHtml = marked.parse(text);
      return DOMPurify.sanitize(rawHtml);
    },


    // 新增方法：显示用户消息和占位符
    displayUserMessage(messageText) {
      // 创建用户消息
      const userMessage = {
        id: Date.now() + "-user",
        role: "user",
        content: messageText
      };

      const thinkingMessage = {
        id: Date.now() + "-thinking",
        role: "thinking",
        thinking: "请稍等，正在连接服务器..."
      };

      const aiMessage = {
        id: Date.now() + "-assistant",
        role: "assistant",
        content: ""
      };

      // 添加消息到列表
      this.messages.push(userMessage);
      this.messages.push(thinkingMessage);
      this.messages.push(aiMessage);

      // 滚动到底部
      this.$nextTick(() => {
        this.scrollToBottom();
      });

      return { userMessage, thinkingMessage, aiMessage };
    },

    // 新增方法：建立WebSocket连接
    setupWebSocketConnection() {
      // 使用会话ID建立连接
      const wsUrl = `wss://your-api-endpoint/stream/${this.conversationId}`;

      // 或者使用SSE（服务器发送事件）
      // const eventSource = new EventSource(`/api/stream/${this.conversationId}`);

      console.log("建立流式连接，等待服务器响应...");

      // 这里是示例代码，您需要根据实际API实现WebSocket或SSE连接
      // 实际代码可能需要处理认证、重连等问题
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
      let firstResponseReceived = false;

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
          LLMID: 0,//临时
          title: this.getTitleFromMessage(userQuery),
          webSearch: this.webSearch,
        };

        // 调用继续对话API
        const response = await continueConversation(
          params,
          this.conversationId,
          this.handleReasoningCallback(thinkingMessage, loadHide),
          this.handleReplyCallback(aiMessage, loadHide)
        );

        console.log("继续对话完成，会话ID:", this.conversationId);
      } catch (error) {
        console.error("继续对话-UI层错误:", error);
        if (error.error?.isShowable) {
          messageApi.error("服务暂时不可用，请稍后再试");
        }
        const aiIndex = this.messages.findIndex(msg => msg.id === aiMessage.id);
        if (aiIndex !== -1) {
          this.messages[aiIndex].content = "抱歉，我暂时无法回答您的问题。";
        }
      } finally {
        // 无论成功或失败，都结束加载状态
        this.loading = false;
        if (!this.firstResponseReceived && loadHide) {
          loadHide();
        }
        // 滚动到底部
        this.scrollToBottom();
      }
    }
  },
};
</script>

<style scoped>
@import "@/assets/styles/views/chat.css";
</style>