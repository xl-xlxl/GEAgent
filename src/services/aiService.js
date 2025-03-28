// 硅基流动的API服务（调用了deepseek R1）
const API_KEY = import.meta.env.VITE_SILICON_FLOW_API_KEY || '<token>';

export const chatService = {
    /**
     * 发送消息到硅基流动API
     * @param {Array} messages 聊天消息历史
     * @returns {Promise} 返回AI响应的Promise
     */
    async sendMessage(messages) {
        try {
            const options = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "model": "deepseek-ai/DeepSeek-R1",
                    "messages": messages,
                    "stream": false,
                    "max_tokens": 512,
                    "stop": null,
                    "temperature": 0.7,
                    "top_p": 0.7,
                    "top_k": 50,
                    "frequency_penalty": 0.5,
                    "n": 1,
                    "response_format": { "type": "text" }
                })
            };

            const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', options);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || '请求失败');
            }

            return data.choices[0].message;
        } catch (error) {
            console.error('API调用失败:', error);
            throw error;
        }
    }
};