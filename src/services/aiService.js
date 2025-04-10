import { useModelStore } from "@/stores/modelStore.js";
const API_KEY = import.meta.env.VITE_SILICON_FLOW_API_KEY;

export const chatService = {
    async sendMessage(messages, onThinking, onReply) {
        try {
            // 从 Pinia Store 获取动态参数
            const modelStore = useModelStore();
            const model = modelStore.currentModel;
            const max_tokens = modelStore.max_tokens;
            const temperature = modelStore.temperature;
            const top_p = modelStore.top_p;
            const top_k = modelStore.top_k;
            //模型参数
            const options = {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    stream: true,
                    max_tokens: max_tokens,
                    temperature: temperature, 
                    top_p: top_p,
                    top_k: top_k,
                    include_reasoning: true,
                    frequency_penalty: 0.5,
                    n: 1,
                    response_format: { type: "text" },
                }),
            };
            const response = await fetch(
                "https://api.siliconflow.cn/v1/chat/completions",
                options
            );
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || "请求失败");
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let content = "";
            let thinkingContent = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk
                    .split("\n")
                    .filter((line) => line.trim().startsWith("data: "));
                for (const line of lines) {
                    if (line.includes("[DONE]")) {
                        continue;
                    }
                    try {
                        const jsonStr = line.replace("data: ", "").trim();
                        const json = JSON.parse(jsonStr);
                        // 提取思考过程
                        if (
                            json.choices &&
                            json.choices[0].delta.reasoning_content !== undefined &&
                            json.choices[0].delta.reasoning_content !== null
                        ) {
                            const reasoning = json.choices[0].delta.reasoning_content;
                            thinkingContent += reasoning;
                            if (typeof onThinking === "function") {
                                onThinking(reasoning);
                            }
                        }
                        // 提取回答内容
                        if (
                            json.choices &&
                            json.choices[0].delta.content !== undefined &&
                            json.choices[0].delta.content !== null
                        ) {
                            const reply = json.choices[0].delta.content;
                            content += reply;
                            if (typeof onReply === "function") {
                                onReply(reply);
                            }
                        }
                        // 检查是否完成
                        if (json.choices && json.choices[0] && json.choices[0].finish_reason) {
                            if (json.choices[0].finish_reason === "stop") {
                                console.log("回答生成完成");
                                break;
                            } else if (json.choices[0].finish_reason === "length") {
                                console.warn("回答长度超过限制，已被截断");
                                break;
                            } else if (json.choices[0].finish_reason === "content_filter") {
                                console.warn("部分内容因内容过滤而被截断");
                                break;
                            } else {
                                console.warn(`回答因 ${json.choices[0].finish_reason} 原因结束`);
                                break;
                            }
                        }
                    } catch (e) {
                        console.error("解析流数据失败:", e, line);
                    }
                }
            }
            return {
                role: "assistant",
                content: content || "抱歉，未能生成回复",
                thinking: thinkingContent,
            };
        } catch (error) {
            console.error("API调用失败:", error);
            throw error;
        }
    },
};