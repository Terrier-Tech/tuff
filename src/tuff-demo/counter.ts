import './styles.scss'
import {DivTag} from '../tuff/tags'
import {Part, ParentTag} from '../tuff/part'
import * as messages from '../tuff/messages'

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
        parent.class('counter')
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
        parent.div('.flex-row', d => {
            d.div('.stretch', d => {
                d.part(this.counter)
            })
            d.div('.shrink', d => {
                d.a('.button', {text: "+"})
                    .emitClick(ChangeKey, {by: 1})
            })
            d.div('.shrink', d => {
                d.a('.button', {text: "-"})
                .emitClick(ChangeKey, {by: -1})
            })
            d.div('.shrink', d => {
                d.a('.button', {text: "Reset"})
                    .emitClick(ResetKey, {})
            })
        })
    }

}

new App('counter').mount('counter')