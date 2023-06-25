import { test } from 'vitest'
import { resolveRedirect } from './'

test('resolveRedirect', async () => {
    const res = await resolveRedirect('https://www.google.com')
    console.log(res)
})
