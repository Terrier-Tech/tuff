import {Part, PartTag, StatelessPart} from '../parts'
import {Logger} from '../logging'
import * as styles from './styles.css'
import * as boids from './boids'
import * as counter from './counter'
import * as contacts from './contacts'
import * as shapes from './shapes'
import * as demo from './demo'
import * as messages from '../messages'

const log = new Logger("Demo")
Logger.level = 'debug'

class OutputPart extends Part<demo.OutputData> {

    init() {
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
        parent.class(styles.output, styles.fixedBottom)
        parent.div({text: this.state.output})
    }

}

class App extends Part<{}> {
    output!: OutputPart
    parts: {[name: string]: StatelessPart} = {}

    init() {
        this.output = this.makePart(OutputPart, {output: ""})
        this.parts['Boids'] = this.makeStatelessPart(boids.App)
        this.parts['Counter'] = this.makeStatelessPart(counter.App)
        this.parts['Contacts'] = this.makeStatelessPart(contacts.App)
        this.parts['Shapes'] = this.makeStatelessPart(shapes.App)

        this.output.write("Initialized!")

        this.onKeyPress(messages.keyPress("z", "control/command"), m => {
            log.debug("Key press message", m)
        })
    }

    render(parent: PartTag) {
        for (let [name, part] of Object.entries(this.parts)) {
            parent.h2(styles.partPreviewTitle, {text: name})
                .css({textAlign: 'center'}) // test inline styles
            parent.div(styles.partPreview, d => {
                d.part(part)
            })
        }

        parent.part(this.output)
    }
}

Part.mount(App, 'app', {})