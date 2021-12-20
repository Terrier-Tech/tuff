export {}

import * as fs from 'fs'
import TypescriptTree from './ts-tree'
import * as meta from './dom-meta'
import SourceFile from './source-file'


const elementTypes: {[name: string]: meta.Element} = {}
const taggedElements: {[name: string]: meta.Element} = {}

const raw = fs.readFileSync('node_modules/typescript/lib/lib.dom.d.ts', {encoding:'utf8', flag:'r'})

const tst = new TypescriptTree(raw)
let numSkipped = 0
let baseElement: meta.Element | null = null

tst.eachInterface(iface => {
    const name = tst.text(iface.name)

    // see if it's the tag name map
    if (name == 'HTMLElementTagNameMap') {
        for (let prop of tst.getProperties(iface)) {
            const elem = elementTypes[prop.type]
            if (elem) {
                console.log(`<${prop.name}> is ${prop.type}`)
                taggedElements[prop.name] = elem
            }
            else {
                console.log(`Skipping <${prop.name}> (${prop.type})`)
                numSkipped += 1
            }
        }
    }
    // see if it is HTMLElement
    else if (name == 'HTMLElement') {
        const elem = new meta.Element(name, iface, tst)
        elementTypes[name] = elem
        baseElement = elem
    }
    // see if it extends HTMLElement
    else if (tst.interfaceExtends(iface, 'HTMLElement')) {
        const comment = tst.fullText(iface).split('interface')[0]
        if (!comment.includes('@deprecated')) { // skip deprecated elements
            const elem = new meta.Element(name, iface, tst)
            elementTypes[name] = elem
        }
    }
})

if (!baseElement) {
    throw "No HTMLElement declaration!"
}

console.log(`Parsed ${Object.entries(taggedElements).length} tagged element types (skipped ${numSkipped})`)

const tagsFile = new SourceFile('src/tuff/tags.ts')

const classDeclarations = Object.values(elementTypes).map(elem => {
    return elem.classDeclaration(baseElement!)
}).join("\n\n")
tagsFile.replaceRegion("Tag Classes", classDeclarations)

const tagMethods = Object.entries(taggedElements).map(([tag, elem]) => {
    return elem.tagMethod(tag)
}).join("\n")
tagsFile.replaceRegion("Tag Methods", tagMethods)

tagsFile.write()
