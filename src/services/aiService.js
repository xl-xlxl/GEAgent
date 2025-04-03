// 硅基流动的API服务（调用了deepseek R1）
const API_KEY = import.meta.env.VITE_SILICON_FLOW_API_KEY || '<token>';

export const chatService = {
    /**
     * 发送消息到硅基流动API
     * @param {Array} messages 聊天消息历史
     * @param {Function} onThinking 思考过程更新的回调函数 (thinking) => void
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
                    "stream": true,
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
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || '请求失败');
            }

            // 初始化流式读取
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let content = "";
            let thinkingContent = "";
            
            // 处理每个数据块
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                // 解码当前块
                const chunk = decoder.decode(value, { stream: true });
                
                // 分割成行，并过滤出数据行
                const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));
                
                for (const line of lines) {
                    // 忽略结束标记
                    if (line.includes('[DONE]')) continue;
                    
                    try {
                        // 解析JSON数据
                        const jsonStr = line.replace('data: ', '').trim();
                        const json = JSON.parse(jsonStr);
                        
                        // 提取思考内容
                        if (json.choices && json.choices[0].delta.reasoning_content !== undefined) {
                            const reasoning = json.choices[0].delta.reasoning_content;
                            if (reasoning !== null) {
                                thinkingContent += reasoning;
                                // 回调通知更新思考过程
                                if (typeof onThinking === 'function') {
                                    onThinking(thinkingContent);
                                }
                            }
                        }
                        
                        // 提取实际内容
                        if (json.choices && json.choices[0].delta.content !== undefined && json.choices[0].delta.content !== null)
                            {
                            content += json.choices[0].delta.content;
                            }
                        
                        // 检查是否完成
                        if (json.choices[0].finish_reason === 'stop') {
                            break;
                        }
                    } catch (e) {
                        console.error('解析流数据失败:', e, line);
                    }
                }
            }
            
            // 返回完整的消息对象
            return {
                role: 'assistant',
                content: content || '抱歉，未能生成回复',
                thinking: thinkingContent
            };
        } catch (error) {
            console.error('API调用失败:', error);
            throw error;
        }
    }
};