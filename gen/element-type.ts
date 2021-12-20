
import * as ts from 'typescript'
import * as tsh from './ts-helpers'

export default class ElementType {

    readonly properties = Array<tsh.Property>()

    constructor(readonly name: string, iface: ts.InterfaceDeclaration, sourceFile: ts.SourceFile) {
        console.log(`=== Element Type ${name} ===`)
        // tsHelpers.printTree(iface, sourceFile)
        tsh.getProperties(iface, sourceFile, this.properties)
        for (let prop of this.properties) {
            const readonlyString = prop.isReadonly ? '(readonly)' : ''
            console.log(`  ${prop.name}: ${prop.type} ${readonlyString}`)
        }
    }

}