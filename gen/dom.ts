export {}

import * as fs from 'fs/promises'
import * as ts from 'typescript'
import * as tsh from './ts-helpers'
import ElementType from './element-type'


const elementTypes: {[name: string]: ElementType} = {}

const main = async () => {
    const raw = await fs.readFile('node_modules/typescript/lib/lib.dom.d.ts', 'utf8')
    
    const sourceFile = ts.createSourceFile('temp.ts', raw, ts.ScriptTarget.ESNext)

    sourceFile.forEachChild(node => {
        if (tsh.nodeIs(node, 'InterfaceDeclaration')) {
            let iface = node as ts.InterfaceDeclaration

            // see if it extends HTMLElement
            iface.forEachChild(child => {
                if (tsh.nodeIs(child, 'HeritageClause')) {
                    child.forEachChild(c => {
                        if (tsh.nodeIs(c, 'ExpressionWithTypeArguments') && c.getText(sourceFile) == 'HTMLElement') {
                            const comment = iface.getFullText(sourceFile).split('interface')[0]
                            if (!comment.includes('@deprecated')) { // skip deprecated elements
                                let name = iface.name.getText(sourceFile)
                                elementTypes[name] = new ElementType(name, iface, sourceFile)
                            }
                        }
                    })
                }
            })
        }
    })

    console.log(`Parsed ${Object.entries(elementTypes).length} element types`)

}
main()