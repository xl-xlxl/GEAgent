import conversationApi from "@/assets/api/conversation";

export async function createConversation(params, reasoningCallback, replyCallback) {
    try {
        const response = await conversationApi.createConversation(params, reasoningCallback, replyCallback);
        return response; 
    } catch (error) {
        console.log("创建新会话-服务层错误:", error);
        return {
            success: false,
            error: {
                message: "无法完成请求",
                isShowable: error.isShowable === true
            }
        }
    }
}

// 添加继续对话的服务函数
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
        console.log("继续对话-服务层错误:", error);
        return {
            success: false,
            error: {
                message: "无法完成请求",
                isShowable: error.isShowable === true
            }
        }
    }
}

// 添加获取对话列表的函数
export async function getConversationList() {
    try {
        const response = await conversationApi.getConversationList();
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
export async function getConversationHistory(conversationId) {
    try {
        const response = await conversationApi.getConversationHistory(conversationId);
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