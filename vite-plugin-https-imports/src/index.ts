import MagicString from 'magic-string'
import { fetch } from 'native-fetch'
import fs from 'fs'

import path from 'path'
import { PluginOption, transformWithEsbuild } from 'vite/dist/node'

export function viteHttpsImportsPlugin() {
    const cwd = process.cwd()
    const folderName = 'httpfiles'
    const folderPath = path.resolve(cwd, folderName)
    let resolved = new Map<string, Promise<any>>()

    const p: PluginOption = {
        name: 'vite-plugin-https-imports', // required, will show up in warnings and errors
        // enforce: 'pre',

        config(config, { command }) {
            if (!config.ssr) {
                config.ssr = {}
            }
            if (!config.ssr.noExternal) {
                config.ssr.noExternal = []
            }
            let regex = /^https:\/\/.*/
            if (Array.isArray(config.ssr.noExternal)) {
                config.ssr.noExternal!.push(regex)
            } else if (typeof config.ssr.noExternal === 'string') {
                config.ssr.noExternal = [config.ssr.noExternal, regex]
            }
            // config.ssr.noExternal.push(new RegExp(`https`))
            config.define ??= {}
            // config.define['process.env.NODE_ENV'] = JSON.stringify('dev')
        },
        async transform(code, id) {
            console.log('http transform', { id })
            if (!code) {
                return null
            }

            // console.log('http transform', res)
            // code = res.code
            if (!code) {
                return null
            }

            // let url = source.replace(prefix, 'https://')

            async function download(url) {
                try {
                    const realUrl = await resolveRedirect(url)

                    let realFile = addExtension(
                        path.resolve(
                            folderPath,
                            realUrl.replace('https://', ''),
                        ),
                    )
                    const res = await fetch(realUrl)
                    if (!res.ok) {
                        throw new Error(
                            `http resolve not ok for ${url} ${res.status} imported by '${id}'`,
                        )
                    }
                    const text = await res.text()
                    fs.mkdirSync(path.dirname(realFile), {
                        recursive: true,
                    })
                    fs.writeFileSync(realFile, text)
                    return realFile
                } catch (e) {
                    console.error('http resolve error', e)
                    throw e
                }
            }

            {
                // https://regexr.com/7g0nh

                let regex = /from\s*('|")(https:\/\/[^'"]*)('|")/

                let match: RegExpExecArray | null

                while ((match = regex.exec(code)) !== null) {
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
                    let realFile = ''
                    if (resolved.has(url)) {
                        const p = resolved.get(url)
                        realFile = await p
                    } else {
                        let p = download(url)
                        resolved.set(url, p)
                        realFile = await p
                    }

                    const s = new MagicString(code)
                    const end = endIndex - 1

                    const domain = url.replace('https://', '') // .replace(/?.*$/, '')
                    const relativeFolder = path.relative(id, folderPath)
                    let source = `/${folderName}/${domain}`
                    source = realFile
                    console.log('http transform', { source: source, url, id })
                    s.overwrite(
                        startIndex,
                        end + 1,
                        `from ${quote}${source}${quote}`,
                    )

                    code = s.toString() || ''
                }
            }
            {
                // https://regexr.com/7g0tn
                let regex = /new\s*URL\(([^,]+),\s*(import\.meta\.url)\s*\)/

                let match: RegExpExecArray | null

                while ((match = regex.exec(code)) !== null) {
                    let whole = match[0]
                    let importMeta = match[2]
                    const start = match.index + whole.indexOf(importMeta)
                    const end = start + importMeta.length
                    const s = new MagicString(code)
                    let prefix = `/${folderName}/`
                    const domain = id.slice(id.indexOf(prefix) + prefix.length)
                    let url = `https://${domain}`
                    console.log('second transform', {
                        url,
                        id,
                        meta: code.slice(start, end),
                    })
                    s.overwrite(start, end, `"${url}"`)

                    code = s.toString() || ''
                }
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
        // async resolveId(source, importer, options) {
        //     // if (source.startsWith(prefix)) {
        //     //     source = 'https://' + source.slice(prefix.length)
        //     // }

        //     let snippet = `/${folderName}/`
        //     console.log('http resolve', { source, importer })
        //     const start = source.indexOf(snippet)
        //     // const isAsset =
        //     if (start === -1) {
        //         // console.log('http resolve not found', source)
        //         return
        //     }
        //     let url = 'https://' + source.slice(start + snippet.length)

        //     // console.log('http resolve', { url, realFile })

        //     return {
        //         id: realFile, //
        //         moduleSideEffects: false,
        //     }
        // },
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

export async function resolveRedirect(url) {
    let res = await fetch(url, { redirect: 'manual', method: 'HEAD' })
    const loc = res.headers.get('location')
    if (res.status < 400 && res.status >= 300 && loc) {
        console.log('redirect', loc)
        return resolveRedirect(res.headers.get('location'))
    }
    return url
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
