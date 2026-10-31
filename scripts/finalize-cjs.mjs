/**
 * Mark dist/cjs as CommonJS.
 *
 * 🔴 Without this file the CommonJS half of the build does not load at all. The package root declares
 * `"type": "module"`, which applies to every `.js` under it, so Node parses `dist/cjs/index.js` - real
 * CommonJS, `exports.` and all - as an ES module. Measured before the fix, against the packed tarball:
 *
 *   $ node -e "require('@xcrop/sdk')"
 *   Error: Cannot find module './client.js'
 *
 * The `exports` map in package.json cannot solve this: it chooses WHICH file to load, not how Node parses
 * it. The nearest `package.json` to the file is what decides that, which is why this one has to exist.
 *
 * It is generated rather than committed so it cannot drift from the build, and it lands inside `dist`,
 * which `files` already ships.
 */
import { writeFileSync, existsSync } from 'node:fs'

const target = 'dist/cjs/package.json'
if (!existsSync('dist/cjs')) {
  console.error('[finalize-cjs] dist/cjs is missing - run the build first')
  process.exit(1)
}
writeFileSync(target, JSON.stringify({ type: 'commonjs' }, null, 2) + '\n')
console.log(`[finalize-cjs] wrote ${target}`)
