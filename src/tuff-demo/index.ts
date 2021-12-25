import './styles.scss'
import {DivTag} from '../tuff/tags'
import {Part, ParentTag} from '../tuff/parts'
import * as messages from '../tuff/messages'
import Logger from '../tuff/logger'

const log = new Logger("Demo")
Logger.level = 'info'

const range = (start: number, end: number) => Array.from(Array(end - start + 1).keys()).map(x => x + start)

type OutputData = {
    output: string
}

type IncData = {
    value: number
}

const ResetKey = messages.untypedKey()
const IncKey = messages.typedKey<IncData>()
const HelloKey = messages.untypedKey()
const OutputKey = messages.typedKey<OutputData>()
const HoverKey = messages.untypedKey()

class IncrementButton extends Part<IncData> {
    
    render(parent: DivTag) {
        parent.a('.button', {text: this.state.value.toString()})
            .emitClick(IncKey, this.state)
            .emitClick(OutputKey, {output: `Increment ${this.state.value} Clicked`})
            .emitMouseOver(HoverKey)
    }    

}

class Toolbar extends Part<{}> {

    buttons = Array<IncrementButton>()

    init() {
        for (let i of range(0, 10)) {
            this.buttons.push(
                this.makePart(IncrementButton, {value: i})
            )
        }

        this.onClick(HelloKey, m => {
            log.info("Hello!", m)
            return false
        })
    }
    
    render(parent: DivTag) {
        parent.class('toolbar')
        parent.div(d => {
            d.a('.button', {text: "Hello"})
             .emitClick(HelloKey, {})
             .emitClick(OutputKey, {output: "Hello Clicked"})
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
    
    render(parent: DivTag) {
        parent.class('counter')
        parent.span({text: `Count: ${this.state.count}`})
    }

}

class Output extends Part<OutputData> {

    init() {
        this.onClick(OutputKey, m => {
            this.write(m.data.output)
        }, "passive")
    }

    write(t: string) {
        log.info(`Writing output: ${t}`)
        this.state.output = t
        this.dirty()
    }
    
    render(parent: DivTag) {
        parent.class('output')
        parent.div({text: this.state.output})
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
        this.output = this.makePart(Output, {output: ""})
    }

    init() {
        this.onClick(IncKey, m => {
            let value = m.data.value
            log.info(`Increment by ${value}`)
            this.counter.incCount(value)
        })

        this.onClick(ResetKey, _ => {
            log.info('Clicked reset')
            this.counter.resetCount()
        })

        this.onMouseOver(HoverKey, evt => {
            log.info("Hover", evt.element)
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
                d.a('.button', {text: "Reset"})
                    .emitClick(ResetKey, {})
                    .emitClick(OutputKey, {output: `Increment Reset Clicked`})
            })
        })
        parent.part(this.output)
    }
}

new App('app').mount('app')