import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

import Components from 'unplugin-vue-components/vite'

import { AntDesignXVueResolver } from 'ant-design-x-vue/resolver';

export default defineConfig({
    plugins: [
        vue(),
        Components({

            dirs: ['src/components'],

            extensions: ['vue'],

            dts: 'src/components.d.ts',

            resolvers: [

                AntDesignXVueResolver(),

            ],
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    }
})