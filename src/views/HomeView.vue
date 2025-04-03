<template>
  <div class="home">
    <div class="hero-section">
      <h1>欢迎使用 GESeek</h1>
      <p>这是接入的哪个大模型，好难猜呀</p>
      <router-link to="/chat" class="start-btn">开始对话</router-link>
    </div>

    <div class="features-section">
      <div class="feature-card">
        <div class="feature-icon">🚀</div>
        <h3>智能对话</h3>
        <p>我要看Mygo!!!!!</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">📝</div>
        <h3>历史记录</h3>
        <p>我要看gbc</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">⚙️</div>
        <h3>设置</h3>
        <p>我要看轻音老阿姨</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
    name: 'HomeView',
    data() {
        return {
            // 在此处添加数据属性
        }
    },
    methods: {
        // 在此处添加方法
    },
    mounted() {
        // 组件挂载后的逻辑
    }
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.hero-section {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  color: white;
  border-radius: 12px;
  margin-bottom: 40px;
}

.hero-section h1 {
  font-size: 2.5rem;
  margin-bottom: 16px;
}

.hero-section p {
  font-size: 1.2rem;
  margin-bottom: 30px;
  opacity: 0.9;
}

.start-btn {
  display: inline-block;
  background-color: white;
  color: #6e8efb;
  padding: 12px 30px;
  border-radius: 30px;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.3s;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
}

.features-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-top: 40px;
}

.feature-card {
  background: white;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 40px;
  margin-bottom: 20px;
}

.feature-card h3 {
  font-size: 1.4rem;
  margin-bottom: 15px;
  color: #333;
}

@media (max-width: 768px) {
  .hero-section {
    padding: 40px 15px;
  }
  
  .hero-section h1 {
    font-size: 2rem;
  }
  
  .features-section {
    grid-template-columns: 1fr;
  }
}
</style>