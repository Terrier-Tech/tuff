import { Part } from "./part"
import { MessageKey } from "./messages"

type DataAttrs = {[key: string]: any}

// resursively constructs data attributes into key/value strings
// nested keys are joined with dashes
let buildDataAttrs = (builder: string[], data: DataAttrs, prefix='data-') => {
    for (let kv of Object.entries(data)) {
        if (typeof kv[1] == 'object') {
            buildDataAttrs(builder, kv[1], `${prefix}${kv[0]}-`)
        }
        else {
            builder.push(`${prefix}${kv[0]}="${kv[1]}"`)
        }
    }
}


export type Attrs = {
    id?: string
    class?: string
    classes?: string[]
    sel?: string
    text?: string
    title?: string
    data?: DataAttrs
}

// don't add these attributes directly to the HTML, they're managed separately
const _attrsBlacklist = ['id', 'class', 'classes', 'sel', 'text', 'data']

// each argument to a tag can be a callback, selector string, or attribute literal
type Args<TagType extends Tag<AttrsType>, AttrsType extends Attrs> =
    ((n: TagType) => any) | AttrsType | string | undefined

export class Tag<AttrsType extends Attrs> {

    private children: Tag<Attrs>[] = []
    private _text?: string
    private _id?: string
    private _classes: string[] = []
    private _attrs: {[key: string]: string} = {}
    private _data?: DataAttrs

    constructor(public readonly tag: string) {
    }


    /// Attributes

    sel(selector: string): Tag<AttrsType> {
        if (!selector || selector.length == 0) {
            return this
        }
        let comps = selector.split(/(?=\.)|(?=#)/)
        for (let comp of comps) {
            switch (comp[0]) {
                case '.':
                    this._classes.push(comp.substring(1))
                    break
                case '#':
                    this._id = comp.substring(1)
                    break
                default:
                    throw `Don't know what to do with selector component '${comp}'`
            }
        }
        return this
    }

    class(s: string): Tag<AttrsType> {
        this._classes.push(s)
        return this
    }

    id(s: string): Tag<AttrsType> {
        this._id = s
        return this
    }

    text(s: string): Tag<AttrsType> {
        this._text = s
        return this
    }

    data(d: DataAttrs): Tag<AttrsType> {
        if (this._data) {
            this._data = {...this._data, ...d}
        }
        else {
            this._data = {...d}
        }
        return this
    }

    // Assignes a single data attribute without having to create a new object
    dataAttr(key: string, value: any): Tag<AttrsType> {
        if (!this._data) {
            this._data = {}
        }
        this._data[key] = value
        return this
    }

    attrs(attrs: AttrsType): Tag<AttrsType> {
        if (attrs.class?.length) {
            this.class(attrs.class)
        }
        if (attrs.classes?.length) {
            this._classes = this._classes.concat(attrs.classes)
        }
        if (attrs.id?.length) {
            this._id = attrs.id
        }
        if (attrs.sel?.length) {
            this.sel(attrs.sel)
        }
        if (attrs.text?.length) {
            this.text(attrs.text)
        }
        if (attrs.data?.length) {
            this.data(attrs.data)
        }
        for (let key of Object.keys(attrs)) {
            if (!_attrsBlacklist.includes(key)) {
                this._attrs[key] = (attrs as any)[key].toString()
            }
        }
        return this
    }


    /// Children

    child<TagType extends Tag<ChildAttrsType>, ChildAttrsType extends Attrs>(
            c: { new (): TagType }, 
            ...args: Args<TagType,ChildAttrsType>[]
    ): TagType {
        let node = new c()
        this.children.push(node)
        for (let arg of args) {
            if (arg instanceof Function) {
                arg(node)
            }
            else if (typeof arg == 'string') {
                node.sel(arg)
            }
            else if (arg) {
                node.attrs(arg)
            }
        }
        return node
    }

    part(part: Part<{}>) {
        part.renderInTag(this)
    }

    div(...args: Args<Div,Attrs>[]) : Div {
        return this.child(Div, ...args)
    }

    span(...args: Args<Span,Attrs>[]) : Span {
        return this.child(Span, ...args)
    }

    a(...args: Args<Anchor,AnchorAttrs>[]) : Anchor {
        return this.child(Anchor, ...args)
    }


    /// Messages

    private messageKeys: {[type: string]: MessageKey[]} | null = null

    private addMessageKey(type: string, key: MessageKey) {
        if (!this.messageKeys) {
            this.messageKeys = {}
        }
        if (this.messageKeys[type]) {
            this.messageKeys[type].push(key)
        }
        else {
            this.messageKeys[type] = [key]
        }
    }

    private addMessageKeys(output: string[]) {
        if (!this.messageKeys) return
        for (let typeKeys of Object.entries(this.messageKeys)) {
            let keys = typeKeys[1].map(k => {return k.id}).join(';')
            output.push(`data-__${typeKeys[0]}__="${keys}"`)
        }
    }

    emit(type: keyof HTMLElementEventMap, key: MessageKey): Tag<AttrsType> {
        this.addMessageKey(type, key)
        return this
    }

    click(key: MessageKey): Tag<AttrsType> {
        this.emit('click', key)
        return this
    }


    /// Building

    build(output: string[]) {
        output.push(`<${this.tag}`)
        let allAttrs = Array<string>()
        if (this._classes.length) {
            allAttrs.push(`class="${this._classes.join(' ')}"`)
        }
        if (this._id) {
            allAttrs.push(`id="${this._id}"`)
        }
        for (let kv of Object.entries(this._attrs)) {
            allAttrs.push(`${kv[0]}="${kv[1]}"`)
        }
        if (this._data) {
            buildDataAttrs(allAttrs, this._data)
        }
        this.addMessageKeys(allAttrs)
        if (allAttrs.length) {
            output.push(` ${allAttrs.join(' ')}`)
        }
        output.push('>')
        if (this._text) {
            output.push(this._text)
        }
        this.buildInner(output)
        output.push(`</${this.tag}>`)
    }

    buildInner(output: string[]) {
        for (let child of this.children) {
            child.build(output)
        }
    }

}

export class Div extends Tag<Attrs> {
    constructor() {
        super("div")
    }
}

export class Span extends Tag<Attrs> {
    constructor() {
        super("span")
    }
}

type AnchorAttrs = Attrs & {
    href?: string
    target?: string
}

export class Anchor extends Tag<AnchorAttrs> {
    constructor() {
        super("a")
    }
}