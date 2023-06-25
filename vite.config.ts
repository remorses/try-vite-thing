import { defineConfig, transformWithEsbuild } from 'vite'
import fs from 'fs'
import path from 'path'
import MagicString from 'magic-string'

import react from '@vitejs/plugin-react'
import { PluginOption } from 'vite'

export default defineConfig({
    plugins: [viteHttpfilePlugin(), react()],
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

export function viteHttpfilePlugin() {
    const cwd = process.cwd()
    const folderName = 'httpfiles'
    const folderPath = path.resolve(cwd, folderName)
    let resolved = new Map<string, Promise<any>>()
    /**
     * @type {import('vite').PluginOption}
     */
    const p: PluginOption = {
        name: 'vite-plugin-httpfile', // required, will show up in warnings and errors
        // enforce: 'pre',

        config(config, { command }) {
            if (!config.ssr) {
                config.ssr = {}
            }
            if (!config.ssr.noExternal) {
                config.ssr.noExternal = []
            }
            config.ssr.noExternal!.push(/^https:\/\//)
            // config.ssr.noExternal.push(new RegExp(`https`))
            config.define ??= {}
            // config.define['process.env.NODE_ENV'] = JSON.stringify('dev')
        },
        async transform(code, id) {
            if (!code) {
                return null
            }

            // console.log('http transform', res)
            // code = res.code
            if (!code) {
                return null
            }
            // https://regexr.com/7g0nh
            let regex = /from\s*('|")(https:\/\/[^'"]*)('|")/
            let transformed = false

            /**
             * @type {RegExpExecArray | null}
             */
            let match

            while ((match = regex.exec(code)) !== null) {
                transformed = true
                const startIndex = match.index
                const endIndex = match[0].length + startIndex
                const quote = match[1]
                if (!quote) {
                    throw new Error('no quote found for import')
                }
                const url = match[2]
                if (!url) {
                    throw new Error('no url found for import')
                }

                const s = new MagicString(code)
                const end = endIndex - 1

                const domain = url.replace('https://', '') // .replace(/?.*$/, '')
                const relativeFolder = path.relative(id, folderPath)
                const source = `/${folderName}/${domain}`
                console.log('http transform', { source: source, url, id })
                s.overwrite(
                    startIndex,
                    end + 1,
                    `from ${quote}${source}${quote}`,
                )

                code = s.toString() || ''
            }

            // if (transformed) {
            //     console.log(code.split('\n').slice(0, 20).join('\n'))
            // }
            return {
                code,
            }
            const res = await transformWithEsbuild(code, id, {
                sourcemap: true,
                loader: 'js',
            })
            return { code: res.code, map: res.map }
        },
        // async load(source, id, options) {
        //     console.log('http load', source)

        //     if (!source.startsWith(prefix)) {
        //         return null
        //     }
        //     let url = source.replace(prefix, 'https://')
        //     let httpfileText = await fetch(url).then((res) => res.text())

        //     return { code: httpfileText }
        // },
        // resolveImportMeta(property, opts) {
        //     const { moduleId } = opts
        //     console.log('resolveImportMeta', property, opts)
        //     if (property === 'url') {
        //         return `new URL('${path.relative(
        //             process.cwd(),
        //             moduleId,
        //         )}', document.baseURI).href`
        //     }
        //     return null
        // },
        async resolveId(source, importer, options) {
            // if (source.startsWith(prefix)) {
            //     source = 'https://' + source.slice(prefix.length)
            // }

            let snippet = `/${folderName}/`
            console.log('http resolve', { source, importer })
            const start = source.indexOf(snippet)
            // const isAsset =
            if (start === -1) {
                // console.log('http resolve not found', source)
                return
            }
            let url = 'https://' + source.slice(start + snippet.length)
            let realFile = addExtension(
                path.resolve(folderPath, source.slice(start + snippet.length)),
            )
            console.log('http resolve', { url, realFile })

            if (resolved.has(url)) {
                const p = resolved.get(url)
                await p
                return { id: realFile }
            }
            // let url = source.replace(prefix, 'https://')
            let p = fetch(url)
                .then(async (res) => {
                    if (!res.ok) {
                        throw new Error(
                            `http resolve not ok for ${url} ${res.status}`,
                        )
                    }
                    const text = await res.text()
                    fs.mkdirSync(path.dirname(realFile), {
                        recursive: true,
                    })
                    fs.writeFileSync(realFile, text)
                    return
                })
                .catch((e) => {
                    console.error('http resolve', e.stack)
                })
            resolved.set(url, p)
            await p

            return {
                id: realFile, //
                moduleSideEffects: false,
            }
        },
        // resolveDynamicImport(source, importer, options) {
        //     // if (source.startsWith(prefix)) {
        //     //     source = 'https://' + source.slice(prefix.length)
        //     // }
        //     if (typeof source !== 'string') {
        //         return null
        //     }
        //     console.log('http resolve', source)
        //     if (source.startsWith(prefix)) {
        //         return { id: source, moduleSideEffects: false }
        //     }
        // },
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

function addExtension(p) {
    const ext = path.extname(p)
    console.log('addExtension', ext)
    if (!ext) {
        return p + '.js'
    }
    if (ext.includes('@')) {
        return p + '.js'
    }
    // if (!p.endsWith('.js')) {
    //     return p + '.js'
    // }
    return p
}
