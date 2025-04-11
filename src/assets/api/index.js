import axios from "axios";
import { message } from 'ant-design-vue';
const messageApi = message.useMessage()

const baseURL = `${import.meta.env.VITE_API_BASE_URL}/api`;
console.log("baseURL:", baseURL);
const api = axios.create({
    baseURL,          // 基础URL
    timeout: 10000,                   // 请求超时时间：10秒
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer${localStorage.getItem("token")}`
    }
});

//由于跨域问题此行暂时注释
//api.defaults.withCredentials = true;

api.interceptors.request.use(config => {

    // console.log("发送请求：", config);
    return config;
}, error => {
    // 处理请求错误
    // console.log("请求错误：", error);
    Promise.reject(error);
});

api.interceptors.response.use(res => {
    // 直接返回响应中的数据部分
    // console.log("拦截响应：", res);
    return res;
}, error => {
    // 传递错误到调用者
    // console.log("响应错误：", error);
    return Promise.reject(error);
});

export default api;