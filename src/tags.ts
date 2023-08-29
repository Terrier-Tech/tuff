import {EventMap, TypedKey, UntypedKey} from './messages'
import Strings from './strings'
import Html from "./html"

// import {Logger} from './logging'
// const log = new Logger('tags')

/**
 * Type for arbitrary data-* attributes.
 */
export type DataAttrs = {[key: string]: any}

/**
 * An object containing inline style declarations.
 */
export type InlineStyle = Partial<CSSStyleDeclaration>

/**
 * General rectangle interface, used in place of SVGAnimatedRect.
 */
export interface IRect {
    height: number
    width: number
    x: number
    y: number
}

/**
 * Constructs a style attribute value from an {InlineStyle} object.
 * @param styles - An object containing inline style definitions
 * @returns An inline style string
 */
const buildStyleAttr = (styles: InlineStyle): string => {
    return Object.entries(styles).map(([k, v]): string => {
        return `${Strings.ropeCase(k)}: ${v};`
    }).join('; ')
}

/**
 * Common attributes shared amongst all tags.
 */
export type Attrs = {
    id?: string
    class?: string
    classes?: string[]
    sel?: string
    text?: string
    title?: string
    data?: DataAttrs
    css?: InlineStyle
}

// don't add these attributes directly to the HTML, they're managed separately
const _attrsBlacklist = ['id', 'class', 'classes', 'sel', 'text', 'data', 'css']

// each argument to a tag can be a callback, selector string, or attribute literal
export type TagArgs<TagType extends Tag<AttrsType,any>, AttrsType extends Attrs> =
    ((n: TagType) => any) | AttrsType | string | undefined

export abstract class Tag<AttrsType extends Attrs, ElementType extends Element> {

    private children: Tag<Attrs,any>[] = []
    protected _text?: string
    private _id?: string
    private _classes: string[] = []
    private _attrs: {[key: string]: any} = {}
    private _data?: DataAttrs
    private _css?: InlineStyle

    constructor(public readonly tag: string) {
    }


    /// Attributes

    /**
     * Assigns one or more classes and/or an id to the element.
     * @param {string} s - A CSS selector containing classes (.-prefixed) and/or an id (#-prefixed)
     * @returns this
     */
    sel(selector: string) {
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
                default: // assume it's a class
                    this._classes.push(comp)
            }
        }
        return this
    }

    /**
     * Assigns a single class to the element.
     * @param {string} s - A single class name
     * @returns this
     */
    class(...s: string[]) {
        this._classes = this._classes.concat(s)
        return this
    }

    /**
     * Assigns the element's id attribute.
     * @param s - an id
     * @returns this
     */
    id(s: string) {
        this._id = s
        return this
    }

    /**
     * Apply an inline style using the +style+ attribute.
     * @param {InlineStyle} s - An inline style to apply to the element
     * @returns this
     */
    css(s: InlineStyle) {
        if (this._css) {
            this._css = {...this._css, ...s}
        }
        else {
            this._css = {...s}
        }
        return this
    }

    /**
     * Assign raw data- attributes to the element.
     * @param {DataAttrs} d - Some raw data attributes
     * @returns this
     */
    data(d: DataAttrs) {
        if (this._data) {
            this._data = {...this._data, ...d}
        }
        else {
            this._data = {...d}
        }
        return this
    }

    // Assignes a single data attribute without having to create a new object
    dataAttr(key: string, value: any) {
        if (!this._data) {
            this._data = {}
        }
        this._data[key] = value
        return this
    }

    attrs(attrs: AttrsType) {
        if (attrs.class?.length) {
            this.class(attrs.class)
        }
        if (attrs.classes?.length) {
            this._classes = this._classes.concat(attrs.classes)
        }
        if (attrs.id?.length) {
            this._id = attrs.id
        }
        if (attrs.text?.length) {
            this._text = attrs.text
        }
        if (attrs.sel?.length) {
            this.sel(attrs.sel)
        }
        if (attrs.data && Object.keys(attrs.data).length) {
            this.data(attrs.data)
        }
        if (attrs.css) {
            this.css(attrs.css)
        }
        for (let key of Object.keys(attrs)) {
            if (!_attrsBlacklist.includes(key)) {
                const value = (attrs as any)[key]
                if (value) {
                    this._attrs[key] = value
                }
            }
        }
        return this
    }

    
    /// Building

    /**
     * It's up to subclasses to serialize attributes since HTML and SVG handle the names differently.
     * @param name the attribute name
     * @param value the attribute value
     */
    abstract serializeAttribute(name: string, value: any): string

    protected escapeAttrValue(unsafeValue: string): string {
        return Html.escape(unsafeValue)
    }

    /**
     * Sanitizes the given data-attribute key based on the rules described here:
     * https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset#:~:text=Using%20data%20attributes.-,Name%20conversion,-dash%2Dstyle%20to
     * @param k a data-attribute key
     */
    protected sanitizeDataKey(k: string): string {
        return Strings.ropeCase(k)
    }

    /**
     * Recursively constructs data attributes into key/value Strings.
     * Nested keys are joined with dashes.
     * @param builder - An array of strings on which to append the attributes
     * @param data - The data attributes object
     * @param prefix - A prefix for each attribute name
     */
    protected buildDataAttrs(builder: string[], data: DataAttrs, prefix='data-') {
        for (let kv of Object.entries(data)) {
            const k = this.sanitizeDataKey(kv[0])
            if (typeof kv[1] == 'object') {
                this.buildDataAttrs(builder, kv[1], `${prefix}${k}-`)
            }
            else {
                builder.push(`${prefix}${k}="${this.escapeAttrValue(kv[1])}"`)
            }
        }
    }

    /**
     * Builds the resulting HTML by appending lines to the `output` array.
     * @param output - A string array on which to append the output
     */
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
            allAttrs.push(this.serializeAttribute(kv[0], kv[1]))
        }
        if (this._data) {
            this.buildDataAttrs(allAttrs, this._data)
        }
        if (this._css) {
            allAttrs.push(`style="${buildStyleAttr(this._css)}"`)
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

    /**
     * Appends the children
     * @param output a string array on which to append the output
     */
    buildInner(output: string[]) {
        for (let child of this.children) {
            child.build(output)
        }
    }


    /// Children

    child<TagType extends Tag<ChildAttrsType,any>, ChildAttrsType extends Attrs>(
            c: { new (tag: string): TagType },
            tag: string,
            ...args: TagArgs<TagType,ChildAttrsType>[]
    ): TagType {
        let node = new c(tag)
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


    /// Messages

    private messageKeys: {[type: string]: string[]} | null = null

    private addMessageKey(type: string, key: string) {
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
            let keys = typeKeys[1].map(k => {return k}).join(';')
            output.push(`data-tuff${typeKeys[0]}="${keys}"`)
        }
    }

    emit<DataType extends object>(type: keyof EventMap, key: UntypedKey): Tag<AttrsType,ElementType>
    
    // Force the caller to pass data if the message key is typed
    emit<DataType extends object>(type: keyof EventMap, key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>

    emit<DataType extends object>(type: keyof EventMap, key: UntypedKey | TypedKey<DataType>, data?: DataType): Tag<AttrsType,ElementType> {
        this.addMessageKey(type, key.id)
        if (data) {
            this.dataAttr(key.id, encodeURIComponent(JSON.stringify(data)))
        }
        return this
    }

    //// Begin Emit Methods

    emitAbort<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitAbort<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitAbort<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('abort', key, data)
        }
        else {
            this.emit('abort', key as UntypedKey)
        }
        return this
    }
    
    emitAnimationCancel<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitAnimationCancel<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitAnimationCancel<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('animationcancel', key, data)
        }
        else {
            this.emit('animationcancel', key as UntypedKey)
        }
        return this
    }
    
    emitAnimationEnd<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitAnimationEnd<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitAnimationEnd<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('animationend', key, data)
        }
        else {
            this.emit('animationend', key as UntypedKey)
        }
        return this
    }
    
    emitAnimationIteration<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitAnimationIteration<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitAnimationIteration<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('animationiteration', key, data)
        }
        else {
            this.emit('animationiteration', key as UntypedKey)
        }
        return this
    }
    
    emitAnimationStart<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitAnimationStart<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitAnimationStart<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('animationstart', key, data)
        }
        else {
            this.emit('animationstart', key as UntypedKey)
        }
        return this
    }
    
    emitAuxClick<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitAuxClick<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitAuxClick<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('auxclick', key, data)
        }
        else {
            this.emit('auxclick', key as UntypedKey)
        }
        return this
    }
    
    emitBeforeInput<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitBeforeInput<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitBeforeInput<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('beforeinput', key, data)
        }
        else {
            this.emit('beforeinput', key as UntypedKey)
        }
        return this
    }
    
    emitBlur<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitBlur<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitBlur<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('blur', key, data)
        }
        else {
            this.emit('blur', key as UntypedKey)
        }
        return this
    }
    
    emitCancel<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitCancel<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitCancel<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('cancel', key, data)
        }
        else {
            this.emit('cancel', key as UntypedKey)
        }
        return this
    }
    
    emitCanPlay<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitCanPlay<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitCanPlay<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('canplay', key, data)
        }
        else {
            this.emit('canplay', key as UntypedKey)
        }
        return this
    }
    
    emitCanPlayThrough<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitCanPlayThrough<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitCanPlayThrough<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('canplaythrough', key, data)
        }
        else {
            this.emit('canplaythrough', key as UntypedKey)
        }
        return this
    }
    
    emitChange<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitChange<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitChange<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('change', key, data)
        }
        else {
            this.emit('change', key as UntypedKey)
        }
        return this
    }
    
    emitClick<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitClick<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitClick<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('click', key, data)
        }
        else {
            this.emit('click', key as UntypedKey)
        }
        return this
    }
    
    emitClose<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitClose<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitClose<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('close', key, data)
        }
        else {
            this.emit('close', key as UntypedKey)
        }
        return this
    }
    
    emitCompositionEnd<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitCompositionEnd<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitCompositionEnd<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('compositionend', key, data)
        }
        else {
            this.emit('compositionend', key as UntypedKey)
        }
        return this
    }
    
    emitCompositionStart<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitCompositionStart<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitCompositionStart<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('compositionstart', key, data)
        }
        else {
            this.emit('compositionstart', key as UntypedKey)
        }
        return this
    }
    
    emitCompositionUpdate<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitCompositionUpdate<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitCompositionUpdate<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('compositionupdate', key, data)
        }
        else {
            this.emit('compositionupdate', key as UntypedKey)
        }
        return this
    }
    
    emitContextMenu<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitContextMenu<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitContextMenu<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('contextmenu', key, data)
        }
        else {
            this.emit('contextmenu', key as UntypedKey)
        }
        return this
    }
    
    emitCopy<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitCopy<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitCopy<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('copy', key, data)
        }
        else {
            this.emit('copy', key as UntypedKey)
        }
        return this
    }
    
    emitCueChange<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitCueChange<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitCueChange<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('cuechange', key, data)
        }
        else {
            this.emit('cuechange', key as UntypedKey)
        }
        return this
    }
    
    emitCut<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitCut<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitCut<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('cut', key, data)
        }
        else {
            this.emit('cut', key as UntypedKey)
        }
        return this
    }
    
    emitDblClick<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitDblClick<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitDblClick<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('dblclick', key, data)
        }
        else {
            this.emit('dblclick', key as UntypedKey)
        }
        return this
    }
    
    emitDrag<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitDrag<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitDrag<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('drag', key, data)
        }
        else {
            this.emit('drag', key as UntypedKey)
        }
        return this
    }
    
    emitDragEnd<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitDragEnd<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitDragEnd<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('dragend', key, data)
        }
        else {
            this.emit('dragend', key as UntypedKey)
        }
        return this
    }
    
    emitDragEnter<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitDragEnter<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitDragEnter<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('dragenter', key, data)
        }
        else {
            this.emit('dragenter', key as UntypedKey)
        }
        return this
    }
    
    emitDragLeave<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitDragLeave<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitDragLeave<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('dragleave', key, data)
        }
        else {
            this.emit('dragleave', key as UntypedKey)
        }
        return this
    }
    
    emitDragOver<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitDragOver<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitDragOver<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('dragover', key, data)
        }
        else {
            this.emit('dragover', key as UntypedKey)
        }
        return this
    }
    
    emitDragStart<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitDragStart<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitDragStart<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('dragstart', key, data)
        }
        else {
            this.emit('dragstart', key as UntypedKey)
        }
        return this
    }
    
    emitDrop<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitDrop<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitDrop<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('drop', key, data)
        }
        else {
            this.emit('drop', key as UntypedKey)
        }
        return this
    }
    
    emitDurationChange<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitDurationChange<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitDurationChange<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('durationchange', key, data)
        }
        else {
            this.emit('durationchange', key as UntypedKey)
        }
        return this
    }
    
    emitEmptied<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitEmptied<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitEmptied<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('emptied', key, data)
        }
        else {
            this.emit('emptied', key as UntypedKey)
        }
        return this
    }
    
    emitEnded<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitEnded<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitEnded<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('ended', key, data)
        }
        else {
            this.emit('ended', key as UntypedKey)
        }
        return this
    }
    
    emitError<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitError<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitError<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('error', key, data)
        }
        else {
            this.emit('error', key as UntypedKey)
        }
        return this
    }
    
    emitFocus<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitFocus<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitFocus<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('focus', key, data)
        }
        else {
            this.emit('focus', key as UntypedKey)
        }
        return this
    }
    
    emitFocusIn<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitFocusIn<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitFocusIn<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('focusin', key, data)
        }
        else {
            this.emit('focusin', key as UntypedKey)
        }
        return this
    }
    
    emitFocusOut<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitFocusOut<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitFocusOut<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('focusout', key, data)
        }
        else {
            this.emit('focusout', key as UntypedKey)
        }
        return this
    }
    
    emitFormData<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitFormData<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitFormData<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('formdata', key, data)
        }
        else {
            this.emit('formdata', key as UntypedKey)
        }
        return this
    }
    
    emitFullscreenChange<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitFullscreenChange<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitFullscreenChange<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('fullscreenchange', key, data)
        }
        else {
            this.emit('fullscreenchange', key as UntypedKey)
        }
        return this
    }
    
    emitFullscreenError<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitFullscreenError<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitFullscreenError<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('fullscreenerror', key, data)
        }
        else {
            this.emit('fullscreenerror', key as UntypedKey)
        }
        return this
    }
    
    emitGotPointerCapture<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitGotPointerCapture<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitGotPointerCapture<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('gotpointercapture', key, data)
        }
        else {
            this.emit('gotpointercapture', key as UntypedKey)
        }
        return this
    }
    
    emitInput<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitInput<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitInput<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('input', key, data)
        }
        else {
            this.emit('input', key as UntypedKey)
        }
        return this
    }
    
    emitInvalid<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitInvalid<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitInvalid<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('invalid', key, data)
        }
        else {
            this.emit('invalid', key as UntypedKey)
        }
        return this
    }
    
    emitKeyDown<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitKeyDown<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitKeyDown<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('keydown', key, data)
        }
        else {
            this.emit('keydown', key as UntypedKey)
        }
        return this
    }
    
    emitKeyUp<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitKeyUp<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitKeyUp<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('keyup', key, data)
        }
        else {
            this.emit('keyup', key as UntypedKey)
        }
        return this
    }
    
    emitLoad<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitLoad<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitLoad<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('load', key, data)
        }
        else {
            this.emit('load', key as UntypedKey)
        }
        return this
    }
    
    emitLoadedData<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitLoadedData<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitLoadedData<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('loadeddata', key, data)
        }
        else {
            this.emit('loadeddata', key as UntypedKey)
        }
        return this
    }
    
    emitLoadedMetadata<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitLoadedMetadata<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitLoadedMetadata<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('loadedmetadata', key, data)
        }
        else {
            this.emit('loadedmetadata', key as UntypedKey)
        }
        return this
    }
    
    emitLoadStart<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitLoadStart<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitLoadStart<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('loadstart', key, data)
        }
        else {
            this.emit('loadstart', key as UntypedKey)
        }
        return this
    }
    
    emitLostPointerCapture<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitLostPointerCapture<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitLostPointerCapture<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('lostpointercapture', key, data)
        }
        else {
            this.emit('lostpointercapture', key as UntypedKey)
        }
        return this
    }
    
    emitMouseDown<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitMouseDown<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitMouseDown<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('mousedown', key, data)
        }
        else {
            this.emit('mousedown', key as UntypedKey)
        }
        return this
    }
    
    emitMouseEnter<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitMouseEnter<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitMouseEnter<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('mouseenter', key, data)
        }
        else {
            this.emit('mouseenter', key as UntypedKey)
        }
        return this
    }
    
    emitMouseLeave<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitMouseLeave<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitMouseLeave<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('mouseleave', key, data)
        }
        else {
            this.emit('mouseleave', key as UntypedKey)
        }
        return this
    }
    
    emitMouseMove<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitMouseMove<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitMouseMove<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('mousemove', key, data)
        }
        else {
            this.emit('mousemove', key as UntypedKey)
        }
        return this
    }
    
    emitMouseOut<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitMouseOut<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitMouseOut<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('mouseout', key, data)
        }
        else {
            this.emit('mouseout', key as UntypedKey)
        }
        return this
    }
    
    emitMouseOver<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitMouseOver<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitMouseOver<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('mouseover', key, data)
        }
        else {
            this.emit('mouseover', key as UntypedKey)
        }
        return this
    }
    
    emitMouseUp<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitMouseUp<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitMouseUp<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('mouseup', key, data)
        }
        else {
            this.emit('mouseup', key as UntypedKey)
        }
        return this
    }
    
    emitPaste<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitPaste<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitPaste<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('paste', key, data)
        }
        else {
            this.emit('paste', key as UntypedKey)
        }
        return this
    }
    
    emitPause<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitPause<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitPause<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('pause', key, data)
        }
        else {
            this.emit('pause', key as UntypedKey)
        }
        return this
    }
    
    emitPlay<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitPlay<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitPlay<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('play', key, data)
        }
        else {
            this.emit('play', key as UntypedKey)
        }
        return this
    }
    
    emitPlaying<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitPlaying<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitPlaying<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('playing', key, data)
        }
        else {
            this.emit('playing', key as UntypedKey)
        }
        return this
    }
    
    emitPointerCancel<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitPointerCancel<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitPointerCancel<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('pointercancel', key, data)
        }
        else {
            this.emit('pointercancel', key as UntypedKey)
        }
        return this
    }
    
    emitPointerDown<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitPointerDown<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitPointerDown<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('pointerdown', key, data)
        }
        else {
            this.emit('pointerdown', key as UntypedKey)
        }
        return this
    }
    
    emitPointerEnter<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitPointerEnter<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitPointerEnter<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('pointerenter', key, data)
        }
        else {
            this.emit('pointerenter', key as UntypedKey)
        }
        return this
    }
    
    emitPointerLeave<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitPointerLeave<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitPointerLeave<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('pointerleave', key, data)
        }
        else {
            this.emit('pointerleave', key as UntypedKey)
        }
        return this
    }
    
    emitPointerMove<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitPointerMove<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitPointerMove<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('pointermove', key, data)
        }
        else {
            this.emit('pointermove', key as UntypedKey)
        }
        return this
    }
    
    emitPointerOut<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitPointerOut<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitPointerOut<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('pointerout', key, data)
        }
        else {
            this.emit('pointerout', key as UntypedKey)
        }
        return this
    }
    
    emitPointerOver<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitPointerOver<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitPointerOver<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('pointerover', key, data)
        }
        else {
            this.emit('pointerover', key as UntypedKey)
        }
        return this
    }
    
    emitPointerUp<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitPointerUp<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitPointerUp<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('pointerup', key, data)
        }
        else {
            this.emit('pointerup', key as UntypedKey)
        }
        return this
    }
    
    emitProgress<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitProgress<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitProgress<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('progress', key, data)
        }
        else {
            this.emit('progress', key as UntypedKey)
        }
        return this
    }
    
    emitRateChange<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitRateChange<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitRateChange<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('ratechange', key, data)
        }
        else {
            this.emit('ratechange', key as UntypedKey)
        }
        return this
    }
    
    emitReset<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitReset<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitReset<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('reset', key, data)
        }
        else {
            this.emit('reset', key as UntypedKey)
        }
        return this
    }
    
    emitResize<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitResize<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitResize<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('resize', key, data)
        }
        else {
            this.emit('resize', key as UntypedKey)
        }
        return this
    }
    
    emitScroll<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitScroll<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitScroll<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('scroll', key, data)
        }
        else {
            this.emit('scroll', key as UntypedKey)
        }
        return this
    }
    
    emitSecurityPolicyViolation<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitSecurityPolicyViolation<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitSecurityPolicyViolation<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('securitypolicyviolation', key, data)
        }
        else {
            this.emit('securitypolicyviolation', key as UntypedKey)
        }
        return this
    }
    
    emitSeeked<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitSeeked<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitSeeked<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('seeked', key, data)
        }
        else {
            this.emit('seeked', key as UntypedKey)
        }
        return this
    }
    
    emitSeeking<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitSeeking<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitSeeking<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('seeking', key, data)
        }
        else {
            this.emit('seeking', key as UntypedKey)
        }
        return this
    }
    
    emitSelect<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitSelect<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitSelect<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('select', key, data)
        }
        else {
            this.emit('select', key as UntypedKey)
        }
        return this
    }
    
    emitSelectionChange<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitSelectionChange<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitSelectionChange<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('selectionchange', key, data)
        }
        else {
            this.emit('selectionchange', key as UntypedKey)
        }
        return this
    }
    
    emitSelectStart<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitSelectStart<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitSelectStart<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('selectstart', key, data)
        }
        else {
            this.emit('selectstart', key as UntypedKey)
        }
        return this
    }
    
    emitSlotChange<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitSlotChange<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitSlotChange<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('slotchange', key, data)
        }
        else {
            this.emit('slotchange', key as UntypedKey)
        }
        return this
    }
    
    emitStalled<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitStalled<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitStalled<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('stalled', key, data)
        }
        else {
            this.emit('stalled', key as UntypedKey)
        }
        return this
    }
    
    emitSubmit<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitSubmit<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitSubmit<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('submit', key, data)
        }
        else {
            this.emit('submit', key as UntypedKey)
        }
        return this
    }
    
    emitSuspend<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitSuspend<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitSuspend<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('suspend', key, data)
        }
        else {
            this.emit('suspend', key as UntypedKey)
        }
        return this
    }
    
    emitTimeUpdate<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitTimeUpdate<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitTimeUpdate<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('timeupdate', key, data)
        }
        else {
            this.emit('timeupdate', key as UntypedKey)
        }
        return this
    }
    
    emitToggle<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitToggle<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitToggle<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('toggle', key, data)
        }
        else {
            this.emit('toggle', key as UntypedKey)
        }
        return this
    }
    
    emitTouchCancel<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitTouchCancel<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitTouchCancel<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('touchcancel', key, data)
        }
        else {
            this.emit('touchcancel', key as UntypedKey)
        }
        return this
    }
    
    emitTouchEnd<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitTouchEnd<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitTouchEnd<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('touchend', key, data)
        }
        else {
            this.emit('touchend', key as UntypedKey)
        }
        return this
    }
    
    emitTouchMove<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitTouchMove<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitTouchMove<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('touchmove', key, data)
        }
        else {
            this.emit('touchmove', key as UntypedKey)
        }
        return this
    }
    
    emitTouchStart<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitTouchStart<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitTouchStart<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('touchstart', key, data)
        }
        else {
            this.emit('touchstart', key as UntypedKey)
        }
        return this
    }
    
    emitTransitionCancel<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitTransitionCancel<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitTransitionCancel<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('transitioncancel', key, data)
        }
        else {
            this.emit('transitioncancel', key as UntypedKey)
        }
        return this
    }
    
    emitTransitionEnd<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitTransitionEnd<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitTransitionEnd<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('transitionend', key, data)
        }
        else {
            this.emit('transitionend', key as UntypedKey)
        }
        return this
    }
    
    emitTransitionRun<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitTransitionRun<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitTransitionRun<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('transitionrun', key, data)
        }
        else {
            this.emit('transitionrun', key as UntypedKey)
        }
        return this
    }
    
    emitTransitionStart<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitTransitionStart<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitTransitionStart<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('transitionstart', key, data)
        }
        else {
            this.emit('transitionstart', key as UntypedKey)
        }
        return this
    }
    
    emitVolumeChange<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitVolumeChange<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitVolumeChange<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('volumechange', key, data)
        }
        else {
            this.emit('volumechange', key as UntypedKey)
        }
        return this
    }
    
    emitWaiting<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitWaiting<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitWaiting<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('waiting', key, data)
        }
        else {
            this.emit('waiting', key as UntypedKey)
        }
        return this
    }
    
    emitWebkitAnimationEnd<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitWebkitAnimationEnd<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitWebkitAnimationEnd<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('webkitanimationend', key, data)
        }
        else {
            this.emit('webkitanimationend', key as UntypedKey)
        }
        return this
    }
    
    emitWebkitAnimationIteration<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitWebkitAnimationIteration<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitWebkitAnimationIteration<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('webkitanimationiteration', key, data)
        }
        else {
            this.emit('webkitanimationiteration', key as UntypedKey)
        }
        return this
    }
    
    emitWebkitAnimationStart<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitWebkitAnimationStart<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitWebkitAnimationStart<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('webkitanimationstart', key, data)
        }
        else {
            this.emit('webkitanimationstart', key as UntypedKey)
        }
        return this
    }
    
    emitWebkitTransitionEnd<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitWebkitTransitionEnd<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitWebkitTransitionEnd<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('webkittransitionend', key, data)
        }
        else {
            this.emit('webkittransitionend', key as UntypedKey)
        }
        return this
    }
    
    emitWheel<DataType extends object>(key: UntypedKey): Tag<AttrsType,ElementType>
    emitWheel<DataType extends object>(key: TypedKey<DataType>, data: DataType): Tag<AttrsType,ElementType>
    emitWheel<DataType extends object>(key: TypedKey<DataType> | UntypedKey, data?: DataType): Tag<AttrsType,ElementType> {
        if (data) {
            this.emit('wheel', key, data)
        }
        else {
            this.emit('wheel', key as UntypedKey)
        }
        return this
    }
    
//// End Emit Methods


}
