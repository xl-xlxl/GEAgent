import { api } from './index';

export const modelConfigAPI = {
    // 获取模型配置
    getModelConfig: async (currentModel) => {
        try {
            const response = await api.get(`/config/${currentModel}`);
            return response.data;
        } catch (error) {
            console.error(`API调用失败 - 获取模型${currentModel}配置:`, error);
            throw error;
        }
    },

    // 更新模型配置
    updateModelConfig: async (currentModel, configParams) => {
        try {
            const response = await api.put(`/config/${currentModel}`, {
                configs: configParams
            });
            
            return response.data;
        } catch (error) {
            console.error(`API调用失败 - 更新模型${currentModel}配置:`, error);
            throw error;
        }
    },
    
    getAllModelConfig: async () => {
        try {
            const response = await api.get('/config/all');
            return response.data;
        } catch (error) {
            console.error('API调用失败 - 获取所有模型配置:', error);
            throw error;
        }
    },
};