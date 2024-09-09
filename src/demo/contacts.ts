import {Part, PartTag} from '../parts'
import * as forms from '../forms'
import { FormFields, SelectOptions } from '../forms'
import Messages from '../messages'
import Time from "../time"
import * as styles from './styles.css'
import Strings from '../strings'
import * as demo from './demo'
import {Logger} from '../logging'
import Arrays from "../arrays"

const log = new Logger('Contacts')


const newContactKey = Messages.untypedKey()
const serializeKey = Messages.untypedKey()
const deleteContactKey = Messages.typedKey<{ id: string }>()

const PhoneTypes = ["home", "mobile"]

type PhoneType = typeof PhoneTypes[number]

type PhoneState = {
    number?: string
    type: PhoneType
    extension?: number
}

const newPhoneKey = Messages.untypedKey()

const deletePhoneKey = Messages.typedKey<{id: string}>()


const roles = ['customer', 'vendor'] as const

type Role = typeof roles[number]

const roleOptions: SelectOptions = [
    { value: "", title: "[Pick A Role]" },
    {
        group: "Customer Roles",
        options: [
            { value: 'customer', title: 'Customer' },
        ]
    },
    { value: 'vendor', title: 'Vendor' },
]

const statuses = ['active', 'inactive'] as const

type Status = typeof statuses[number]

type ContactState = {
    id: string
    name: string
    email?: string
    photo?: File
    role?: Role
    status: Status
    isAdmin: boolean
    birthday?: string
    notes?: string
    phones: PhoneState[]
}

class ContactFormPart extends forms.FormPart<ContactState> {

    phoneInputKey = Messages.typedKey<{ id: string }>()
    phoneForms: {[id: string]: FormFields<PhoneState>} = {}
    photoKey = Messages.untypedKey()
    photoSrcs: Array<string> = new Array<string>()

    async init() {
        await super.init()

        this.onInput(this.phoneInputKey, m => {
            log.info(`The value of the input '${m.data.id}' changed to '${m.value}'`)
        })

        this.onClick(newPhoneKey, _ => {
            this.addPhone()
        })

        this.onClick(deletePhoneKey, m => {
            log.info("Deleting phone", m.data)
            delete this.phoneForms[m.data.id]
            this.dirty()
        })

        this.onDataChanged(this.dataChangedKey, m => {
            log.info("Contact form data changed", m)
        })

        this.onChange(this.photoKey, async m => {
            this.photoSrcs.splice(0)

            const fileInput = m.event.target as HTMLInputElement
            const data = await this.serializeFileInput(fileInput)
            const photos = data.getAll('files') as Array<File>

            if (data && photos.length) {
                for (const photo of photos) {
                    // use a new FileReader for each photo
                    const reader = new FileReader()
                    reader.onload = () => {
                        this.photoSrcs.push(reader.result as string)
                        this.dirty()
                    }
                    reader.readAsDataURL(photo)
                }
            }
        })
    }

    addPhone() {
        const newPhone: PhoneState = { type: "home", number: demo.randomPhone() }
        const fields = new FormFields(this, newPhone)
        this.phoneForms[fields.id] = fields
        this.onDataChanged(fields.dataChangedKey, m => {
            log.info("Phone data changed", m)
        })
        log.info("Adding phone", this)
        this.dirty()
    }


    get parentClasses(): Array<string> {
        return ['parent-class']
    }

    render(parent: PartTag) {
        parent.div(styles.contactForm, form => {
            form.div(styles.flexRow, row => {
                this.textInput(row, "name", {placeholder: 'Name'})
                row.a(styles.characterLink, {text: "&times;"})
                    .css({paddingTop: '14px'})
                    .emitClick(deleteContactKey, {id: this.state.id})
            })
            this.emailInput(form, "email", {placeholder: 'E-Mail'})

            form.div(styles.flexColumn, col => {
                col.label(label => {
                    label.span({text: "Photo(s)"})
                })
                this.fileInput(col, "photo", {accept: "image/png, image/jpeg", multiple: true})
                    .emitChange(this.photoKey)

                if (this.photoSrcs.length) {
                    for (const src of this.photoSrcs) {
                        col.img({src: src, width: 200, height: 200})
                    }
                }
            })

            this.select(form, "role", roleOptions)
            
            form.div(styles.flexRow, row => {
                row.div(styles.flexStretch, col => {
                    col.label(label => {
                        this.checkbox(label, "isAdmin")
                        label.span({text: "Is Admin?"})
                    })
                })
            })
            
            form.div(styles.flexRow, row => {
                for (const status of statuses) {
                    row.div(styles.flexStretch, col => {
                        col.label(label => {
                            this.radio(label, "status", status)
                            label.span({text: status})
                        })
                    })
                }
            })

            form.div(row => {
                row.label({text: 'Birthday'})
                this.dateInput(row, "birthday")
            })
            
            // phones
            form.div(styles.flexRow, row => {
                row.div(styles.flexStretch, col => {
                    col.label({text: "Phones"})
                })
                row.div(styles.flexShrink, col => {
                    col.a(styles.characterLink, {text: "+"})
                        .emitClick(newPhoneKey)
                        .emitClick(demo.OutputKey, {output: "New Phone Clicked"})
                })
            })
            for (let [_, phoneFields] of Object.entries(this.phoneForms)) {
                this.renderPhoneFields(form, phoneFields)
            }

            this.textArea(form, "notes", {placeholder: 'Notes', rows: 3})
        })
    }

    renderPhoneFields(parent: PartTag, fields: FormFields<PhoneState>) {
        parent.div(styles.phoneForm, container => {
            container.div(styles.flexRow, row => {
                for (let t of PhoneTypes) {
                    row.div(styles.flexStretch, col => {
                        col.label(label => {
                            fields.radio(label, "type", t)
                            label.span({text: Strings.titleize(t)})
                        })
                    })
                }
                row.div(styles.flexShrink, col => {
                    col.a(styles.characterLink, {text: '-'})
                        .emitClick(deletePhoneKey, {id: fields.id})
                        .emitClick(demo.OutputKey, {output: `Delete Phone ${fields.id} Clicked`})
                })
            })
            container.div(styles.flexRow, row => {
                fields.phoneInput(row, "number", {placeholder: "555-555-5555"})
                    .emitInput(this.phoneInputKey, {id: fields.id})
                fields.numberInput(row, "extension", {placeholder: "ext"})
            })
        })
    }
}

export const AddedContactKey = Messages.untypedKey()

export class ContactsApp extends Part<{}> {

    contacts: ContactState[] = []
    contactCounter = 0

    async appendContact() {
        // Simulate loading time to ensure that async init parts behave properly
        await Time.wait(200)

        this.contactCounter += 1
        this.contacts.push({
            id: demo.newId(),
            name: `Bobby Tables ${this.contactCounter}`,
            role: undefined,
            isAdmin: Math.random() < 0.5,
            status: 'active',
            birthday: '2021-12-01',
            phones: [],
            notes: "Pre-filled notes"
        })
        this.assignCollection('contacts', ContactFormPart, this.contacts)
        this.emitMessage(AddedContactKey, {})
    }

    async init() {
        await this.appendContact()
        this.dirty()

        this.onClick(newContactKey, async _ => {
            log.info("Appending new contact")
            await this.appendContact()
        })

        this.onClick(deleteContactKey, m => {
            const id = m.data.id
            const contact = Arrays.find(this.contacts, c => c.id == id)
            if (contact) {
                log.info(`Delete contact ${id}`, contact)
                this.contacts = Arrays.without(this.contacts, contact)
                this.assignCollection('contacts', ContactFormPart, this.contacts)
            }
            else {
                log.warn(`No contact to delete with id ${id}`)
            }
        })

        this.onClick(serializeKey, async _ => {
            log.info("Serializing Contacts")
            const forms = this.getCollectionParts('contacts') as ContactFormPart[]
            const serialized = await Promise.all(forms.map(f => f.serialize()))
            console.log("Serialized Contact Forms", serialized)
        })
    }

    render(parent: PartTag) {
        this.renderCollection(parent, 'contacts')
            .class(styles.contactsContainer)
        parent.a(styles.button, {text: "+ Add"})
            .emitClick(newContactKey)
        parent.a(styles.button, {text: "To JSON"})
            .emitClick(serializeKey)
    }


}

const container = document.getElementById('contacts')
if (container) {
    Part.mount(ContactsApp, container, {})
}
