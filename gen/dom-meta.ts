import ts from 'typescript'
import TypescriptTree from './ts-tree'

export class Element {

    attrTypes: {[name: string]: string} = {}
    readonly className!: string
    readonly attrsName!: string

    constructor(readonly name: string, iface: ts.InterfaceDeclaration, tst: TypescriptTree) {

        // compute the class name
        const cName = name.replace(/^HTML/, '').replace(/Element$/, '')
        if (cName.length) {
            this.className = `${cName}Tag`
        }
        else {
            this.className = 'DefaultTag'
        }

        // parse the attributes
        for (let prop of tst.getProperties(iface)) {
            if (prop.isReadonly) {
                // logic based on readonly properties
            }
            else {
                this.attrTypes[prop.name] = prop.type
            }
        }

        // compute the attributes name
        if (this.className == 'DefaultTag' || !Object.keys(this.attrTypes)) {
            this.attrsName = 'DefaultTagAttrs'
        }
        else {
            this.attrsName = `${this.className}Attrs`
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

    private attrsDeclaration(lines: string[]) {
        this.eachAttrType((name, type) => {
            lines.push(`    ${name}?: ${type}`)
        })
    }

    classDeclaration(base: Element): string {
        const lines = Array<string>()

        if (this == base) {
            lines.push(`type ${this.attrsName} = Attrs & {`)
            this.attrsDeclaration(lines)
            lines.push("}\n")
        }
        else if (this.attrsName != base.attrsName) {
            lines.push(`type ${this.attrsName} = ${base.attrsName} & {`)
            this.attrsDeclaration(lines)
            lines.push("}\n")
        }

        lines.push(`export class ${this.className} extends Tag<${this.attrsName}> {}`)

        return lines.join("\n")
    }

    tagMethod(tag: string): string {
        const lines = Array<string>()
        const methodName = tag == 'data' ? 'dataTag' : tag // I'd rather use data() for assigning data attributes
        lines.push(`    ${methodName}(...args: Args<${this.className},${this.attrsName}>[]) : ${this.className} {`)
        lines.push(`        return this.child(${this.className}, "${tag}", ...args)`)
        lines.push("    }\n")
        return lines.join("\n")
    }

}