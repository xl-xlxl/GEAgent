import { streamApi } from "@/assets/api/index";
import axios from 'axios';
import { ref } from 'vue';

// 提取错误消息的工具函数
function SelectMessageError(error) {
    let errorMessage = "未知错误";

    if (error.response && error.response.data) {
        if (error.response.data.message) {
            errorMessage = error.response.data.message;
        } else if (error.response.data.errors && error.response.data.errors.msg) {
            errorMessage = error.response.data.errors.msg;
        }
    } else if (error.message) {
        // 如果是网络错误等没有 response 的情况
        errorMessage = error.message;
    }

    return errorMessage;
}

// 使用api配置创建fetch请求URL的辅助函数
function getApiConfig() {
    return {
        baseURL: import.meta.env.VITE_API_BASE_URL || '', 
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        withCredentials: true
    };
}

const conversationApi = {
    async createConversation(params, reasoningCallback, replyCallback) {
        try {
            // 获取API配置
            const apiConfig = getApiConfig();
            
            // 使用相对路径而非getApiUrl，避免CORS问题
            const response = await fetch('/api/chat/create', {
                method: "POST",
                headers: apiConfig.headers,
                body: JSON.stringify({
                    // 确保参数名称与API要求一致
                    message: params.message,
                    LLMID: params.LLMID,
                    title: params.title || "GESeek",
                    webSearch: params.webSearch || false
                }),
                // 移除credentials以避免CORS问题
                // credentials: apiConfig.withCredentials ? "include" : "same-origin"
            });

            // 处理SSE流的代码保持不变
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let conversationId = null;

            // 逐行处理SSE数据
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // 添加到缓冲区并按行分割
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // 保留可能不完整的最后一行

                for (const line of lines) {
                    // 判断是否是SSE数据行
                    if (line.startsWith('data: ')) {
                        try {
                            // 提取JSON部分（移除"data: "前缀）
                            const jsonStr = line.substring(6);
                            const jsonData = JSON.parse(jsonStr);

                            // 处理不同类型的数据
                            if (jsonData.conversationId) {
                                conversationId = jsonData.conversationId;
                            }

                            if (jsonData.reasoning_content && reasoningCallback) {
                                reasoningCallback(jsonData.reasoning_content);
                            }

                            if (jsonData.content && replyCallback) {
                                replyCallback(jsonData.content);
                            }
                        } catch (error) {
                            console.warn("无法解析响应数据:", line, error);
                        }
                    }
                }
            }
            return { success: true, conversationId };
        } catch (error) {
            console.log(error);
            let head = '对话创建失败';
            let errorMessage = '创建对话失败，请稍后重试';
            errorMessage = SelectMessageError(error);

            if (error.response && error.response.status) {
                if (error.response.status === 401) {
                    head = '认证失败';
                } else if (error.response.status === 400) {
                    head = '请求错误';
                }
            }

            // 返回统一格式的错误
            throw {
                success: false,
                head,
                message: errorMessage
            };
        }
    },
};

export default conversationApi;