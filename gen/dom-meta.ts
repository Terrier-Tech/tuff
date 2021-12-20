import ts from 'typescript'
import TypescriptTree from './ts-tree'

export class Element {

    tag = ''

    attrTypes: {[name: string]: string} = {}

    constructor(readonly name: string, iface: ts.InterfaceDeclaration, tst: TypescriptTree) {
        for (let prop of tst.getProperties(iface)) {
            if (prop.isReadonly) {
                // logic based on readonly properties
            }
            else {
                this.attrTypes[prop.name] = prop.type
            }
        }
        this.print()
    }

    eachAttrType(fun: (name: string, type: string) => void) {
        for (let [name, type] of Object.entries(this.attrTypes)) {
            fun(name, type)
        }
    }

    print() {
        console.log(`${this.name} {`)
        this.eachAttrType((name, type) => {
            console.log(`  ${name}: ${type}`)
        })
        console.log('}')
    }

}