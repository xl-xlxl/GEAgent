<script>
export default {
  name: 'App',
  data() {
    return {
      menuItems: [
        { title: '首页', route: '/' },
        { title: '聊天', route: '/chat' },
        { title: '历史', route: '/history' },
        { title: '设置', route: '/setting' }
      ]
    }
  }
}
</script>

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
          <li v-for="item in menuItems" :key="item.route">
            <router-link :to="item.route" class="nav-link">
              <span class="title">{{ item.title }}</span>
            </router-link>
          </li>
        </ul>
      </nav>
    </aside>
    
    <!-- 主内容区域 -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 250px;
  background-color: #2c3e50;
  color: white;
  padding: 20px 0;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
}

.logo-container {
  padding: 0 20px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 20px;
}

.nav-menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  color: #e0e0e0;
  text-decoration: none;
  transition: all 0.3s;
}

.nav-link:hover,
.router-link-active {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.icon {
  margin-right: 10px;
  font-size: 1.2em;
}

.main-content {
  flex: 1;
  padding: 20px;
  background-color: #f5f5f5;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-container {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    padding: 10px 0;
  }
  
  .nav-menu ul {
    display: flex;
    overflow-x: auto;
  }

  .version-text {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.658);
  font-weight: normal;
  margin-top: 5px;
}

}
</style>