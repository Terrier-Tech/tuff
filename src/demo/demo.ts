import Messages from '../messages'

let idCounter = 0

// Generates a globally unique id for use in place of actual record ids
export function newId() {
    idCounter += 1
    return `__${idCounter}__`
}

export type OutputData = {
    output: string
}

export function randomPhone(): string {
    return Math.random().toString().substring(2, 11)
}

// Global key for listening to general text output messages
export const OutputKey = Messages.typedKey<OutputData>()