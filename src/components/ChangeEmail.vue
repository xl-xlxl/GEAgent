<template>
  <div class="change-email-container" @click.stop>
    <a-card class="change-email-card">
      <template #cover>
        <div class="card-cover">
          <h1 class="website-title">修改邮箱</h1>
        </div>
      </template>
      
      <a-form :model="emailForm" @finish="handleChangeEmail" layout="vertical">
        <a-form-item label="当前邮箱" name="currentEmail">
          <a-input v-model:value="emailForm.currentEmail" disabled size="large">
            <template #prefix><mail-outlined /></template>
          </a-input>
        </a-form-item>
        
        <a-form-item label="新邮箱" name="newEmail" :rules="[
          { required: true, message: '请输入新邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' }
        ]">
          <a-input v-model:value="emailForm.newEmail" placeholder="请输入新邮箱" size="large">
            <template #prefix><mail-outlined /></template>
          </a-input>
        </a-form-item>
        
        <!-- 验证码输入框 -->
        <a-form-item name="code" :rules="[
          { required: true,type: 'string', message: '请输入验证码' }
        ]">
           <div class="verification-code-container">
              <a-input v-model:value="emailForm.code" placeholder="验证码" size="large" >
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
        
        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading" block size="large">
            确认修改
          </a-button>
        </a-form-item>
        
        <a-form-item>
          <a-button @click="$emit('cancel')" block>取消</a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script>
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { MailOutlined, SafetyOutlined } from '@ant-design/icons-vue';
import * as userService from '@/services/userService';
import { useUserStore } from '@/stores/userStore';

export default {
  name: 'ChangeEmail',
  components: {
    MailOutlined,
    SafetyOutlined
  },
  emits: ['success', 'cancel'],
  setup(props, { emit }) {
    const messageApi = message;
    const userStore = useUserStore();
    const loading = ref(false);
    const codeSending = ref(false);
    const countdown = ref(0);

    const emailForm = ref({
      currentEmail: userStore.getUserInfo.email || '',
      newEmail: '',
      code: ''
    });

    // 发送验证码
    const sendVerificationCode = async () => {
      if (!emailForm.value.newEmail) {
        messageApi.error('请先输入新邮箱地址');
        return;
      }
      
      const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      if (!emailPattern.test(emailForm.value.newEmail)) {
        messageApi.error('请输入有效的邮箱地址');
        return;
      }
      
      codeSending.value = true;
      try {
        // 调用发送验证码API
        const result = await userService.sendVerificationCode({
          email: emailForm.value.newEmail,
          purpose: 'bindEmail'
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

    // 处理修改邮箱
    const handleChangeEmail = async (values) => {
      loading.value = true;
      try {
        const changeData = {
          email: values.newEmail,
          code: values.code,
          purpose: 'bindEmail'
        };
        
        const result = await userService.bindEmail(changeData);
        if (result && result.success) {
          emit('success');
        } else {
          messageApi.error(result?.message || '邮箱修改失败，请检查验证码是否正确');
        }
      } catch (error) {
        console.error('修改邮箱失败:', error);
        messageApi.error('修改邮箱失败，请稍后重试');
      } finally {
        loading.value = false;
      }
    };

    return {
      emailForm,
      loading,
      codeSending,
      countdown,
      sendVerificationCode,
      handleChangeEmail
    };
  }
};
</script>

<style scoped>
.change-email-container {
  animation: fadeIn 0.3s;
}

.change-email-card {
  width: 380px;
  border-radius: 18px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-cover {
  height: 120px;
  background: #F1EDED;
  display: flex;
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