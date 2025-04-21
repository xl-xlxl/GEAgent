import axios from 'axios';

export const modelConfigAPI = {
    // 获取模型配置
    getModelConfig: async (currentModel) => {
        try {
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            };

            const response = await axios.get(`/api/config/${currentModel}`, { headers });
            return response.data;
        } catch (error) {
            console.error(`API调用失败 - 获取模型${currentModel}配置:`, error);
            throw error;
        }
    },

    // 更新模型配置
    updateModelConfig: async (currentModel, configParams) => {
        try {
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            };

            const response = await axios.put(`/api/config/${currentModel}`, {
                configs: configParams
            }, { headers });
            
            return response.data;
        } catch (error) {
            console.error(`API调用失败 - 更新模型${currentModel}配置:`, error);
            throw error;
        }
    }
};