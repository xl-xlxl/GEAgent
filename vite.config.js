
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import Components from 'unplugin-vue-components/vite'
import { AntDesignXVueResolver } from 'ant-design-x-vue/resolver';

export default defineConfig({
    plugins: [vue(), 
                tailwindcss(), 
                Components({resolvers: [AntDesignXVueResolver()]})
            ],
    server: {
        proxy: {
            '/api/qianfan': {
                target: 'https://qianfan.baidubce.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/qianfan/, '')
            }
        }
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    }
});