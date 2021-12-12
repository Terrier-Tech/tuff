

export type MessageKey = {
    readonly id: string
}

let count = 0

export const makeKey = () => {
    count += 1
    return {
        id: `__message-${count}__`
    }
}