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
  }),
  
  getters: {
    // 获取登录状态
    loggedIn: (state) => state.isLoggedIn,
    // 获取用户信息
    getUserInfo: (state) => state.userInfo,
  },
  
  actions: {
    // 登录成功后调用
    login(userInfo, token) {
      this.isLoggedIn = true;
      this.token = token;
      this.userName = userInfo.userName;
      this.avatarUrl = userInfo.avatarUrl;
      this.email = userInfo.email;
      this.fullName = userInfo.fullName;
      // 将token存储到localStorage，便于持久化
      localStorage.setItem('token', token);
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