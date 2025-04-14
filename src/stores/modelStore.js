import { defineStore } from "pinia";

export const useModelStore = defineStore("modelStore", {
  state: () => ({
    currentModel: "deepseek-ai/DeepSeek-V3",
    models: [
      { value: 'deepseek-ai/DeepSeek-R1', alias: 'DeepSeek-R1', maxTokens: 16384},
      { value: 'deepseek-ai/DeepSeek-V3', alias: 'DeepSeek-V3', maxTokens: 8192},
      { value: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B', alias: 'DS-R1-D-QW-32B', maxTokens: 16384},
      { value: 'Qwen/QwQ-32B', alias: 'QwQ-32B', maxTokens: 32520},
      { value: 'Qwen/Qwen2.5-72B-Instruct-128K', alias: 'QW2.5-72B-I-128K', maxTokens: 4096},
    ],
    max_tokens: 2048,
    temperature: 0.8,
    top_p: 0.7,
    top_k: 50,
    frequency_penalty: 0.5,
  }),
  actions: {
    switchModel(model) {
      this.currentModel = model;
      this.currentModelIndex = this.models.findIndex(item => item.value === model);
      return this.currentModelIndex;
    },
    switchSettings({ max_tokens, temperature, top_p, top_k, frequency_penalty }) {
      if (max_tokens !== undefined) this.max_tokens = max_tokens;
      if (temperature !== undefined) this.temperature = temperature;
      if (top_p !== undefined) this.top_p = top_p;
      if (top_k !== undefined) this.top_k = top_k;
      if (frequency_penalty !== undefined) this.frequency_penalty = frequency_penalty;
    },
  },
});