<template>
  <div class="register-card-container" @click.stop>
    <a-card class="register-card">
      <template #cover>
        <div class="card-cover">
          <img src="/LOGO-GEAent/logo+GEAGENT.svg" class="logo-img"/>
        </div>
      </template>
      
      <h2 class="register-title">用户注册</h2>
      <a-form :model="registerForm" @finish="handleRegister" layout="vertical">
        <a-form-item name="username" :rules="[
          { required: true, message: '请输入用户名' },
          { min: 6, max: 50, message: '用户名长度必须在6-50个字符之间' },
          { pattern: /^[a-zA-Z0-9_-]+$/, message: '用户名只能包含字母、数字、下划线与连字符' }
        ]">
          <a-input v-model:value="registerForm.username" placeholder="用户名" size="large">
            <template #prefix><user-outlined /></template>
          </a-input>
        </a-form-item>
        
        <a-form-item name="email" :rules="[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' }
        ]">
          <a-input v-model:value="registerForm.email" placeholder="邮箱" size="large">
            <template #prefix><mail-outlined /></template>
          </a-input>
        </a-form-item>
        
        <!-- 添加验证码输入框 -->
        <a-form-item name="code" :rules="[
          { required: true, message: '请输入验证码' },
          { len: 6, message: '验证码长度必须为6位' }
        ]">
          <div class="verification-code-container">
            <a-input v-model:value="registerForm.code" placeholder="验证码" size="large">
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
        
        <a-form-item name="password" :rules="[
          { required: true, message: '请输入密码' },
          { min: 8, max: 100, message: '密码长度必须在8-100字符之间' },
          { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, message: '密码必须包含大小写字母和数字' }
        ]">
          <a-input-password v-model:value="registerForm.password" placeholder="密码" size="large">
            <template #prefix><lock-outlined /></template>
          </a-input-password>
        </a-form-item>
        
        <a-form-item name="confirmPassword" :rules="[
          { required: true, message: '请确认密码' },
          { validator: validateConfirmPassword }
        ]">
          <a-input-password v-model:value="registerForm.confirmPassword" placeholder="确认密码" size="large">
            <template #prefix><lock-outlined /></template>
          </a-input-password>
        </a-form-item>
        
        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading" block size="large">
            注册
          </a-button>
        </a-form-item>
        
        <a-form-item>
          <a-button @click="$emit('cancel')" block>取消</a-button>
        </a-form-item>
        
        <div class="login-link">
          已有账号？<a href="#" @click.prevent="$emit('switch-to-login')">立即登录</a>
        </div>
      </a-form>
    </a-card>
  </div>
  <contextHolder />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { message, Form, Input, Button, Checkbox, Card } from 'ant-design-vue';
import { UserOutlined, LockOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons-vue';
import * as userService from '@/services/userService';

defineOptions({ name: 'RegisterCard' });

const [messageApi, contextHolder] = message.useMessage();

const loading = ref<boolean>(false);
const codeSending = ref<boolean>(false);
const countdown = ref<number>(0);

const registerForm = ref({
  username: '',
  email: '',
  code: '',
  password: '',
  confirmPassword: '',
});

const emit = defineEmits(['register-success', 'cancel', 'switch-to-login']);

// 验证确认密码
const validateConfirmPassword = async (_rule: any, value: string) => {
  if (value !== registerForm.value.password) {
    return Promise.reject('两次输入的密码不一致');
  }
  return Promise.resolve();
};

// 发送验证码
const sendVerificationCode = async () => {
  if (!registerForm.value.email) {
    messageApi.error('请先输入邮箱地址');
    return;
  }
  
  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!emailPattern.test(registerForm.value.email)) {
    messageApi.error('请输入有效的邮箱地址');
    return;
  }
  
  codeSending.value = true;
  try {
    const credential = {
      purpose: 'register',
      email: registerForm.value.email,
    };
    console.log('发送验证码:', credential);
    // 调用发送注册验证码API
    const result = await userService.sendVerificationCode(credential);
    if (result && result.success) {
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

// 处理注册
const handleRegister = async (values: any) => {
  loading.value = true;
  try {
    const userData = {
      username: values.username,
      email: values.email,
      code: values.code,
      password: values.password
    };
    
    const registerRes = await userService.register(userData);
    console.log(registerRes);
    if (registerRes && registerRes.success !== false) {
      // 注册成功
      messageApi.success('注册成功！');
      emit('register-success', registerRes);
    } else {
      // 注册失败
      const errorMsg = registerRes?.message || '注册失败，请稍后重试';
      messageApi.error(errorMsg);
    }
  } catch (error) {
    // 处理请求异常
    messageApi.error('注册请求失败，请稍后重试');
    console.error('注册错误:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-card-container {
  animation: fadeIn 0.3s;
}

.logo-img {
  margin: 15px;
  max-width: 80%;
}

.register-card {
  width: 380px;
  border-radius: 18px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-cover {
  height: 120px;
  background: #F1EDED;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 18px 18px 0 0;
}

.website-title {
  text-align: center;
  font-size: 2.2rem;
  font-weight: bold;
  color: white;
  margin-bottom: 5px;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
}

.register-title {
  text-align: center;
  margin: 0 0 24px;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 600;
  font-size: 1.5rem;
}

.login-link {
  text-align: center;
  margin-top: 16px;
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

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>