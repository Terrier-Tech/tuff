import {Part, PartTag} from "../parts"
import * as styles from "./styles.css"
import * as forms from "../forms"
import './demo.scss'
import Messages from "../messages"

const Themes = ['light', 'dark']
type ThemeOptions = typeof Themes[number]

export class ThemeApp extends Part<{}> {
    async init() {
        this.makePart(ThemeDisplay, { theme: 'light' }, 'theme')
    }
    render(parent: PartTag) {
        parent.part(this.namedChild('theme')!)
    }
}

const ChangeThemeKey = Messages.typedKey<{ theme: ThemeOptions }>()

export class ThemeDisplay extends Part<{ theme: ThemeOptions }> {
    async init() {
        this.assignCollection('text-boxes', ThemeTextBox, [
            { text: "First", theme: this.state.theme },
            { text: "Second", theme: this.state.theme },
            { text: "Third", theme: this.state.theme }
        ])
        this.makePart(ThemeToggleForm, { theme: 'light' }, 'toggle-form')

        this.listenMessage(ChangeThemeKey, m => {
            this.state.theme = m.data.theme

            /**
             * This is really yucky, but is necessary if we want the child parts to render in relation to the parent state.
             */
            const toggleForm = this.namedChild('toggle-form')!
            toggleForm.state = Object.assign(toggleForm.state, { theme: this.state.theme })

            const textBoxes = this.getCollectionParts('text-boxes')
            textBoxes.forEach(textBox => textBox.assignState(Object.assign(textBox.state, { theme: this.state.theme })))

            this.dirty()
        })
    }
    render(parent: PartTag) {
        parent.div(styles.flexRow, styles.padded, row => {
            this.renderCollection(row, 'text-boxes')
                .class('tt-flex')
            row.part(this.namedChild('toggle-form')!)
        }).css({ backgroundColor: this.state.theme == "light" ? "white" : "darkgray", borderRadius: "5px" })
    }
}

export class ThemeTextBox extends Part<{ text: string, theme: ThemeOptions }> {
    async init() {
        this.makePart(ThemeText, { text: this.state.text, theme: this.state.theme }, 'text')
    }

    assignState(state: { text: string, theme: ThemeOptions }) {
        this.namedChild('text')!.state = state
        return super.assignState(state)
    }
    render(parent: PartTag) {
        parent.div(box => {
            box.part(this.namedChild('text')!)
        }).css({ backgroundColor: this.state.theme == "light" ? "#ececec" : "gray", padding: "10px", borderRadius: "5px" })
    }
}

export class ThemeText extends Part<{ text: string, theme: ThemeOptions }> {
    render(parent: PartTag) {
        parent.div().text(this.state.text).css({color: this.state.theme == 'light' ? 'black' : 'white' })
    }
}

export class ThemeToggleForm extends forms.FormPart<{ theme: ThemeOptions }> {
    async init() {
        await super.init()
        this.onChange(this.formFields.changeKeyForField('theme'), m => {
            console.log("Theme changed", m.data)
            this.emitMessage(ChangeThemeKey, { theme: m.data.value })
        })
    }

    render(parent: PartTag) {
        parent.div(styles.flexColumn, col => {
            Themes.forEach(themeOpt => {
                col.label(label => {
                    this.radio(label, "theme", themeOpt)
                    label.span({text: themeOpt.toUpperCase()}).css({ color: this.state.theme == 'light' ? "black" : "white" })
                })
            })
        }).css({ backgroundColor: this.state.theme == "light" ? "#ececec" : "gray", padding: "10px", borderRadius: "5px" })
    }
}