import {Logger} from './logging'
import * as parts from './parts'
import Messages, {KeyModifier, KeyPress, Message} from "./messages"

const log = new Logger('Keyboard')

export type Listener = (m: Message<"keypress", KeyPress>) => void

type RegisteredPart = {
    part: parts.StatelessPart
    listeners: Listener[]
}

// Singleton class that handles the global events and sends them to parts.
class GlobalHandler {

    private parts: {[id: string]: RegisteredPart} = {}

    isApple: boolean

    /**
     * Registers the part's root to receive global keyboard events.
     * @param part A part that wishes to receive global keyboard events
     * @param listener
     */
    addPart(part: parts.StatelessPart, listener?: Listener) {
        const root = part.root
        if (!root.isAttached) {
            log.warn(`Trying to listen for keyboard events on an unattached part`)
            return
        }
        if (!this.parts[root.id]) { // not already registered
            this.parts[root.id] = {
                part: root,
                listeners: []
            }
        }
        if (listener) {
            this.parts[root.id].listeners.push(listener)
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
        log.debug(`Raw event: ${key}`, evt)
        
        // parse the modifiers
        const modifiers = new Array<KeyModifier>()
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

        const press = Messages.keyPress(key, ...modifiers)
        const message = {data: press, event: evt, type: 'keypress'} as const
        for (let [id, reg] of Object.entries(this.parts)) {
            if (reg.part.isAttached) {
                reg.part.emit("keypress", press, evt, press)
                for (const listener of reg.listeners) {
                    listener(message)
                }
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
 * @param listener An optional wildcard listener
 */
export const registerPart = (part: parts.StatelessPart, listener?: Listener) => {
    getGlobalHandler().addPart(part, listener)
}