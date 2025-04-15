import axios from "axios";
import { message } from 'ant-design-vue';
import { useUserStore } from "@/stores/userStore";
const [messageApi, contextHolder] = message.useMessage();

const baseURL = `${import.meta.env.VITE_API_BASE_URL}/api`;

console.log("baseURL:", baseURL);

// 创建基础headers
const headers = {
  'Content-Type': 'application/json'
};

// 只有token存在时才添加Authorization头
const token = localStorage.getItem("token");
if (token) {
  console.log("token:", token);
  headers['Authorization'] = `Bearer ${token}`;
}
console.log("headers:", headers);
const api = axios.create({
    baseURL,          // 基础URL
    timeout: 10000,   // 请求超时时间：10秒
    headers
})

//由于跨域问题此行暂时注释
//api.defaults.withCredentials = true;

api.interceptors.request.use(config => {
    // 每次请求前检查token并更新Authorization头
    const token = localStorage.getItem("token");
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    } else {
        // 如果没有token，删除Authorization头
        delete config.headers['Authorization'];
    }
    return config;
}, error => {
    // 处理请求错误
    return Promise.reject(error);
});

api.interceptors.response.use(res => {
    // 直接返回响应中的数据部分
    // console.log("拦截响应：", res);
    return res;
}, error => {
    console.log("响应错误：", error);
    // 修正错误状态码的获取方式
    if (error.response && error.response.status === 403) {
        // 使用正确的消息API调用方式
        messageApi.error("登录已过期，请重新登录");
        // 调用用户存储的handleAuthError方法
        const userStore = useUserStore();
        userStore.handleAuthError();
        
        //延时2秒后跳转到登录页面
        setTimeout(() => {
            localStorage.removeItem("token");
            window.location.href = "/"; 
        },1500)
    }
    // 传递错误到调用者
    return Promise.reject(error);
});

export { api };
