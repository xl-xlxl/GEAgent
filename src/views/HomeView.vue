<template>
    <div class="home-view">
        <h1>欢迎使用 GESeek</h1>
        <p>这是主页内容。</p>
        <BlueBox /><!-- 组件内容 -->
        
    </div>
</template>

<script>
import BlueBox from '@/components/test1.vue';// 引入组件

export default {
    name: 'HomeView',
    components: {
        BlueBox,// 注册组件
    },
    data() {
        return {};
    },
};
</script>

<style scoped>
@import '@/assets/styles/views/home.css';
</style>