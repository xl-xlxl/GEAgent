<template>
    <div class="settings-container">
        <div class="model-selection">
            <label>选择模型：</label>
            <select v-model="currentModel"  @change="updateModel">
                <option v-for="model in models" :key="model" :value="model">
                    {{ model }}
                </option>
            </select>
        </div>
    </div>
</template>

<script>
import { useModelStore } from "@/stores/modelStore";

export default {
    name: "SettingsView",
    data() {
        const modelStore = useModelStore();
        return {
            currentModel: modelStore.currentModel,
            models: modelStore.models,
            modelStore,
        };
    },
    methods: {
        updateModel() {
            console.log("当前模型：", this.currentModel);
            this.modelStore.switchModel(this.currentModel);
        },
    },
};
</script>

<style scoped>
@import "@/assets/styles/views/setting.css";
</style>