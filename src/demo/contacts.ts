import {Part, PartTag} from '../parts'
import * as forms from '../forms'
import * as messages from '../messages'
import * as styles from './styles.css'
import * as strings from '../strings'
import * as demo from './demo'
import {Logger} from '../logging'

const log = new Logger('Contacts')

const PhoneTypes = ["home", "mobile"]

type PhoneType = typeof PhoneTypes[number]

type PhoneState = {
    id: string
    number?: string
    type: PhoneType
}

const newPhoneKey = messages.untypedKey()

const deletePhoneKey = messages.typedKey<{id: string}>()

class PhoneFormPart extends forms.FormPart<PhoneState> {
    
    render(parent: PartTag) {
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
                row.div(styles.flexShrink, col => {
                    col.a(styles.characterLink, {text: '-'})
                       .emitClick(deletePhoneKey, {id: this.state.id})
                       .emitClick(demo.OutputKey, {output: `Delete Phone ${this.state.id} Clicked`})
                })
            })
            this.phoneInput(f, "number", {placeholder: "555-555-5555"})
        })
    }

}


type ContactState = {
    id: string
    name: string
    email?: string
    isAdmin: boolean
    birthday?: string
    notes?: string,
    phones: PhoneState[]
}

class ContactFormPart extends forms.FormPart<ContactState> {

    phoneForms: {[id: string]: PhoneFormPart} = {}

    init() {
        this.onClick(newPhoneKey, _ => {
            this.addPhone()
        })

        this.onClick(deletePhoneKey, m => {
            log.info("Deleting phone", m.data)
            this.removeChild(this.phoneForms[m.data.id])
            delete this.phoneForms[m.data.id]
            this.dirty()
        })

        this.onDataChanged(this.dataChangedKey, m => {
            log.info("Contact form data changed", m)
        })
    }

    addPhone() {
        const part = this.makePart(PhoneFormPart, {
            id: demo.newId(),
            type: "home"
        })
        this.phoneForms[part.state.id] = part
        this.onDataChanged(part.dataChangedKey, m => {
            log.info("Phone data changed", m)
        })
        log.info("Adding phone", this)
        this.dirty()
    }

    render(parent: PartTag) {
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

        parent.div(row => {
            row.label({text: 'Birthday'})
            this.dateInput(row, "birthday")
        })
        
        // phones
        parent.div(styles.flexRow, row => {
            row.div(styles.flexStretch, col => {
                col.label({text: "Phones"})
            })
            row.div(styles.flexShrink, col => {
                col.a(styles.characterLink, {text: "+"})
                    .emitClick(newPhoneKey)
                    .emitClick(demo.OutputKey, {output: "New Phone Clicked"})
            })
        })
        for (let [_, phoneForm] of Object.entries(this.phoneForms)) {
            parent.part(phoneForm)
        }
        
        this.textArea(parent, "notes", {placeholder: 'Notes', rows: 3})
    }
}

export class ContactsApp extends Part<{}> {

    forms = new Array<ContactFormPart>()

    init() {
        this.forms.push(this.makePart(ContactFormPart, {
            id: demo.newId(),
            name: "Bobby Tables", 
            isAdmin: true,
            birthday: '2021-12-01',
            phones: []
        }))
    }

    render(parent: PartTag) {
        parent.class(styles.contactsContainer)
        for (let form of this.forms) {
            parent.part(form)
        }
    }


}

const container = document.getElementById('contacts')
if (container) {
    Part.mount(ContactsApp, container, {})
}