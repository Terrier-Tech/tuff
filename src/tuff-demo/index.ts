import {DivTag, ParentTag} from '../tuff/tags'
import {Part} from '../tuff/parts'
import * as messages from '../tuff/messages'
import Logger from '../tuff/logger'
import * as styles from './styles.css'
import * as forms from '../tuff/forms'

const log = new Logger("Demo")
Logger.level = 'debug'

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

class IncrementButtonPart extends Part<IncData> {
    
    render(parent: DivTag) {
        parent.class(styles.flexStretch)
        parent.a({text: this.state.value.toString()})
            .class(styles.button)
            .emitClick(IncKey, this.state)
            .emitClick(OutputKey, {output: `Increment ${this.state.value} Clicked`})
            .emitMouseOver(HoverKey)
    }    

}

class ToolbarPart extends Part<{}> {

    buttons = Array<IncrementButtonPart>()

    init() {
        for (let i of range(0, 10)) {
            this.buttons.push(
                this.makePart(IncrementButtonPart, {value: i})
            )
        }

        this.onClick(HelloKey, m => {
            log.info("Hello!", m)
            return false
        })
    }
    
    render(parent: DivTag) {
        parent.class(styles.flexRow, styles.padded)
        parent.div(d => {
            d.a({text: "Hello"})
             .class(styles.button)
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

class CounterPart extends Part<CounterState> {

    incCount(amount: number) {
        this.state.count += amount
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

type UserState = {
    name: string
    isAdmin: boolean
    startDate?: string
    stopDate?: string
    notes?: string
}

class UserFormPart extends forms.FormPart<UserState> {

    init() {
        super.init()
    }

    render(parent: DivTag) {
        this.formTag(parent, f => {
            this.textInput(f, "name", {placeholder: 'Name'})
            f.div(styles.flexRow, row => {
                row.div(styles.flexStretch, col => {
                    col.label(label => {
                        this.checkbox(label, "isAdmin")
                        label.span({text: "Is Admin?"})
                    })
                })
            })
            f.div(styles.flexRow, row => {
                row.div(styles.flexStretch, col => {
                    col.label({text: 'Start Date'})
                    this.dateInput(col, "startDate")
                })
                row.div(styles.flexStretch, col => {
                    col.label({text: 'Stop Date'})
                    this.dateInput(col, "stopDate")
                })
            })
            this.textArea(f, "notes", {placeholder: 'Notes', rows: 3})
        })
    }
}

class OutputPart extends Part<OutputData> {

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
        parent.class(styles.output, styles.fixedBottom)
        parent.div({text: this.state.output})
    }

}

class App extends Part<{}> {
    toolbar: ToolbarPart
    counter: CounterPart
    output: OutputPart
    form: UserFormPart

    constructor(id: string) {
        super(null, id, {})
        this.toolbar = this.makePart(ToolbarPart, {})
        this.counter = this.makePart(CounterPart, {count: 0})
        this.output = this.makePart(OutputPart, {output: ""})
        this.form = this.makePart(UserFormPart, {name: "Bobby Tables", 
            isAdmin: true,
            startDate: '2021-12-01'
        })
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
        parent.div(styles.flexRow, styles.padded, d => {
            d.div(styles.flexStretch, d => {
                d.part(this.counter)
            })
            d.div(styles.flexShrink, d => {
                d.a(styles.button, {text: "Reset"})
                    .emitClick(ResetKey)
                    .emitClick(OutputKey, {output: `Increment Reset Clicked`})
            })
        })

        parent.part(this.form)

        parent.part(this.output)
    }
}

new App('app').mount('app')