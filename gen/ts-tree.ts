import ts from 'typescript'

export type Property = {
    name: string
    type: string
    isReadonly: boolean
}

// helper methods on top of the typescript AST
export default class TypescriptTree {
    private source!: ts.SourceFile

    constructor(body: string) {
        this.source = ts.createSourceFile('temp.ts', body, ts.ScriptTarget.ESNext)
    }
    
    printTree(node: ts.Node, indent = 0) {
        const start = new Array(indent+1).join('  ')
        const kind = ts.SyntaxKind[node.kind]
        if (node.getChildCount(this.source)) {
            console.log(`${start}(${kind})`)
            indent++
            ts.forEachChild(node, child => {
                this.printTree(child, indent)
            });
        }
        else { // no children
            console.log(`${start}(${kind}) ${this.fullText(node)}`);
        }
    }

    propertyString(prop: Property): string {
        const readonlyString = prop.isReadonly ? '(readonly)' : ''
        return `${prop.name}: ${prop.type} ${readonlyString}`
    }

    eachInterface(cb: (iface: ts.InterfaceDeclaration) => void) {
        this.source.forEachChild(node => {
            if (this.nodeIs(node, 'InterfaceDeclaration')) {
                const iface = node as ts.InterfaceDeclaration
                cb(iface)
            }
        })
    }

    interfaceExtends(iface: ts.InterfaceDeclaration, base: string): boolean {
        let doesExtend = false
        iface.forEachChild(child => {
            if (this.nodeIs(child, 'HeritageClause')) {
                child.forEachChild(c => {
                    if (this.nodeIs(c, 'ExpressionWithTypeArguments') && this.text(c) == base) {
                        doesExtend = true
                    }
                })
            }
        })
        return doesExtend
    }


    nodeIs(node: ts.Node, type: string): boolean {
        return ts.SyntaxKind[node.kind] == type
    }

    text(node: ts.Node): string {
        return node.getText(this.source)
    }

    fullText(node: ts.Node): string {
        return node.getFullText(this.source)
    }

    parseProperty(sig: ts.PropertySignature): Property {
        let name: string | null = null
        let type: string | null = null
        let isReadonly = false
        const fullText = sig.getFullText(this.source)
        sig.forEachChild(c => {
            const t = c.getText(this.source)
            const kind = ts.SyntaxKind[c.kind]
            switch (kind) {
                case 'Identifier':
                    name = t
                    break
                case 'StringLiteral':
                    name = t.replace(/\"/g, '')
                case 'BooleanKeyword':
                    type = 'boolean'
                    break
                case 'StringKeyword':
                    type = 'string'
                    break
                case 'NumberKeyword':
                    type = 'number'
                    break
                case 'ReadonlyKeyword':
                    isReadonly = true
                    break
                case 'TypeReference':
                    type = t
                    break
                case 'UnionType':
                    type = t
                    break
                default:
                    console.log(`ignoring property sig child ${t} (${kind})`)
            }
        })
        if (name == null) {
            throw `No name for ${fullText}`
        }
        if (type == null) {
            this.printTree(sig)
            throw `No type for ${fullText}`
        }
        return {name: name, type: type, isReadonly: isReadonly}
    }

    getProperties(iface: ts.InterfaceDeclaration): Property[] {
        const props = Array<Property>()
        iface.forEachChild(child => {
            if (this.nodeIs(child, 'PropertySignature')) {
                if (!child.getFullText(this.source).includes('@deprecated')) {
                    const prop = this.parseProperty(child as ts.PropertySignature)
                    props.push(prop)
                }
            }
        })
        return props
    }

}