<template>
  <div class="app-container">
    <HomeView />
  </div>
</template>

<script>
import HomeView from '@/views/HomeView.vue';

export default {
  name: 'App',
  components: {
    HomeView
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