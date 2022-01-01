import * as tags from './tags'
import {Part} from './parts'
import Logger from './logger'
import * as arrays from './arrays'

const log = new Logger("Forms")

type InputType = "button" | "checkbox" | "color" | "date" | "datetime-local" | "email" | "file" | "hidden" | "image" | "month" | "number" | "password" | "radio" | "range" | "reset" | "search" | "submit" | "tel" | "text" | "time" | "url" | "week"

type KeyOfType<T, ValueType> = 
  { [Key in keyof T]-?: T[Key] extends ValueType | undefined ? Key : never }[keyof T]

export type FormData = Record<string, any>

export abstract class FormPart<DataType extends FormData> extends Part<DataType> {

    fields: {[name: string]: Field<any,Element>} = {}

    get className(): string {
        return `form-${this.id}`
    }

    protected input<Key extends KeyOfType<DataType,any> & string>(parent: tags.ParentTag, type: InputType, name: Key, serializerType: (new (name: string)=> Field<any, Element>), attrs: tags.InputTagAttrs={}): tags.InputTag {
        attrs.type = type
        attrs.name = `${this.id}-${name}`
        if (!this.fields[attrs.name]) {
            this.fields[attrs.name] = new serializerType(name)
        }
        this.fields[attrs.name].assignAttrValue(attrs, this.state[name])
        return parent.input(attrs).class(this.className)
    }

    textInput<Key extends KeyOfType<DataType,string> & string>(parent: tags.ParentTag, name: Key, attrs: tags.InputTagAttrs={}): tags.InputTag {
        return this.input<Key>(parent, "text", name, TextInputField, attrs)
    }

    emailInput<Key extends KeyOfType<DataType,string> & string>(parent: tags.ParentTag, name: Key, attrs: tags.InputTagAttrs={}): tags.InputTag {
        return this.input<Key>(parent, "email", name, TextInputField, attrs)
    }

    phoneInput<Key extends KeyOfType<DataType,string> & string>(parent: tags.ParentTag, name: Key, attrs: tags.InputTagAttrs={}): tags.InputTag {
        return this.input<Key>(parent, "tel", name, TextInputField, attrs)
    }

    textArea<Key extends KeyOfType<DataType,string> & string>(parent: tags.ParentTag, name: Key, attrs: tags.TextAreaTagAttrs={}): tags.TextAreaTag {
        attrs.name = `${this.id}-${name}`
        if (!this.fields[name]) {
            this.fields[name] = new TextAreaField(name)
        }
        this.fields[name].assignAttrValue(attrs, this.state[name])
        return parent.textarea(attrs).class(this.className)
    }

    dateInput<Key extends KeyOfType<DataType,string> & string>(parent: tags.ParentTag, name: Key, attrs: tags.InputTagAttrs={}): tags.InputTag {
        return this.input<Key>(parent, "date", name, TextInputField, attrs)
    }

    checkbox<Key extends KeyOfType<DataType,boolean> & string>(parent: tags.ParentTag, name: Key, attrs: tags.InputTagAttrs={}): tags.InputTag {
        return this.input<Key>(parent, "checkbox", name, CheckboxField, attrs)
    }

    radio<Key extends KeyOfType<DataType,string> & string>(parent: tags.ParentTag, name: Key, value: string, attrs: tags.InputTagAttrs={}): tags.InputTag {
        attrs.value = value
        return this.input<Key>(parent, "radio", name, RadioField, attrs)
    }

    // Create a form tag
    formTag(parent: tags.ParentTag, fun: ((n: tags.FormTag) => any)) {
        const tag = parent.form({id: `${this.id}_tag`}).class(this.className)
        fun(tag)
    }

    attachEventListeners() {
        super.attachEventListeners()
        const elem = this.element
        const part = this
        elem.addEventListener("change", function(this: HTMLElement, evt: Event) {
            // debugger
            if ((evt.target as HTMLElement).classList.contains(part.className)) {
                const data = part.serialize()
                log.debug("Input Changed", part, evt, data)
            }
        })
    }

    // Serializes the form into a new copy of this.state
    serialize(): DataType {
        const root = this.element
        const data: DataType = {...this.state}
        const allElems = Array.from(root.getElementsByClassName(this.className))
        for (let [name, elems] of Object.entries(arrays.groupBy(allElems, e => e.getAttribute('name')||''))) {
            const field = this.fields[name]
            if (field) {
                const value = field.getValue(elems)
                Object.assign(data, {[field.name]: value})
            }
        }
        return data
    }

}


abstract class Field<FieldType, ElementType extends Element> {

    // name is the actual name of the property, not the element name attribute,
    // which is mangled to ensure uniqueness between forms
    constructor(readonly name: string) {

    }

    // Assigns either the 'value' attribute or related attributes (like 'checked')
    abstract assignAttrValue(attrs: tags.InputTagAttrs, value?: FieldType): void

    // Gets the value from an actual element
    abstract getValue(elem: ElementType[]): FieldType | null

}

class TextInputField extends Field<string, HTMLInputElement> {
    
    assignAttrValue(attrs: tags.InputTagAttrs, value?: string) {
        attrs.value = value
    }

    getValue(elems: HTMLInputElement[]): string | null {
        return elems[0].value
    }

}

class TextAreaField extends Field<string, HTMLTextAreaElement> {
    
    assignAttrValue(attrs: tags.InputTagAttrs, value?: string) {
        attrs.value = value
    }

    getValue(elems: HTMLTextAreaElement[]): string | null {
        return elems[0].value
    }

}

class CheckboxField extends Field<boolean, HTMLInputElement> {
        
    assignAttrValue(attrs: tags.InputTagAttrs, value?: boolean) {
        attrs.checked = value
    }

    getValue(elems: HTMLInputElement[]): boolean | null {
        return elems[0].checked
    }
}

class RadioField extends Field<string, HTMLInputElement> {
        
    assignAttrValue(attrs: tags.InputTagAttrs, value?: string) {
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