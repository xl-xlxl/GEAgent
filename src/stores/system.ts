import { defineStore } from 'pinia'
import { h, ref, computed } from 'vue'

export const useSystemStore = defineStore('system', () => {
    const sidebarOpen = ref(true)
    const isMobile = ref(false)
    const contentType = ref('login')
    const elementRef = ref(null)
    const currentRoute = ref(null)
    const animationId = ref(null)

    const updateIsMobile = () => {
            isMobile.value = window.innerWidth < 768;
        };
    
    window.addEventListener('resize', updateIsMobile);
    updateIsMobile();

    function setElement(el: HTMLElement) {
        elementRef.value = el
    }
    
    function setContent(type: string) {
        contentType.value = type
    }

    return {
        sidebarOpen,
        isMobile,
        contentType,
        elementRef,
        currentRoute,
        setElement,
        setContent,
        animationId
    }
})