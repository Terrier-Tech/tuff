import ts from 'typescript'
import TypescriptTree from './ts-tree'

const capitalize = (s: string) => s = s.charAt(0).toUpperCase() + s.slice(1)

// represents an HTML element type
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
            lines.push(`\ntype ${this.attrsName} = Attrs & {`)
            this.attrsDeclaration(lines)
            lines.push("}\n")
        }
        else if (this.attrsName != base.attrsName) {
            lines.push(`\ntype ${this.attrsName} = ${base.attrsName} & {`)
            this.attrsDeclaration(lines)
            lines.push("}\n")
        }

        lines.push(`export class ${this.className} extends Tag<${this.attrsName}> {}\n`)

        return lines.join("\n")
    }

    tagMethod(tag: string): string {
        const lines = Array<string>()
        const methodName = tag == 'data' ? 'dataTag' : tag // I'd rather use data() for assigning data attributes
        lines.push(`\n    ${methodName}(...args: Args<${this.className},${this.attrsName}>[]) : ${this.className} {`)
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