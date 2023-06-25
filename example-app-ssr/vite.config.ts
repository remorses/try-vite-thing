import { defineConfig, transformWithEsbuild } from 'vite'
import { viteHttpsImportsPlugin } from 'vite-plugin-https-imports/src/index'
import fs from 'fs'
import path from 'path'

import react from '@vitejs/plugin-react'
import { PluginOption } from 'vite'

export default defineConfig({
    plugins: [viteHttpsImportsPlugin(), react()],
    build: {
        minify: false,
    },
    esbuild: {
        define: {
            'process.env.NODE_ENV': JSON.stringify('dev'),
        },
    },
})

// const prefix = `/urlImport:`
