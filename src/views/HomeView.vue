
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
                    @submit="() => {
                        value = '';
                        loading = true
                        messageApi.info('Send message!');
                    }" 
                    @cancel="() => {
                        loading = false
                        messageApi.error('Cancel sending!');
                    }" 
                />
            </div>
        </Flex>
    </div>
</template>

<style scoped>
.home-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
    padding: 0 20px;
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
    width: 100%;
    max-width: 800px;
}
</style>

<script setup lang="ts">
import { message, Flex } from 'ant-design-vue';
import { Sender } from 'ant-design-x-vue';
import { onWatcherCleanup, ref, watch } from 'vue';

defineOptions({ name: 'AXSenderBasicSetup' });

const [messageApi, contextHolder] = message.useMessage();

const value = ref<any>('');
const loading = ref<boolean>(false);

// Mock send message
watch(loading, () => {
  if (loading.value) {
    const timer = setTimeout(() => {
      loading.value = false;
      messageApi.success('Send message successfully!');
    }, 3000);
    onWatcherCleanup(() => {
      clearTimeout(timer);
    })
  }
});
</script>