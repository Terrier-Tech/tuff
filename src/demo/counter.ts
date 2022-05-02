import {Part, PartTag} from '../parts'
import * as messages from '../messages'
import * as styles from './styles.css'
import * as demo from './demo'
import * as logging from '../logging'

const log = new logging.Logger('Counter')

type ChangeData = {
    by: number
}

const ResetKey = messages.untypedKey()
const ChangeKey = messages.typedKey<ChangeData>()


type CounterState = {
    count: number
}

class Counter extends Part<CounterState> {

    change(data: ChangeData) {
        this.state.count += data.by
        this.dirty()
    }

    resetCount() {
        this.state.count = 0
        this.dirty()
    }
    
    render(parent: PartTag) {
        parent.class(styles.output)
        parent.span({text: `Count: ${this.state.count}`})
    }

    update(elem: HTMLElement): void {
        log.info("After Render", elem)
    }

}


export class CounterApp extends Part<{}> {

    init() {
        const counter = this.makePart(Counter, {count: 0}, 'counter')

        this.onClick(ChangeKey, (m) => {
            log.info("Change", m.data)
            counter.change(m.data)
        })
        this.onClick(ResetKey, _ => {
            log.info("Reset")
            counter.resetCount()
        })
    }

    render(parent: PartTag) {
        parent.div(d => {
            d.class(styles.flexRow, styles.padded)
            d.div(styles.flexStretch, d => {
                d.part(this.namedChild('counter')!)
            })
            d.div(styles.flexShrink, d => {
                d.a(styles.button, {text: "+"})
                 .emitClick(ChangeKey, {by: 1})
                 .emitClick(demo.OutputKey, {output: "Increment Clicked"})
            })
            d.div(styles.flexShrink, d => {
                d.a(styles.button, {text: "-"})
                 .emitClick(ChangeKey, {by: -1})
                 .emitClick(demo.OutputKey, {output: "Decrement Clicked"})
            })
            d.div(styles.flexShrink, d => {
                d.a(styles.button, {text: "Reset"})
                 .emitClick(ResetKey)
                 .emitClick(demo.OutputKey, {output: "Reset Clicked"})
            })
        })
    }

}

const container = document.getElementById('counter')
if (container) {
    Part.mount(CounterApp, container, {})
}