<template>
  <div class="change-password-container" @click.stop>
    <a-card class="change-password-card">
      <template #cover>
        <div class="card-cover">
          <h1 class="website-title">修改密码</h1>
        </div>
      </template>
      
      <a-form :model="passwordForm" @finish="handleChangePassword" layout="vertical">
        <a-form-item name="email" :rules="[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' }
        ]">
          <a-input v-model:value="passwordForm.email" placeholder="邮箱" size="large" disabled>
            <template #prefix><mail-outlined /></template>
          </a-input>
        </a-form-item>
        
        <!-- 验证码输入框 -->
        <a-form-item name="code" :rules="[
          { required: true, message: '请输入验证码' },
          { len: 6, message: '验证码长度必须为6位' }
        ]">
          <div class="verification-code-container">
            <a-input v-model:value="passwordForm.code" placeholder="验证码" size="large">
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
        
        <a-form-item name="newPassword" :rules="[
          { required: true, message: '请输入新密码' },
          { min: 8, max: 100, message: '密码长度必须在8-100字符之间' },
          { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, message: '密码必须包含大小写字母和数字' }
        ]">
          <a-input-password v-model:value="passwordForm.newPassword" placeholder="新密码" size="large">
            <template #prefix><lock-outlined /></template>
          </a-input-password>
        </a-form-item>
        
        <a-form-item name="confirmPassword" :rules="[
          { required: true, message: '请确认新密码' },
          { validator: validateConfirmPassword }
        ]">
          <a-input-password v-model:value="passwordForm.confirmPassword" placeholder="确认新密码" size="large">
            <template #prefix><lock-outlined /></template>
          </a-input-password>
        </a-form-item>
        
        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading" block size="large">
            修改密码
          </a-button>
        </a-form-item>
        
        <a-form-item>
          <a-button @click="$emit('cancel')" block>取消</a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
  <contextHolder />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { message, Form } from 'ant-design-vue';
import { LockOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons-vue';
import * as userService from '@/services/userService';
import { useUserStore } from '@/stores/userStore';

defineOptions({ name: 'ChangePassword' });

const [messageApi, contextHolder] = message.useMessage();
const userStore = useUserStore();
const loading = ref<boolean>(false);
const codeSending = ref<boolean>(false);
const countdown = ref<number>(0);

const passwordForm = ref({
  email: userStore.getUserInfo.email || '',
  code: '',
  newPassword: '',
  confirmPassword: ''
});

const emit = defineEmits(['success', 'cancel']);

// 验证确认密码
const validateConfirmPassword = async (_rule: any, value: string) => {
  if (value !== passwordForm.value.newPassword) {
    return Promise.reject('两次输入的密码不一致');
  }
  return Promise.resolve();
};

// 发送验证码
const sendVerificationCode = async () => {
  if (!passwordForm.value.email) {
    messageApi.error('请先输入邮箱地址');
    return;
  }
  
  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!emailPattern.test(passwordForm.value.email)) {
    messageApi.error('请输入有效的邮箱地址');
    return;
  }
  
  codeSending.value = true;
  try {
    // 调用发送验证码API
    const result = await userService.sendVerificationCode({
      email: passwordForm.value.email,
      purpose: 'resetPassword'
    });
    
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

// 处理修改密码
const handleChangePassword = async (values: any) => {
  loading.value = true;
  try {
    const changeData = {
      email: values.email,
      code: values.code,
      newPassword: values.newPassword
    };
    
    const result = await userService.resetPassword(changeData);
    if (result && result.success) {
      messageApi.success('密码修改成功，请重新登录');
      emit('success');
      // 退出登录
      setTimeout(() => {
        userStore.logout();
      }, 1500);
    } else {
      messageApi.error(result?.message || '密码修改失败，请检查验证码是否正确');
    }
  } catch (error) {
    console.error('修改密码失败:', error);
    messageApi.error('修改密码失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.change-password-container {
  animation: fadeIn 0.3s;
}

.change-password-card {
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