<template>
    <div ref="bgContainer"
        class="bg-[#FAF6F5] fixed top-1/2 left-1/2 z-[10000] -translate-x-1/2 -translate-y-1/2 pointer-events-none *:pointer-events-auto overflow-hidden w-full h-full will-change-transform">
        <div
            class="w-full absolute flex flex-col items-center justify-center select-none will-change-transform top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div ref="bgLogo" class="relative w-3/5 min-w-[320px]">
                <img ref="logoGE" :src="getPreRes('GE')" alt=""
                    class="w-full min-w-[320px] relative z-[4] will-change-transform">
                <img ref="logoAGENT" :src="getPreRes('AGENT')" alt=""
                    class="w-full min-w-[320px] absolute inset-0 z-[3] will-change-transform">
                <div ref="logoMask1" class="absolute inset-0 bg-[#FAF6F5] z-[3] will-change-transform"></div>
                <img ref="logoMyGO" :src="getPreRes('MyGO!!!')" alt=""
                    class="w-full min-w-[320px] absolute inset-0 z-[2] will-change-transform">
                <div ref="logoMask2" class="absolute inset-0 bg-[#FAF6F5] z-[2] will-change-transform"></div>
            </div>
        </div>
        <!-- <div class="absolute w-10 h-10 bg-slate-400 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        </div> -->
        <div ref="bgContent" class="bg w-full h-full absolute z-[5] overflow-hidden will-change-transform">
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSystemStore } from '@/stores/system'
import { preloader } from '@/services/preloader'
import { gsap } from 'gsap'




const route = useRoute()
const systemStore = useSystemStore()
const bgContainer = ref(null)
const bgContent = ref(null)
const bgLogo = ref(null)
const logoMask1 = ref(null)
const logoMask2 = ref(null)
const logoGE = ref(null)
const logoAGENT = ref(null)
const logoMyGO = ref(null)


onMounted(() => {
    gsap.set(bgContent.value, {
        opacity: 1,
        scale: 1,
        xPercent: -50,
        yPercent: -50,
        left: '50%',
        top: '50%',
        width: '10%',
        height: systemStore.isMobile ? 2.5 : 5
    })
    gsap.set(bgLogo.value, {
        yPercent: -17,
    })
    gsap.set(logoMask1.value, {
        opacity: 1,
        scale: 1,
        left: '-36%',
        top: '-32.5%',
        width: '100%',
        height: '100%'
    })
    gsap.set(logoMask2.value, {
        opacity: 1,
        scale: 1,
        top: '-32.5%',
        width: '100%',
        height: '100%'
    })
    gsap.set(logoGE.value, {
        left: '36%',
    })
    gsap.set(logoAGENT.value, {
        left: '-36%',
    })
    gsap.set(logoMyGO.value, {
        top: '-34%'
    })
})

let loadTL = gsap.timeline()

watch(() => preloader.progress.value, (progress) => {
    console.log(progress)
    if (progress <= 100 && !startLoadComplete) {
        loadTL.to(bgContent.value, {
            duration: 0.1,
            width: `${10 + progress / 2.5}%`,
            ease: 'back.out(1.2)',
            onComplete: () => {
                if (progress === 100) {
                    loadTL = null
                    loadCompleteAnimation()
                    startLoadComplete = true
                }
            }
        })
    }
    if (progress === 100) {
        setTimeout(() => {
            if (!startLoadComplete) {
                loadTL.kill()
                loadTL = null;
                loadCompleteAnimation()
                startLoadComplete = true
            }
        }, 1000)
    }
})

let startLoadComplete = false

function loadCompleteAnimation() {
    const tl = gsap.timeline()
    tl.to(bgContent.value, {
        duration: 1.2,
        width: '100%',
        ease: 'power4.inOut',
        onComplete: () => {
            gsap.set(bgContent.value, {
                left: 0,
                xPercent: 0,
            })
        }
    })
    tl.to(logoMask1.value, {
        duration: 1.2,
        left: '-72.5%',
        ease: 'power4.inOut'
    }, '<')
    tl.to(logoGE.value, {
        duration: 1.2,
        left: 0,
        ease: 'power4.inOut'
    }, '<')
    tl.to(logoAGENT.value, {
        duration: 1.2,
        left: 0,
        ease: 'power4.inOut'
    }, '<')
    tl.to(logoMyGO.value, {
        duration: 1.2,
        top: 0,
        ease: 'power4.inOut',
        onComplete: () => {
            systemStore.animationId = 'mainIn'
        }
    }, '-=0.75')
    tl.to(bgContainer.value, {
        duration: 1,
        scale: 1.05,
        filter: 'blur(12px)',
        opacity: 0,
        x: '2%',
        y: '5%',
        ease: 'power4.inOut',
        onComplete: () => {
            bgLogo.value.style.display = 'none'
            bgContainer.value.classList.remove('bg-black');
            bgContainer.value.style.backgroundColor = 'transparent'
            loadAnimationToMain(tl)
        }
    })
}

function loadAnimationToMain(tl: gsap.core.Timeline) {
    tl.to(bgContent.value, {
        duration: 1.2,
        y: '100%',
        ease: "power4.inOut",
        onComplete: () => {
            bgContent.value.style.display = 'none'
        }
    })
}


function getPreRes(id: string) {
    const resource = preloader.resources.find(r => r.id === id)
    return resource && resource.loaded ? resource.url : ''
}






</script>

<style scoped>
.bg {
    background: linear-gradient(100deg, #bba7a1, #bdaa95, #b3a390);
}
</style>