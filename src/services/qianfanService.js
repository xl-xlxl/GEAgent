import axios from "axios";

const TOKEN = import.meta.env.VITE_QIANFAN_TOKEN;
const APP_ID = import.meta.env.VITE_QIANFAN_APP_ID;

export const qianfanService = {
    
    async getConversationId() {
        try {
            const options = {
                method: "POST",
                url: "/api/qianfan/v2/app/conversation",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${TOKEN}`,
                },
                data: JSON.stringify({
                    app_id: APP_ID,
                }),
            };
            const response = await axios(options);
            return response.data.conversation_id;
        } catch (error) {
            console.error("联网服务获取会话ID失败:", error.message);
        }
    },

    async sendMessage(query, conversationId) {
        try {
            const options = {
                method: "POST",
                url: "/api/qianfan/v2/app/conversation/runs",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${TOKEN}`,
                },
                data: JSON.stringify({
                    app_id: APP_ID,
                    query: query,
                    conversation_id: conversationId,
                    stream: false,
                }),
            };
            const response = await axios(options);
            return response.data.response;
        } catch (error) {
            return '联网服务请求失败:' + error.message;
        }
    }
};
