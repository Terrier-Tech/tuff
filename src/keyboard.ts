import * as messages from './messages'
import {Logger} from './logging'
import * as parts from './parts'

const log = new Logger('Keyboard')

// Singleton class that handles the global events and sends them to parts.
class GlobalHandler {

    private parts: {[id: string]: parts.StatelessPart} = {}

    isApple: boolean

    /**
     * Registers the part's root to receive global keyboard events.
     * @param part A part that wishes to receive global keyboard events
     */
    addPart(part: parts.StatelessPart) {
        const root = part.root
        if (!this.parts[root.id] && root.isAttached) {
            this.parts[root.id] = root
        }
    }

    constructor() {
        const handler = this
        log.debug("Attaching global keydown listener to the document")
        document.addEventListener("keydown", function(this: Document, evt: KeyboardEvent) {
            handler.emit(evt)
        })

        // compute whether the user agent is Apple-like
        // and should have command/control switched
        const ua = navigator.userAgent // navigator.userAgentData isn't widely supported yet
        this.isApple = ua.includes('Macintosh') // TODO: improve this
    }

    emit(evt: KeyboardEvent) {
        const key = evt.key.toLowerCase()
        
        // parse the modifiers
        const modifiers = new Array<messages.KeyModifier>()
        if (this.isApple) {
            if (evt.metaKey) {
                modifiers.push("control/command")
            }
        }
        else { // not Apple
            if (evt.ctrlKey) {
                modifiers.push("control/command")
            }
        }
        if (evt.altKey) {
            modifiers.push("alt/option")
        }
        if (evt.shiftKey) {
            modifiers.push("shift")
        }

        const press = messages.keyPress(key, ...modifiers)
        for (let [id, part] of Object.entries(this.parts)) {
            if (part.isAttached) {
                part.emit("keypress", press, evt, press)
            }
            else {
                delete this.parts[id]
            }
        }
    }

}

let _gloablHandler: GlobalHandler | null = null

// Singleton method for obtaining the global handler.
const getGlobalHandler = () => {
    if (!_gloablHandler) {
        _gloablHandler = new GlobalHandler()
    }
    return _gloablHandler
}

/**
 * Registers the part's root to receive global keyboard events.
 * @param part A part that wishes to receive global keyboard events
 */
export const registerPart = (part: parts.StatelessPart) => {
    getGlobalHandler().addPart(part)
}