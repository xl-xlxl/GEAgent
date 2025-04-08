import axios from "axios";

const TOKEN =
    import.meta.env.VITE_QIANFAN_TOKEN ||
    "bce-v3/ALTAK-UcjEswgQpcizQZo6rTAUp/c0d8fc271acd5ff14af8574e962ec4be1a099d72";
const APP_ID =
    import.meta.env.VITE_QIANFAN_APP_ID || "2d1c4aff-0811-4225-ab6f-02311b072306";

export const qianfanService = {
    // 获取会话ID
    async getConversationId() {
        try {
            const options = {
                method: "POST",
                url: "/api/qianfan/v2/app/conversation", // 使用代理路径
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
            console.error("获取千帆会话ID失败:", error);
            if (error.response) {
                // 打印服务器返回的详细错误信息
                console.error("错误详情:", error.response.data);
                console.error("状态码:", error.response.status);
            }
            throw error;
        }
    },

    // 发送消息到千帆API
    async sendMessage(query, conversationId) {
        try {
            console.log("准备发送请求到千帆API:", {
                app_id: APP_ID,
                query,
                conversation_id: conversationId,
            });

            const options = {
                method: "POST",
                url: "/api/qianfan/v2/app/conversation/runs", // 使用代理路径
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

            console.log("发送请求选项:", options);
            const response = await axios(options);
            console.log("API响应:", response.data);
            return response.data.response;
        } catch (error) {
            console.error("千帆API请求失败:", error);
            if (error.response) {
                console.error("错误详情:", error.response.data);
                console.error("状态码:", error.response.status);
                console.error("响应头:", error.response.headers);
            } else if (error.request) {
                console.error("请求已发送但未收到响应");
                console.error(error.request);
            } else {
                console.error("请求设置错误:", error.message);
            }
            // 返回一个友好的错误信息，而不是抛出异常
            return `联网搜索失败: ${error.message || "未知错误"}`;
        }
    },
};
