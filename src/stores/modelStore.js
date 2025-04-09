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
  }),
  actions: {
    switchModel(model) {
      this.currentModel = model;
    },
  },
});