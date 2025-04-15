import axios from "axios";
import { ref } from "vue";

function SelectMessageError(error) {
    let errorMessage = "未知错误";
    if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
    } else if (error.message) {
        errorMessage = error.message;
    }
    return errorMessage;
}

// 创建新对话
const conversationApi = {
    async createConversation(params, reasoningCallback, replyCallback) {
        try {
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            };
            const response = await fetch("/api/chat/create", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    message: params.message,
                    LLMID: params.LLMID,
                    title: params.title,
                    webSearch: params.webSearch,
                }),
            });

            // 检查HTTP状态码
            if (!response.ok) {
                let errorData = {};
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { message: response.statusText };
                }

                // 构造错误对象
                const error = {
                    response: {
                        status: response.status,
                        data: errorData,
                    },
                    message: errorData.message || response.statusText,
                };
                console.log(`创建新会话-API错误(${response.status}):`, error);
                throw error;
            }

            //处理响应流
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let conversationId = null;
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                // 添加到缓冲区并按行分割
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || ""; // 保留可能不完整的最后一行

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
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
            const isServerError = error.response &&
                error.response.status >= 500;
            throw {
                success: false,
                isShowable: isServerError,
                message: "服务暂时不可用，请稍后再试"
            };
        }
    },

    // 继续对话
    async continueConversation(params, conversationId, reasoningCallback, replyCallback) {
        try {
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            };
            const response = await fetch(`/api/chat/continue/${conversationId}`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    message: params.message,
                    LLMID: params.LLMID,
                    webSearch: params.webSearch,
                }),
            });

            // 检查HTTP状态码
            if (!response.ok) {
                let errorData = {};
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { message: response.statusText };
                }

                // 构造错误对象
                const error = {
                    response: {
                        status: response.status,
                        data: errorData,
                    },
                    message: errorData.message || response.statusText,
                };
                console.log(`继续对话-API错误(${response.status}):`, error);
                throw error;
            }

            //处理响应流
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                // 添加到缓冲区并按行分割
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || ""; // 保留可能不完整的最后一行

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const jsonStr = line.substring(6);
                            const jsonData = JSON.parse(jsonStr);
                            // 处理不同类型的数据
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
            const isServerError = error.response &&
                error.response.status >= 500;
            throw {
                success: false,
                isShowable: isServerError,
                message: "服务暂时不可用，请稍后再试"
            };
        }
    }

};

export default conversationApi;
