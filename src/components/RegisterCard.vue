<template>
  <div class="register-card-container" @click.stop>
    <a-card class="register-card">
      <template #cover>
        <div class="card-cover">
          <h1 class="website-title">GESeek</h1>
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
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons-vue';
import * as userService from '@/services/userService';

defineOptions({ name: 'RegisterCard' });

const [messageApi, contextHolder] = message.useMessage();

const loading = ref<boolean>(false);
const registerForm = ref({
  username: '',
  email: '',
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

// 处理注册
const handleRegister = async (values: any) => {
  
  loading.value = true;
  try {
    const userData = {
      username: values.username,
      email: values.email,
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

.register-card {
  width: 380px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-cover {
  height: 120px;
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 8px 8px 0 0;
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

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>