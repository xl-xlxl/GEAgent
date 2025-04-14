import conversationApi from "@/assets/api/conversation";

/**
 * 创建新对话
 * @param {Object} params 对话参数
 * @param {Function} reasoningCallback 思考过程回调函数
 * @param {Function} replyCallback 回复内容回调函数
 * @returns {Promise<Object>} 响应结果
 */
export async function createConversation(params, reasoningCallback, replyCallback) {
    try {
        const response = await conversationApi.createConversation(params, reasoningCallback, replyCallback);
        if (response.success === true) {
            return response;
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        return {
            success: false,
            error
        }
    }
}

/**
 * 获取对话历史记录
 * @returns {Promise<Object>} 响应结果
 */
export async function getConversations() {
    try {
        const response = await conversationApi.getConversations();
        if (response.success === true) {
            return response;
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            error
        }
    }
}

/**
 * 获取特定对话详情
 * @param {number} id 对话ID
 * @returns {Promise<Object>} 响应结果
 */
export async function getConversationById(id) {
    try {
        const response = await conversationApi.getConversationById(id);
        if (response.success === true) {
            return response;
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            error
        }
    }
}

/**
 * 删除对话
 * @param {number} id 对话ID
 * @returns {Promise<Object>} 响应结果
 */
export async function deleteConversation(id) {
    try {
        const response = await conversationApi.deleteConversation(id);
        if (response.success === true) {
            return response;
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            error
        }
    }
}

/**
 * 更新对话标题
 * @param {number} id 对话ID
 * @param {string} title 新标题
 * @returns {Promise<Object>} 响应结果
 */
export async function updateConversationTitle(id, title) {
    try {
        const response = await conversationApi.updateConversationTitle(id, title);
        if (response.success === true) {
            return response;
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            error
        }
    }
}