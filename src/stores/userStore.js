import { defineStore } from "pinia";
import * as userService from "@/services/userService";
import { ExclamationCircleFilled } from "@ant-design/icons-vue";
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
    async login(Credential) {
      try {
        // 使用await等待异步请求完成
        const loginResponse = await userService.login(Credential); 
        if (loginResponse.success == true){
          this.token = loginResponse.token;
          localStorage.setItem('token', loginResponse.token);
          this.isLoggedIn = true;
          const userInfoResponse = await userService.getUserInfo();
          console.log(userInfoResponse);
          this.userName = userInfoResponse.user.username;
          this.email = userInfoResponse.user.email;
          this.fullName = userInfoResponse.user.fullName;
          const avatarUrlResponse = await userService.getUserAvatarUrl();
          this.avatarUrl = avatarUrlResponse.url;
          return ({success: true});
        }else if (loginResponse.success == false){
          return (loginResponse);
        }
        
      } catch (error) {
        console.error(error);
        // 可以选择是否在这里处理错误
      }
    },
    
    async emailLogin(Credential) {
      try {
        // 使用await等待异步请求完成
        const emailLoginResponse = await userService.emailLogin(Credential); 
        if (emailLoginResponse.success == true){
          this.token = emailLoginResponse.token;
          localStorage.setItem('token', emailLoginResponse.token);
          this.isLoggedIn = true;
          const userInfoResponse = await userService.getUserInfo();
          console.log(userInfoResponse);
          this.userName = userInfoResponse.user.username;
          this.email = userInfoResponse.user.email;
          this.fullName = userInfoResponse.user.fullName;
          const avatarUrlResponse = await userService.getUserAvatarUrl();
          this.avatarUrl = avatarUrlResponse.url;
          return ({success: true});
        }else if (emailLoginResponse.success == false){
          return (emailLoginResponse);
        }
        
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
      this.userName = null;
      this.avatarUrl = null;
      this.email = null;
      this.fullName = null;
      // 清除localStorage中的数据
      localStorage.removeItem('token');
    },
    
    async refreshUserInfo() {
      try {
        const userInfoResponse = await userService.getUserInfo();
          this.userName = userInfoResponse.user.username;
          this.email = userInfoResponse.user.email;
          this.fullName = userInfoResponse.user.fullName;
          const avatarUrlResponse = await userService.getUserAvatarUrl();
          this.avatarUrl = avatarUrlResponse.url;
      } catch (error) {
        console.error(error);
      }
    },
    
    // 刷新token
    async refreshToken() {
      try {
        const newToken = await userService.refreshToken(); 
        if(newToken.success == true){
          this.token = newToken.token;
          localStorage.setItem('token', newToken.token);
          this.isLoggedIn = true;
          return newToken.token;
        }else if(newToken.success == false){
          this.handleAuthError();
          console.error(newToken.error.message);
          return null;
        }
        
      } catch (error) {
        console.error(error);
        this.handleAuthError();
        return null; 
      }
      
    },

    async uploadAvatar(file) {
      try {
        const uploadResponse = await userService.uploadAvatar(file);
        console.log('11111',uploadResponse);
        if (uploadResponse.success == true) {
          this.avatarUrl = uploadResponse.url;
          return uploadResponse;
        } else if (uploadResponse.success == false) {
          console.error(uploadResponse);
          return uploadResponse;
        }
      } catch (error) {
        console.error(error);
      }
    },
    
    async updateFullname(fullName) {
      try {
        const updateResponse = await userService.updateInfo(fullName);
        if (updateResponse.success == true) {
          this.fullName = fullName;
          return updateResponse;
        } else if (updateResponse.success == false) {
          console.error(updateResponse);
          return updateResponse;
        }
      } catch (error) {
        console.error(error);
      }
    },

    async bindEmail(data) {
      try {
        const bindEmailResponse = await userService.bindEmail(data);
        if (bindEmailResponse.success == true) {
          this.email = data.email;
          return bindEmailResponse;
        } else if (bindEmailResponse.success == false) {
          console.error(bindEmailResponse);
          return bindEmailResponse;
        }
      } catch (error) {
        console.error(error);
      }
    }
  },
  
});