import {PartPlugin} from "../plugins"
import {Logger} from "../logging"

const log = new Logger("Highlighter")


/**
 * Highlights all elements with the given target class with a border of the given color.
 */
export default class HighlighterPlugin extends PartPlugin<{ targetClass: string, color: string }> {

    async init() {
        log.info(`Initializing HighlighterPlugin plugin`, this.state)
    }


    load() {
        log.info(`Loading HighlighterPlugin plugin`, this.state)
    }


    update(elem: HTMLElement) {
        log.info(`Updating HighlighterPlugin plugin`, this.state, elem)

        elem.querySelectorAll('.' + this.state.targetClass).forEach(target => {
            log.info(`Highlighting element`, target)
            ;(target as HTMLElement).style.border = `1px solid ${this.state.color}`
        })
    }
}