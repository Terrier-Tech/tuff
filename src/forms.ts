import {Part, PartTag, StatelessPart} from './parts'
import {Logger} from './logging'
import {
    FormTag,
    InputTag,
    InputTagAttrs,
    OptGroupTag,
    OptionTagAttrs,
    SelectTag,
    SelectTagAttrs,
    TextAreaTag,
    TextAreaTagAttrs
} from './html'
import Arrays from "./arrays"
import Messages, {ListenOptions, Message, TypedKey} from "./messages"

const log = new Logger("Forms")

/**
 * All possible input element types.
 */
export type InputType = "button" | "checkbox" | "color" | "date" | "datetime-local" | "email" | "file" | "hidden" | "image" | "month" | "number" | "password" | "radio" | "range" | "reset" | "search" | "submit" | "tel" | "text" | "time" | "url" | "week"

/**
 * Type-safe way to match the key of type `T` as long as the value is of type `ValueType`.
 */
export type KeyOfType<T, ValueType> = 
  { [Key in keyof T]-?: T[Key] extends ValueType | undefined ? Key : never }[keyof T]

/**
 * All form elements are keyed by a string.
 */
export type FormPartData = Record<string, any>

/**
 * These get added to the possible events for which messages can be sent and received.
 */
export interface EventMap {
    "datachanged": Event
}

export abstract class FormPart<DataType extends FormPartData> extends Part<DataType> {

    fields: {[name: string]: Field<any,Element>} = {}
    files: {[name: string]: FileList | null} = {}

    readonly dataChangedKey = Messages.typedKey<DataType>()

    async init() {
        this.onDataChanged(this.dataChangedKey, m => {
            const field = m.event.target as HTMLInputElement
            if (field.type == 'file') {
                this.files[field.name] = field.files
            }
        })
    }

    get className(): string {
        return `form-${this.id}`
    }

    protected input<Key extends KeyOfType<DataType,any> & string>(parent: PartTag, type: InputType, name: Key, serializerType: (new (name: string)=> Field<any, Element>), attrs: InputTagAttrs={}): InputTag {
        attrs.type = type
        attrs.name = `${this.id}-${name}`
        if (!this.fields[attrs.name]) {
            this.fields[attrs.name] = new serializerType(name)
        }
        if (type == 'file' && !this.files[attrs.name]) {
            this.files[attrs.name] = null
        }
        this.fields[attrs.name].assignAttrValue(attrs, this.state[name])
        return parent.input(attrs, this.className)
    }

    hiddenInput<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "hidden", name, TextInputField, attrs)
    }

    textInput<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "text", name, TextInputField, attrs)
    }

    numberInput<Key extends KeyOfType<DataType,number> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "number", name, NumberInputField, attrs)
    }

    fileInput<Key extends KeyOfType<DataType,File> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "file", name, FileInputField, attrs)
    }

    emailInput<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "email", name, TextInputField, attrs)
    }

    phoneInput<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "tel", name, TextInputField, attrs)
    }

    passwordInput<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "password", name, TextInputField, attrs)
    }

    searchInput<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "search", name, TextInputField, attrs)
    }

    urlInput<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "url", name, TextInputField, attrs)
    }

    textArea<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: TextAreaTagAttrs={}): TextAreaTag {
        attrs.name = `${this.id}-${name}`
        if (!this.fields[attrs.name]) {
            this.fields[attrs.name] = new TextAreaField(name)
        }
        this.fields[attrs.name].assignAttrValue(attrs, this.state[name])
        return parent.textarea(attrs, this.className)
    }

    dateInput<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "date", name, TextInputField, attrs)
    }

    timeInput<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "time", name, TextInputField, attrs)
    }

    dateTimeInput<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "datetime-local", name, TextInputField, attrs)
    }

    monthInput<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "month", name, TextInputField, attrs)
    }

    weekInput<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "week", name, TextInputField, attrs)
    }

    checkbox<Key extends KeyOfType<DataType,boolean> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "checkbox", name, CheckboxField, attrs)
    }

    radio<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, value: string, attrs: InputTagAttrs={}): InputTag {
        attrs.value = value
        return this.input<Key>(parent, "radio", name, RadioField, attrs)
    }

    select<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, options?: SelectOptions, attrs: SelectTagAttrs={}): SelectTag {
        attrs.name = `${this.id}-${name}`
        if (!this.fields[attrs.name]) {
            this.fields[attrs.name] = new SelectField(name)
        }
        this.fields[attrs.name].assignAttrValue(attrs, this.state[name])
        const tag = parent.select(attrs, this.className)
        if (options) {
            optionsForSelect(tag, options, this.state[name])
        }
        return tag
    }

    colorInput<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "color", name, TextInputField, attrs)
    }

    update(elem: HTMLElement) {
        if (Object.keys(this.files).length) {
            for (const fieldName in this.files) {
                if (this.files[fieldName]) {
                    const field = elem.querySelector(`input[name=${fieldName}]`) as HTMLInputElement
                    field.files = this.files[fieldName]
                }
            }
        }
    }

    /**
     *  Create a form tag in the given parent.
     */
    formTag(parent: PartTag, fun: ((n: FormTag) => any)) {
        const tag = parent.form({id: `${this.id}_tag`}, this.className)
        fun(tag)
    }

    /**
     * Serializes the form into a new copy of `this.state`.
     * This is async so that subclasses can override it and do async things.
     */
    async serialize(): Promise<DataType> {
        const root = this.element
        if (!root) {
            return {} as DataType
        }
        const data: DataType = {...this.state}
        const allElems = Array.from(root.getElementsByClassName(this.className))
        // there may be more than one actual element for any given key, so group them together and let the Field determine the value
        Arrays.eachGroupByFunction(allElems, e => (e.getAttribute('name')||undefined), (name, elems) => {
            const field = this.fields[name]
            if (field) {
                const value = field.getValue(elems)
                Object.assign(data, {[field.name]: value})
            }
        })
        return data
    }

    /**
     * Serializes the file input into a FormData object.
     * This is async so that subclasses can override it and do async things.
     * @param   input       file input
     * @param   key         key to associate files with in FormData
     * @returns FormData    contains files
     */
    async serializeFileInput(input: HTMLInputElement, key?: string): Promise<FormData> {
        const root = this.element
        const data: FormData = new FormData()

        if (!root || input.type != 'file' || !(input.files instanceof FileList)) {
            return data
        }

        const fileList: FileList = input.files
        key = key ?? 'files'
        for (let i = 0; i < fileList.length; i++) {
            data.append(key, fileList[i])
        }
        return data
    }

    /**
     * In addition to the regular part listeners, listen to change events on fields for this form
     */
    _attachEventListeners() {
        const needsEventListeners = this._needsEventListeners
        super._attachEventListeners()
        if (!this.isInitialized || !needsEventListeners) {
            return
        }
        const elem = this.element
        if (!elem) {
            return
        }
        const part = this
        elem.addEventListener("change", async function(this: HTMLElement, evt: Event) {
            if ((evt.target as HTMLElement).classList.contains(part.className)) {
                const data = await part.serialize()
                log.debug("Data Changed", part, evt, data)
                if (part.shouldUpdateState(data)) {
                    Object.assign(part.state, data)
                    part.emitDataChanged(evt, data)
                }
            }
        })
    }

    /** 
     * @returns true (default) to assign the new data to the part's state and propagate it as a message.
     */
    shouldUpdateState(_: DataType): boolean {
        return true
    }

    /** 
     * Emits the datachanged event for this form and the given data
     */
    emitDataChanged(evt: Event, data: DataType) {
        log.debug("Emitting datachanged event", this, evt, data)
        this.emit("datachanged", this.dataChangedKey, evt, data, {scope: "bubble"})
    }

    /**
     *  Listens for datachanged events on this or child forms
     */
    onDataChanged<EvtDataType>(
        key: TypedKey<EvtDataType>, 
        listener: (m: Message<"datachanged",EvtDataType>) => void, 
        options?: ListenOptions) {
        this.listen<"datachanged",EvtDataType>("datachanged", key, listener, options)
    }


}

/**
 * Base class for classes that get and set values for concrete form elements.
 */
export abstract class Field<FieldType, ElementType extends Element> {

    /**
     * @param name is the actual name of the property, not the element name attribute,
     * which is mangled to ensure uniqueness between forms
     */
    constructor(readonly name: string) {

    }

    /**
     * Assigns either the 'value' attribute or related attributes (like 'checked')
     */
    abstract assignAttrValue(attrs: InputTagAttrs, value?: FieldType): void

    /**
     * Gets the value from an actual element or elements
     */
    abstract getValue(elem: ElementType[]): FieldType | null

}

export class TextInputField extends Field<string, HTMLInputElement> {
    
    assignAttrValue(attrs: InputTagAttrs, value?: string) {
        attrs.value = value
    }

    getValue(elems: HTMLInputElement[]): string | null {
        return elems[0].value
    }

}

export class NumberInputField extends Field<number, HTMLInputElement> {

    assignAttrValue(attrs: InputTagAttrs, value?: number) {
        attrs.value = value?.toString()
    }

    getValue(elems: HTMLInputElement[]): number | null {
        const val = elems[0].value
        if (val?.length) {
            return parseFloat(val)
        }
        else {
            return null
        }
    }

}

export class FileInputField extends Field<FileList, HTMLInputElement> {

    assignAttrValue(_attrs: InputTagAttrs, _value?: FileList) {
        // FileList is assigned to HTMLInputElement's .files attribute by FormPart#update
    }

    getValue(elem: HTMLInputElement[]): FileList | null {
        return elem[0].files ?? null
    }

}

export class TextAreaField extends Field<string, HTMLTextAreaElement> {
    
    assignAttrValue(attrs: TextAreaTagAttrs, value?: string) {
        attrs.text = value
    }

    getValue(elems: HTMLTextAreaElement[]): string | null {
        return elems[0].value
    }

}

export class SelectField extends Field<string, HTMLSelectElement> {
    
    assignAttrValue(attrs: SelectTagAttrs, value?: string) {
        attrs.value = value // even though `value` isn't a valid select attribute, it might be convenient to have this value later on
    }

    getValue(elems: HTMLSelectElement[]): string | null {
        // The `value` property on <select> or <option> will return the text content of the <option> if the `value`
        // attribute is null or undefined. Using `getAttribute` bypasses this custom behavior and returns the *actual*
        // value.
        // This assumes that the select does not have the `multiple` attribute.
        return elems[0].selectedOptions[0]?.getAttribute("value") ?? null
    }

}

export class CheckboxField extends Field<boolean, HTMLInputElement> {
        
    assignAttrValue(attrs: InputTagAttrs, value?: boolean) {
        attrs.checked = value
    }

    getValue(elems: HTMLInputElement[]): boolean | null {
        return elems[0].checked
    }
}

export class RadioField extends Field<string, HTMLInputElement> {
        
    assignAttrValue(attrs: InputTagAttrs, value?: string) {
        attrs.checked = attrs.value == value
    }

    getValue(elems: HTMLInputElement[]): string | null {
        for (let elem of elems) {
            if (elem.checked) {
                return elem.value
            }
        }
        return null
    }
}



////////////////////////////////////////////////////////////////////////////////
// Select Options
////////////////////////////////////////////////////////////////////////////////

/**
 * Represents a single <option> tag.
 */
export type SelectOption = {
    value: string | null
    title: string
}

export type SelectOptGroup = {
    group: string
    options: SelectOption[]
}

/**
 * An array of `SelectOption`s that can be passed to `optionsForSelect`.
 */
export type SelectOptions = (SelectOption | SelectOptGroup)[]

/**
 * Adds options to a select tag
 * @param tag the select tag
 * @param options the options to add
 * @param selected the currently selected option value
 */
export function optionsForSelect(tag: SelectTag | OptGroupTag, options: SelectOptions, selected?: string) {
    for (const opt of options) {
        if ('group' in opt) {
            const optgroup = tag.optgroup({ label: opt.group })
            optionsForSelect(optgroup, opt.options, selected)
        } else {
            const attrs: OptionTagAttrs = {
                value: opt.value == null ? undefined : opt.value
            }
            if (selected == opt.value) {
                attrs.selected = true
            }
            tag.option(attrs).text(opt.title)
        }
    }
}

/**
 * Transforms a rails-style options array to a tuff SelectOptions
 * @param options
 */
export function toSelectOptions(options: readonly [string, string][]) : SelectOption[]
export function toSelectOptions(options: readonly [string, [string, string][]][]) : SelectOptions
export function toSelectOptions(options: readonly [string, string][] | readonly [string, [string, string][]][]) : SelectOptions {
    const results: SelectOptions = []
    for (const option of options) {
        const value = option[1]
        if (Array.isArray(value)) {
            results.push({ group: option[0], options: toSelectOptions(value)})
        } else {
            results.push({ title: option[0], value })
        }
    }

    return results
}



////////////////////////////////////////////////////////////////////////////////
// Form Fields
////////////////////////////////////////////////////////////////////////////////

let _formCount = 0

/**
 * A lightweight alternative to `FormPart` that exposes the same field helper methods
 * but maintains the form data separate from a part's state.
 */
export class FormFields<DataType extends FormPartData> {

    readonly id!: string
    readonly fieldChangeKey = Messages.untypedKey()
    readonly dataChangedKey = Messages.typedKey<DataType>()

    constructor(readonly part: StatelessPart, public data: DataType) {
        _formCount += 1
        this.id = `tuff-form-${_formCount}`

        // hijack the part's onChange listener to emit the datachanged message for the fields themselves
        this.part.onChange(this.fieldChangeKey, async m => {
            log.info(`FormFields ${this.id} field changed`, m)
            const data = await this.serialize()
            this.data = data
            this.emitDataChanged(m.event, data)
        })
    }

    fields: {[name: string]: Field<any,Element>} = {}
    files: {[name: string]: FileList | null} = {}

    get className(): string {
        return `form-${this.id}`
    }


    protected input<Key extends KeyOfType<DataType,any> & string>(parent: PartTag, type: InputType, name: Key, serializerType: (new (name: string)=> Field<any, Element>), attrs: InputTagAttrs={}): InputTag {
        attrs.type = type
        attrs.name = `${this.id}-${name}`
        if (!this.fields[attrs.name]) {
            this.fields[attrs.name] = new serializerType(name)
        }
        if (type == 'file' && !this.files[attrs.name]) {
            this.files[attrs.name] = null
        }
        this.fields[attrs.name].assignAttrValue(attrs, this.data[name])
        const input = parent.input(attrs, this.className)
        input.emitChange(this.fieldChangeKey)
        return input
    }

    hiddenInput<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "hidden", name, TextInputField, attrs)
    }

    textInput<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "text", name, TextInputField, attrs)
    }

    numberInput<Key extends KeyOfType<DataType,number> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "number", name, NumberInputField, attrs)
    }

    fileInput<Key extends KeyOfType<DataType,File> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "file", name, FileInputField, attrs)
    }

    emailInput<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "email", name, TextInputField, attrs)
    }

    phoneInput<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "tel", name, TextInputField, attrs)
    }

    passwordInput<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "password", name, TextInputField, attrs)
    }

    searchInput<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "search", name, TextInputField, attrs)
    }

    urlInput<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "url", name, TextInputField, attrs)
    }

    textArea<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: TextAreaTagAttrs={}): TextAreaTag {
        attrs.name = `${this.id}-${name}`
        if (!this.fields[attrs.name]) {
            this.fields[attrs.name] = new TextAreaField(name)
        }
        this.fields[attrs.name].assignAttrValue(attrs, this.data[name])
        const tag = parent.textarea(attrs, this.className)
        tag.emitChange(this.fieldChangeKey)
        return tag
    }

    dateInput<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "date", name, TextInputField, attrs)
    }

    timeInput<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "time", name, TextInputField, attrs)
    }

    dateTimeInput<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "datetime-local", name, TextInputField, attrs)
    }

    monthInput<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "month", name, TextInputField, attrs)
    }

    weekInput<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "week", name, TextInputField, attrs)
    }

    checkbox<Key extends KeyOfType<DataType,boolean> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "checkbox", name, CheckboxField, attrs)
    }

    radio<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, value: string, attrs: InputTagAttrs={}): InputTag {
        attrs.value = value
        return this.input<Key>(parent, "radio", name, RadioField, attrs)
    }

    select<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, options?: SelectOptions, attrs: SelectTagAttrs={}): SelectTag {
        attrs.name = `${this.id}-${name}`
        if (!this.fields[attrs.name]) {
            this.fields[attrs.name] = new SelectField(name)
        }
        this.fields[attrs.name].assignAttrValue(attrs, this.data[name])
        const tag = parent.select(attrs, this.className)
        if (options) {
            optionsForSelect(tag, options, this.data[name])
        }
        tag.emitChange(this.fieldChangeKey)
        return tag
    }

    colorInput<Key extends KeyOfType<DataType,string> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.input<Key>(parent, "color", name, TextInputField, attrs)
    }

    /**
     *  Create a form tag in the given parent.
     */
    formTag(parent: PartTag, fun: ((n: FormTag) => any)) {
        const tag = parent.form({id: `${this.id}_tag`}, this.className)
        fun(tag)
    }

    /**
     * Call this from the part's `update()` method to populate file fields.
     * @param elem the part's root element
     */
    update(elem: HTMLElement) {
        if (Object.keys(this.files).length) {
            for (const fieldName in this.files) {
                if (this.files[fieldName]) {
                    const field = elem.querySelector(`input[name=${fieldName}]`) as HTMLInputElement
                    field.files = this.files[fieldName]
                }
            }
        }
    }

    /**
     * Serializes the form fields into a new copy of `this.data`.
     * This is async so that subclasses can override it and do async things.
     */
    async serialize(): Promise<DataType> {
        const root = this.part.element
        if (!root) {
            return {} as DataType
        }
        const data: DataType = {...this.data}
        const allElems = Array.from(root.getElementsByClassName(this.className))
        // there may be more than one actual element for any given key, so group them together and let the Field determine the value
        Arrays.eachGroupByFunction(allElems, e => (e.getAttribute('name')||undefined), (name, elems) => {
            const field = this.fields[name]
            if (field) {
                const value = field.getValue(elems)
                Object.assign(data, {[field.name]: value})
            }
        })
        return data
    }

    /**
     * Emits the datachanged event for this form and the given data
     */
    emitDataChanged(evt: Event, data: DataType) {
        log.debug("Emitting datachanged event", this, evt, data)
        this.part.emit("datachanged", this.dataChangedKey, evt, data, {scope: "bubble"})
    }
}