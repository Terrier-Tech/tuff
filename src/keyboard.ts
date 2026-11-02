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
     * Registers the given part to receive global keyboard events
     * @param part A part that wishes to receive global keyboard events
     * @param listener
     */
    addPart(part: parts.StatelessPart, listener?: Listener) {
        if (!this.parts[part.id]) { // not already registered
            this.parts[part.id] = { part, listeners: [] }
        }
        if (listener) {
            this.parts[part.id].listeners.push(listener)
        }
    }

    /**
     * Removes a part that was previously receiving global keyboard events.
     * If the given part was not receiving events, does nothing.
     * @param part
     */
    removePart(part: parts.StatelessPart) {
        delete this.parts[part.id]
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
        for (let { part, listeners } of Object.values(this.parts)) {
            if (!part.isAttached) continue

            part.emit("keypress", press, evt, press)
            for (const listener of listeners) {
                listener(message)
            }
        }
    }

}

let _globalHandler: GlobalHandler | null = null

// Singleton method for obtaining the global handler.
const getGlobalHandler = () => {
    if (!_globalHandler) {
        _globalHandler = new GlobalHandler()
    }
    return _globalHandler
}

/**
 * Registers the given part to receive global keyboard events.
 * @param part A part that wishes to receive global keyboard events
 * @param listener An optional wildcard listener
 */
export function registerPart(part: parts.StatelessPart, listener?: Listener) {
    getGlobalHandler().addPart(part, listener)
}

/**
 * Removes the given part from receiving global keyboard events.
 * @param part
 */
export function deregisterPart(part: parts.StatelessPart) {
    getGlobalHandler().removePart(part)
}