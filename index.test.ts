import { test } from 'vitest'
import { resolveRedirect } from './vite.config'

test('resolveRedirect', async () => {
    const res = await resolveRedirect('https://framer.com/m/Mega-Menu-2wT3.js@W0zNsrcZ2WAwVuzt0BCl')
    console.log(res)
})
