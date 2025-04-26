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
    modelConfigs: {
      0: {
        max_tokens: 4000,
        temperature: 0.9,
        top_p: 0.9,
        top_k: 50,
        frequent_penalty: 0.6,
      },
      1: {
        max_tokens: 3000,
        temperature: 0.4,
        top_p: 0.7,
        top_k: 40,
        frequent_penalty: 0.5,
      },
      2: {
        max_tokens: 4000,
        top_p: 0.9,
        top_k: 50,
        frequent_penalty: 0.3,
      },
      3: {
        max_tokens: 4000,
        top_p: 0.8,
        top_k: 40,
        frequent_penalty: 0.4,
      },
    },
    max_tokens: 4000,
    temperature: 1,
    top_p: 0.9,
    top_k: 50,
    frequent_penalty: 0.5,
  }),

  getters: {
    getCurrentModel(state) {
      return state.models.find((model) => model.LLMID === state.currentModel);
    },
  },

  actions: {

    async getAllModelConfig() {
      if (!localStorage.getItem("token")) {
        console.log("用户未登录，无法获取模型配置");
        return false;
      }

      try {
        this.isLoading = true;
        const response = await modelConfigService.getAllModelConfigs();
        if (response && response.success) {
          // 存储所有模型配置
          response.configs.forEach(configs => {
            const LLMID = configs.LLMID;
            
            // 更新或新建对应 LLMID 的配置
            this.modelConfigs[LLMID] = {
              max_tokens: configs.max_tokens,
              temperature: configs.temperature,
              top_p: configs.top_p,
              top_k: configs.top_k,
              frequent_penalty: configs.frequent_penalty,
            };
          });
          console.log("成功获取所有模型配置");
          return true;
        }
        return false;
      } catch (error) {
        console.error("获取所有模型配置失败:", error);
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    switchSettings(currentModel) {

        this.currentModel = currentModel;
      
        // 从 modelConfigs 获取对应配置
        const config = this.modelConfigs[currentModel];
        if (config) {
          // 应用该模型的所有配置
          this.max_tokens = config.max_tokens;
          this.temperature = config.temperature;
          this.top_p = config.top_p;
          this.top_k = config.top_k;
          this.frequent_penalty = config.frequent_penalty;
          console.log(`已切换到模型${currentModel}的配置`);
          return true;
        } else {
          console.log(`未找到模型${currentModel}的配置`);
          return false;
        }
    },

    persistSettings({
      max_tokens,
      temperature,
      top_p,
      top_k,
      frequent_penalty,
    }) {
      this.max_tokens = max_tokens;
      this.temperature = temperature;
      this.top_p = top_p;
      this.top_k = top_k;
      this.frequent_penalty = frequent_penalty; 
    },


    async syncSettingsToBackend() {
      if (!localStorage.getItem("token")) {
        console.log("用户未登录，无法同步配置到后端");
        return false;
      }

      try {
        console.log(this.currentModel)
        const configParams = {
          max_tokens: this.max_tokens,
          temperature: this.temperature,
          top_p: this.top_p,
          top_k: this.top_k,
          frequent_penalty: this.frequent_penalty,
        };

        const success = await modelConfigService.updateModelConfig(
          this.currentModel,
          configParams
        );

        if (success) {
          console.log(`成功同步模型${this.currentModel}配置到后端`);
          this.modelConfigs[this.currentModel] = configParams; // 更新本地缓存
        }

        return success;
      } catch (error) {
        console.error("同步配置到后端失败:", error);
        return false;
      }
    },
  },
  persist: true,
});
