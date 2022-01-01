import {DivTag} from '../tuff/tags'
import {Part} from '../tuff/parts'
import * as forms from '../tuff/forms'
import * as messages from '../tuff/messages'
import * as styles from './styles.css'
import * as strings from '../tuff/strings'


const PhoneTypes = ["home", "mobile"]

type PhoneType = typeof PhoneTypes[number]

type PhoneState = {
    number?: string
    type: PhoneType
}

class PhoneFormPart extends forms.FormPart<PhoneState> {
    
    render(parent: DivTag) {
        parent.div(styles.phoneForm, f => {
            f.div(styles.flexRow, row => {
                for (let t of PhoneTypes) {
                    row.div(styles.flexStretch, col => {
                        col.label(label => {
                            this.radio(label, "type", t)
                            label.span({text: strings.titleize(t)})
                        })
                    })
                }
            })
            this.phoneInput(f, "number", {placeholder: "555-555-5555"})
        })
    }

}


type ContactState = {
    name: string
    email?: string
    isAdmin: boolean
    birthday?: string
    notes?: string,
    phones: PhoneState[]
}

const newPhoneKey = messages.untypedKey()

class ContactFormPart extends forms.FormPart<ContactState> {

    phoneForms = new Array<PhoneFormPart>()

    init() {
        this.onClick(newPhoneKey, _ => {
            this.phoneForms.push(this.makePart(PhoneFormPart, {
                type: "home"
            }))
            this.dirty()
        })
    }

    render(parent: DivTag) {
        parent.class(styles.contactForm)
        this.textInput(parent, "name", {placeholder: 'Name'})
        this.emailInput(parent, "email", {placeholder: 'E-Mail'})
        parent.div(styles.flexRow, row => {
            row.div(styles.flexStretch, col => {
                col.label(label => {
                    this.checkbox(label, "isAdmin")
                    label.span({text: "Is Admin?"})
                })
            })
        })
        parent.label({text: 'Birthday'})
        this.dateInput(parent, "birthday")
        
        // phones
        parent.div(styles.flexRow, row => {
            row.div(styles.flexStretch, col => {
                col.label({text: "Phones"})
            })
            row.div(styles.flexShrink, col => {
                col.a(styles.characterLink, {text: "+"})
                    .emitClick(newPhoneKey)
            })
        })
        for (let phoneForm of this.phoneForms) {
            parent.part(phoneForm)
        }
        
        this.textArea(parent, "notes", {placeholder: 'Notes', rows: 3})
    }
}

export class App extends Part<{}> {

    forms = new Array<ContactFormPart>()

    init() {
        this.forms.push(this.makePart(ContactFormPart, {
            name: "Bobby Tables", 
            isAdmin: true,
            birthday: '2021-12-01',
            phones: []
        }))
    }

    render(parent: DivTag) {
        parent.class(styles.contactsContainer)
        for (let form of this.forms) {
            parent.part(form)
        }
    }


}

const container = document.getElementById('contacts')
if (container) {
    new App(null, 'contacts', {}).mount(container)
}