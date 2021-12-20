export {}

import * as fs from 'fs/promises'
import TypescriptTree from './ts-tree'
import * as meta from './dom-meta'

const elementTypes: {[name: string]: meta.Element} = {}
const taggedElements: {[name: string]: meta.Element} = {}

const main = async () => {
    const raw = await fs.readFile('node_modules/typescript/lib/lib.dom.d.ts', 'utf8')
    
    const tst = new TypescriptTree(raw)
    let numSkipped = 0
    let baseElement: meta.Element | null = null

    tst.eachInterface(iface => {
        iface.forEachChild(child => {
            const name = tst.text(iface.name)

            // see if it's the tag name map
            if (tst.nodeIs(child, 'Identifier') && name == 'HTMLElementTagNameMap') {
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
            else if (tst.nodeIs(child, 'Identifier') && name == 'HTMLElement') {
                const elem = new meta.Element(name, iface, tst)
                elementTypes[name] = elem
                baseElement = elem
            }
            // see if it extends HTMLElement
            else if (tst.nodeIs(child, 'HeritageClause')) {
                child.forEachChild(c => {
                    if (tst.nodeIs(c, 'ExpressionWithTypeArguments') && tst.text(c) == 'HTMLElement') {
                        const comment = tst.fullText(iface).split('interface')[0]
                        if (!comment.includes('@deprecated')) { // skip deprecated elements
                            const elem = new meta.Element(name, iface, tst)
                            elementTypes[name] = elem
                        }
                    }
                })
            }
        })
    })

    if (!baseElement) {
        throw "No HTMLElement declaration!"
    }

    console.log(`Parsed ${Object.entries(taggedElements).length} tagged element types (skipped ${numSkipped})`)

}
main()