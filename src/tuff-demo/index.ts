import {DivTag, ParentTag} from '../tuff/tags'
import {Part, StatelessPart} from '../tuff/parts'
import * as messages from '../tuff/messages'
import Logger from '../tuff/logger'
import * as styles from './styles.css'
import * as counter from './counter'
import * as contacts from './contacts'

const log = new Logger("Demo")
Logger.level = 'debug'

type OutputData = {
    output: string
}

const OutputKey = messages.typedKey<OutputData>()

class OutputPart extends Part<OutputData> {

    init() {
        this.onClick(OutputKey, m => {
            this.write(m.data.output)
        }, "passive")
    }

    write(t: string) {
        log.debug(`Writing output: ${t}`)
        this.state.output = t
        this.dirty()
    }
    
    render(parent: DivTag) {
        parent.class(styles.output, styles.fixedBottom)
        parent.div({text: this.state.output})
    }

}

class App extends Part<{}> {
    output: OutputPart
    parts: {[name: string]: StatelessPart} = {}

    constructor(id: string) {
        super(null, id, {})
        
        this.output = this.makePart(OutputPart, {output: ""})
    }

    init() {
        this.parts['Counter'] = this.makeStatelessPart(counter.App)
        this.parts['Contacts'] = this.makeStatelessPart(contacts.App)

        this.output.write("Initialized!")
    }

    render(parent: ParentTag) {
        for (let [name, part] of Object.entries(this.parts)) {
            parent.h2(styles.partPreviewTitle, {text: name})
            parent.div(styles.partPreview, d => {
                d.part(part)
            })
        }

        parent.part(this.output)
    }
}

new App('app').mount('app')