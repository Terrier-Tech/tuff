import {DivTag, ParentTag} from '../tuff/tags'
import {Part} from '../tuff/parts'
import * as messages from '../tuff/messages'
import * as styles from './styles.css'

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
    
    render(parent: DivTag) {
        parent.class(styles.output, styles.insetShadow)
        parent.span({text: `Count: ${this.state.count}`})
    }

}


export class App extends Part<{}> {
    counter!: Counter

    init() {
        this.counter = this.makePart(Counter, {count: 0})

        this.onClick(ChangeKey, (m) => {
            this.counter.change(m.data)
        })
        this.onClick(ResetKey, _ => {
            this.counter.resetCount()
        })
    }

    render(parent: ParentTag) {
        parent.div(d => {
            d.class(styles.flexRow, styles.padded)
            d.div(styles.flexStretch, d => {
                d.part(this.counter)
            })
            d.div(styles.flexShrink, d => {
                d.a(styles.button, {text: "+"})
                 .emitClick(ChangeKey, {by: 1})
            })
            d.div(styles.flexShrink, d => {
                d.a(styles.button, {text: "-"})
                 .emitClick(ChangeKey, {by: -1})
            })
            d.div(styles.flexShrink, d => {
                d.a(styles.button, {text: "Reset"})
                 .emitClick(ResetKey)
            })
        })
    }

}

const container = document.getElementById('counter')
if (container) {
    new App(null, 'counter', {}).mount(container)
}