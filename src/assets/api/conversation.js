import axios from 'axios'

// 创建新对话
const conversationApi = {
    async createConversation(params, reasoningCallback, replyCallback) {
        try {
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            };

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
                        // 跳过特定的空内容
                        else if (data.content === "\n\n" && data.reasoning_content === null) {
                            continue;
                            // 忽略这些特定类型的响应
                        } else if (data.webSearchStatus || data.success === false || data.MCPStatus || data.content === "<tool_call>") {
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


    // 继续对话方法
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


    // 获取对话列表的方法
    async getConversationList(page = 1, pageSize = 20) {
        try {
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            };
            const response = await axios.get(`/api/chat/list?page=${page}&pageSize=${pageSize}`, { headers });
            if (response.status === 200) {
                return {
                    success: response.data.success,
                    pagination: response.data.conversationsList.pagination,
                    conversations: response.data.conversationsList.conversations
                };
            } else {
                throw {
                    message: response.data?.message || "获取对话列表失败",
                    status: response.status,
                    isShowable: true,
                };
            }
        } catch (error) {
            console.error("获取对话列表错误:", error);
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
    async getConversationHistory(conversationId, page = 1, pageSize = 10) {
        try {
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            };
            const response = await axios.get(`/api/chat/list/${conversationId}?page=${page}&pageSize=${pageSize}`, { headers });
            if (response.status === 200) {
                return {
                    success: response.data.success,
                    pagination: response.data.pagingInteractions.pagination,
                    conversation: {
                        id: conversationId,
                        messages: this._processMessages(response.data.pagingInteractions.interactions.rows)
                    }
                };
            } else {
                throw {
                    message: response.data?.message || "获取对话历史失败",
                    status: response.status,
                    isShowable: true,
                };
            }
        } catch (error) {
            console.error("获取对话历史错误:", error);
            throw {
                message: error.response?.data?.message || "获取对话历史失败",
                isShowable: true,
            };
        }
    },

    // 更新处理消息的辅助方法，适配新的数据结构
    _processMessages(interactions) {
        const messages = [];

        // 对交互按时间排序，确保最早的交互在前面
        const sortedInteractions = [...interactions].sort((a, b) =>
            new Date(a.createdAt) - new Date(b.createdAt)
        );

        sortedInteractions.forEach(interaction => {
            // 添加用户消息
            messages.push({
                id: `user-${interaction.id}`,
                role: 'user',
                content: interaction.user_input
            });

            // 处理该交互下的所有助手消息
            if (interaction.messages && interaction.messages.length > 0) {
                // 按轮次排序消息
                const sortedMessages = [...interaction.messages].sort((a, b) => a.round - b.round);

                sortedMessages.forEach(msg => {
                    if (msg.assistant_output && msg.assistant_output.includes("<tool_call>")) {
                        return;
                    }

                    // 添加思考消息
                    if (msg.assistant_reasoning_output) {
                        messages.push({
                            id: `thinking-${msg.id}`,
                            role: 'thinking',
                            thinking: msg.assistant_reasoning_output
                        });
                    }

                    if (msg.assistant_output) {
                        if (msg.assistant_output && msg.assistant_output.trim()) {
                            messages.push({
                                id: String(msg.id),
                                role: 'assistant',
                                content: msg.assistant_output
                            });
                        }
                    }
                });
            }
        });
        return messages;
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

    // 更新对话标题
    async updateConversationTitle(conversationId, title) {
        try {
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            };
            const response = await axios.put(`/api/chat/updateTitle/${conversationId}`,
                { title },
                { headers }
            );
            if (response.status === 200) {
                return {
                    success: response.data.success,
                    message: response.data.message,
                    conversationId: response.data.conversationId,
                    title: response.data.title
                };
            } else {
                throw {
                    message: response.data?.message || "更新对话标题失败",
                    status: response.status,
                    isShowable: true,
                };
            }
        } catch (error) {
            console.error("更新对话标题错误:", error);
            throw {
                message: error.response?.data?.message || "更新对话标题失败",
                isShowable: true,
            };
        }
    },

};

export default conversationApi;
