<template>
  <div class="app-container">
    <!-- 左侧侧边栏 -->
    <aside class="sidebar">
      <div class="logo-container">
        <h1>GESeek</h1>
        <h2 class="version-text">demo 0.0.2</h2>
      </div>
      <nav class="nav-menu">
        <ul>
          <li v-for="(item, index) in menuItems" :key="index">
            <a @click="view = item.id" :class="['nav-link', { 'active': view === item.id }]">
              <span class="title">{{ item.title }}</span>
            </a>
          </li>
        </ul>
      </nav>
    </aside>
    <!-- 主内容区域 -->
    <main class="main-content">
      <ChatView v-show="view === 'chat'" />
      <HistoryView v-if="view === 'history'" />
      <SettingView v-if="view === 'setting'" />
    </main>
  </div>
</template>

<script>
import '@/assets/styles/views/app.css';
import ChatView from '@/views/ChatView.vue';
import HistoryView from '@/views/HistoryView.vue';
import SettingView from '@/views/SettingView.vue';

export default {
  name: 'App',
  components: {
    ChatView,
    HistoryView,
    SettingView
  },
  data() {
    return {
      view: 'chat',
      menuItems: [
        { id: 'chat', title: '聊天' },
        { id: 'history', title: '历史' },
        { id: 'setting', title: '设置' }
      ]
    }
  }
}
</script>