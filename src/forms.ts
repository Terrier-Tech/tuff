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
import Strings from "./strings"

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

    formFields!: FormFields<DataType>

    get fields(): {[name: string]: Field<any,Element>} {
        return this.formFields.fields
    }

    get files(): {[name: string]: FileList | null} {
        return this.formFields.files
    }

    get dataChangedKey() {
        return this.formFields.dataChangedKey
    }

    async init() {
        this.formFields = new FormFields(this, this.state)
    }

    assignState(state: DataType): boolean {
        const changed = super.assignState(state)
        if (changed) {
            this.formFields.data = state
        }
        return changed
    }

    get className(): string {
        return `form-${this.id}`
    }

    input<Key extends KeyOfType<DataType,any> & string>(parent: PartTag, type: InputType, name: Key, serializerType: FieldConstructor<any, Element>, attrs: InputTagAttrs={}): InputTag {
        return this.formFields.input(parent, type, name, serializerType, attrs)
    }

    hiddenInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        return this.formFields.hiddenInput(parent, name, attrs, serializerType)
    }

    textInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        return this.formFields.textInput(parent, name, attrs, serializerType)
    }

    numberInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        return this.formFields.numberInput(parent, name, attrs, serializerType)
    }

    fileInput<Key extends KeyOfType<DataType,File> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        return this.formFields.fileInput(parent, name, attrs)
    }

    emailInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        return this.formFields.emailInput(parent, name, attrs, serializerType)
    }

    phoneInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        return this.formFields.phoneInput(parent, name, attrs, serializerType)
    }

    passwordInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        return this.formFields.passwordInput(parent, name, attrs, serializerType)
    }

    searchInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        return this.formFields.searchInput(parent, name, attrs, serializerType)
    }

    urlInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        return this.formFields.urlInput(parent, name, attrs, serializerType)
    }

    textArea<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLTextAreaElement>>(parent: PartTag, name: Key, attrs: TextAreaTagAttrs={}, serializerType?: TSerializer): TextAreaTag {
        return this.formFields.textArea(parent, name, attrs, serializerType)
    }

    dateInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        return this.formFields.dateInput(parent, name, attrs, serializerType)
    }

    timeInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        return this.formFields.timeInput(parent, name, attrs, serializerType)
    }

    dateTimeInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        return this.formFields.dateTimeInput(parent, name, attrs, serializerType)
    }

    monthInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        return this.formFields.monthInput(parent, name, attrs, serializerType)
    }

    weekInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        return this.formFields.weekInput(parent, name, attrs, serializerType)
    }

    checkbox<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        return this.formFields.checkbox(parent, name, attrs, serializerType)
    }

    radio<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, value: DataType[Key], attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        return this.formFields.radio(parent, name, value, attrs, serializerType)
    }

    select<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLSelectElement>>(parent: PartTag, name: Key, options?: SelectOptions, attrs: SelectTagAttrs={}, serializerType?: TSerializer): SelectTag {
        return this.formFields.select(parent, name, options, attrs, serializerType)
    }

    colorInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        return this.formFields.colorInput(parent, name, attrs, serializerType)
    }

    update(elem: HTMLElement) {
        super.update(elem)
        this.formFields.update(elem)
    }

    /**
     *  Create a form tag in the given parent.
     */
    formTag(parent: PartTag, fun: ((n: FormTag) => any)) {
        this.formFields.formTag(parent, fun)
    }

    /**
     * Serializes the form into a new copy of `this.state`.
     * This is async so that subclasses can override it and do async things.
     */
    async serialize(): Promise<DataType> {
        return this.formFields.serialize()
    }

    /**
     * Serializes the file input into a FormData object.
     * This is async so that subclasses can override it and do async things.
     * @param   input       file input
     * @param   key         key to associate files with in FormData
     * @returns FormData    contains files
     */
    async serializeFileInput(input: HTMLInputElement, key?: string): Promise<FormData> {
        return this.formFields.serializeFileInput(input, key)
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
        if (!elem) return
        this.formFields.registerChangeListener(elem, data => {
            const shouldUpdateState = this.shouldUpdateState(data)
            if (shouldUpdateState) {
                Object.assign(this.state, data)
            }
            return shouldUpdateState
        })
    }

    /** 
     * @returns true (default) to assign the new data to the part's state and propagate it as a message.
     */
    shouldUpdateState(_: DataType): boolean {
        return true
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


export type FieldConstructor<FieldType, ElementType extends Element> = new (name: string) => Field<FieldType, ElementType>


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

/**
 * Returns a new field that interprets the field value as a number
 * @param fieldConstructor
 */
export function numericAdapter<ElementType extends Element>(fieldConstructor: FieldConstructor<string, ElementType>): FieldConstructor<number, ElementType> {
    return class extends Field<number, ElementType> {
        private readonly inner: Field<string, ElementType>
        constructor(name: string) {
            super(name)
            this.inner = new fieldConstructor(name)
        }

        assignAttrValue(attrs: InputTagAttrs, value?: number) {
            this.inner.assignAttrValue(attrs, value?.toString())
        }

        getValue(elems: ElementType[]): number | null {
            const val = this.inner.getValue(elems)
            if (!val?.length) return null
            return parseFloat(val)
        }
    }
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
    readonly fieldChangeKey = Messages.typedKey<{ key: keyof DataType }>()
    readonly dataChangedKey = Messages.typedKey<DataType>()

    constructor(readonly part: StatelessPart, public data: DataType) {
        _formCount += 1
        this.id = `tuff-form-${_formCount}`

        // hijack the part's onChange listener to emit the datachanged message for the fields themselves
        this.part.onChange(this.fieldChangeKey, async m => {
            log.info(`FormFields ${this.id} field changed`, m)
            const field = m.event.target as HTMLInputElement
            if (field.type == 'file') {
                this.files[field.name] = field.files
            }
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

    inputName<Key extends keyof DataType & string>(name: Key) {
        return `${this.id}-${name}`
    }

    input<Key extends KeyOfType<DataType,any> & string>(parent: PartTag, type: InputType, name: Key, serializerType: FieldConstructor<any, Element>, attrs: InputTagAttrs={}): InputTag {
        attrs.type = type
        attrs.name = this.inputName(name)
        if (!this.fields[attrs.name]) {
            this.fields[attrs.name] = new serializerType(name)
        }
        this.fields[attrs.name].assignAttrValue(attrs, this.data[name])
        const input = parent.input(attrs, this.className)
        input.emitChange(this.fieldChangeKey, { key: name })
        return input
    }

    hiddenInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        serializerType ??= TextInputField as TSerializer
        return this.input<Key>(parent, "hidden", name, serializerType, attrs)
    }

    textInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        serializerType ??= TextInputField as TSerializer
        return this.input<Key>(parent, "text", name, serializerType, attrs)
    }

    numberInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        serializerType ??= NumberInputField as TSerializer
        return this.input<Key>(parent, "number", name, serializerType, attrs)
    }

    fileInput<Key extends KeyOfType<DataType,File> & string>(parent: PartTag, name: Key, attrs: InputTagAttrs={}): InputTag {
        const inputName = this.inputName(name)
        if (!this.files[inputName]) {
            this.files[inputName] = null
        }
        return this.input<Key>(parent, "file", name, FileInputField, attrs)
    }

    emailInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        serializerType ??= TextInputField as TSerializer
        return this.input<Key>(parent, "email", name, serializerType, attrs)
    }

    phoneInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        serializerType ??= TextInputField as TSerializer
        return this.input<Key>(parent, "tel", name, serializerType, attrs)
    }

    passwordInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        serializerType ??= TextInputField as TSerializer
        return this.input<Key>(parent, "password", name, serializerType, attrs)
    }

    searchInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        serializerType ??= TextInputField as TSerializer
        return this.input<Key>(parent, "search", name, serializerType, attrs)
    }

    urlInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        serializerType ??= TextInputField as TSerializer
        return this.input<Key>(parent, "url", name, serializerType, attrs)
    }

    textArea<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLTextAreaElement>>(parent: PartTag, name: Key, attrs: TextAreaTagAttrs={}, serializerType?: TSerializer): TextAreaTag {
        serializerType ??= TextAreaField as TSerializer
        attrs.name = `${this.id}-${name}`
        if (!this.fields[attrs.name]) {
            this.fields[attrs.name] = new serializerType(name)
        }
        this.fields[attrs.name].assignAttrValue(attrs, this.data[name])
        const tag = parent.textarea(attrs, this.className)
        tag.emitChange(this.fieldChangeKey, { key: name })
        return tag
    }

    dateInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        serializerType ??= TextInputField as TSerializer
        return this.input<Key>(parent, "date", name, serializerType, attrs)
    }

    timeInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        serializerType ??= TextInputField as TSerializer
        return this.input<Key>(parent, "time", name, serializerType, attrs)
    }

    dateTimeInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        serializerType ??= TextInputField as TSerializer
        return this.input<Key>(parent, "datetime-local", name, serializerType, attrs)
    }

    monthInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        serializerType ??= TextInputField as TSerializer
        return this.input<Key>(parent, "month", name, serializerType, attrs)
    }

    weekInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        serializerType ??= TextInputField as TSerializer
        return this.input<Key>(parent, "week", name, serializerType, attrs)
    }

    checkbox<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        serializerType ??= CheckboxField as TSerializer
        return this.input<Key>(parent, "checkbox", name, serializerType, attrs)
    }

    radio<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, value: DataType[Key], attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        serializerType ??= RadioField as TSerializer
        attrs.value = value
        return this.input<Key>(parent, "radio", name, serializerType, attrs)
    }

    select<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLSelectElement>>(parent: PartTag, name: Key, options?: SelectOptions, attrs: SelectTagAttrs={}, serializerType?: TSerializer): SelectTag {
        serializerType ??= SelectField as TSerializer
        attrs.name = `${this.id}-${name}`
        if (!this.fields[attrs.name]) {
            this.fields[attrs.name] = new serializerType(name)
        }
        this.fields[attrs.name].assignAttrValue(attrs, this.data[name])
        const tag = parent.select(attrs, this.className)
        if (options) {
            optionsForSelect(tag, options, this.data[name])
        }
        tag.emitChange(this.fieldChangeKey, { key: name })
        return tag
    }

    colorInput<Key extends keyof DataType & string, TSerializer extends FieldConstructor<DataType[Key], HTMLInputElement>>(parent: PartTag, name: Key, attrs: InputTagAttrs={}, serializerType?: TSerializer): InputTag {
        serializerType ??= TextInputField as TSerializer
        return this.input<Key>(parent, "color", name, serializerType, attrs)
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

    registerChangeListener(elem: Element, shouldUpdateState: (data: DataType) => boolean) {
        const _this = this
        elem.addEventListener("change", async function(this: HTMLElement, evt: Event) {
            if (evt.target === elem) {
                const data = await _this.serialize()
                log.debug("Data Changed", _this, evt, data)
                if (shouldUpdateState(data)) {
                    Object.assign(_this.data, data)
                    _this.emitDataChanged(evt, data)
                }
            }
        })
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

    serializeFileInput(input: HTMLInputElement, key?: string): FormData {
        const root = this.part.element
        const data: FormData = new FormData()

        if (!root || input.type != 'file' || !(input.files instanceof FileList)) {
            return data
        }

        const fileList: FileList = input.files
        key ??= 'files'
        for (let i = 0; i < fileList.length; i++) {
            data.append(key, fileList[i])
        }
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
export function optionsForSelect(tag: SelectTag | OptGroupTag, options: SelectOptions, selected?: string | null) {
    for (const opt of options) {
        if ('group' in opt) {
            const optgroup = tag.optgroup({ label: opt.group })
            optionsForSelect(optgroup, opt.options, selected)
        } else {
            const attrs: OptionTagAttrs = {
                value: opt.value == null ? undefined : opt.value
            }
            if (selected === opt.value) {
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
export function toSelectOptions(options: readonly [string, string | null][]) : SelectOption[]
export function toSelectOptions(options: readonly [string, [string, string | null][]][]) : SelectOptions
export function toSelectOptions(options: readonly [string, string | null][] | readonly [string, [string, string | null][]][]) : SelectOptions {
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

/**
 * Transforms an object of key-value pairs into an array of select options
 */
export function objectToSelectOptions(obj: Record<string, string>): SelectOptions {
    return Object.entries(obj).map(([value, title]) => ({ value, title }))
}

/**
 * Prepends a collection of select options with a blank option with an optional specified title.
 * This does not modify the original collection.
 * @param options the existing options to append to.
 * @param blankTitle the title of the blank option. Default is an empty string.
 * @return A new {@link SelectOptions} collection with a blank option in the first position.
 */
export function withBlankOption<T extends SelectOptions | SelectOption[]>(options: T, blankTitle = ""): T {
    return [{ value: "", title: blankTitle } as SelectOption, ...options] as T
}

/**
 * Prepends a collection of select options with a blank option that uses null for a value and the specified title.
 * This does not modify the original collection.
 * @param options the existing options to append to.
 * @param blankTitle the title of the blank option. Default is an empty string.
 * @return A new {@link SelectOptions} collection with a blank option in the first position.
 */
export function withNullBlankOption<T extends SelectOptions | SelectOption[]>(options: T, blankTitle = ""): T {
    return [{ value: null, title: blankTitle } as SelectOption, ...options] as T
}

/**
 * Transforms an array of strings into an array of SelectOptions
 * @param options an array of strings to convert into SelectOptions
 * @param blankTitle title of the blank option. If null, no blank option will be included
 */
export function titleizeOptions(options: string[] | readonly string[], blankTitle: string | null = null): SelectOption[] {
    const selectOptions = options.map(o => ({ value: o, title: Strings.titleize(o) }))
    if (blankTitle != null) {
        selectOptions.unshift({ value: "", title: blankTitle })
    }
    return selectOptions
}


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Forms = {
    optionsForSelect,
    toSelectOptions,
    objectToSelectOptions,
    withBlankOption,
    withNullBlankOption,
    titleizeOptions,
}

export default Forms