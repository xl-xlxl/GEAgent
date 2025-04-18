import axios from 'axios'

// 创建新对话
const conversationApi = {
    // 修改创建新对话方法
    async createConversation(params, reasoningCallback, replyCallback) {
        try {
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            };

            // 创建请求
            const response = await fetch("/api/chat/create", {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(params)
            });

            let conversationId = null;
            let currentRound = 0;

            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // 解码并分割响应数据
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    let data;
                    try {
                        // 移除"data: "前缀并解析JSON
                        const jsonStr = line.startsWith('data: ') ? line.substring(6) : line;
                        data = JSON.parse(jsonStr);

                        // 处理不同类型的响应
                        if (data.connection && data.conversationId) {
                            // 初始连接，获取会话ID
                            conversationId = data.conversationId;
                        }
                        // 添加条件：跳过特定的空内容
                        else if (data.content === "\n\n" && data.reasoning_content === null) {
                            continue;
                            // 其他需要过滤的响应类型
                        } else if (data.webSearchStatus || data.success === false || data.MCPStatus || data.content === "<tool_call>") {
                            // 忽略这些特定类型的响应
                            continue;
                        } else if (data.postConversationRequest) {
                            // 更新当前轮次
                            currentRound = data.round;
                        } else if (data.content !== null && !data.reasoning_content) {
                            // 处理回复内容
                            if (replyCallback && data.content) {
                                replyCallback(data.content);
                            }
                        } else if (data.reasoning_content) {
                            // 处理思考过程
                            if (reasoningCallback && data.reasoning_content) {
                                reasoningCallback(data.reasoning_content);
                            }
                        }
                    } catch (error) {
                        console.error("解析响应数据错误:", error, line);
                    }
                }
            }

            return { conversationId, round: currentRound };
        } catch (error) {
            console.error("创建对话-API层错误:", error);
            throw {
                message: error.message || "创建新对话失败",
                isShowable: true,
            };
        }
    },


    // 修改继续对话方法
    async continueConversation(params, conversationId, reasoningCallback, replyCallback) {
        try {
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            };

            // 创建请求
            const response = await fetch(`/api/chat/continue/${conversationId}`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(params)
            });

            let currentRound = 0;

            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // 解码并分割响应数据
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    let data;
                    try {
                        // 移除"data: "前缀并解析JSON
                        const jsonStr = line.startsWith('data: ') ? line.substring(6) : line;
                        data = JSON.parse(jsonStr);

                        // 添加条件：跳过特定的空内容
                        if (data.content === "\n\n" && data.reasoning_content === null) {
                            continue;
                        }
                        // 其他需要过滤的响应类型
                        else if (data.webSearchStatus || data.success === false || data.MCPStatus || data.content === "<tool_call>") {
                            continue;
                        } else if (data.postConversationRequest) {
                            // 更新当前轮次
                            currentRound = data.round;
                        } else if (data.content !== null && !data.reasoning_content) {
                            // 处理回复内容
                            if (replyCallback && data.content) {
                                replyCallback(data.content);
                            }
                        } else if (data.reasoning_content) {
                            // 处理思考过程
                            if (reasoningCallback && data.reasoning_content) {
                                reasoningCallback(data.reasoning_content);
                            }
                        }
                    } catch (error) {
                        console.error("解析响应数据错误:", error, line);
                    }
                }
            }

            return { conversationId, round: currentRound };
        } catch (error) {
            console.error("继续对话-API层错误:", error);
            throw {
                message: error.message || "继续对话失败",
                isShowable: true,
            };
        }
    },


    // 添加获取对话列表的方法
    async getConversationList() {
        try {
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            };
            // 使用 axios 发送 GET 请求
            const response = await axios.get("/api/chat/list", { headers });
            // 检查 HTTP 状态码并返回数据
            if (response.status === 200) {
                return response.data; // 返回响应数据
            } else {
                throw {
                    message: response.data?.message || "获取对话列表失败",
                    status: response.status,
                    isShowable: true,
                };
            }
        } catch (error) {
            console.error("获取对话列表错误:", error);
            // 处理 axios 错误
            if (error.response) {
                throw {
                    message: error.response.data?.message || "获取对话列表失败",
                    status: error.response.status,
                    isShowable: true,
                };
            } else {
                throw {
                    message: error.message || "获取对话列表时发生错误",
                    isShowable: true,
                };
            }
        }
    },


    // 获取特定对话的历史记录
    async getConversationHistory(conversationId) {
        try {
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            };

            // 使用 axios 发送 GET 请求
            const response = await axios.get(`/api/chat/list/${conversationId}`, { headers });

            // 检查 HTTP 状态码并返回数据
            if (response.status === 200) {
                return response.data; // 返回响应数据
            } else {
                throw {
                    message: response.data?.message || "获取对话历史失败",
                    status: response.status,
                    isShowable: true,
                };
            }
        } catch (error) {
            console.error("获取对话历史错误:", error);

            // 处理 axios 错误
            if (error.response) {
                throw {
                    message: error.response.data?.message || "获取对话历史失败",
                    status: error.response.status,
                    isShowable: true,
                };
            } else {
                throw {
                    message: error.message || "获取对话历史时发生错误",
                    isShowable: true,
                };
            }
        }
    },

    // 删除对话
    async deleteConversations(conversationIds) {
        try {
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            };

            const response = await axios.delete("/api/chat/delete", {
                headers,
                data: { conversationIds }
            });

            if (response.status === 200) {
                return response.data;
            } else {
                throw {
                    message: response.data?.message || "删除对话失败",
                    status: response.status,
                    isShowable: true,
                };
            }
        } catch (error) {
            console.error("删除对话错误:", error);

            if (error.response) {
                throw {
                    message: error.response.data?.message || "删除对话失败",
                    status: error.response.status,
                    isShowable: true,
                };
            } else {
                throw {
                    message: error.message || "删除对话时发生错误",
                    isShowable: true,
                };
            }
        }
    },

    // 删除所有对话
    async deleteAllConversations() {
        try {
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            };

            const response = await axios.delete("/api/chat/deleteAll", {
                headers
            });

            if (response.status === 200) {
                return response.data;
            } else {
                throw {
                    message: response.data?.message || "删除全部对话失败",
                    status: response.status,
                    isShowable: true,
                };
            }
        } catch (error) {
            console.error("删除全部对话错误:", error);

            if (error.response) {
                throw {
                    message: error.response.data?.message || "删除全部对话失败",
                    status: error.response.status,
                    isShowable: true,
                };
            } else {
                throw {
                    message: error.message || "删除全部对话时发生错误",
                    isShowable: true,
                };
            }
        }
    },

};

export default conversationApi;
