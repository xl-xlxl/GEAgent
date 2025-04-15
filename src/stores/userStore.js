import { defineStore } from "pinia";
import * as userService from "@/services/userService";

export const useUserStore = defineStore("userStore", {
  state: () => ({
    isLoggedIn: false,
    token: null,
    userInfo: null,
    // 用户信息可能包含：
    // username: 用户名
    // avatar: 头像
    // email: 邮箱
    // 其他用户相关信息
  }),
  
  getters: {
    // 获取登录状态
    loggedIn: (state) => state.isLoggedIn,
    // 获取用户信息
    getUserInfo: (state) => state.userInfo,
  },
  
  actions: {
    // 登录成功后调用
    login(userData, token) {
      this.isLoggedIn = true;
      this.token = token;
      this.userInfo = userData;
      
      // 将token存储到localStorage，便于持久化
      localStorage.setItem('token', token);
      localStorage.setItem('userInfo', JSON.stringify(userData));
    },
    
    // 退出登录
    logout() {
      this.isLoggedIn = false;
      this.token = null;
      this.userInfo = null;
      
      // 清除localStorage中的数据
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
    },
    
    // 检查登录状态（页面刷新后调用）
    checkLoginStatus() {
      const token = localStorage.getItem('token');
      const userInfo = localStorage.getItem('userInfo');
      
      if (token) {
        this.isLoggedIn = true;
        this.token = token;
        this.userInfo = userInfo ? JSON.parse(userInfo) : null;
        return true;
      }
      
      return false;
    },
    
    // 更新用户信息
    updateUserInfo(newUserInfo) {
      this.userInfo = { ...this.userInfo, ...newUserInfo };
      localStorage.setItem('userInfo', JSON.stringify(this.userInfo));
    },
    
    // 刷新token
    refreshToken(newToken) {
      this.token = newToken;
      localStorage.setItem('token', newToken);
    }
  },
});