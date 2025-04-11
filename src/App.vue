<template>
  <div class="app-container">
    <ChatView />
    <!-- <HomeView /> -->
  </div>
</template>

<script>
// import HomeView from '@/views/HomeView.vue';
import ChatView from './views/ChatView.vue';

export default {
  name: 'App',
  components: {
    // HomeView,
    ChatView,
  }
}
</script>

<style scoped>
@import url('./assets/styles/views/app.css');

.app-container {
  display: flex;
  justify-content: center;
  align-items: center; 
}
</style>