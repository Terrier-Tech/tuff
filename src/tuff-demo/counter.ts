import {DivTag} from '../tuff/tags'
import {Part, ParentTag} from '../tuff/parts'
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
        parent.class(styles.output)
        parent.span({text: `Count: ${this.state.count}`})
    }

}


class App extends Part<{}> {
    counter: Counter

    constructor(id: string) {
        super(null, id, {})
        this.counter = this.makePart(Counter, {count: 0})
    }

    init() {
        this.onClick(ChangeKey, (m) => {
            this.counter.change(m.data)
        })
        this.onClick(ResetKey, _ => {
            this.counter.resetCount()
        })
    }

    render(parent: ParentTag) {
        parent.div(d => {
            d.class(styles.flexRow)
            d.div(styles.flexStretch, d => {
                d.part(this.counter)
            })
            d.div(styles.flexShrink, d => {
                d.a({text: "+"})
                    .class(styles.button)
                    .emitClick(ChangeKey, {by: 1})
            })
            d.div(styles.flexShrink, d => {
                d.a({text: "-"})
                    .class(styles.button)
                    .emitClick(ChangeKey, {by: -1})
            })
            d.div(styles.flexShrink, d => {
                d.a({text: "Reset"})
                    .class(styles.button)
                    .emitClick(ResetKey)
            })
        })
    }

}

new App('counter').mount('counter')