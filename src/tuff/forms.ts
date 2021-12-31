import * as tags from './tags'
import {Part} from './parts'
import Logger from '../tuff/logger'

const log = new Logger("Forms")

type InputType = "button" | "checkbox" | "color" | "date" | "datetime-local" | "email" | "file" | "hidden" | "image" | "month" | "number" | "password" | "radio" | "range" | "reset" | "search" | "submit" | "tel" | "text" | "time" | "url" | "week"


type KeyOfType<T, ValueType> = 
  { [Key in keyof T]-?: T[Key] extends ValueType | undefined ? Key : never }[keyof T]

export type FormData = Record<string, any>

export abstract class FormPart<DataType extends FormData> extends Part<DataType> {

    serializers: {[name: string]: FieldSerializer<any,Element>} = {}

    className!: string

    init() {
        super._init()
        this.className = `form-${this.id}`
    }

    protected input<Key extends KeyOfType<DataType,any> & string>(parent: tags.ParentTag, type: InputType, name: Key, serializerType: (new ()=> FieldSerializer<any, Element>), attrs: tags.InputTagAttrs={}): tags.InputTag {
        attrs.type = type
        attrs.name = name
        if (!this.serializers[name]) {
            this.serializers[name] = new serializerType()
        }
        this.serializers[name].assignAttrValue(attrs, this.state[name])
        return parent.input(attrs).class(this.className)
    }

    textInput<Key extends KeyOfType<DataType,string> & string>(parent: tags.ParentTag, name: Key, attrs: tags.InputTagAttrs={}): tags.InputTag {
        return this.input<Key>(parent, "text", name, TextInputSerializer, attrs)
    }

    textArea<Key extends KeyOfType<DataType,string> & string>(parent: tags.ParentTag, name: Key, attrs: tags.TextAreaTagAttrs={}): tags.TextAreaTag {
        attrs.name = name
        if (!this.serializers[name]) {
            this.serializers[name] = new TextAreaSerializer()
        }
        this.serializers[name].assignAttrValue(attrs, this.state[name])
        return parent.textarea(attrs).class(this.className)
    }

    dateInput<Key extends KeyOfType<DataType,string> & string>(parent: tags.ParentTag, name: Key, attrs: tags.InputTagAttrs={}): tags.InputTag {
        return this.input<Key>(parent, "date", name, TextInputSerializer, attrs)
    }

    checkbox<Key extends KeyOfType<DataType,boolean> & string>(parent: tags.ParentTag, name: Key, attrs: tags.InputTagAttrs={}): tags.InputTag {
        return this.input<Key>(parent, "checkbox", name, CheckboxSerializer, attrs)
    }

    // Create a form tag
    formTag(parent: tags.ParentTag, fun: ((n: tags.FormTag) => any)) {
        const tag = parent.form({id: this.id}).class(this.className)
        fun(tag)
    }

    attachEventListeners() {
        super.attachEventListeners()
        const elem = this.element
        const part = this
        elem.addEventListener("change", function(this: HTMLElement, evt: Event) {
            const data = part.serialize()
            log.debug("Input changed", evt, data)
        })
    }

    // Serializes the form into a new copy of this.state
    serialize(): DataType {
        const root = this.element
        const data: DataType = {...this.state}
        for (let elem of Array.from(root.getElementsByClassName(this.className))) {
            const name = elem.getAttribute('name')
            if (name) {
                const serializer = this.serializers[name]
                if (serializer) {
                    const value = serializer.getValue(elem as Element)
                    Object.assign(data, {[name]: value})
                }
            }
        }
        return data
    }

}


abstract class FieldSerializer<FieldType, ElementType extends Element> {

    // Assigns either the 'value' attribute or related attributes (like 'checked')
    abstract assignAttrValue(attrs: tags.InputTagAttrs, value?: FieldType): void

    // Gets the value from an actual element
    abstract getValue(elem: ElementType): FieldType

}

class TextInputSerializer extends FieldSerializer<string, HTMLInputElement> {
    
    assignAttrValue(attrs: tags.InputTagAttrs, value?: string) {
        attrs.value = value
    }

    getValue(elem: HTMLInputElement): string {
        return elem.value
    }

}

class TextAreaSerializer extends FieldSerializer<string, HTMLTextAreaElement> {
    
    assignAttrValue(attrs: tags.InputTagAttrs, value?: string) {
        attrs.value = value
    }

    getValue(elem: HTMLTextAreaElement): string {
        return elem.value
    }

}

class CheckboxSerializer extends FieldSerializer<boolean, HTMLInputElement> {
        
    assignAttrValue(attrs: tags.InputTagAttrs, value?: boolean) {
        attrs.checked = value
    }

    getValue(elem: HTMLInputElement): boolean {
        return elem.checked
    }
}