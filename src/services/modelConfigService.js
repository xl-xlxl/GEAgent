import { modelConfigAPI } from '@/assets/api/modelConfig';
import { message } from 'ant-design-vue';

// 服务层 - 处理业务逻辑，数据处理，错误处理
export const modelConfigService = {
    /**
     * 获取特定模型的配置参数
     * @param {string|number} modelId - 模型ID
     * @returns {Promise<Object>} - 处理后的模型配置
     */
    async getModelConfig(modelId) {
        try {
            // 调用API层
            const response = await modelConfigAPI.getModelConfig(modelId);

            // 数据验证与处理
            if (!response.success) {
                console.error('获取模型配置失败:', response);
                message.error('获取模型配置失败');
                return null;
            }

            // 数据格式转换与默认值处理
            return {
                max_tokens: response.configs.max_tokens || 2048,
                temperature: response.configs.temperature || 0.7,
                top_p: response.configs.top_p || 0.7,
                top_k: response.configs.top_k || 50,
                frequency_penalty: response.configs.frequent_penalty || 0.5
            };
        } catch (error) {
            console.error(`模型${modelId}配置获取服务失败:`, error);
            message.error('无法连接到服务器，请检查网络设置');
            // 返回默认配置，确保界面可用
            return {
                max_tokens: 2048,
                temperature: 0.7,
                top_p: 0.7,
                top_k: 50,
                frequency_penalty: 0.5
            };
        }
    },

    /**
     * 更新特定模型的配置
     * @param {string|number} modelId - 模型ID
     * @param {Object} configParams - 配置参数
     * @returns {Promise<boolean>} - 是否更新成功
     */
    async updateModelConfig(modelId, configParams) {
        try {
            // 修改数据验证逻辑，兼容ID为0的情况
            if (modelId === undefined || modelId === null) {
                message.error('更新失败: 无效的模型ID');
                return false;
            }

            // 确保数据范围有效
            const validatedParams = {
                max_tokens: Math.max(0, configParams.max_tokens || 0),
                temperature: Math.min(Math.max(0, configParams.temperature || 0), 2),
                top_p: Math.min(Math.max(0.1, configParams.top_p || 0.1), 1),
                top_k: Math.min(Math.max(0, configParams.top_k || 0), 100),
                frequent_penalty: Math.min(Math.max(-2, configParams.frequency_penalty || 0), 2)
            };

            // 调用API层
            const response = await modelConfigAPI.updateModelConfig(modelId, validatedParams);

            // 处理响应 - 修改判断条件，检查success字段而非configs字段
            if (response && response.success) {
                console.log('模型配置更新成功:', response);
                // 可以显示成功消息
                message.success(response.message || '模型配置已更新');
                return true;
            } else {
                console.error('模型配置更新失败:', response);
                message.error('更新模型配置失败');
                return false;
            }
        } catch (error) {
            console.error(`更新模型${modelId}配置服务失败:`, error);

            // 错误处理与用户反馈
            if (error.response) {
                // 服务器返回错误
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