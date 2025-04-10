import { defineStore } from "pinia";

export const useModelStore = defineStore("modelStore", {
  state: () => ({
    currentModel: "deepseek-ai/DeepSeek-R1",
    models: [
      "deepseek-ai/DeepSeek-R1",
      "deepseek-ai/DeepSeek-V3",
      "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
      "Qwen/QwQ-32B",
      "Qwen/Qwen2.5-72B-Instruct-128K",
    ],
    max_tokens: 4096,
    temperature: 0.7,
    top_p: 0.7,
    top_k: 50,
  }),
  actions: {
    switchModel(model) {
      this.currentModel = model;
    },
    switchSettings({ max_tokens, temperature, top_p, top_k }) {
      if (max_tokens !== undefined) this.max_tokens = max_tokens;
      if (temperature !== undefined) this.temperature = temperature;
      if (top_p !== undefined) this.top_p = top_p;
      if (top_k !== undefined) this.top_k = top_k;
    },
  },
});