import ts from 'typescript'
import TypescriptTree from './ts-tree'
import * as strings from '../strings'
import { info } from 'console'

const capitalize = (s: string) => s = s.charAt(0).toUpperCase() + s.slice(1)

// represents an HTML element type
export class Element {

    attrTypes: {[name: string]: string} = {}
    readonly className!: string
    readonly attrsName!: string
    readonly typeName!: string // capitalized type name

    constructor(readonly type: string, readonly name: string, readonly baseName: string, iface: ts.InterfaceDeclaration, tst: TypescriptTree) {
        this.typeName = strings.capitalize(type)

        // compute the class name
        const nameRegex = new RegExp(`^${this.type.toUpperCase()}`)
        const cName = name.replace(nameRegex, '').replace(/Element$/, '')
        if (cName.length) {
            this.className = `${cName}Tag`
        }
        else {
            this.className = 'DefaultTag'
        }

        // parse the attributes
        for (let prop of tst.getProperties(iface)) {
            // svg and html attributes are handled differently
            if (this.type == 'svg') {
                // we don't need animated attributes in the builder
                let type = prop.type
                switch (type) {
                    case 'SVGAnimatedBoolean':
                        type = 'boolean'
                        break
                    case 'SVGAnimatedEnumeration':
                        type = 'string|number'
                        break
                    case 'SVGAnimatedTransformList':
                    case 'SVGAnimatedString':
                    case 'SVGAnimatedPreserveAspectRatio':
                        type = 'string'
                        break
                    case 'SVGAnimatedNumberList':
                        type = 'Array<number>'
                        break
                    case 'SVGAnimatedNumber':
                    case 'SVGAnimatedLength':
                    case 'SVGAnimatedInteger':
                    case 'SVGAnimatedAngle':
                        type = 'number'
                        break
                }
                // for some reason, the SVG attributes are marked as readonly in the DOM types
                this.attrTypes[prop.name] = type
            }
            else {
                if (prop.isReadonly) {
                    // readonly html attributes don't seem too interesting
                }
                else {
                    this.attrTypes[prop.name] = prop.type
                
                }
            }
        }

        // compute the attributes name
        if (this.className == 'DefaultTag' || !Object.keys(this.attrTypes)) {
            this.attrsName = 'DefaultTagAttrs'
        }
        else {
            this.attrsName = `${this.className}Attrs`
        }
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

    classDeclaration(base: Element, baseClass: string = 'Tag'): string {
        const lines = Array<string>()
        info(`${this.className} has base ${base.className}`)
        if (this == base) {
            lines.push(`\nexport type ${this.attrsName} = ${this.typeName}BaseAttrs & {`)
            this.attrsDeclaration(lines)
            lines.push("}\n")
        }
        else if (this.attrsName != base.attrsName) {
            lines.push(`\nexport type ${this.attrsName} = ${base.attrsName} & {`)
            this.attrsDeclaration(lines)
            lines.push("}\n")
        }

        lines.push(`export class ${this.className} extends ${baseClass}<${this.attrsName}> {}\n`)

        return lines.join("\n")
    }

    tagMethod(tag: string): string {
        const lines = Array<string>()
        const methodName = tag == 'data' ? 'dataTag' : tag // I'd rather use data() for assigning data attributes
        lines.push(`\n    ${methodName}(...args: TagArgs<${this.className},${this.attrsName}>[]) : ${this.className} {`)
        lines.push(`        return this.child(${this.className}, "${tag}", ...args)`)
        lines.push("    }\n")
        return lines.join("\n")
    }

}


// list of event name components that should be capitalized
// we want to write `.onMouseDown`, not `.onmousedown`
const capitalEventNames = ['animation', 'cancel', 'capture', 'change', 'click', 'data', 'down', 'end', 'enter', 'error', 'input', 'iteration', 'leave', 'menu', 'move', 'out', 'over', 'play', 'pointer', 'policy', 'press', 'run', 'start', 'transition', 'through', 'up', 'violation']

// these don't fit into our general capitalizations above
const eventNameExceptions: {[name: string]: string} = {
    focusin: 'FocusIn',
    loadedmetadata: 'LoadedMetadata',
    suspend: 'Suspend'
}

// represents a event type
export class EventType {

    constructor(readonly name: string, readonly type: string) {

    }

    // computes the name of the hanlder convenience method based on the event name, e.g.:
    // 'DragEnd' from 'dragend'
    get methodName(): string {
        if (eventNameExceptions[this.name]) {
            return eventNameExceptions[this.name]
        }
        let n = capitalize(this.name)
        for (let s of capitalEventNames) {
            n = n.replace(s, capitalize(s))
        }
        return n
    }

    listenMethod(): string {
        return `
    on${this.methodName}<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"${this.name}",DataType>) => void, active?: ActiveOrPassive): void
    on${this.methodName}<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"${this.name}",DataType>) => void, active?: ActiveOrPassive): void
    on${this.methodName}<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"${this.name}",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"${this.name}",DataType>("${this.name}", key, listener, active)
    }
    `
    }

    emitMethod(): string {
        return `
    emit${this.methodName}<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emit${this.methodName}<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emit${this.methodName}<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('${this.name}', key, data)
        return this
    }
    `
    }

}