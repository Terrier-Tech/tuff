export {}

import * as fs from "fs"

const info = console.log

/**
 * Copy the root package.json to dist/package.json after removing some unneeded entries.
 */
function copyPackage() {
    const pkg: Record<string, any> = JSON.parse(fs.readFileSync('package.json', {encoding: 'utf8', flag: 'r'}))

    delete pkg.devDependencies
    delete pkg.scripts

    info(`Writing dist/package.json...`)
    fs.writeFileSync('dist/package.json', JSON.stringify(pkg, null, 2))
}

copyPackage()