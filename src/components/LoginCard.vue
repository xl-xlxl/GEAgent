<template>
  <div class="login-card-container" @click.stop>
    <a-card class="login-card">
      <template #cover>
        <div class="card-cover">
          <h1 class="website-title">GEAgent</h1>
        </div>
      </template>
      
      <h2 class="login-title">用户登录</h2>
      <a-form :model="loginForm" @finish="handleLogin" layout="vertical">
        <a-form-item name="username" :rules="[{ required: true, message: '请输入用户名' }]">
          <a-input v-model:value="loginForm.username" placeholder="用户名" size="large">
            <template #prefix><user-outlined /></template>
          </a-input>
        </a-form-item>
        <a-form-item name="password" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password v-model:value="loginForm.password" placeholder="密码" size="large">
            <template #prefix><lock-outlined /></template>
          </a-input-password>
        </a-form-item>
        
        <!-- 添加邮箱登录和忘记密码链接 -->
        <a-form-item class="links-container">
          <a-row :gutter="8" style="display: flex; justify-content: space-between;">
            <div class="emailLogin-link">
              <a href="#" @click.prevent="$emit('switch-to-email-login')">邮箱登录</a>
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
        
        <!-- 添加注册链接 -->
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
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue';
import * as userService from '@/services/userService';
import authApi from '@/assets/api/auth';
import { useUserStore } from '@/stores/userStore';
defineOptions({ name: 'LoginCard' });

const [messageApi, contextHolder] = message.useMessage();
const userStore = useUserStore();
const loading = ref<boolean>(false);
const loginForm = ref({
  username: '',
  password: '',
  remember: false
});

const emit = defineEmits(['login-success', 'cancel', 'switch-to-register', 'switch-to-email-login', 'switch-to-reset-password']);

// 处理登录
const handleLogin = async (values:any) => {
  loading.value = true; 
  try {
    const Credential = {
      username: values.username,
      password: values.password 
    }
    
    const loginRes = await userStore.login(Credential);
    console.log(loginRes);
    if (loginRes.success === true) {
      // 登录成功
      await messageApi.success('登录成功！');
      emit('login-success',loginRes); // 触发登录成功事件
    } else if (loginRes.success === false) {
      // 登录失败
      messageApi.error(loginRes.error.message);
    } else {
      // 其他错误
      throw new Error(loginRes);
    }
  } catch (error) {
    // 处理请求异常
    messageApi.error('服务器错误');
    console.error('登录错误:', error);
  } finally {
    // 无论成功还是失败，都重置loading状态
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
  border-radius: 20px 20px 0 0;
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

/* 添加邮箱登录和忘记密码的样式 */
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
</style>