<template>
    <contextHolder />
    <div class="home-container">

        <div class="input-area">
            <h1 class="website-title">GEAgent</h1>
            <div class="input-container">
                <!-- 输入栏 -->
                <textarea class="message-input" placeholder="给 GEAgent 发送消息" v-model="userInput" @submit="handleSubmit"
                    @keydown="handleKeyDown" :disabled="loading" :auto-size="{ minRows: 3, maxRows: 8 }"></textarea>
                <div style="display: flex;justify-content: space-between;">
                    <div class="model-select">
                        <!-- 模型选择 -->
                        <a-select v-model:value="modelStore.currentModel" style="width: 150px" size="small"
                            :disabled="loading"
                            @change="(currentModel) => modelStore.currentModel = Number(currentModel)">
                            <a-select-option v-for="model in modelStore.models" :key="model.value" :value="model.LLMID">
                                {{ model.value }}
                            </a-select-option>
                        </a-select>
                    </div>
                    <div class="input-actions">
                        <!-- MCP按钮 -->
                        <button class="feature-button" :class="{ 'active-feature': enableMCPService }"
                            @click="() => featureStore.enableMCPService = !featureStore.enableMCPService"
                            :disabled="loading">
                            <span class="MCP-icon"><img src="/mcp.svg" /></span>
                            MCP Services
                        </button>
                        <!-- 联网搜索按钮 -->
                        <button class="feature-button" :class="{ 'active-feature': webSearch }"
                            @click="() => featureStore.webSearch = !featureStore.webSearch" :disabled="loading">
                            <span class="web-icon"><img src="/互联网搜索.svg" /></span>
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
        <div class="login-overlay" v-if="showLoginCard" @click="closeAllCards">
            <LoginCard 
                @login-success="handleLoginSuccess" 
                @cancel="showLoginCard = false"
                @switch-to-register="switchToRegister" 
                @switch-to-emailLogin="switchToEmailLogin"
                @switch-to-reset-password="switchToResetPassword"
            />
        </div>

        <!-- 注册卡片弹层 -->
        <div class="login-overlay" v-if="showRegisterCard" @click="closeAllCards">
            <RegisterCard 
                @register-success="handleRegisterSuccess" 
                @cancel="showRegisterCard = false"
                @switch-to-login="switchToLogin" 
            />
        </div>

        <!-- 邮箱登录卡片弹层 -->
        <div class="login-overlay" v-if="showEmailLoginCard" @click="closeAllCards">
            <LoginByEmail 
                @login-success="handleEmailLoginSuccess" 
                @cancel="showEmailLoginCard = false"
                @switch-to-login="switchToLogin"
                @switch-to-register="switchToRegister"
                @switch-to-reset-password="switchToResetPassword"
            />
        </div>

        <!-- 重置密码卡片弹层 -->
        <div class="login-overlay" v-if="showResetPasswordCard" @click="closeAllCards">
            <ResetPassword
                @reset-success="handleResetSuccess"
                @cancel="showResetPasswordCard = false"
                @switch-to-login="switchToLogin"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue';
import { onMounted, ref, watch, computed } from 'vue';
import LoginCard from '@/components/LoginCard.vue';
import RegisterCard from '@/components/RegisterCard.vue';
import LoginByEmail from '@/components/LoginByEmail.vue';
import ResetPassword from '@/components/ResetPassword.vue';
import { useModelStore } from '@/stores/modelStore';
import { useFeatureStore } from "@/stores/featureStore";
import { useUserStore } from '@/stores/userStore';
import { useRouter } from 'vue-router';
import { useConversationStore } from '@/stores/conversationStore';

const [messageApi, contextHolder] = message.useMessage();
const userInput = ref<any>('');
const loading = ref<boolean>(false);
const showLoginCard = ref<boolean>(false);
const showRegisterCard = ref<boolean>(false);
const showEmailLoginCard = ref<boolean>(false); // 添加邮箱登录显示状态
const showResetPasswordCard = ref<boolean>(false); // 添加重置密码显示状态

const router = useRouter();

const modelStore = useModelStore();

const userStore = useUserStore();
// 使用 featureStore 替换本地状态
const featureStore = useFeatureStore();
// 使用计算属性获取状态
const webSearch = computed(() => featureStore.webSearch);
const enableMCPService = computed(() => featureStore.enableMCPService);

// 切换联网搜索模式
const switchWebSearch = () => {
    featureStore.webSearch = !featureStore.webSearch;
    console.log('联网模式: ' + (featureStore.webSearch ? '开启' : '关闭'));
};

// 切换MCP服务
const switchMCPService = () => {
    featureStore.enableMCPService = !featureStore.enableMCPService;
    console.log('MCP服务: ' + (featureStore.enableMCPService ? '开启' : '关闭'));
};

// 处理提交
const handleSubmit = async () => {
    if (!userInput.value.trim() || loading.value) return;

    if (!localStorage.getItem('token')) {
        userStore.logout();
    }

    if (!userStore.loggedIn) {
        // 用户未登录，显示登录卡片
        showLoginCard.value = true;
        messageApi.warning('请先登录后再发送消息');
        return;
    }

    // 保存消息内容
    const messageContent = userInput.value.trim();
    userInput.value = '';

    try {
        // 将初始消息存储到状态管理中
        const conversationStore = useConversationStore();
        conversationStore.setInitialMessage(messageContent);
        router.push('/chat');
        // 刷新对话列表
    } catch (error) {
        console.error("跳转到聊天页面失败：", error);
        messageApi.error("无法跳转到聊天页面，请稍后再试");
    }
};

// 登录成功处理函数
const handleLoginSuccess = (loginResult) => {
    // 确保登录成功
    if (loginResult) {
        showLoginCard.value = false;
        // 登录成功后自动弹窗消息
        messageApi.success('登录成功！');

        // 如果输入框有内容，尝试发送消息
        if (userInput.value.trim()) {
            handleSubmit();
        }
    } else {
        messageApi.error('登录未完成，请重试');
    }
};

// 邮箱登录成功处理函数
const handleEmailLoginSuccess = (loginResult) => {
    // 确保登录成功
    if (loginResult) {
        showEmailLoginCard.value = false;
        // 登录成功后自动弹窗消息
        messageApi.success('登录成功！');

        // 如果输入框有内容，尝试发送消息
        if (userInput.value.trim()) {
            handleSubmit();
        }
    } else {
        messageApi.error('登录未完成，请重试');
    }
};

// 处理密码重置成功
const handleResetSuccess = () => {
    showResetPasswordCard.value = false;
    messageApi.success('密码重置成功，请使用新密码登录');
    showLoginCard.value = true;
};

// 切换到注册卡片
const switchToRegister = () => {
    showLoginCard.value = false;
    showEmailLoginCard.value = false;
    showResetPasswordCard.value = false;
    showRegisterCard.value = true;
};

// 切换到登录卡片
const switchToLogin = () => {
    showRegisterCard.value = false;
    showEmailLoginCard.value = false;
    showResetPasswordCard.value = false;
    showLoginCard.value = true;
};

// 切换到邮箱登录卡片
const switchToEmailLogin = () => {
    showLoginCard.value = false;
    showRegisterCard.value = false;
    showResetPasswordCard.value = false;
    showEmailLoginCard.value = true;
};

// 切换到重置密码卡片
const switchToResetPassword = () => {
    showLoginCard.value = false;
    showRegisterCard.value = false;
    showEmailLoginCard.value = false;
    showResetPasswordCard.value = true;
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

// 添加关闭所有卡片的方法
const closeAllCards = (event) => {
    // 确保点击的是背景而不是卡片内容
    if (event.target.classList.contains('login-overlay')) {
        showLoginCard.value = false;
        showRegisterCard.value = false;
        showEmailLoginCard.value = false;
        showResetPasswordCard.value = false;
    }
};

console.log(userStore.showLogin);
// 监听userStore中的showLogin状态
watch(() => userStore.showLogin, (newVal) => {
    if (newVal) {
        showLoginCard.value = true;
        // 重置状态，避免影响下次操作
        userStore.showLogin = false;
    }
});

// 组件挂载时检查状态
onMounted(() => {
    if (userStore.showLogin) {
        showLoginCard.value = true;
        userStore.showLogin = false;
    }
});
</script>

<style scoped>
@import '@/assets/styles/views/home.css';
</style>