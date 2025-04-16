<template>
    <contextHolder />
    <div class="home-container">

        <div class="input-area">
            <h1 class="website-title">GESeek</h1>
            <div class="input-container">
                <!-- 输入栏 -->
                <textarea class="message-input" placeholder="给 GESeek 发送消息" v-model="userInput" @submit="handleSubmit"
                    @keydown="handleKeyDown" :disabled="loading" :auto-size="{ minRows: 3, maxRows: 8 }"></textarea>
                <div style="display: flex;justify-content: space-between;">
                    <div class="model-select">
                        <!-- 模型选择 -->
                        <a-select :default-value="currentModel" v-model="currentModel" @change="switchModel"
                            style=" width: 150px" size="small" :disabled="loading">
                            <a-select-option v-for="model in models" :key="model.value" :value="model.value">
                                {{ model.alias }}
                            </a-select-option>
                        </a-select>
                    </div>
                    <div class="input-actions">
                        <!-- 联网搜索按钮 -->
                        <button class="webServe-button" :disabled="loading" :class="{ 'active-search': webSearch }"
                            @click="switchWebSearch">
                            <span class="webServe-icon"><img src="/互联网搜索.svg"></span>
                            联网搜索
                        </button>
                        <!-- 发送按钮 -->
                        <button class="send-button" @click="handleSubmit" :disabled="!userInput.trim() || loading">
                            <span class="send-icon"><img src="/发送.svg"></span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 登录卡片弹层 -->
        <div class="login-overlay" v-if="showLoginCard">
            <LoginCard @login-success="handleLoginSuccess" @cancel="showLoginCard = false"
                @switch-to-register="switchToRegister" />
        </div>

        <!-- 注册卡片弹层 -->
        <div class="login-overlay" v-if="showRegisterCard">
            <RegisterCard @register-success="handleRegisterSuccess" @cancel="showRegisterCard = false"
                @switch-to-login="switchToLogin" />
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
import { useUserStore } from '@/stores/userStore';
import * as userService from '@/services/userService';

defineOptions({ name: 'AXSenderBasicSetup' });

const [messageApi, contextHolder] = message.useMessage();
const userInput = ref<any>('');
const loading = ref<boolean>(false);
const showLoginCard = ref<boolean>(false);
const showRegisterCard = ref<boolean>(false);
// 临时写一个无意义的变量，后续会改为真正的联网搜索功能
const webSearch = ref<boolean>(false);

// 使用 modelStore
const modelStore = useModelStore();
const models = modelStore.models;
const currentModel = ref(modelStore.currentModel)

// 更新模型选择
const switchModel = (value: string) => {//统一命名为switchModel
    currentModel.value = value;
    modelStore.switchModel(value);
};

// 处理提交
const handleSubmit = async () => {
    const userStore = useUserStore();

    // 检查输入是否为空
    if (!userInput.value.trim() || loading.value) return;

    // 检查token是否存在，如果不存在则通过store的action更新登录状态
    if (!localStorage.getItem('token')) {
        userStore.logout();
    }

    if (!userStore.loggedIn) {
        // 用户未登录，显示登录卡片
        showLoginCard.value = true;
        messageApi.warning('请先登录后再发送消息');
        return;
    }

    // 重要：先保存消息内容，再清空输入框
    const messageContent = userInput.value.trim();
    userInput.value = '';

    // 用户已登录，继续发送消息
    loading.value = true;
    const loadHide = messageApi.loading("创建会话中...", 0);
    
};

// 修改登录成功处理函数，接收登录结果作为参数
const handleLoginSuccess = (loginResult) => {
    // 确保登录成功
    if (loginResult) {
        showLoginCard.value = false;
        // 登录成功后自动弹窗消息
        messageApi.success('登录成功！');

        // 如果输入框有内容，尝试发送消息
        if (userInput.value.trim()) {
            // 延迟一点执行提交，给用户看到登录成功消息的时间
            handleSubmit();
        }
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

// 处理键盘事件
const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
        if (!event.shiftKey) {
            event.preventDefault();
            handleSubmit();
        }
        // 按下Shift+Enter时浏览器默认行为生效(插入换行符)
    }
};

// 切换联网搜索模式
const switchWebSearch = () => {
    webSearch.value = !webSearch.value;
    console.log('联网模式: ' + (webSearch.value ? '开启' : '关闭'));
};
</script>

<style scoped>
@import '@/assets/styles/views/home.css';

.home-container {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
}

.website-title {
    text-align: center;
    font-size: 2.5rem;
    font-weight: bold;
    color: #1890ff;
    margin-bottom: 30px;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.1);
    user-select: none;
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
</style>