import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react(), viteHttpfilePlugin()],
    build: {
        minify: false,
    },
})

export function viteHttpfilePlugin() {
    /**
     * @type {import('vite').PluginOption}
     */
    const p = {
        name: 'vite-plugin-httpfile', // required, will show up in warnings and errors
        // enforce: 'pre',
        config(config, { command }) {
            if (!config.ssr) {
                config.ssr = {}
            }
            if (!config.ssr.noExternal) {
                config.ssr.noExternal = []
            }
            config.ssr.noExternal.push(/https/)
        },
        async load(source, { ssr }) {
            console.log('http load', source)
            if (source.startsWith('framer.com')) {
                source = 'https://' + source
            }
            if (!source.startsWith('https://')) {
                return null
            }
            let httpfileText = await fetch(source).then((res) => res.text())
            return { code: httpfileText }
        },

        resolveId(source, importer, options) {
            console.log('http resolve', source)
            if (source.startsWith('https://')) {
                return { id: source, moduleSideEffects: false }
            }
            if (source.includes('framer.com')) {
                return { id: source, moduleSideEffects: false }
            }
        },
    }
    return p
}

export function exampleWorkingPlugin() {
    /**
     * @type {import('vite').PluginOption}
     */

    const p = {
        name: 'xxx',
        // enforce: 'pre',
        config(config, { command }) {
            if (!config.ssr) {
                config.ssr = {}
            }
            if (!config.ssr.noExternal) {
                config.ssr.noExternal = []
            }
            config.ssr.noExternal.push('xxx')
        },
        async load(source, { ssr }) {
            console.log('load', source)
            if (source !== 'xxx') {
                return null
            }

            return { code: `export default () => null` }
        },

        resolveId(source, importer, options) {
            console.log('resolve', source)
            if (source === 'xxx') {
                return { id: source, external: false, moduleSideEffects: false }
            }
        },
    }
    return p
}
