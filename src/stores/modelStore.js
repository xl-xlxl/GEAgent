import { defineStore } from "pinia";
import { modelConfigService } from "@/services/modelConfigService";

export const useModelStore = defineStore("modelStore", {
  state: () => ({
    currentModel: 3,
    models: [
      { value: "DeepSeek-R1", maxTokens: 16384, LLMID: 0 },
      { value: "DeepSeek-V3", maxTokens: 8192, LLMID: 1 },
      { value: "DS-R1-D-QW-32B", maxTokens: 16384, LLMID: 2 },
      { value: "QwQ-32B", maxTokens: 16384, LLMID: 3 },
      { value: "QW2.5-72B-I-128K", maxTokens: 4096, LLMID: 4 },
    ],
    max_tokens: 2048,
    temperature: 0.8,
    top_p: 0.7,
    top_k: 50,
    frequency_penalty: 0.5,
  }),

  getters: {
    // 获取当前选中的模型完整信息
    getCurrentModel(state) {
      return (
        state.models.find((model) => model.LLMID === state.currentModel) ||
        state.models[3]
      );
    },
  },

  actions: {
    async switchModel(modelId) {
      // 更新当前模型ID
      this.currentModel = modelId;
      
      // 如果用户已登录，从后端加载对应模型配置
      if (localStorage.getItem('token')) {
        try {
          this.isLoading = true;
          const configs = await modelConfigService.getModelConfig(modelId);
          
          if (configs) {
            // 使用后端配置更新本地状态
            this.switchSettings(configs);
            console.log(`已从后端加载模型${modelId}配置`);
          }
        } catch (error) {
          console.error(`加载模型${modelId}配置失败:`, error);
          // 错误已在服务层处理，这里不做额外处理
        } finally {
          this.isLoading = false;
        }
      } else {
        console.log('用户未登录，使用本地模型配置');
      }
    },

    switchSettings({
      max_tokens,
      temperature,
      top_p,
      top_k,
      frequency_penalty,
    }) {
      if (max_tokens !== undefined) this.max_tokens = max_tokens;
      if (temperature !== undefined) this.temperature = temperature;
      if (top_p !== undefined) this.top_p = top_p;
      if (top_k !== undefined) this.top_k = top_k;
      if (frequency_penalty !== undefined)
        this.frequency_penalty = frequency_penalty;
    },
    
    /**
     * 将当前设置同步到后端
     * @returns {Promise<boolean>} 是否同步成功
     */
    async syncSettingsToBackend() {
      if (!localStorage.getItem('token')) {
        console.log('用户未登录，无法同步配置到后端');
        return false;
      }
      
      try {
        const configParams = {
          max_tokens: this.max_tokens,
          temperature: this.temperature,
          top_p: this.top_p,
          top_k: this.top_k,
          frequency_penalty: this.frequency_penalty,
        };
        
        const success = await modelConfigService.updateModelConfig(
          this.currentModel,
          configParams
        );
        
        if (success) {
          console.log(`成功同步模型${this.currentModel}配置到后端`);
        }
        
        return success;
      } catch (error) {
        console.error('同步配置到后端失败:', error);
        return false;
      }
    },
  },
  persist: true,
});
