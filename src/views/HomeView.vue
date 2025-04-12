<template>
    <contextHolder />
    <div class="home-container">
        <Flex vertical gap="large" align="center">
            <h1 class="website-title">GESeek</h1>

            <div class="sender-container">
                <Sender v-model:value="value" :loading="loading" :auto-size="{ minRows: 3, maxRows: 8 }"
                    placeholder="请输入您的问题..." @submit="handleSubmit" @cancel="() => {
                        loading = false
                        messageApi.error('Cancel sending!');
                    }">
                    <!-- 添加模型选择栏 -->
                    <template #actions>
                        <div class="sender-actions">
                            <a-select v-model="currentModel" @change="updateModel" style="width: 120px" size="small"
                                :disabled="loading">
                                <a-select-option v-for="model in models" :key="model" :value="model">
                                    {{ model }}
                                </a-select-option>
                            </a-select>
                            <a-button type="primary" @click="handleSubmit" :loading="loading" :disabled="!value.trim()"
                                size="small" class="send-button">
                                <template #icon>
                                    <SendOutlined />
                                </template>
                            </a-button>
                        </div>
                    </template>
                </Sender>
            </div>
        </Flex>

        <!-- 登录卡片弹层 -->
        <div class="login-overlay" v-if="showLoginCard">
            <LoginCard @login-success="handleLoginSuccess" @cancel="showLoginCard = false" @switch-to-register="switchToRegister" />
        </div>

        <!-- 注册卡片弹层 -->
        <div class="login-overlay" v-if="showRegisterCard">
            <RegisterCard @register-success="handleRegisterSuccess" @cancel="showRegisterCard = false" @switch-to-login="switchToLogin" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { message, Flex, Button, Select } from 'ant-design-vue';
import { SendOutlined } from '@ant-design/icons-vue';
import { Sender } from 'ant-design-x-vue';
import { onWatcherCleanup, ref, watch } from 'vue';
import LoginCard from '@/components/LoginCard.vue';
import RegisterCard from '@/components/RegisterCard.vue';
import { useModelStore } from '@/stores/modelStore';
import * as userService from '@/services/userService';

defineOptions({ name: 'AXSenderBasicSetup' });

const [messageApi, contextHolder] = message.useMessage();
const value = ref<any>('');
const loading = ref<boolean>(false);
const showLoginCard = ref<boolean>(false);
const showRegisterCard = ref<boolean>(false);

// 使用 modelStore
const modelStore = useModelStore();
const models = modelStore.models;
const currentModel = ref(modelStore.currentModel)

// 更新模型选择
const updateModel = (model: string) => {
    modelStore.switchModel(model);
};

// 处理提交
const handleSubmit = () => {


    // 检查登录状态，这里假设从localStorage获取
    const token = localStorage.getItem('token');
    console.log(token)

    if (!token) {
        // 用户未登录，显示登录卡片
        showLoginCard.value = true;
        messageApi.warning('请先登录后再发送消息');
        return;
    } else {
        // 用户已登录，继续发送消息
        const newToken = userService.refreshToken();
        console.log(newToken)
        messageApi.info(`使用 ${modelStore.currentModel} 发送消息`);
        value.value = '';
        loading.value = true;

        // 模拟发送成功
        setTimeout(() => {
            loading.value = false;
            messageApi.success('消息发送成功！');
        }, 2000);
    }

};

// 修改登录成功处理函数，接收登录结果作为参数
const handleLoginSuccess = (loginResult) => {
  // 确保登录成功
  if (loginResult) {
    showLoginCard.value = false;

    // 登录成功后自动发送消息
    messageApi.info(`使用 ${modelStore.currentModel} 发送消息`);
    value.value = '';
    loading.value = true;

    // 模拟发送成功
    setTimeout(() => {
      loading.value = false;
      messageApi.success('消息发送成功！');
    }, 2000);
  } else {
    messageApi.error('登录未完成，请重试');
  }
};

// 切换到注册卡片
const switchToRegister = () => {
  showLoginCard.value = false;
  showRegisterCard.value = true;
};

// 切换到登录卡片
const switchToLogin = () => {
  showRegisterCard.value = false;
  showLoginCard.value = true;
};

// 处理注册成功
const handleRegisterSuccess = (registerResult) => {
  if (registerResult) {
    showRegisterCard.value = false;
    messageApi.success('注册成功，请登录');
    // 可以选择自动显示登录卡片
    showLoginCard.value = true;
  } else {
    messageApi.error('注册未完成，请重试');
  }
};
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