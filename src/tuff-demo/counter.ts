import './styles.scss'
import {DivTag} from '../tuff/tags'
import {Part, ParentTag} from '../tuff/part'
import { makeKey } from '../tuff/messages'


const ResetKey = makeKey()
const IncKey = makeKey()
const DecKey = makeKey()


type CounterState = {
    count: number
}

class Counter extends Part<CounterState> {

    increment() {
        this.state.count += 1
        this.dirty()
    }

    decrement() {
        this.state.count -= 1
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
        this.onClick(IncKey, _ => {
            this.counter.increment()
        })
        this.onClick(DecKey, _ => {
            this.counter.decrement()
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
                    .emitClick(IncKey)
            })
            d.div('.shrink', d => {
                d.a('.button', {text: "-"})
                    .emitClick(DecKey)
            })
            d.div('.shrink', d => {
                d.a('.button', {text: "Reset"})
                    .emitClick(ResetKey)
            })
        })
    }

}

new App('counter').mount('counter')