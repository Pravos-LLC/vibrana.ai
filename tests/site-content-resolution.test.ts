import { describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'

const require = createRequire(import.meta.url)
const bundled = require('next/dist/compiled/webpack/webpack')
const { JsConfigPathsPlugin } = require('next/dist/build/webpack/plugins/jsconfig-paths-plugin')

describe('production display module resolution', () => {
  for (const environment of ['production', 'preview']) {
    it(`selects the correct display module through Next's tsconfig resolver in ${environment}`, async () => {
      const root = await mkdtemp(path.join(tmpdir(), 'display-resolution-'))
      try {
        await mkdir(path.join(root, 'src/site-content'), { recursive: true })
        await writeFile(path.join(root, 'src/site-content/generated.json'), JSON.stringify({ heading: 'SAMPLE' }))
        await writeFile(path.join(root, 'src/site-content/generated.production.json'), JSON.stringify({ heading: 'PREPARED' }))
        await writeFile(path.join(root, 'entry.js'), "module.exports = require('@/src/site-content/generated.json')")
        const module = { exports: {} as { webpack: (config: object) => { resolve: { alias: object } } } }
        runInNewContext(await readFile(path.resolve('next.config.js'), 'utf8'), {
          require, module, __dirname: root, process: { env: { VERCEL_ENV: environment } },
        })
        const config = module.exports.webpack({ resolve: { alias: {} } })
        const compiler = bundled.webpack({
          mode: 'development', target: 'node', devtool: false, context: root,
          entry: './entry.js', output: { path: path.join(root, 'dist'), filename: 'result.cjs', library: { type: 'commonjs2' } },
          resolve: { ...config.resolve, plugins: [new JsConfigPathsPlugin({ '@/*': ['./*'] }, { baseUrl: root, isImplicit: true })] },
        })
        await new Promise<void>((resolve, reject) => {
          compiler.run((error: Error | null, stats: { hasErrors: () => boolean; toString: () => string }) => {
            compiler.close((closeError: Error | null) => {
              if (error || closeError) reject(error || closeError)
              else if (stats.hasErrors()) reject(new Error(stats.toString()))
              else resolve()
            })
          })
        })
        expect(require(path.join(root, 'dist/result.cjs'))).toEqual({ heading: environment === 'production' ? 'PREPARED' : 'SAMPLE' })
      } finally {
        await rm(root, { recursive: true, force: true })
      }
    })
  }
})
