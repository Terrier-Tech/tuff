import './styles.scss'
import {Div} from '../tuff/tags'
import {Assembly, Part, ParentTag} from '../tuff/part'
import { newMessageKey } from '../tuff/messages'

const range = (start: number, end: number) => Array.from(Array(end - start + 1).keys()).map(x => x + start)

type ButtonState = {
    text: string
}

const ResetKey = newMessageKey()
const IncKey = newMessageKey()
const HelloKey = newMessageKey()

class IncrementButton extends Part<ButtonState> {
    
    render(parent: Div) {
        parent.a(this.state)
            .click(IncKey)
            .data({value: this.state.text})
    }    

}

class Toolbar extends Part<{}> {

    buttons = Array<IncrementButton>()

    init() {
        for (let i of range(0, 10)) {
            this.buttons.push(
                this.createPart(IncrementButton, {text: i.toString()})
            )
        }

        this.onClick(HelloKey, m => {
            console.log("Hello!", m)
            return false
        })
    }
    
    render(parent: Div) {
        parent.class('toolbar')
        parent.div(d => {
            d.a({text: "Hello"})
             .click(HelloKey)
        })
        for (let button of this.buttons) {
            parent.part(button)
        }
    }
}

type CounterState = {
    count: number
}

class Counter extends Part<CounterState> {

    incCount(amount: number) {
        this.state.count += amount
        this.dirty()
    }

    resetCount() {
        this.state.count = 0
        this.dirty()
    }
    
    render(parent: Div) {
        parent.class('counter')
        parent.span({text: `Count: ${this.state.count}`})
    }

}

class App extends Assembly<{}> {
    toolbar: Toolbar
    counter: Counter

    constructor() {
        super({})
        this.toolbar = this.createPart(Toolbar, {})
        this.counter = this.createPart(Counter, {count: 0})
    }

    init() {
        this.onClick(IncKey, m => {
            let value = parseInt(m.element.dataset.value || '0')
            console.log(`increment by ${value}`)
            this.counter.incCount(value)
            this.update()
            return true
        })
        this.onClick(ResetKey, _ => {
            console.log('clicked reset')
            this.counter.resetCount()
            this.update()
            return true
        })
    }

    render(parent: ParentTag) {
        parent.part(this.toolbar)
        parent.div('.flex-row', d => {
            d.div('.stretch', d => {
                d.part(this.counter)
            })
            d.div('.shrink', d => {
                d.a({text: "Reset"})
                    .click(ResetKey)
            })
        })
    }
}

new App().mount('app')