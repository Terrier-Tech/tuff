import {Part, PartTag} from "../parts"
import * as styles from "./styles.css"
import * as forms from "../forms"
import './demo.scss'
import Messages from "../messages"
import {createScope} from "../scope"

const Themes = ['light', 'dark']
type ThemeOptions = typeof Themes[number]

type ThemeScopeType = { style: ThemeOptions }
const ThemeScope = createScope<ThemeScopeType>()

export class ScopedThemeApp extends Part<{}> {
    async init() {
        // Initialize the scope with a default value
        this.initScope(ThemeScope, { style: 'light' })
        this.makePart(ScopedThemeDisplay, { theme: 'light' }, 'theme')

        this.listenMessage(ChangeThemeKey, m => {
            this.assignScope(ThemeScope, { style: m.data.style })
            // alternative syntax for assigning individual key:
            // this.assignScopeKey(ThemeScope, 'style', m.data.style)
        })
    }

    render(parent: PartTag) {
        parent.part(this.namedChild('theme')!)
        // The following text should not update because useScope() was not called for this part
        parent.div().text(this.getScopeValue(ThemeScope, 'style') == 'light' ? "Light (this should not change)" : "Dark")
            .css({ padding: "10px" })
    }
}

const ChangeThemeKey = Messages.typedKey<{ style: ThemeOptions }>()

class ScopedThemeDisplay extends Part<{ theme: ThemeOptions }> {
    async init() {
        // Call useScope() to re-render this part (and its children) whenever the specified scope changes
        this.useScope(ThemeScope)

        this.assignCollection('text-boxes', ScopedThemeTextBox, [
            { text: "First" },
            { text: "Second" },
            { text: "Third" }
        ])

        this.makePart(ScopedThemeToggleForm, { theme: this.state.theme }, 'toggle-form')
    }

    render(parent: PartTag) {
        parent.div(styles.flexRow, styles.padded, row => {
            this.renderCollection(row, 'text-boxes')
                .class('tt-flex')
            row.part(this.namedChild('toggle-form')!)
        }).css({ backgroundColor: this.getScopeValue(ThemeScope, 'style') == "light" ? "white" : "darkgray", borderRadius: "5px" })
    }
}

class ScopedThemeTextBox extends Part<{ text: string }> {
    async init() {
        this.makePart(ThemeText, { text: this.state.text }, 'text')
    }
    render(parent: PartTag) {
        parent.div(box => {
            box.part(this.namedChild('text')!)
        }).css({ backgroundColor: this.getScopeValue(ThemeScope, 'style') == "light" ? "#ececec" : "gray", padding: "10px", borderRadius: "5px" })
    }
}

class ThemeText extends Part<{ text: string }> {
    render(parent: PartTag) {
        parent.div().text(this.state.text).css({color: this.getScopeValue(ThemeScope, 'style') == 'light' ? 'black' : 'white' })
    }
}

class ScopedThemeToggleForm extends forms.FormPart<{ theme: ThemeOptions }> {
    async init() {
        await super.init()
        this.onChange(this.formFields.changeKeyForField('theme'), m => {
            this.emitMessage(ChangeThemeKey, { style: m.data.value })
        })
    }

    render(parent: PartTag) {
        const themeStyle = this.getScopeValue(ThemeScope, 'style')
        parent.div(styles.flexColumn, col => {
            Themes.forEach(themeOpt => {
                col.label(label => {
                    this.radio(label, "theme", themeOpt)
                    label.span({text: themeOpt.toUpperCase()}).css({ color: themeStyle == 'light' ? "black" : "white" })
                })
            })
        }).css({ backgroundColor: themeStyle == "light" ? "#ececec" : "gray", padding: "10px", borderRadius: "5px" })
    }
}