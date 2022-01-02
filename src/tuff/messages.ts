import * as forms from './forms'

// Maps event type strings to event types
export interface EventMap extends HTMLElementEventMap, forms.EventMap {

}

// The actual payload that gets delivered when a message is handled
export type Message<EventType extends keyof EventMap, DataType> = {
    type: EventType
    event: EventMap[EventType]
    data: DataType
}

// Stores a handler for a specific event type and key
export type Handler<EventType extends keyof EventMap, DataType> = {
    type: EventType
    key: TypedKey<DataType>
    callback: (m: Message<EventType,DataType>) => void
}

// Associates handlers with their event types and keys
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