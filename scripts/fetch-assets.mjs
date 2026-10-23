// Downloads the photos and seal used in the Figma design into public/images.
// Run on your own machine (needs internet access to figma.com):  npm run assets
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, '..', 'public', 'images')
const manifest = JSON.parse(await readFile(join(here, 'assets-manifest.json'), 'utf8'))

await mkdir(outDir, { recursive: true })

let failed = 0
for (const [file, url] of Object.entries(manifest)) {
  if (file.startsWith('_')) continue
  try {
    const res = await fetch(url, { redirect: 'follow' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    await writeFile(join(outDir, file), Buffer.from(await res.arrayBuffer()))
    console.log('✓', file)
  } catch (err) {
    failed++
    console.error('✗', file, '-', err.message)
  }
}

if (failed) {
  console.error(`\n${failed} file(s) failed. The links may have expired: export those frames from Figma into public/images instead.`)
  process.exit(1)
}
console.log('\nAll assets saved to public/images')
