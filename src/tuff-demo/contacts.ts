import {DivTag, ParentTag} from '../tuff/tags'
import {Part} from '../tuff/parts'
import * as forms from '../tuff/forms'
import * as messages from '../tuff/messages'
import * as styles from './styles.css'


type ContactState = {
    name: string
    isAdmin: boolean
    birthday?: string
    notes?: string
}

class ContactFormPart extends forms.FormPart<ContactState> {

    init() {
    }

    render(parent: DivTag) {
        parent.class(styles.contactForm, styles.insetShadow)
        this.textInput(parent, "name", {placeholder: 'Name'})
        parent.div(styles.flexRow, row => {
            row.div(styles.flexStretch, col => {
                col.label(label => {
                    this.checkbox(label, "isAdmin")
                    label.span({text: "Is Admin?"})
                })
            })
        })
        parent.div(styles.flexRow, row => {
            row.div(styles.flexStretch, col => {
                col.label({text: 'Birthday'})
                this.dateInput(col, "birthday")
            })
            // row.div(styles.flexStretch, col => {
            //     col.label({text: 'Stop Date'})
            //     this.dateInput(col, "stopDate")
            // })
        })
        this.textArea(parent, "notes", {placeholder: 'Notes', rows: 3})
    }
}

export class App extends Part<{}> {

    forms = new Array<ContactFormPart>()

    init() {
        this.forms.push(this.makePart(ContactFormPart, {name: "Bobby Tables", 
            isAdmin: true,
            birthday: '2021-12-01'
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