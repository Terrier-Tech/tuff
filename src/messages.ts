import * as forms from './forms'
import { Part } from './parts'

/**
 * "Event" object that gets passed along to generic part-related handlers.
 */
export type PartEvent = {
    part: Part<any>
}

/**
 * Maps event keys that are used internally for tuff.
 */
interface InternalEventMap {
    "message": PartEvent // generic message associated with a part
}

/**
 * Maps event type strings to DOM event types
 */ 
export interface EventMap extends HTMLElementEventMap, forms.EventMap, InternalEventMap {

}

export const ValueEventNames = ['change', 'input'] as const
export type ValueEvents = typeof ValueEventNames[number]

/**
 * The actual payload that gets delivered when a DOM message is handled
 */ 
export type Message<EventType extends keyof EventMap, DataType> = {
    type: EventType
    event: EventMap[EventType]
    data: DataType
}

/**
 * Message payload with a value
 */
export type ValueMessage<EventType extends ValueEvents, DataType> = Message<EventType, DataType> & { value: string }

/**
 * Conditionally determines the appropriate message type based on the event type
 */
export type EventMessageTypeMap<EventType extends keyof EventMap, DataType> =
    { [k in EventType]: Message<EventType, DataType> } &
    { [k in ValueEvents]: ValueMessage<k, DataType> }

/**
 * Stores a handler for a specific event type and key
 */ 
export type Handler<EventType extends keyof EventMap, DataType> = {
    type: EventType
    key: TypedKey<DataType>
    options?: ListenOptions
    callback: (m: EventMessageTypeMap<EventType, DataType>[EventType]) => void
}

/** 
 * Associates handlers with their event types and keys
 */
export class HandlerMap {
    private _map = new Map<string,Handler<any,any>[]>()

    private computeKey<EventType extends keyof EventMap>(type: EventType, key: Key): string {
        return `${type}__${key.id}`
    }

    add<EventType extends keyof EventMap, DataType>(
        handler: Handler<EventType, DataType>) 
    {
        const k = this.computeKey(handler.type, handler.key)
        let handlers = this._map.get(k)
        if (!handlers) {
            handlers = new Array<Handler<any,any>>()
            this._map.set(k, handlers)
        }
        handlers.push(handler)
    }

    each<EventType extends keyof EventMap, DataType>(
        type: EventType,
        key: TypedKey<DataType>, 
        fun: (m: Handler<EventType, DataType>) => any)
    {
        const k = this.computeKey(type, key)
        let handlers = this._map.get(k)
        if (handlers) {
            handlers.forEach(fun)
        }
    }

    allTypes<EventType extends keyof EventMap>(): EventType[] {
        const typeSet = new Set<EventType>()
        for (let [_, handlers] of this._map) {
            for (let handler of handlers) {
                typeSet.add(handler.type)
            }
        }
        return Array.from(typeSet.values())
    }

}


/** 
 * Whether or not a particular event listener attaches to the current part or the root
 */
export type ListenAttach = "active" | "passive"

/**
 * Options that get passed to the Part#listen() method.
 */
export type ListenOptions = {
    attach?: ListenAttach
}


let count = 0

function nextId(): string {
    count += 1
    return `tuff${count}`
}

/**
 * Both typed and untyped message keys contain an id.
 */
export interface Key {
    readonly id: string
}

/**
 * A key with a specific data type.
 */
export interface TypedKey<T> extends Key {
    data?: T // not really sure what to do with this, but the compiler complains when we don't use T
}

/**
 * A key with no data. 
 */
export interface UntypedKey extends Key {
    typed: false // need this so that TypedKey is not compatible
}

/**
 * Creates a unique untyped message key
 */
export function untypedKey(): UntypedKey {
    return {
        id: nextId(),
        typed: false
    }
}

/**
 *  Creates a unique typed message key that binds to a specific data type
 */
export function typedKey<T>(): TypedKey<T> {
    return {
        id: nextId()
    }
}


/// Key Presses

/** 
 * Platform-independent modifier key.
 * 
 * "control/command" maps to Command (⌘) on macOS and Control everywhere else, 
 * whereas "control" maps to the Control key on all platforms.
 * 
 * "alt/option" maps to Option on macOS and Alt everywhere else, 
 * whereas "meta" maps to the Command key on macOS and the meta (Windows) on Windows.
 * 
 * Therefore, it is not possible to map the Control key on macOS or the Windows key on Windows.
 */ 
export type KeyModifier = "control/command" | "alt/option" | "shift"

/** 
 * Represents a single key press with optional modifiers.
 */
export class KeyPress implements Key {

    /** 
     * The key modifiers associated with this press.
     */
    readonly modifiers: Array<KeyModifier>

    /** 
     * The lowercase key
     */
    readonly key: string

    // Platform-indpendent code that uniquely identifies the key and modifier combination.
    readonly id: string

    constructor(key: string, ... modifiers: Array<KeyModifier>) {
        this.key = key.toLowerCase()
        this.modifiers = modifiers
        this.id = key + '__' + modifiers.join('&')
    }

}

/**
 * Helper function to create a new KeyPress key.
 * @param key The press key
 * @param modifiers The press modifiers
 * @returns A new KeyPress key
 */
export const keyPress = (key: string, ... modifiers: Array<KeyModifier>) => {
    return new KeyPress(key, ...modifiers)
}
