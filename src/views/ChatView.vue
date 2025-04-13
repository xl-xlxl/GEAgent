<template>
  <div class="chat-container">
    <div class="chat-header" style=" user-select: none;">
      <h1>title</h1>
    </div>
    <div class="scroll-container" ref="scrollArea" @scroll="handleScroll">
      <!-- 消息区域 -->
      <div class="messages-area">
        <template v-for="message in messages" :key="message.id">
          <div v-if="message.role === 'user' ||
            (message.role === 'thinking') ||
            (message.role === 'assistant' && message.content)" :class="{
              'message': true,
              'user-message': message.role === 'user',
              'ai-message': message.role === 'assistant',
              'thinking-message': message.role === 'thinking'
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
            <div v-if="message.role === 'thinking' && message.thinking && message.thinking.trim().length > 0"
              class="thinking-message-container">
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
        <div style="display: flex;justify-content: space-between;">
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
              <span class="webServe-icon"><img src="/互联网搜索.svg"></span>
              联网搜索
            </button>
            <!-- 发送按钮 -->
            <button class="send-button" @click="sendMessage" :disabled="!userInput.trim() || loading">
              <span class="send-icon"><img src="/发送.svg"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { chatService } from '@/services/aiService';
import { qianfanService } from '@/services/qianfanService';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useModelStore } from "@/stores/modelStore";
import { Flex, Select, Button, message } from 'ant-design-vue';
import { Sender } from 'ant-design-x-vue';
import { SendOutlined } from '@ant-design/icons-vue';
import { Avatar } from 'ant-design-vue';

export default {
  name: 'ChatView',
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
      userInput: '',
      loading: false,
      webSearch: true,
      conversationId: null,
      models: modelStore.models,
      modelStore,
      autoScroll: true,
    };
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

  methods: {
    handleScroll() {
      const scrollArea = this.$refs.scrollArea;
      if (!scrollArea) return;
      const isAtBottom = Math.abs(scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight) < 5;
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
      const currentIndex = this.messages.findIndex(msg => msg.id === currentMessage.id);
      if (currentIndex === -1) return false;
      for (let i = currentIndex - 1; i >= 0; i--) {
        const msg = this.messages[i];
        if (msg.role === 'user') {
          return false;
        }
        if (msg.role === 'thinking' && msg.thinking && msg.thinking.trim().length > 0) {
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
      console.log('联网模式: ' + (this.webSearch ? '开启' : '关闭'));
    },

    handleKeyDown(event) {
      if (event.key === 'Enter') {
        if (!event.shiftKey) {
          event.preventDefault();
          this.sendMessage();
        }
        // 按下Shift+Enter时浏览器默认行为生效(插入换行符)
      }
    },

    renderMarkdown(text) {
      if (!text) return '';
      const rawHtml = marked.parse(text);
      return DOMPurify.sanitize(rawHtml);
    },

    async sendMessage() {
      if (!this.userInput.trim() || this.loading) return;

      // 显示加载消息
      const loadHide = message.loading('正在思考中...', 0);
      //用户消息
      const userMessage = {
        id: Date.now() + '-user',
        role: 'user',
        content: this.userInput
      };
      this.messages.push(userMessage);
      this.loading = true;
      const userQuery = this.userInput;
      this.userInput = '';

      //思考过程消息
      const thinkingMessage = {
        id: Date.now() + '-thinking',
        role: 'thinking',
        thinking: ''
      };
      this.messages.push(thinkingMessage);

      //ai回复消息
      const aiMessage = {
        id: Date.now() + '-assistant',
        role: 'assistant',
        content: ''
      };
      this.messages.push(aiMessage);

      try {
        console.log('当前模型:', this.currentModel);
        console.log('现在的max_tokens:', this.max_tokens);
        console.log('现在的temperature:', this.temperature);
        console.log('现在的top_p:', this.top_p);
        console.log('现在的top_k:', this.top_k);
        console.log('现在的frequency_penalty:', this.frequency_penalty);

        let messagesToSend = [];
        // 如果启用了联网功能，先通过千帆API获取信息
        if (this.webSearch) {
          try {
            if (!this.conversationId) {
              this.conversationId = await qianfanService.getConversationId();
            }
            const qianfanResponse = await qianfanService.sendMessage(userQuery, this.conversationId);
            // 构建包含联网信息的消息
            messagesToSend = [
              ...this.messages
                .slice(-5)
                .filter(msg => msg.role !== 'thinking')
                .map(msg => ({
                  role: msg.role,
                  content: msg.content
                })),
              {
                role: 'system',
                content: `以下是来自互联网查询的结果，请基于这些信息回答用户的问题：\n${qianfanResponse}`
              }
            ];
          }
          catch (error) {
            // 联网失败时回退到常规模式
            messagesToSend = this.messages
              .slice(-5)
              .filter(msg => msg.role !== 'thinking')
              .map(msg => ({
                role: msg.role,
                content: msg.content
              }));
          }
        }
        else {
          // 不使用联网功能
          messagesToSend = this.messages
            .filter(msg => msg.role !== 'thinking')
            .map(msg => ({
              role: msg.role,
              content: msg.content
            }));
        }
        // 添加标志跟踪是否已收到第一个响应
        let firstResponseReceived = false;
        const aiResponse = await chatService.sendMessage(
          messagesToSend,
          // 思考过程回调
          (reasoning) => {
            const thinkingIndex = this.messages.findIndex(msg => msg.id === thinkingMessage.id);
            if (thinkingIndex !== -1) {
              if (!firstResponseReceived) {
                loadHide(); // 收到第一个思考内容时隐藏加载消息
                firstResponseReceived = true;
              }
              const currentThinking = this.messages[thinkingIndex].thinking || '';
              const newThinking = currentThinking + reasoning;
              this.messages[thinkingIndex].thinking = newThinking;
            }
          },
          // 回答内容回调
          (reply) => {
            if (!firstResponseReceived) {
              loadHide(); // 收到第一个回答内容时隐藏加载消息
              firstResponseReceived = true;
            }
            const aiIndex = this.messages.findIndex(msg => msg.id === aiMessage.id);
            if (aiIndex !== -1) {
              const currentContent = this.messages[aiIndex].content || '';
              const newContent = currentContent + reply;
              this.messages[aiIndex].content = newContent;
            }
          },
        );

      } catch (error) {
        console.error('AI响应错误:', error);
        const thinkingIndex = this.messages.findIndex(msg => msg.id === thinkingMessage.id);
        if (thinkingIndex !== -1) {
          this.messages[thinkingIndex].thinking = '思考过程中断: ' + error.message;
        }
        this.messages.push({
          id: Date.now() + '-error',
          role: 'assistant',
          content: `抱歉，发生了错误: ${error.message || '请求失败'}`
        });
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
@import '@/assets/styles/views/chat.css';
</style>