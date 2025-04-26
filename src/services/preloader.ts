import { ref, reactive } from 'vue'

export type ResourceType = 'image' | 'font' | 'video' | 'audio' | 'other'

export interface Resource {
    id: string
    type: ResourceType
    url: string
    loaded: boolean
    element?: HTMLElement | null
}

export class Preloader {
    resources = reactive<Resource[]>([])
    progress = ref(0)
    loaded = ref(false)
    errors = ref<string[]>([])
    addResource(id: string, url: string, type: ResourceType = 'image') {
        this.resources.push({ id, url, type, loaded: false })
        return this
    }
    addResources(resources: Array<{ id: string, url: string, type?: ResourceType }>) {
        resources.forEach(resource => {
            this.addResource(resource.id, resource.url, resource.type || 'image')
        })
        return this
    }
    async loadAll(): Promise<void> {
        if (this.resources.length === 0) {
            this.loaded.value = true
            this.progress.value = 100
            return
        }
        const promises = this.resources.map(resource => this.loadResource(resource))
        await Promise.allSettled(promises)
        this.loaded.value = true
        this.progress.value = 100
    }
    private async loadResource(resource: Resource): Promise<void> {
        try {
            if (resource.type === 'image') {
                await this.loadImage(resource)
            } else if (resource.type === 'font') {
                await this.loadFont(resource)
            }
            resource.loaded = true
            this.updateProgress()
        } catch (error) {
            this.errors.value.push(`Failed to load resource ${resource.id}: ${error}`)
            console.error(`Error loading resource ${resource.id}:`, error)
        }
    }
    private loadImage(resource: Resource): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => {
                resource.element = img
                resolve()
            }
            img.onerror = () => reject(new Error(`Failed to load image: ${resource.url}`))
            img.src = resource.url
        })
    }
    private loadFont(resource: Resource): Promise<void> {
        return new Promise((resolve, reject) => {
            const font = new FontFace(resource.id, `url(${resource.url})`)
            font.load()
                .then(loadedFont => {
                    (document.fonts as any).add(loadedFont)
                    resolve()
                })
                .catch(error => reject(error))
        })
    }
    private updateProgress() {
        const totalResources = this.resources.length
        const loadedResources = this.resources.filter(r => r.loaded).length
        this.progress.value = Math.floor((loadedResources / totalResources) * 100)
    }
}

export const preloader = new Preloader()