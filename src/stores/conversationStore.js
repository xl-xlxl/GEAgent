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
        titleMessage(initialMessage) {
            this.titleMessage = initialMessage.length > 20 ? initialMessage.substring(0, 17) + '...' : initialMessage; // 截取前20个字符
        }
    },
});