import {Part, PartParent, PartTag, StatelessPart} from '../parts'
import {Logger} from '../logging'
import { AddedContactKey, ContactsApp } from "./contacts"
import * as styles from './styles.css'
import * as counter from './counter'
import * as contacts from './contacts'
import * as shapes from './shapes'
import * as table from './table'
import * as nav from './nav'
import * as demo from './demo'
import Html from '../html'
import {OutputData} from "./demo"
import HighlighterPlugin from "./highlighter"
import Messages from "../messages"

const log = new Logger("Demo")
log.level = 'debug'

class OutputPart extends Part<demo.OutputData> {

    constructor(parent: PartParent, id: string, state: OutputData) {
        super(parent, id, state)

        this.makePlugin(HighlighterPlugin, {targetClass: styles.output, color: "#0aa"})
    }

    async init() {
        this.onClick(demo.OutputKey, m => {
            this.write(m.data.output)
        }, {attach: "passive"})
    }

    write(t: string) {
        log.debug(`Writing output: ${t}`)
        this.state.output = t
        this.dirty()
    }
    
    render(parent: PartTag) {
        parent.div(styles.output, styles.fixedBottom).text(this.state.output)
    }

}

class App extends Part<{}> {
    output!: OutputPart
    parts: {[name: string]: StatelessPart} = {}

    async init() {
        this.output = this.makePart(OutputPart, {output: ""})
        this.parts['Counter'] = this.makeStatelessPart(counter.CounterApp)
        this.parts['Contacts'] = this.makeStatelessPart(contacts.ContactsApp)
        this.parts['Shapes'] = this.makeStatelessPart(shapes.ShapesApp)
        this.parts['Table'] = this.makePart(table.Table, {})
        this.parts['Nav'] = this.makeStatelessPart(nav.NavApp)

        this.output.write("Initialized!")

        // specific keypress
        this.onKeyPress(Messages.keyPress("z", "control/command"), m => {
            log.info("Undo", m)
        })

        // wildcard keypress
        this.onAnyKeyPress(m => {
            log.info(`Wildcard Keypress: ${m.data.id}`, m)
        })

        // Mark the container as stale so we can modify the "Contacts" header in place
        // The newly added contact form should still re-render despite that one of its ancestors is stale
        this.listenMessage(AddedContactKey, _ => this.stale())

        // test creating an arbitrary element
        const divTag = Html.createElement("div", div => {
            div.class('global').css({padding: '1em'}).text("Hello Global Element")
        })
        document.body.appendChild(divTag)
        divTag.classList.add('extra')
        log.info(`Created div tag`, divTag)
    }

    load() {
        log.info("Loaded app with context", this.context)
    }

    render(parent: PartTag) {
        for (let [name, part] of Object.entries(this.parts)) {
            parent.h2(styles.partPreviewTitle, `#${name}-section`, {text: name})
                .css({textAlign: 'center'}) // test inline styles
            parent.div(styles.partPreview, d => {
                d.part(part)
            })
        }

        parent.part(this.output)
    }

    update(elem: HTMLElement) {
        super.update(elem)

        const contactsHeader = elem.querySelector("#Contacts-section")!
        contactsHeader.textContent = `Contacts (${(this.parts.Contacts as ContactsApp).contactCounter})`
    }
}

Part.mount(App, 'app', {}, {
    capturePath: "/"
})