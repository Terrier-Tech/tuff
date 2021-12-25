


// Maps event type strings to event types
export interface EventMap extends HTMLElementEventMap {

}

// The actual payload that gets delivered when a message is handled
export type Message<EventType extends keyof EventMap, DataType> = {
    type: EventType
    event: EventMap[EventType]
    element: HTMLElement
    data: DataType
}

// Stores a handler for a specific event type and key
export type Handler<EventType extends keyof EventMap, DataType> = {
    type: EventType
    key: TypedKey<DataType>
    callback: (m: Message<EventType,DataType>) => void
}

// Associates handlers with their event keys
export type HandlerMap = Map<string,Handler<any,any>>


let count = 0

function nextId(): string {
    count += 1
    return `__msg-${count}__`
}

// Both typed and untyped message keys contain an id
export interface Key {
    readonly id: string
}

export interface TypedKey<T extends {}> extends Key {
    data?: T // not really sure what to do with this, but the compiler complains when we don't use T
}

export interface UntypedKey extends Key {
    typed: false // need this so that TypedKey is not compatible
}

// Creates a unique untyped message key
export function untypedKey(): UntypedKey {
    return {
        id: nextId(),
        typed: false
    }
}

// Creates a unique typed message key that binds to a specific data type
export function typedKey<T>(): TypedKey<T> {
    return {
        id: nextId()
    }
}