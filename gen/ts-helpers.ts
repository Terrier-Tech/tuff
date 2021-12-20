
import * as tsh from 'typescript'

export function printTree(node: tsh.Node, sourceFile: tsh.SourceFile, indent = 0) {
    let start = new Array(indent+1).join('  ')
    let kind = tsh.SyntaxKind[node.kind]
    if (node.getChildCount(sourceFile)) {
        console.log(`${start}(${kind})`)
        indent++
        tsh.forEachChild(node, child => {
            printTree(child, sourceFile, indent)
        });
    }
    else { // no children
        console.log(`${start}(${kind}) ${node.getFullText(sourceFile)}`);
    }
}


export function nodeIs(node: tsh.Node, type: string): boolean {
    return tsh.SyntaxKind[node.kind] == type
}

export type Property = {
    name: string
    type: string
    isReadonly: boolean
}

function parseProperty(sig: tsh.PropertySignature, sourceFile: tsh.SourceFile): Property {
    let name: string | null = null
    let type: string | null = null
    let isReadonly = false
    const fullText = sig.getFullText(sourceFile)
    sig.forEachChild(c => {
        const t = c.getText(sourceFile)
        const kind = tsh.SyntaxKind[c.kind]
        switch (kind) {
            case 'Identifier':
                name = t
                break
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
        printTree(sig, sourceFile)
        throw `No type for ${fullText}`
    }
    return {name: name, type: type, isReadonly: isReadonly}
}

export function getProperties(iface: tsh.InterfaceDeclaration, sourceFile: tsh.SourceFile, props: Property[]) {
    iface.forEachChild(child => {
        if (nodeIs(child, 'PropertySignature')) {
            if (!child.getFullText(sourceFile).includes('@deprecated')) {
                const prop = parseProperty(child as tsh.PropertySignature, sourceFile)
                props.push(prop)
            }
        }
    })
}