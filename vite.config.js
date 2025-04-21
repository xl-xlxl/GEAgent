import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import Components from 'unplugin-vue-components/vite'
import { AntDesignXVueResolver } from 'ant-design-x-vue/resolver';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';

export default defineConfig({
    plugins: [
        vue(),
        tailwindcss(),
        Components({
            dirs: ['src/components'],
            extensions: ['vue'],
            dts: 'src/components.d.ts',
            resolvers: [
                AntDesignXVueResolver(),
                AntDesignVueResolver({
                    importStyle: false,
                }),
            ],
        }),
    ],
    server: {
        proxy: {
            '/api/qianfan': {
                target: 'https://qianfan.baidubce.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/qianfan/, '')
            },
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '')
            }
        }
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        }
    },
})