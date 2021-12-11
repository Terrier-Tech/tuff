

export type MessageKey = {
    readonly id: string
}

let count = 0

export const newMessageKey = () => {
    count += 1
    return {
        id: `message-${count}`
    }
}