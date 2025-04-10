
<template>
    <contextHolder />
    <div class="home-container">
        <Flex vertical gap="large" align="center">
            <h1 class="website-title">GESeek</h1>

            <div class="sender-container">
                <Sender 
                    v-model:value="value" 
                    :loading="loading" 
                    :auto-size="{ minRows: 3, maxRows: 8 }" 
                    placeholder="请输入您的问题..."
                    @submit="handleSubmit" 
                    @cancel="() => {
                        loading = false
                        messageApi.error('Cancel sending!');
                    }" 
                >
                    <!-- 添加模型选择栏 -->
                    <template #actions>
                        <div class="sender-actions">
                            <a-select 
                                v-model:value="selectedModel" 
                                style="width: 120px" 
                                size="small"
                                :disabled="loading"
                            >
                                <a-select-option v-for="model in models" :key="model.value" :value="model.value">
                                    {{ model.label }}
                                </a-select-option>
                            </a-select>
                            <a-button 
                                type="primary" 
                                @click="handleSubmit" 
                                :loading="loading" 
                                :disabled="!value.trim()" 
                                size="small"
                                class="send-button"
                            >
                                <template #icon><SendOutlined /></template>
                            </a-button>
                        </div>
                    </template>
                </Sender>
            </div>
        </Flex>
        
        <!-- 登录卡片弹层 -->
        <div class="login-overlay" v-if="showLoginCard">
            <LoginCard @login-success="handleLoginSuccess" @cancel="showLoginCard = false" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { message, Flex, Button, Select } from 'ant-design-vue';
import {SendOutlined} from '@ant-design/icons-vue';
import { Sender } from 'ant-design-x-vue';
import { onWatcherCleanup, ref, watch } from 'vue';
import LoginCard from '@/components/LoginCard.vue';

defineOptions({ name: 'AXSenderBasicSetup' });

const [messageApi, contextHolder] = message.useMessage();

const value = ref<any>('');
const loading = ref<boolean>(false);
const showLoginCard = ref<boolean>(false);

// 添加模型选择相关数据
const selectedModel = ref('gpt-3.5-turbo');
const models = [
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'claude-3', label: 'Claude 3' },
  { value: 'gemini-pro', label: 'Gemini Pro' }
];

// 处理提交
const handleSubmit = () => {
  // 检查登录状态，这里假设从localStorage获取
  const token = localStorage.getItem('token');
  console.log(token)
  
    // 用户未登录，显示登录卡片
    showLoginCard.value = true;
    messageApi.warning('请先登录后再发送消息');
    return;
};

// 处理登录成功
const handleLoginSuccess = () => {
  showLoginCard.value = false;
  // 登录成功后自动发送消息
  
  const modelName = models.find(m => m.value === selectedModel.value)?.label || selectedModel.value;
  messageApi.info(`使用 ${modelName} 发送消息`);
  value.value = '';
  loading.value = true;
};

//mock假数据


</script>

<style scoped>
.home-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
    padding: 0 20px;
    position: relative;
}

.website-title {
    text-align: center;
    font-size: 2.5rem;
    font-weight: bold;
    color: #1890ff;
    margin-bottom: 30px;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.1);
}

.sender-container {
    width: clamp(30px, 50vw, 1000px);
    transition: width 0.3s ease;
}

.login-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

/* 添加发送区域样式 */
.sender-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

/* 发送按钮样式 */
.send-button {
    display: flex;
    align-items: center;
    justify-content: center;
}

.send-button .anticon {
    margin: 0 auto;
}
</style>