import { defineStore } from "pinia";

export const useModelStore = defineStore("modelStore", {
  state: () => ({
    currentModel: 3,
    models: [
      { value: "DeepSeek-R1", maxTokens: 16384, LLMID: 0 },
      { value: "DeepSeek-V3", maxTokens: 8192, LLMID: 1 },
      { value: "DS-R1-D-QW-32B", maxTokens: 16384, LLMID: 2 },
      { value: "QwQ-32B", maxTokens: 32520, LLMID: 3 },
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
    switchModel(modelId) {
      this.currentModel = modelId;
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
  },
  persist: true,
});
