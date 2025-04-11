import api from '@/assets/api/index'
import axios from 'axios'
import { ref } from 'vue';

function SelectMessageError(error) {
    let errorMessage = '未知错误'; // 将变量声明移到函数顶部
    
    if (error.response && error.response.data) {
        if (error.response.data.message) {
            errorMessage = error.response.data.message;
        } else if (error.response.data.errors && error.response.data.errors.msg) {
            errorMessage = error.response.data.errors.msg;
        }
    } else if (error.message) {
        // 如果是网络错误等没有response的情况
        errorMessage = error.message;
    }
    
    return errorMessage;
}


const authApi = {
    async login(credentials) {
        try {
            return await api.post('/user/login', credentials)
        } catch (error) {

            let head = '未知错误';
            let errorMessage = '登录失败，请稍后重试';
            if (error.response.status === 401) {
                head = '登录失败';
            } else if (error.response.status === 400) {
                head = '请求错误';
            }
            errorMessage = SelectMessageError(error);
            // 返回统一格式的错误
            return {
                success: false,
                head,
                message: errorMessage
            };
        }
    },

    async register(userData) {
        try {
            return await api.post('/user/register', userData)
        } catch (error) {
            let head = '注册失败';
            let errorMessage = '注册失败，请稍后重试';
            errorMessage = SelectMessageError(error);

            // 返回统一格式的错误
            return {
                success: false,
                head,
                message: errorMessage
            };
        }
    },

    async getUserInfo() {
        try {
            return await api.get('/user/me') 
        }catch (error) {
            let head = '获取用户信息失败';
            let errorMessage = '获取用户信息失败，请稍后重试';
            errorMessage = SelectMessageError(error);
            
            // 返回统一格式的错误
            return {
                success: false,
                head,
                message: errorMessage
            };
        } 
    },

    async refreshToken() {
       try {
            return await api.get('/user/refreshToken')
        }catch (error) {
            let head = '刷新token失败';
            let errorMessage = '刷新token失败，请稍后重试';
            errorMessage = SelectMessageError(error);
            if (error.response.status === 401) {
                head = '请求错误';
            }else if (error.response.status === 403) {
                head = '刷新失败';
            }

            // 返回统一格式的错误
            return {
                success: false,
                head,
                message: errorMessage
            };

        } 
    }
}



export default authApi;