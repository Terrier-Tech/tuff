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
    
    get parentClasses(): Array<string> {
        return [styles.phoneForm]
    }

    render(parent: PartTag) {
        parent.div(styles.flexRow, row => {
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
        this.phoneInput(parent, "number", {placeholder: "555-555-5555"})
    }

}

const roles = ['customer', 'vendor'] as const

type Role = typeof roles[number]

const roleOptions = [
    {
        value: 'customer',
        title: 'Customer'
    },
    {
        value: 'vendor',
        title: 'Vendor'
    }
]

const statuses = ['active', 'inactive'] as const

type Status = typeof statuses[number]

type ContactState = {
    id: string
    name: string
    email?: string
    photo?: File
    role: Role
    status: Status
    isAdmin: boolean
    birthday?: string
    notes?: string
    phones: PhoneState[]
}

class ContactFormPart extends forms.FormPart<ContactState> {

    phoneForms: {[id: string]: PhoneFormPart} = {}
    photoKey = messages.untypedKey()
    photoSrcs: Array<string> = new Array<string>()

    async init() {
        await super.init()

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

        this.onChange(this.photoKey, async m => {
            this.photoSrcs.splice(0)

            const fileInput = m.event.target as HTMLInputElement
            let data = await this.serializeFileInput(fileInput)
            let photos = data.getAll(fileInput.name) as Array<File>

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
        parent.div(styles.contactForm, form => {
            this.textInput(form, "name", {placeholder: 'Name'})
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
            for (let [_, phoneForm] of Object.entries(this.phoneForms)) {
                form.part(phoneForm)
            }

            this.textArea(form, "notes", {placeholder: 'Notes', rows: 3})
        })
    }
}

export class ContactsApp extends Part<{}> {

    forms = new Array<ContactFormPart>()

    async init() {
        this.forms.push(this.makePart(ContactFormPart, {
            id: demo.newId(),
            name: "Bobby Tables", 
            role: 'vendor',
            isAdmin: true,
            status: 'active',
            birthday: '2021-12-01',
            phones: []
        }))
    }

    render(parent: PartTag) {
        parent.div(styles.contactsContainer, container => {
            for (let form of this.forms) {
                container.part(form)
            }
        })
    }


}

const container = document.getElementById('contacts')
if (container) {
    Part.mount(ContactsApp, container, {})
}
