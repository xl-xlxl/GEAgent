<template>
  <div class="chat-container">
    <div class="messages-container">
      <div v-for="message in messages" :key="message.id" :class="{
        'message': true,
        'user-message': message.role === 'user',
        'ai-message': message.role === 'assistant'
      }">
        <div class="message-content">{{ message.content }}</div>

        <!-- 思考过程显示区域 -->
        <div v-if="message.thinking" class="thinking-box">
          <div class="thinking-title">思考过程：</div>
          <div class="thinking-content">{{ message.thinking }}</div>
        </div>
      </div>
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

      // 添加思考中的临时消息
      const thinkingMessage = {
        id: Date.now() + '-thinking',
        role: 'thinking',
        content: '思考中...',
        thinking: ''
      };
      this.messages.push(thinkingMessage);

      try {
        const messagesToSend = this.messages
          .filter(msg => msg.role !== 'thinking') // 排除思考消息
          .map(msg => ({
            role: msg.role,
            content: msg.content
          }));

        // 调用API并传入回调函数
        const aiResponse = await chatService.sendMessage(messagesToSend, (thinking) => {
          // 更新思考中消息的内容
          const index = this.messages.findIndex(msg => msg.id === thinkingMessage.id);
          if (index !== -1) {
            // 使用Vue.set或直接赋值更新对象属性，确保响应式更新
            this.$set ? this.$set(this.messages[index], 'thinking', thinking) :
              this.messages[index].thinking = thinking;
          }
        });

        // 移除思考中的临时消息
        const thinkingIndex = this.messages.findIndex(msg => msg.id === thinkingMessage.id);
        if (thinkingIndex !== -1) {
          this.messages.splice(thinkingIndex, 1);
        }

        // 添加AI的实际响应
        this.messages.push({
          ...aiResponse,
          id: Date.now() + '-assistant'
        });
      } catch (error) {
        console.error('AI响应错误:', error);

        // 移除思考中的临时消息
        const thinkingIndex = this.messages.findIndex(msg => msg.id === thinkingMessage.id);
        if (thinkingIndex !== -1) {
          this.messages.splice(thinkingIndex, 1);
        }

        // 添加错误消息
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

.thinking-message {
  background-color: rgba(230, 230, 230, 0.3);
  font-style: italic;
  border-left: 3px solid #aaa;
  padding: 10px;
  margin-bottom: 10px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 0.6;
  }
}

.thinking-box {
  margin-top: 8px;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #ccc;
  font-size: 0.9em;
}

.thinking-title {
  font-weight: 500;
  color: #666;
  margin-bottom: 4px;
  font-size: 0.9em;
}

.thinking-content {
  white-space: pre-wrap;
  color: #555;
  line-height: 1.4;
}
</style>