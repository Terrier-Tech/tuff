import './styles.scss'
import {Div} from '../tuff/tags'
import {Part, ParentTag} from '../tuff/part'
import { makeKey } from '../tuff/messages'

const range = (start: number, end: number) => Array.from(Array(end - start + 1).keys()).map(x => x + start)

type ButtonState = {
    text: string
}

const ResetKey = makeKey()
const IncKey = makeKey()
const HelloKey = makeKey()
const OutputKey = makeKey()

class IncrementButton extends Part<ButtonState> {
    
    render(parent: Div) {
        parent.a(this.state)
            .click(IncKey)
            .data({value: this.state.text})
            .click(OutputKey)
            .data({output: `Increment ${this.state.text} Clicked`})
    }    

}

class Toolbar extends Part<{}> {

    buttons = Array<IncrementButton>()

    init() {
        for (let i of range(0, 10)) {
            this.buttons.push(
                this.makePart(IncrementButton, {text: i.toString()})
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
             .click(OutputKey)
             .data({output: "Hello Clicked"})
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

type OutputState = {
    text: string
}

class Output extends Part<OutputState> {

    init() {
        this.onClick(OutputKey, m => {
            this.write(m.element.dataset?.output || "")
            return false
        }, true)
    }

    write(t: string) {
        console.log(`writing output: ${t}`)
        this.state.text = t
        this.dirty()
    }
    
    render(parent: Div) {
        parent.class('output')
        parent.div({text: this.state.text})
    }

}

class App extends Part<{}> {
    toolbar: Toolbar
    counter: Counter
    output: Output

    constructor(id: string) {
        super(null, id, {})
        this.toolbar = this.makePart(Toolbar, {})
        this.counter = this.makePart(Counter, {count: 0})
        this.output = this.makePart(Output, {text: ""})
    }

    init() {
        this.onClick(IncKey, m => {
            let value = parseInt(m.element.dataset.value || '0')
            console.log(`increment by ${value}`)
            this.counter.incCount(value)
            return true
        })
        this.onClick(ResetKey, _ => {
            console.log('clicked reset')
            this.counter.resetCount()
            return true
        })

        this.output.write("Initialized!")
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
                    .click(OutputKey)
                    .data({output: `Increment Reset Clicked`})
            })
        })
        parent.part(this.output)
    }
}

new App('app').mount('app')