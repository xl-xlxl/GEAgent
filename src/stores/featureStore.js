import { defineStore } from 'pinia';

export const useFeatureStore = defineStore('featureStore', {
    state: () => ({
        webSearch: false,        
        enableMCPService: true
    }),
    actions: {
        setWebSearch(value) {
            this.webSearch = value;
        },
        setMCPService(value) {
            this.enableMCPService = value;
        }
    },
    persist: true
});