import conversationApi from "@/assets/api/conversation";

// 创建新会话的服务函数
export async function createConversation(params, reasoningCallback, replyCallback) {
    try {
        const response = await conversationApi.createConversation(
            params,
            reasoningCallback,
            replyCallback
        );

        return response;
    } catch (error) {
        console.log("创建对话-服务层错误:", error);
        throw {
            message: error.message || "创建对话失败",
            isShowable: error.isShowable === true,
        };
    }
}

// 继续对话的服务函数
export async function continueConversation(params, conversationId, reasoningCallback, replyCallback) {
    try {
        const response = await conversationApi.continueConversation(
            params,
            conversationId,
            reasoningCallback,
            replyCallback
        );
        return response;
    } catch (error) {
        return {
            success: false,
            error: {
                message: "无法完成请求",
                isShowable: error.isShowable === true
            }
        }
    }
}

// 添加中断对话的函数
export function abortConversation(conversationId) {
    try {
        return conversationApi.abortConversation(conversationId);
    } catch (error) {
        console.log("中断对话-服务层错误:", error);
        return false;
    }
}

// 添加获取对话列表的函数
export async function getConversationList(page = 1, pageSize = 20) {
    try {
        const response = await conversationApi.getConversationList(page, pageSize);
        return response;
    } catch (error) {
        console.log("获取对话列表-服务层错误:", error);
        return {
            success: false,
            error: {
                message: "无法获取对话列表",
                isShowable: error.isShowable === true
            }
        }
    }
}

// 添加获取特定对话历史的函数
export async function getConversationHistory(conversationId, page = 1, pageSize = 10) {
    try {
        const response = await conversationApi.getConversationHistory(conversationId, page, pageSize);
        return response;
    } catch (error) {
        console.log("获取对话历史-服务层错误:", error);
        return {
            success: false,
            error: {
                message: "无法获取对话历史",
                isShowable: error.isShowable === true
            }
        }
    }
}

// 删除对话的函数
export async function deleteConversations(conversationIds) {
    try {
        const response = await conversationApi.deleteConversations(conversationIds);
        return response;
    } catch (error) {
        console.log("删除对话-服务层错误:", error);
        return {
            success: false,
            error: {
                message: "无法删除对话",
                isShowable: error.isShowable === true
            }
        }
    }
}

// 删除所有对话的函数
export async function deleteAllConversations() {
    try {
        const response = await conversationApi.deleteAllConversations();
        return response;
    } catch (error) {
        console.log("删除所有对话-服务层错误:", error);
        return {
            success: false,
            error: {
                message: "无法删除所有对话",
                isShowable: error.isShowable === true
            }
        }
    }
}

// 添加更新对话标题的服务函数
export async function updateConversationTitle(conversationId, title) {
    try {
        const response = await conversationApi.updateConversationTitle(conversationId, title);
        return response;
    } catch (error) {
        console.log("更新对话标题-服务层错误:", error);
        return {
            success: false,
            error: {
                message: "无法更新对话标题",
                isShowable: error.isShowable === true
            }
        }
    }
}