import * as messages from './messages'
import * as strings from './strings'

// import {Logger} from './logging'
// const log = new Logger('tags')

type DataAttrs = {[key: string]: any}

/**
 * Sanitizes the given data-attribute key based on the rules described here:
 * https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset#:~:text=Using%20data%20attributes.-,Name%20conversion,-dash%2Dstyle%20to
 * @param k a data-attribute key
 */
function sanitizeDataKey(k: string): string {
    // Add a dash before any ASCII uppercase letter A to Z, then lowercase the letter
    return k.replaceAll(/-[A-Z]/g, m => {return m.slice(1).toLowerCase()})
}

/**
 * Resursively constructs data attributes into key/value strings.
 * Nested keys are joined with dashes.
 * @param builder - An array of strings on which to append the attributes
 * @param data - The data attributes object
 * @param prefix - A prefix for each attribute name
 */
const buildDataAttrs = (builder: string[], data: DataAttrs, prefix='data-') => {
    for (let kv of Object.entries(data)) {
        const k = sanitizeDataKey(kv[0])
        if (typeof kv[1] == 'object') {
            buildDataAttrs(builder, kv[1], `${prefix}${k}-`)
        }
        else {
            builder.push(`${prefix}${k}="${kv[1]}"`)
        }
    }
}

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
        return `${strings.ropeCase(k)}: ${v};`
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
export type TagArgs<TagType extends Tag<AttrsType>, AttrsType extends Attrs> =
    ((n: TagType) => any) | AttrsType | string | undefined

export abstract class Tag<AttrsType extends Attrs> {

    private children: Tag<Attrs>[] = []
    private _text?: string
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
    class(...s: string[]): Tag<AttrsType> {
        this._classes = this._classes.concat(s)
        return this
    }

    /**
     * Assigns the element's id attribute.
     * @param s - an id
     * @returns this
     */
    id(s: string): Tag<AttrsType> {
        this._id = s
        return this
    }

    /**
     * Set the inner text content of the element.
     * @param {string} s - The inner text of the element
     * @returns this
     */
    text(s: string): Tag<AttrsType> {
        this._text = s
        return this
    }

    /**
     * Apply an inline style using the +style+ attribute.
     * @param {InlineStyle} s - An inline style to apply to the element
     * @returns this
     */
    css(s: InlineStyle): Tag<AttrsType> {
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

    /**
     * Builds the resulting HTML by appending lines to the {output} array.
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
            buildDataAttrs(allAttrs, this._data)
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

    buildInner(output: string[]) {
        for (let child of this.children) {
            child.build(output)
        }
    }


    /// Children

    child<TagType extends Tag<ChildAttrsType>, ChildAttrsType extends Attrs>(
            c: { new (t: string): TagType }, 
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
            output.push(`data-__${typeKeys[0]}__="${keys}"`)
        }
    }

    emit<DataType>(type: keyof messages.EventMap, key: messages.UntypedKey): Tag<AttrsType>
    
    // Force the caller to pass data if the message key is typed
    emit<DataType>(type: keyof messages.EventMap, key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>

    emit<DataType>(type: keyof messages.EventMap, key: messages.UntypedKey | messages.TypedKey<DataType>, data?: DataType): Tag<AttrsType> {
        this.addMessageKey(type, key.id)
        if (data) {
            this.dataAttr(key.id, encodeURIComponent(JSON.stringify(data)))
        }
        return this
    }

    //// Begin Emit Methods

    emitAbort<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitAbort<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitAbort<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('abort', key, data)
        return this
    }
    
    emitAnimationCancel<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitAnimationCancel<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitAnimationCancel<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('animationcancel', key, data)
        return this
    }
    
    emitAnimationEnd<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitAnimationEnd<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitAnimationEnd<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('animationend', key, data)
        return this
    }
    
    emitAnimationIteration<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitAnimationIteration<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitAnimationIteration<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('animationiteration', key, data)
        return this
    }
    
    emitAnimationStart<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitAnimationStart<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitAnimationStart<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('animationstart', key, data)
        return this
    }
    
    emitAuxClick<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitAuxClick<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitAuxClick<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('auxclick', key, data)
        return this
    }
    
    emitBeforeInput<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitBeforeInput<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitBeforeInput<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('beforeinput', key, data)
        return this
    }
    
    emitBlur<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitBlur<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitBlur<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('blur', key, data)
        return this
    }
    
    emitCanPlay<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitCanPlay<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitCanPlay<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('canplay', key, data)
        return this
    }
    
    emitCanPlayThrough<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitCanPlayThrough<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitCanPlayThrough<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('canplaythrough', key, data)
        return this
    }
    
    emitChange<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitChange<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitChange<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('change', key, data)
        return this
    }
    
    emitClick<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitClick<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitClick<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('click', key, data)
        return this
    }
    
    emitClose<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitClose<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitClose<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('close', key, data)
        return this
    }
    
    emitCompositionEnd<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitCompositionEnd<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitCompositionEnd<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('compositionend', key, data)
        return this
    }
    
    emitCompositionStart<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitCompositionStart<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitCompositionStart<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('compositionstart', key, data)
        return this
    }
    
    emitCompositionUpdate<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitCompositionUpdate<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitCompositionUpdate<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('compositionupdate', key, data)
        return this
    }
    
    emitContextMenu<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitContextMenu<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitContextMenu<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('contextmenu', key, data)
        return this
    }
    
    emitCopy<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitCopy<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitCopy<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('copy', key, data)
        return this
    }
    
    emitCueChange<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitCueChange<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitCueChange<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('cuechange', key, data)
        return this
    }
    
    emitCut<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitCut<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitCut<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('cut', key, data)
        return this
    }
    
    emitDblClick<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitDblClick<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitDblClick<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('dblclick', key, data)
        return this
    }
    
    emitDrag<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitDrag<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitDrag<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('drag', key, data)
        return this
    }
    
    emitDragEnd<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitDragEnd<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitDragEnd<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('dragend', key, data)
        return this
    }
    
    emitDragEnter<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitDragEnter<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitDragEnter<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('dragenter', key, data)
        return this
    }
    
    emitDragLeave<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitDragLeave<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitDragLeave<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('dragleave', key, data)
        return this
    }
    
    emitDragOver<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitDragOver<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitDragOver<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('dragover', key, data)
        return this
    }
    
    emitDragStart<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitDragStart<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitDragStart<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('dragstart', key, data)
        return this
    }
    
    emitDrop<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitDrop<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitDrop<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('drop', key, data)
        return this
    }
    
    emitDurationChange<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitDurationChange<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitDurationChange<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('durationchange', key, data)
        return this
    }
    
    emitEmptied<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitEmptied<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitEmptied<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('emptied', key, data)
        return this
    }
    
    emitEnded<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitEnded<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitEnded<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('ended', key, data)
        return this
    }
    
    emitError<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitError<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitError<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('error', key, data)
        return this
    }
    
    emitFocus<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitFocus<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitFocus<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('focus', key, data)
        return this
    }
    
    emitFocusIn<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitFocusIn<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitFocusIn<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('focusin', key, data)
        return this
    }
    
    emitFocusOut<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitFocusOut<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitFocusOut<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('focusout', key, data)
        return this
    }
    
    emitFormData<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitFormData<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitFormData<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('formdata', key, data)
        return this
    }
    
    emitFullscreenChange<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitFullscreenChange<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitFullscreenChange<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('fullscreenchange', key, data)
        return this
    }
    
    emitFullscreenError<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitFullscreenError<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitFullscreenError<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('fullscreenerror', key, data)
        return this
    }
    
    emitGotPointerCapture<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitGotPointerCapture<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitGotPointerCapture<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('gotpointercapture', key, data)
        return this
    }
    
    emitInput<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitInput<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitInput<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('input', key, data)
        return this
    }
    
    emitInvalid<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitInvalid<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitInvalid<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('invalid', key, data)
        return this
    }
    
    emitKeyDown<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitKeyDown<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitKeyDown<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('keydown', key, data)
        return this
    }
    
    emitKeyUp<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitKeyUp<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitKeyUp<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('keyup', key, data)
        return this
    }
    
    emitLoad<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitLoad<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitLoad<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('load', key, data)
        return this
    }
    
    emitLoadedData<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitLoadedData<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitLoadedData<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('loadeddata', key, data)
        return this
    }
    
    emitLoadedMetadata<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitLoadedMetadata<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitLoadedMetadata<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('loadedmetadata', key, data)
        return this
    }
    
    emitLoadStart<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitLoadStart<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitLoadStart<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('loadstart', key, data)
        return this
    }
    
    emitLostPointerCapture<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitLostPointerCapture<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitLostPointerCapture<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('lostpointercapture', key, data)
        return this
    }
    
    emitMouseDown<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitMouseDown<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitMouseDown<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('mousedown', key, data)
        return this
    }
    
    emitMouseEnter<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitMouseEnter<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitMouseEnter<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('mouseenter', key, data)
        return this
    }
    
    emitMouseLeave<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitMouseLeave<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitMouseLeave<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('mouseleave', key, data)
        return this
    }
    
    emitMouseMove<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitMouseMove<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitMouseMove<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('mousemove', key, data)
        return this
    }
    
    emitMouseOut<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitMouseOut<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitMouseOut<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('mouseout', key, data)
        return this
    }
    
    emitMouseOver<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitMouseOver<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitMouseOver<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('mouseover', key, data)
        return this
    }
    
    emitMouseUp<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitMouseUp<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitMouseUp<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('mouseup', key, data)
        return this
    }
    
    emitPaste<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitPaste<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitPaste<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('paste', key, data)
        return this
    }
    
    emitPause<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitPause<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitPause<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('pause', key, data)
        return this
    }
    
    emitPlay<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitPlay<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitPlay<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('play', key, data)
        return this
    }
    
    emitPlaying<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitPlaying<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitPlaying<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('playing', key, data)
        return this
    }
    
    emitPointerCancel<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitPointerCancel<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitPointerCancel<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('pointercancel', key, data)
        return this
    }
    
    emitPointerDown<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitPointerDown<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitPointerDown<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('pointerdown', key, data)
        return this
    }
    
    emitPointerEnter<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitPointerEnter<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitPointerEnter<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('pointerenter', key, data)
        return this
    }
    
    emitPointerLeave<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitPointerLeave<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitPointerLeave<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('pointerleave', key, data)
        return this
    }
    
    emitPointerMove<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitPointerMove<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitPointerMove<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('pointermove', key, data)
        return this
    }
    
    emitPointerOut<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitPointerOut<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitPointerOut<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('pointerout', key, data)
        return this
    }
    
    emitPointerOver<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitPointerOver<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitPointerOver<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('pointerover', key, data)
        return this
    }
    
    emitPointerUp<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitPointerUp<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitPointerUp<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('pointerup', key, data)
        return this
    }
    
    emitProgress<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitProgress<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitProgress<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('progress', key, data)
        return this
    }
    
    emitRateChange<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitRateChange<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitRateChange<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('ratechange', key, data)
        return this
    }
    
    emitReset<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitReset<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitReset<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('reset', key, data)
        return this
    }
    
    emitResize<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitResize<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitResize<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('resize', key, data)
        return this
    }
    
    emitScroll<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitScroll<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitScroll<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('scroll', key, data)
        return this
    }
    
    emitSecurityPolicyViolation<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitSecurityPolicyViolation<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitSecurityPolicyViolation<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('securitypolicyviolation', key, data)
        return this
    }
    
    emitSeeked<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitSeeked<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitSeeked<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('seeked', key, data)
        return this
    }
    
    emitSeeking<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitSeeking<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitSeeking<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('seeking', key, data)
        return this
    }
    
    emitSelect<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitSelect<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitSelect<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('select', key, data)
        return this
    }
    
    emitSelectionChange<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitSelectionChange<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitSelectionChange<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('selectionchange', key, data)
        return this
    }
    
    emitSelectStart<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitSelectStart<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitSelectStart<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('selectstart', key, data)
        return this
    }
    
    emitStalled<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitStalled<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitStalled<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('stalled', key, data)
        return this
    }
    
    emitSubmit<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitSubmit<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitSubmit<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('submit', key, data)
        return this
    }
    
    emitSuspend<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitSuspend<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitSuspend<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('suspend', key, data)
        return this
    }
    
    emitTimeUpdate<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitTimeUpdate<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitTimeUpdate<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('timeupdate', key, data)
        return this
    }
    
    emitToggle<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitToggle<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitToggle<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('toggle', key, data)
        return this
    }
    
    emitTouchCancel<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitTouchCancel<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitTouchCancel<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('touchcancel', key, data)
        return this
    }
    
    emitTouchEnd<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitTouchEnd<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitTouchEnd<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('touchend', key, data)
        return this
    }
    
    emitTouchMove<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitTouchMove<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitTouchMove<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('touchmove', key, data)
        return this
    }
    
    emitTouchStart<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitTouchStart<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitTouchStart<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('touchstart', key, data)
        return this
    }
    
    emitTransitionCancel<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitTransitionCancel<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitTransitionCancel<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('transitioncancel', key, data)
        return this
    }
    
    emitTransitionEnd<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitTransitionEnd<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitTransitionEnd<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('transitionend', key, data)
        return this
    }
    
    emitTransitionRun<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitTransitionRun<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitTransitionRun<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('transitionrun', key, data)
        return this
    }
    
    emitTransitionStart<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitTransitionStart<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitTransitionStart<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('transitionstart', key, data)
        return this
    }
    
    emitVolumeChange<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitVolumeChange<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitVolumeChange<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('volumechange', key, data)
        return this
    }
    
    emitWaiting<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitWaiting<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitWaiting<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('waiting', key, data)
        return this
    }
    
    emitWebkitAnimationEnd<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitWebkitAnimationEnd<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitWebkitAnimationEnd<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('webkitanimationend', key, data)
        return this
    }
    
    emitWebkitAnimationIteration<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitWebkitAnimationIteration<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitWebkitAnimationIteration<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('webkitanimationiteration', key, data)
        return this
    }
    
    emitWebkitAnimationStart<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitWebkitAnimationStart<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitWebkitAnimationStart<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('webkitanimationstart', key, data)
        return this
    }
    
    emitWebkitTransitionEnd<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitWebkitTransitionEnd<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitWebkitTransitionEnd<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('webkittransitionend', key, data)
        return this
    }
    
    emitWheel<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitWheel<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitWheel<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('wheel', key, data)
        return this
    }
    
//// End Emit Methods


}
