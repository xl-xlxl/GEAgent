<template>
  <div class="chat-container">
    <div class="messages-container">
      <div v-for="message in messages" :key="message.id" :class="{
        'message': true,
        'user-message': message.role === 'user',
        'ai-message': message.role === 'assistant'
      }">
        <div class="message-content">{{ message.content }}</div>
      </div>
      <div v-if="loading" class="loading-indicator">AI正在思考中...(当前阶段巨慢)</div>
    </div>

    <div class="input-container">
      <textarea v-model="userInput" placeholder="请输入您的问题..." @keydown="handleKeyDown"></textarea>
      <button @click="sendMessage" :disabled="loading">发送</button>
    </div>
  </div>
</template>

<script>
import { chatService } from '@/services/aiService';

export default {
  name: 'ChatView',
  data() {
    return {
      messages: [],
      userInput: '',
      loading: false
    };
  },
  methods: {

    handleKeyDown(event) {
      if (event.key === 'Enter') {
        if (!event.shiftKey) {
          event.preventDefault();
          this.sendMessage();
        }
        // 按下Shift+Enter时浏览器默认行为生效(插入换行符)
      }
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
      this.userInput = '';

      this.loading = true;

      try {
        const messagesToSend = this.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        const aiResponse = await chatService.sendMessage(messagesToSend);

        //AI响应信息
        this.messages.push({
          ...aiResponse,
          id: Date.now() + '-assistant'
        });
      } catch (error) {
        console.error('AI响应错误:', error);
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
.chat-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 20px;
  min-height: 300px;
}

.message {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 18px;
  word-break: break-word;
}

.user-message {
  align-self: flex-end;
  background: #1677ff;
  color: white;
}

.ai-message {
  align-self: flex-start;
  background: white;
  color: #333;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.message-content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
}

.input-container {
  display: flex;
  gap: 10px;
}

textarea {
  flex-grow: 1;
  min-height: 80px;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  resize: none;
  font-family: inherit;
}

button {
  padding: 0 20px;
  background: #1677ff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
}

.loading-indicator {
  align-self: center;
  color: #888;
  padding: 10px;
}
</style>