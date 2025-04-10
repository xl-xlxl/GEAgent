<template>
  <div class="chat-container">
    <div class="messages-container">
      <div v-for="message in messages" :key="message.id" :class="{
        'message': true,
        'user-message': message.role === 'user',
        'ai-message': message.role === 'assistant',
        'thinking-message': message.role === 'thinking'
      }">
        <!-- 用户消息 -->
        <div v-if="message.role === 'user'" class="message-content">
          {{ message.content }}
        </div>
        <!-- 思考过程消息 -->
        <div v-else-if="message.role === 'thinking'" class="thinking-process">
          <div class="thinking-indicator">思考中</div>
          <div class="thinking-content">{{ message.thinking }}</div>
        </div>
        <!-- AI回复消息 -->
        <div v-else-if="message.role === 'assistant'" class="ai-response">
          <div class="message-content" v-html="renderMarkdown(message.content)"></div>
        </div>
      </div>
    </div>
    <div class="input-container">
      <textarea v-model="userInput" placeholder="请输入您的问题..." @keydown="handleKeyDown"></textarea>
      <div class="model-selection">
        <label>选择模型：</label>
        <select v-model="currentModel" @change="switchModel">
          <option v-for="model in models" :key="model" :value="model">
            {{ model }}
          </option>
        </select>
      </div>
      <button :class="['network', webSearch ? 'blue' : 'gray']" @click="switchWebSearch">联网搜索</button>
      <button class="mr-4" @click="sendMessage" :disabled="loading">发送</button>
    </div>
  </div>
</template>

<script>
import { chatService } from '@/services/aiService';
import { qianfanService } from '@/services/qianfanService';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useModelStore } from "@/stores/modelStore";

export default {
  name: 'ChatView',
  data() {
    const modelStore = useModelStore();
    return {
      messages: [],
      userInput: '',
      loading: false,
      webSearch: false,
      conversationId: null,
      currentModel: modelStore.currentModel,
      models: modelStore.models,
      modelStore,
    };
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
  },

  methods: {
    switchModel() {
      this.modelStore.switchModel(this.currentModel);
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
        console.log('现在的最大token数:', this.max_tokens);
        console.log('现在的temperature:', this.temperature);
        console.log('现在的top_p:', this.top_p);
        console.log('现在的top_k:', this.top_k);

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

        const aiResponse = await chatService.sendMessage(
          messagesToSend,
          // 思考过程回调
          (reasoning) => {
            const thinkingIndex = this.messages.findIndex(msg => msg.id === thinkingMessage.id);
            if (thinkingIndex !== -1) {
              const currentThinking = this.messages[thinkingIndex].thinking || '';
              const newThinking = currentThinking + reasoning;
              this.messages[thinkingIndex].thinking = newThinking;
            }
          },
          // 回答内容回调
          (reply) => {
            const aiIndex = this.messages.findIndex(msg => msg.id === aiMessage.id);
            if (aiIndex !== -1) {
              const currentContent = this.messages[aiIndex].content || '';
              const newContent = currentContent + reply;
              this.messages[aiIndex].content = newContent;
            }
          }
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