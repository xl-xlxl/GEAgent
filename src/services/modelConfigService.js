import { modelConfigAPI } from '@/assets/api/modelConfig';
import { message } from 'ant-design-vue';

export const modelConfigService = {
    async getModelConfig(currentModel) {
        try {
            // 调用API层
            const response = await modelConfigAPI.getModelConfig(currentModel);

            if (!response.success) {
                console.error('获取模型配置失败:', response);
                message.error('获取模型配置失败');
                return null;
            }
            
            return {
                max_tokens: response.configs.max_tokens ,
                temperature: response.configs.temperature ,
                top_p: response.configs.top_p ,
                top_k: response.configs.top_k ,
                frequent_penalty: response.configs.frequent_penalty 
            };
        } catch (error) {
            console.error(`模型${currentModel}配置获取服务失败:`, error);
            message.error('配置获取服务失败');
        }
    },


    async updateModelConfig(currentModel, configParams) {
        try {
            if (currentModel === undefined || currentModel === null) {
                message.error('更新失败: 无效的模型ID');
                return false; 
            }
            // 调用API层
            const response = await modelConfigAPI.updateModelConfig(currentModel, configParams);

            if (response && response.success) {
                console.log('模型配置更新成功:', response);
                message.success('模型配置已更新');
                return true;
            } else {
                console.error('模型配置更新失败:', response);
                message.error('更新模型配置失败');
                return false;
            }
        } catch (error) {
            console.error(`更新模型${currentModel}配置服务失败:`, error);

            if (error.response) {
                if (error.response.status === 401) {
                    message.error('身份验证失败，请重新登录');
                } else if (error.response.status === 403) {
                    message.error('您没有权限修改此模型配置');
                } else {
                    message.error(`更新失败: ${error.response.data?.message || '服务器错误'}`);
                }
            } else {
                message.error('网络错误，请检查连接');
            }
            return false;
        }
    }
};