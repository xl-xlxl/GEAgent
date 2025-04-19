import axios from 'axios';

// API层 - 负责与后端直接通信
export const modelConfigAPI = {
    // 获取模型配置
    getModelConfig: async (modelId) => {
        try {
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            };

            const response = await axios.get(`/api/config/${modelId}`, { headers });
            return response.data;
        } catch (error) {
            console.error(`API调用失败 - 获取模型${modelId}配置:`, error);
            throw error;
        }
    },

    // 更新模型配置
    updateModelConfig: async (modelId, configData) => {
        try {
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            };

            const response = await axios.put(`/api/config/${modelId}`, {
                configs: configData
            }, { headers });
            
            return response.data;
        } catch (error) {
            console.error(`API调用失败 - 更新模型${modelId}配置:`, error);
            throw error;
        }
    }
};