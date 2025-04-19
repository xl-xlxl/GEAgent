import { defineStore } from "pinia";
import * as userService from "@/services/userService";
export const useUserStore = defineStore("userStore", {
  state: () => ({
    isLoggedIn: false,
    token: null,
    userName: null,
    avatarUrl: null,
    email: null,
    fullName: null,
    showLogin: false,
  }),
  
  getters: {
    // 获取登录状态
    loggedIn: (state) => state.isLoggedIn,
    // 获取用户信息
    getUserInfo: (state) => ({
      userName: state.userName,
      avatarUrl: state.avatarUrl,
      email: state.email,
      fullName: state.fullName
    }),
  },
  
  actions: {
    // 登录成功后调用
    async login(token) {
      try {
        // 使用await等待异步请求完成
        const userInfoResponse = await userService.getUserInfo();
        
        this.isLoggedIn = true;
        this.token = token;
        this.userName = userInfoResponse.user.username;
        this.email = userInfoResponse.user.email;
        this.fullName = userInfoResponse.user.fullName;
        const avatarUrlResponse = await userService.getUserAvatarUrl();
        this.avatarUrl = avatarUrlResponse.url;
        // 将token存储到localStorage，便于持久化
        localStorage.setItem('token', token);
      } catch (error) {
        console.error(error);
        // 可以选择是否在这里处理错误
      }
    },
    
    // 退出登录
    logout() {
      this.isLoggedIn = false;
      this.token = null;
      this.userName = null;
      this.avatarUrl = null;
      this.email = null;
      this.fullName = null;
      // 清除localStorage中的数据
      localStorage.removeItem('token');
    },
    
    // 添加处理认证错误的方法
    handleAuthError() {
      this.isLoggedIn = false;
      this.token = null;
      this.userInfo = null;
      // 清除localStorage中的数据
      localStorage.removeItem('token');
    },
  
    
    // 刷新token
    refreshToken(newToken) {
      this.token = newToken;
    }
  },
});