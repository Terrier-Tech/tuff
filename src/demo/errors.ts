import { Part, PartTag } from "../parts"
import * as styles from './styles.css'

/**
 * This part throws an error during init()
 */
class InitErrorPart extends Part<{}> {

    async init() {
        throw "This error was thrown during init(). This part's render() method will never get called."
    }

    render(parent: PartTag) {
        parent.p().text("Exceptions thrown during <code>init()</code> are caught and displayed instead of rendering, so this will never appear.")
    }

}

/**
 * This part throws an error during render()
 */
class RenderErrorPart extends Part<{}> {
    render(parent: PartTag) {
        parent.p().text("Exceptions thrown during <code>render()</code> are caught and displayed but any content rendered before the error (like this) will still be displayed.")
        throw "This error was thrown during render()"
    }
}

/**
 * This part throws an error during update()
 */
class UpdateErrorPart extends Part<{}> {
    render(parent: PartTag) {
        parent.p().text("Exceptions thrown during <code>update()</code> silently handled.")
    }

    update(_: HTMLElement) {
        throw "This error was thrown during update()"
    }
}


/**
 * Showcase the different ways errors can be handled in tuff.
 */
export class ErrorsPart extends Part<{}> {

    initPart!: RenderErrorPart
    renderPart!: RenderErrorPart
    updatePart!: UpdateErrorPart

    async init() {
        this.initPart = this.makePart(InitErrorPart, {})
        this.renderPart = this.makePart(RenderErrorPart, {})
        this.updatePart = this.makePart(UpdateErrorPart, {})
    }

    render(parent: PartTag) {
        parent.div(styles.flexRow, styles.padded, row => {
            row.div(styles.flexStretch, col => {
                col.h3({text: "init()"})
                col.part(this.initPart)
            })
            row.div(styles.flexStretch, col => {
                col.h3({text: "render()"})
                col.part(this.renderPart)
            })
            row.div(styles.flexStretch, col => {
                col.h3({text: "update()"})
                col.part(this.updatePart)
            })
        })
    }


}