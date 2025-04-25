import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import Components from 'unplugin-vue-components/vite'
import { AntDesignXVueResolver } from 'ant-design-x-vue/resolver';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import { nodePolyfills } from 'vite-plugin-node-polyfills'


export default defineConfig({
    plugins: [
        vue(),
        tailwindcss(),
        nodePolyfills({
            include: ['path', 'fs', 'url', 'source-map-js']
        }),
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
            '/api/chat': {
        target: 'http://localhost:3000',
        changeOrigin: true
    }
        }
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            'source-map-js': 'source-map',
        }
    },
})