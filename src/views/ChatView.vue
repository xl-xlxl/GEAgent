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
                <img 
      v-if="message.emojiUrl" 
      :src="message.emojiUrl" 
      class="message-emoji" 
      alt="表情" 
      @load="() => console.log('表情加载成功')"
      @error="() => console.error('表情加载失败:', message.emojiUrl)"
    />
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
            <a-select style="width: 150px" size="small" :disabled="loading" v-model:value="modelStore.currentModel"
              @change="handleModelChange">
              <a-select-option v-for="model in modelStore.models" :key="model.value" :value="model.LLMID">
                {{ model.value }}
              </a-select-option>
            </a-select>
          </div>
          <div class="input-actions">
            <!-- MCP按钮 -->
            <button class="feature-button" :class="{ 'active-feature': enableMCPService }" @click="switchMCPService"
              :disabled="loading">
              <span class="feature-icon"><img src="/MCP服务.svg" /></span>
              Function Call
            </button>
            <!-- 联网搜索按钮 -->
            <button class="feature-button" :class="{ 'active-feature': webSearch }" @click="switchWebSearch"
              :disabled="loading">
              <span class="feature-icon"><img src="/互联网搜索.svg" /></span>
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
import { useFeatureStore } from "@/stores/featureStore";
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
          // 使用路由查询参数中的标题
          if (this.$route.query.title) {
            this.title = this.$route.query.title;
          }
          // 如果有初始消息，自动发送
          if (this.$route.query.initialMessage) {
            this.userInput = this.$route.query.initialMessage;
            this.sendMessage();
          }
          try {
            const response = await getConversationHistory(newId);
            if (response.success && response.conversation.messages) {
              this.messages = [];
              // 直接使用API层处理好的消息格式
              this.messages = response.conversation.messages;
              await this.processHistoryEmoji();

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
    frequency_penalty() {
      return useModelStore().frequency_penalty;
    },
    webSearch() {
      return this.featureStore.webSearch;
    },
    enableMCPService() {
      return this.featureStore.enableMCPService;
    },
  },

  methods: {
    handleModelChange(modelId) {
      this.modelStore.switchModel(modelId);
      console.log(`已切换到模型ID: ${modelId}, 模型名称: ${this.modelStore.getCurrentModel.value}`);
    },

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

    switchWebSearch() {
      this.featureStore.webSearch = !this.featureStore.webSearch;
      console.log("联网模式: " + (this.featureStore.webSearch ? "开启" : "关闭"));
    },

    switchMCPService() {
      this.featureStore.enableMCPService = !this.featureStore.enableMCPService;
      console.log("MCP服务: " + (this.featureStore.enableMCPService ? "开启" : "关闭"));
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
  return (reply, rawData) => {
    const aiIndex = this.messages.findIndex(
      (msg) => msg.id === aiMessage.id
    );
    if (aiIndex !== -1) {
      if (!this.firstResponseReceived) {
        loadHide();
        this.firstResponseReceived = true;
      }
      
      // 处理常规回复
      if (typeof reply === 'string' && reply) {
        const currentContent = this.messages[aiIndex].content || "";
        const newContent = currentContent + reply;
        this.messages[aiIndex].content = newContent;
      }
      
      // 处理表情包信息 (确保 rawData 存在)
      if (rawData && typeof rawData === 'string') {
        // 检查是否包含表情包相关数据
        if (rawData.includes('extraCall') || rawData.includes('emojiPack')) {
          this.handleEmojiPack(rawData, aiMessage.id);
        }
      }
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
          LLMID: this.modelStore.currentModel,
          webSearch: this.featureStore.webSearch,
          enableMCPService: this.featureStore.enableMCPService,
        };

        console.log("发送请求参数:", params); // 添加参数日志

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
              this.title = params.title; // 提取会话标题

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

    // 添加加载更多历史消息的方法
    async loadMoreHistory(page) {
      if (!this.conversationId) return;
      try {
        const response = await getConversationHistory(this.conversationId, page);
        if (response.success && response.conversation.messages) {
          // API层已经处理了消息格式，这里只需添加到消息列表
          const historyMessages = response.conversation.messages;

          // 将历史消息添加到当前消息列表的开头
          this.messages.unshift(...historyMessages);

          // 处理新加载的历史消息中的表情包
  await this.processHistoryEmoji();

          // 更新分页信息
          this.pagination = response.pagination;
        }
      } catch (error) {
        console.error("加载更多对话历史失败:", error);
        message.error("加载更多历史失败");
      }
    },

    parseExtraCall(dataString) {
  try {
    // 移除数据前缀 "data: "
    const jsonString = dataString.replace(/^data:\s/, '');
    const data = JSON.parse(jsonString);
    
    // 检查是否是extraCall
    if (data.extraCall) {
      return data.extraCall;
    }
    
    // 检查是否是MCPStatus中包含表情包信息
    if (data.MCPStatus && data.MCPStatus.fnCall && data.MCPStatus.fnCall.length > 0) {
      // 查找emojiPack函数调用
      const emojiCall = data.MCPStatus.fnCall.find(call => call.name === 'emojiPack');
      if (emojiCall) {
        return {
          name: emojiCall.name,
          arguments: emojiCall.arguments
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('解析extraCall失败:', error, dataString);
    return null;
  }
},

// 处理表情包数据
async handleEmojiPack(rawData, aiMessageId) {
  try {
    // 查找当前的AI消息
    const aiIndex = this.messages.findIndex(msg => msg.id === aiMessageId);
    if (aiIndex === -1) {
      console.error('未找到对应ID的AI消息:', aiMessageId);
      return;
    }
    
    // 解析原始数据
    const extraCall = this.parseExtraCall(rawData);
    
    if (extraCall && extraCall.name === 'emojiPack') {
      const id = extraCall.arguments.id;
      console.log('表情包ID:', id);
      
      // 获取随机表情图片URL
      const emojiUrl = await this.getRandomEmoji(id);
      
      if (emojiUrl) {
        // 更新消息对象，添加表情URL
        this.messages[aiIndex].emojiUrl = emojiUrl;
      }
    }
  } catch (error) {
    console.error('处理表情包数据失败:', error);
  }
},

// 获取指定文件夹中的随机表情包
async getRandomEmoji(id) {
  try {
    // 构建表情包基础路径
    const basePath = `/静态 - 压缩/${id}/`;
    
    // 定义每个ID文件夹中的表情数量
    const emojiCounts = {
      0: 17, // ID为0的文件夹有17个表情
      1: 13, 
      2: 13,
      3: 22,
      4: 21,
      5: 19,
      6: 6,
      7: 16,
      8: 24,
      9: 27,
      10: 4,
      11: 24,
      12: 23,
      // 可以根据实际文件夹添加更多
    };
    
    const count = emojiCounts[id];
    if (!count) {
      console.error(`没有找到ID为${id}的表情包文件夹或表情数量未定义`);
      return null;
    }
    
    // 生成1到count的随机数
    const randomIndex = Math.floor(Math.random() * count) + 1;
    return `${basePath}${randomIndex}.webp`;
  } catch (error) {
    console.error('获取随机表情包失败:', error);
    return null;
  }
},

async processHistoryEmoji() {
  try {
    console.log('开始处理历史消息中的表情包');
    let updatedCount = 0;
    
    // 遍历所有消息
    for (const message of this.messages) {
      // 检查消息是否包含 mcp_service_status 字段中的表情包信息
      if (message.role === 'assistant' && message.mcp_service_status && !message.emojiUrl) {
        try {
          const mcpStatus = typeof message.mcp_service_status === 'string'
            ? JSON.parse(message.mcp_service_status)
            : message.mcp_service_status;
            
          // 查找 fnCall 数组中的 emojiPack 调用
          if (mcpStatus.fnCall && Array.isArray(mcpStatus.fnCall)) {
            const emojiCall = mcpStatus.fnCall.find(call => call.name === 'emojiPack');
            if (emojiCall && emojiCall.arguments && emojiCall.arguments.id !== undefined) {
              const emojiId = emojiCall.arguments.id;
              console.log(`历史消息ID ${message.id} 包含表情包ID: ${emojiId}`);
              
              // 获取表情包URL
              const emojiUrl = await this.getRandomEmoji(emojiId);
              if (emojiUrl) {
                console.log(`为历史消息设置表情URL: ${emojiUrl}`);
                message.emojiUrl = emojiUrl;
                updatedCount++;
              }
            }
          }
        } catch (e) {
          console.error('解析历史消息中的 mcp_service_status 失败:', e);
        }
      }
      
      // 检查消息是否包含 emojiId 字段
      else if (message.role === 'assistant' && message.emojiId !== undefined && !message.emojiUrl) {
        console.log(`历史消息ID ${message.id} 包含直接的表情ID: ${message.emojiId}`);
        const emojiUrl = await this.getRandomEmoji(message.emojiId);
        if (emojiUrl) {
          console.log(`为历史消息设置表情URL: ${emojiUrl}`);
          message.emojiUrl = emojiUrl;
          updatedCount++;
        }
      }
    }
    
    console.log(`历史消息处理完成，更新了 ${updatedCount} 条消息的表情`);
  } catch (error) {
    console.error('处理历史消息表情包时出错:', error);
  }
},

  },
};
</script>

<style scoped>
@import "@/assets/styles/views/chat.css";
</style>