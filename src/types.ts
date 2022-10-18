/**
 * Makes the specified properties of T required in the resulting type
 */
export type RequireProps<T, K extends keyof T> = T & {
    [prop in K]-?: T[prop]
}

/**
 * Makes the specified properties of T optional in the resulting type
 */
export type OptionalProps<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>
