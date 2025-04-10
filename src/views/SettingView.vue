<template>
    <div class="settings-container">
        <div class="parameter-settings">
            <label>
                最大 Token 数:
                <input type="number" v-model.number="max_tokens" @change="switchSettings" />
            </label>
            <label>
                温度 (temperature):
                <input type="number" step="0.1" v-model.number="temperature" @change="switchSettings" />
            </label>
            <label>
                Top P:
                <input type="number" step="0.1" v-model.number="top_p" @change="switchSettings" />
            </label>
            <label>
                Top K:
                <input type="number" v-model.number="top_k" @change="switchSettings" />
            </label>
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
            max_tokens: modelStore.max_tokens,
            temperature: modelStore.temperature,
            top_p: modelStore.top_p,
            top_k: modelStore.top_k,
            modelStore,
        };
    },
    methods: {
        switchSettings() {
            this.modelStore.switchSettings({
                max_tokens: this.max_tokens,
                temperature: this.temperature,
                top_p: this.top_p,
                top_k: this.top_k,
            });
        },
    },
};
</script>

<style scoped>
@import "@/assets/styles/views/setting.css";
</style>