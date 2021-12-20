import ts from 'typescript'
import TypescriptTree from './ts-tree'

export class Element {

    tag = ''

    attrTypes: {[name: string]: string} = {}

    constructor(readonly name: string, iface: ts.InterfaceDeclaration, tst: TypescriptTree) {
        console.log(`=== Element Type ${name} ===`)
        for (let prop of tst.getProperties(iface)) {
            if (prop.isReadonly) {
                // logic based on readonly properties
            }
            else {
                console.log(`  ${tst.propertyString(prop)}`)
            }
        }
    }

}