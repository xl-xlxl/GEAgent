import { api } from '@/assets/api/index'
import LoginByEmail from '@/components/LoginByEmail.vue';
import axios from 'axios' 
import { ref } from 'vue';

function SelectMessageError(error) {
    let errorMessage = '未知错误';
    
    if (error.response && error.response.data) {
        // 处理 error 数组（注意是 error 不是 errors）
        if (Array.isArray(error.response.data.error)) {
            if (error.response.data.error.length > 0) {
                // 提取每个错误对象中的 msg 字段
                const messages = error.response.data.error
                    .map(err => err.msg || '')
                    .filter(msg => msg); // 过滤掉空消息
                
                if (messages.length > 0) {
                    errorMessage = messages.join(', ');
                    return errorMessage; // 找到了就直接返回
                }
            }
        }
        
        // 处理直接的消息字符串
        if (error.response.data.message) {
            // 如果 message 是数组，则连接所有消息
            if (Array.isArray(error.response.data.message)) {
                errorMessage = error.response.data.message.join(', ');
            } else {
                errorMessage = error.response.data.message;
            }
        } 
        // 处理 errors 对象中的 msg
        else if (error.response.data.errors) {
            if (error.response.data.errors.msg) {
                // 如果 msg 是数组，则连接所有消息
                if (Array.isArray(error.response.data.errors.msg)) {
                    errorMessage = error.response.data.errors.msg.join(', ');
                } else {
                    errorMessage = error.response.data.errors.msg;
                }
            } 
            // 处理 errors 作为数组的情况
            else if (Array.isArray(error.response.data.errors)) {
                if (error.response.data.errors.length > 0) {
                    // 从错误数组中提取消息并连接
                    const messages = error.response.data.errors
                        .map(err => err.msg || err.message || JSON.stringify(err))
                        .filter(Boolean);
                    
                    if (messages.length > 0) {
                        errorMessage = messages.join(', ');
                    }
                }
            }
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
            console.log(error);
            let head = '未知错误';
            let errorMessage = '登录失败，请稍后重试';
            if (error.response.status === 401) {
                head = '登录失败';
            } else if (error.response.status === 400) {
                head = '请求错误';
            }
            errorMessage = SelectMessageError(error);
            // 返回统一格式的错误
            throw {
                success: false,
                head,
                message: errorMessage
            };
        }
    },

    async LoginByEmail(email) {
        try {
            return await api.post('/user/loginByEmail', email)
        } catch (error) {
            console.log(error);
            let head = '未知错误';
            let errorMessage = '登录失败，请稍后重试';
            if (error.response.status === 401) {
                head = '登录失败';
            } else if (error.response.status === 400) {
                head = '请求错误';
            }
            errorMessage = SelectMessageError(error);
            // 返回统一格式的错误
            throw {
                success: false,
                head,
                message: errorMessage
            };
        }
    },

    async sendVerificationCode(credentials) {
        try {
            console.log(credentials);
            return await api.post('/user/emailVerificationCode', credentials)
        } catch (error) {
            console.log(error);
            let head = '未知错误';
            let errorMessage = '发送验证码失败，请稍后重试';
            if (error.response.status === 401) {
                head = '登录失败';
            } else if (error.response.status === 400) {
                head = '请求错误';
            }
            errorMessage = SelectMessageError(error);
            // 返回统一格式的错误
            throw {
                success: false,
                head,
                message: errorMessage
            };
        }
    },


    async resetPassword(data) {
        try {
            return await api.put('/user/resetPassword', data)
        }
        catch (error) {
            console.log(error);
            let head = '未知错误';
            let errorMessage = '重置密码失败，请稍后重试';
            errorMessage = SelectMessageError(error);
            // 返回统一格式的错误
            throw {
                success: false,
                head,
                message: errorMessage
            };
        }
    },

    async register(userData) {
        try {
            console.log(userData);
            const registerRes= await api.post('/user/register', userData,)
            console.log(111);
            return registerRes
        } catch (error) {
            let head = '注册失败';
            let errorMessage = '注册失败，请稍后重试';
            errorMessage = SelectMessageError(error);
            console.log(error);
            console.log(errorMessage);
            // 返回统一格式的错误
            throw {
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
            console.log(error);
            let head = '获取用户信息失败';
            let errorMessage = '获取用户信息失败，请稍后重试';
            errorMessage = SelectMessageError(error);
            // 返回统一格式的错误
            throw {
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
            throw {
                success: false,
                head,
                message: errorMessage
            };

        } 
    },

    async getUserAvatarUrl(){
        try {
            return await api.get('/user/avatar')           
        }catch (error) {
            let head = '获取用户头像失败';
            let errorMessage = '获取用户头像失败，请稍后重试';
            errorMessage = SelectMessageError(error);
            throw {
                success: false,
                head,
                message: errorMessage
            };
        }
    },

    async uploadAvatar(file)
    {
        try {
            const formData = new FormData();
            formData.append('image', file);
            const response = await api.post('/user/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.log(error);
            throw (error.data)
        }
    }
}

    
    

export default authApi;