import {Part, PartTag} from '../parts'
import * as styles from './styles.css'
import * as demo from './demo'
import * as logging from '../logging'
import HighlighterPlugin from "./highlighter"
import Messages from "../messages"

const log = new logging.Logger('Counter')

type ChangeData = {
    by: number
}

const ResetKey = Messages.untypedKey()
const ChangeKey = Messages.typedKey<ChangeData>()


type CounterState = {
    count: number
}

class Counter extends Part<CounterState> {

    async init() {
        this.makePlugin(HighlighterPlugin, {targetClass: styles.output, color: "#0aa", thickness: "2px"})
    }

    change(data: ChangeData) {
        this.state.count += data.by
        this.dirty()
    }

    resetCount() {
        this.state.count = 0
        this.dirty()
    }
    
    render(parent: PartTag) {
        parent.div(styles.output, output => {
            output.span({text: `Count: ${this.state.count}`})
        })
    }

    update(elem: HTMLElement): void {
        log.info("After Render", elem)
    }

}


export class CounterApp extends Part<{}> {

    async init() {
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

    get parentClasses(): Array<string> {
        return [styles.flexRow, styles.padded]
    }

    render(parent: PartTag) {
        parent.div(styles.flexStretch, d => {
            d.part(this.namedChild('counter')!)
        })
        parent.div(styles.flexShrink, d => {
            d.a(styles.button, {text: "+"})
                .emitClick(ChangeKey, {by: 1})
                .emitClick(demo.OutputKey, {output: "Increment Clicked"})
        })
        parent.div(styles.flexShrink, d => {
            d.a(styles.button, {text: "-"})
                .emitClick(ChangeKey, {by: -1})
                .emitClick(demo.OutputKey, {output: "Decrement Clicked"})
        })
        parent.div(styles.flexShrink, d => {
            d.a(styles.button, {text: "Reset"})
                .emitClick(ResetKey)
                .emitClick(demo.OutputKey, {output: "Reset Clicked"})
        })
    }

}

const container = document.getElementById('counter')
if (container) {
    Part.mount(CounterApp, container, {})
}