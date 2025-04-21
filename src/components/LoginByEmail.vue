<template>
    <div class="login-card-container" @click.stop>
      <a-card class="login-card">
        <template #cover>
          <div class="card-cover">
            <h1 class="website-title">GEAgent</h1>
          </div>
        </template>
        
        <h2 class="login-title">邮箱登录</h2>
        <a-form :model="loginForm" @finish="handleEmailLogin" layout="vertical">
          <a-form-item name="email" :rules="[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]">
            <a-input v-model:value="loginForm.email" placeholder="邮箱" size="large">
              <template #prefix><mail-outlined /></template>
            </a-input>
          </a-form-item>
          
          <a-form-item name="code" :rules="[
            { required: true, message: '请输入验证码' },
            { len: 6, message: '验证码长度必须为6位' }
          ]">
            <div class="verification-code-container">
              <a-input v-model:value="loginForm.code" placeholder="验证码" size="large">
                <template #prefix><safety-outlined /></template>
              </a-input>
              <a-button 
                type="primary" 
                :disabled="codeSending || countdown > 0" 
                @click="sendVerificationCode"
                size="large"
                class="code-button"
              >
                {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
              </a-button>
            </div>
          </a-form-item>
          
          <a-form-item class="links-container">
            <a-row :gutter="8" style="display: flex; justify-content: space-between;">
              <div class="emailLogin-link">
                <a href="#" @click.prevent="$emit('switch-to-login')">账号密码登录</a>
              </div>
              <div class="resetPassword-link">
                <a href="#" @click.prevent="$emit('switch-to-reset-password')">忘记密码？</a>
              </div>
            </a-row>
          </a-form-item>
          
          <a-form-item>
            <a-button type="primary" html-type="submit" :loading="loading" block size="large">
              登录
            </a-button>
          </a-form-item>
          
          <a-form-item>
            <a-button @click="$emit('cancel')" block>取消</a-button>
          </a-form-item>
          
          <div class="register-link">
            还没有账号？<a href="#" @click.prevent="$emit('switch-to-register')">立即注册</a>
          </div>
        </a-form>
      </a-card>
    </div>
    <contextHolder />
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  import { message, Form, Input, Button, Card, Row, Col } from 'ant-design-vue';
  import { MailOutlined, SafetyOutlined } from '@ant-design/icons-vue';
  import * as userService from '@/services/userService';
  import { useUserStore } from '@/stores/userStore';
  
  defineOptions({ name: 'LoginByEmail' });
  
  const [messageApi, contextHolder] = message.useMessage();
  const userStore = useUserStore();
  const loading = ref<boolean>(false);
  const codeSending = ref<boolean>(false);
  const countdown = ref<number>(0);
  
  const loginForm = ref({
    email: '',
    code: '',
  });
  
  const emit = defineEmits(['login-success', 'cancel', 'switch-to-register', 'switch-to-login', 'switch-to-reset-password']);
  
  // 发送验证码
  const sendVerificationCode = async () => {
    if (!loginForm.value.email) {
      messageApi.error('请先输入邮箱地址');
      return;
    }
    
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailPattern.test(loginForm.value.email)) {
      messageApi.error('请输入有效的邮箱地址');
      return;
    }
    
    codeSending.value = true;
    try {
      const credential = {
        purpose: 'login',
        email: loginForm.value.email,
      };
      // 调用发送登录验证码API
      const result = await userService.sendVerificationCode(credential);
      if (result && result.success=== true) {
        messageApi.success('验证码已发送，请查收邮件');
        // 开始倒计时
        countdown.value = 60;
        const timer = setInterval(() => {
          countdown.value--;
          if (countdown.value <= 0) {
            clearInterval(timer);
          }
        }, 1000);
      } else {
        messageApi.error(result?.message || '发送验证码失败，请稍后重试');
      }
    } catch (error) {
      console.error('发送验证码失败:', error);
      messageApi.error('发送验证码失败，请稍后重试');
    } finally {
      codeSending.value = false;
    }
  };
  
  // 处理邮箱登录
  const handleEmailLogin = async () => {
    loading.value = true;
    try {
      const emailLoginData = {
        email: loginForm.value.email,
        code: loginForm.value.code
      };
      
      const loginRes = await userStore.emailLogin(emailLoginData);
      if (loginRes.success === true) {
        await messageApi.success('登录成功！');
        emit('login-success', loginRes);
      } else {
        messageApi.error(loginRes.error?.message || '登录失败');
      }
    } catch (error) {
      messageApi.error('服务器错误');
      console.error('邮箱登录错误:', error);
    } finally {
      loading.value = false;
    }
  };
  </script>
  
  <style scoped>
  .login-card-container {
    animation: fadeIn 0.3s;
  }
  
  .login-card {
    width: 380px;
    border-radius: 18px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .card-cover {
    height: 120px;
    background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 20px 8px 0 0;
  }
  
  .website-title {
    text-align: center;
    font-size: 2.2rem;
    font-weight: bold;
    color: white;
    margin-bottom: 5px;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
  }
  
  .login-title {
    text-align: center;
    margin: 0 0 24px;
    color: rgba(0, 0, 0, 0.85);
    font-weight: 600;
    font-size: 1.5rem;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .register-link {
    text-align: center;
    margin-top: 16px;
  }
  
  .links-container {
    margin-bottom: 10px;
    margin-top: -10px;
  }
  
  .emailLogin-link {
    text-align: left;
    margin-top: 0;
    padding-left: 8px;
  }
  
  .resetPassword-link {
    text-align: right;
    margin-top: 0;
    padding-right: 8px;
  }
  
  /* 验证码输入框容器样式 */
  .verification-code-container {
    display: flex;
    gap: 8px;
  }
  
  .verification-code-container .ant-input-affix-wrapper {
    flex: 1;
  }
  
  .code-button {
    white-space: nowrap;
    min-width: 110px;
  }
  
  /* 移动端适配 */
  @media (max-width: 480px) {
    .verification-code-container {
      flex-direction: column;
    }
    
    .code-button {
      margin-top: 8px;
      width: 100%;
    }
  }
  </style>