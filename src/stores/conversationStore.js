import { defineStore } from 'pinia';

export const useConversationStore = defineStore('conversationStore', {
    state: () => ({
        initialMessage: '', // 存储初始消息
    }),
    actions: {
        setInitialMessage(message) {
            this.initialMessage = message;
        },
        clearInitialMessage() {
            this.initialMessage = '';
        },
    },
});