import { api } from './index';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

// 创建新对话
const conversationApi = {
    _abortControllers: new Map(), // 用于存储每个对话的中断控制器

    async createConversation(params, reasoningCallback, replyCallback) {
        try {
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            };

            const response = await fetch(`${API_BASE}/api/chat/create`, {
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
                        // 检测回合信息
                        else if (data.postConversationRequest && data.round) {
                            currentRound = data.round;
                        }
                        // 处理表情包数据
                        else if (data.extraCall && data.extraCall.name === "emojiPack" && data.extraCall.arguments?.url) {
                            if (replyCallback) {
                                replyCallback({
                                    type: 'emoji',
                                    url: data.extraCall.arguments.url,
                                    round: currentRound
                                });
                            }
                            continue;
                        }
                        // 跳过特定的空内容
                        else if (data.content === "\n\n" && data.reasoning_content === null) {
                            continue;
                        }
                        // 其他需要过滤的响应类型
                        else if (data.webSearchStatus || data.success === false || data.content === "<tool_call>") {
                            continue;
                        }
                        // 处理思考过程
                        else if (data.reasoning_content && reasoningCallback) {
                            reasoningCallback(data.reasoning_content, currentRound);
                        }
                        // 处理回复内容
                        else if (data.content !== null && data.content !== undefined && replyCallback) {
                            replyCallback(data.content, currentRound);
                        }
                        // 处理 MCP 状态数据
                        else if (data.MCPStatus) {
                            if (data.MCPStatus.fnCall) {
                                data.MCPStatus.fnCall = data.MCPStatus.fnCall.filter(
                                    call => call && call.name && call.name !== 'emojiPack'
                                );
                            }

                            if (replyCallback) {
                                replyCallback({
                                    type: 'mcp',
                                    mcpData: data.MCPStatus,
                                    round: currentRound
                                });
                            }
                            continue;
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
            // 创建一个新的AbortController并与这个会话ID关联
        const abortController = new AbortController();
        this._abortControllers.set(conversationId, abortController);

            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            };

            // 创建请求
            const response = await fetch(`${API_BASE}/api/chat/continue/${conversationId}`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(params),
                signal: abortController.signal 
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

                        // 检测回合信息
                        if (data.postConversationRequest && data.round) {
                            currentRound = data.round;
                        }
                        // 处理表情包数据
                        else if (data.extraCall && data.extraCall.name === "emojiPack" && data.extraCall.arguments?.url) {
                            if (replyCallback) {
                                replyCallback({
                                    type: 'emoji',
                                    url: data.extraCall.arguments.url,
                                    round: currentRound
                                });
                            }
                            continue;
                        }
                        // 跳过特定的空内容
                        else if (data.content === "\n\n" && data.reasoning_content === null) {
                            continue;
                        }
                        // 其他需要过滤的响应类型
                        else if (data.webSearchStatus || data.success === false || data.content === "<tool_call>") {
                            continue;
                        }
                        // 处理思考过程
                        else if (data.reasoning_content && reasoningCallback) {
                            reasoningCallback(data.reasoning_content, currentRound);
                        }
                        // 处理回复内容
                        else if (data.content !== null && data.content !== undefined && replyCallback) {
                            replyCallback(data.content, currentRound);
                        }
                        // 处理 MCP 状态数据
                        else if (data.MCPStatus) {
                            if (data.MCPStatus.fnCall) {
                                data.MCPStatus.fnCall = data.MCPStatus.fnCall.filter(
                                    call => call && call.name && call.name !== 'emojiPack'
                                );
                            }

                            if (replyCallback) {
                                replyCallback({
                                    type: 'mcp',
                                    mcpData: data.MCPStatus,
                                    round: currentRound
                                });
                            }
                            continue;
                        }

                    } catch (error) {
                      // 检查是否为中断错误
                if (error.name === 'AbortError') {
                    console.log("对话已被用户中断");
                    break;
                }
                    }
                }
            }

            return { conversationId, round: currentRound };
        } catch (error) {
            throw {
                message: error.message || "继续对话失败",
                isShowable: true,
                isAborted: error.name === 'AbortError'
            };
        }finally {
            // 完成后清理中断控制器
            if (conversationId) {
                this._abortControllers.delete(conversationId);
            }
        }
    },

    // 中断对话
abortConversation(conversationId) {
    const controller = this._abortControllers.get(conversationId);
    if (controller) {
        controller.abort();
        this._abortControllers.delete(conversationId);
        return true;
    }
    return false;
},

    // 获取对话列表的方法
    async getConversationList(page = 1, pageSize = 20) {
        try {
            const response = await api.get(`/chat/list?page=${page}&pageSize=${pageSize}`);
            if (response.status === 200) {
                const conversationsList = response.data.conversationsList || {};
                return {
                    success: response.data.success,
                    pagination: conversationsList.pagination,
                    conversations: conversationsList.conversations
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
            const response = await api.get(`/chat/list/${conversationId}?page=${page}&pageSize=${pageSize}`);

            if (response.status === 200) {
                return {
                    success: response.data.success,
                    pagination: response.data.pagingInteractions.pagination,
                    conversation: {
                        id: conversationId,
                        messages: this.processMessages(response.data.pagingInteractions.interactions.rows)
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

    // 处理消息格式化的方法
    processMessages(interactions) {
        if (!interactions?.length) return [];

        const sortedInteractions = [...interactions].sort((a, b) => a.id - b.id);
        const messages = [];

        for (const interaction of sortedInteractions) {
            const groupId = `group-${interaction.id}`;

            // 添加用户消息
            if (interaction.user_input) {
                messages.push({
                    id: `user-${interaction.id}`,
                    role: 'user',
                    content: interaction.user_input,
                    interactionId: interaction.id,
                    groupId
                });
            }

            // 没有消息数据则跳过后续处理
            if (!interaction.messages?.length) continue;

            // 将消息按回合分组并收集数据
            const roundMessages = this.collectRoundMessages(interaction.messages);

            // 创建并添加思考和回复消息
            Object.entries(roundMessages)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .forEach(([round, data]) => {
                    // 添加思考消息
                    if (data.thinking.trim()) {
                        messages.push({
                            id: `thinking-${interaction.id}-round-${round}`,
                            role: 'thinking',
                            thinking: data.thinking.trim(),
                            round: parseInt(round),
                            interactionId: interaction.id,
                            groupId
                        });
                    }

                    // 添加回复消息
                    if (data.content.trim() || data.emojiUrls.length > 0) {
                        const assistantMsg = {
                            id: `assistant-${interaction.id}-round-${round}`,
                            role: 'assistant',
                            content: data.content.trim(),
                            round: parseInt(round),
                            interactionId: interaction.id,
                            groupId
                        };

                        // 添加表情包URL（如果有）
                        if (data.emojiUrls.length > 0) {
                            assistantMsg.emojiUrls = data.emojiUrls;
                        }

                        // 添加MCP数据（如果有）
                        if (data.mcpData) {
                            assistantMsg.mcpData = data.mcpData;
                        }

                        messages.push(assistantMsg);
                    }
                    // 如果有MCP数据但没有文本内容和表情，创建单独的MCP消息
                    else if (data.mcpData) {
                        messages.push({
                            id: `assistant-${interaction.id}-round-${round}-mcp`,
                            role: 'assistant',
                            content: '',
                            mcpData: data.mcpData,
                            round: parseInt(round),
                            interactionId: interaction.id,
                            groupId
                        });
                    }
                });
        }

        return messages;
    },

    // 提取的辅助方法，用于收集每个回合的消息数据
    collectRoundMessages(messages) {
        const roundMessages = {};

        messages.forEach(msg => {
            const round = msg.round || 1;

            // 初始化回合数据
            if (!roundMessages[round]) {
                roundMessages[round] = {
                    thinking: '',
                    content: '',
                    emojiUrls: [],
                    mcpData: null
                };
            }

            // 收集思考内容
            if (msg.assistant_reasoning_output) {
                roundMessages[round].thinking += msg.assistant_reasoning_output.trim() + '\n\n';
            }

            // 收集回复内容
            if (msg.assistant_output) {
                const cleanedOutput = msg.assistant_output
                    .replace(/<tool_call>/g, '')
                    .replace(/<del>/g, '')
                    .trim();

                if (cleanedOutput) {
                    roundMessages[round].content += cleanedOutput + ' ';
                }
            }

            // 收集表情包URL
            if (msg.mcp_service_status?.extraCall) {
                const extraCalls = Array.isArray(msg.mcp_service_status.extraCall)
                    ? msg.mcp_service_status.extraCall
                    : [msg.mcp_service_status.extraCall];

                extraCalls.forEach(call => {
                    if (call?.name === 'emojiPack' && call.arguments?.url) {
                        roundMessages[round].emojiUrls.push(call.arguments.url);
                    }
                });
            }

            // 收集MCP状态数据
            if (msg.mcp_service_status && !roundMessages[round].mcpData) {
                // 提取MCP服务调用数据
                const fnCalls = [];

                // 处理函数调用信息
                if (msg.mcp_service_status.fnCall) {
                    const calls = Array.isArray(msg.mcp_service_status.fnCall)
                        ? msg.mcp_service_status.fnCall
                        : [msg.mcp_service_status.fnCall];

                    calls.forEach(call => {
                        if (call && call.name && call.name !== 'emojiPack') {
                            fnCalls.push({
                                name: call.name,
                                arguments: call.arguments || {}
                            });
                        }
                    });
                }

                // 只有当存在函数调用时才添加MCP数据
                if (fnCalls.length > 0) {
                    roundMessages[round].mcpData = {
                        fnCall: fnCalls
                    };
                }
            }
        });

        return roundMessages;
    },


    // 删除对话
    async deleteConversations(conversationIds) {
        try {
            const response = await api.delete("/chat/delete", {
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
            const response = await api.delete("/chat/deleteAll");
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
            const response = await api.put(`/chat/updateTitle/${conversationId}`, { title });

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
