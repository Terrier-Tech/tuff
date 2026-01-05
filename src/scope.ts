import Messages from "./messages"

/**
 * Helper methods for creating and using scopes
 */
export type ScopeToken<T> = symbol & { _type?: T }
type ScopeUpdate<T extends object> = {
    token: ScopeToken<T>,
    key: keyof T,
    value: T[keyof T]
};

export function typedScopeUpdate<T extends object>() {
    return Messages.typedKey<ScopeUpdate<T>>()
}

export function createScope<T>(): ScopeToken<T> {
    return Symbol() as ScopeToken<T>
}

export const Scopes = new Map<ScopeToken<any>, unknown>()

export const ScopeMessageKeys = new Map<ScopeToken<any>, any>()