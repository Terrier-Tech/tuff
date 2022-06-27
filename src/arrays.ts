import { KeyOfType } from "./forms"

/**
 * Groups the elements of `array` by the value of key `key`
 * @param array and array of objects
 * @param key the key by which to group
 * @returns on objects mapping key to grouped elements
 */
export function groupBy<T extends object, K extends KeyOfType<T,string> & string>(array: T[], key: K): Record<string, T[]> {
    return array.reduce((previous, currentItem) => {
        // I don't know why typescript can't figure this out
        const group = currentItem[key] as unknown as string|undefined
        if (group) {
            if (!previous[group]) previous[group] = []
            previous[group].push(currentItem)
        }
        return previous
    }, {} as Record<string, T[]>)
}


/**
 * Type for a function that returns a groupBy key from a type.
 */
type KeyFun<T> = (item: T) => string | undefined


/**
 * Returns a Record with keys for each unique value of getKey
 * @param list an array of objects
 * @param getKey a function returning the key by which to group
 * @returns on objects mapping key to grouped elements
 */ 
export function groupByFunction<T extends object>(list: T[], getKey: KeyFun<T>): Record<string, T[]> {
    return list.reduce((previous, currentItem) => {
        const group = getKey(currentItem)
        if (group) {
            if (!previous[group]) previous[group] = []
            previous[group].push(currentItem)
        }
        return previous
    }, {} as Record<string, T[]>)
}

/**
 * Iterates over the results of groupByFunction
 */
export function eachGroupByFunction<T extends object, K extends keyof T>(list: T[], getKey: KeyFun<T>, fun: (key: K, values: T[]) => any) {
    for (let [k, v] of Object.entries(groupByFunction(list, getKey))) {
        fun(k as K, v as T[])
    }
}

/**
 * Similer to `groupBy`, but only matches a single object for each key.
 * @param array an array of objects
 * @param key the object key by which to index
 * @returns an object mapping the keys to the individual objects
 */
export function indexBy<T extends object, K extends KeyOfType<T,string> & string>(array: T[], key: K): Record<string,T> {
    const obj: Record<string,T> = {}
    for (let item of array) {
        // I don't know why typescript can't figure this out
        const value = item[key] as unknown as string|undefined
        if (value) {
            obj[value] = item
        }
    }
    return obj
}

export type SortDir = "asc" | "desc"

/**
 * Sorts an array of objects by a key.
 * @param array an array to sort
 * @param key the field key by which to sort
 * @param dir the sort direction (default ascending)
 * @returns (a new) sorted array
 */
export function sortBy<T extends object, K extends KeyOfType<T,string> & string>(array: T[], key: K, dir: SortDir = "asc"): T[] {
    const dirMult = dir == "asc" ? 1 : -1
    return Array(...array).sort((a, b) => {
        return dirMult * (a[key] > b[key] ? 1 : -1)
    })
}

/**
 * Generates an array ranging between two numbers
 * @param start The starting number
 * @param end The ending number
 * @returns An array containing integers from {start} to {end}
 */
export function range(start: number, end: number): number[] {
    return Array.from(Array(end - start + 1).keys()).map(x => x + start)
}

/**
 * Picks a random value from an array.
 * @param array an array of values
 */
export function sample<T>(array: Array<T>): T {
    const i = Math.floor(Math.random()*array.length)
    return array[i]
}

/**
 * Returns the minimum value in an array of numbers.
 */
export function min(array: Array<number>): number {
    return Math.min.apply(Math, array)
}

/**
 * Returns the maximum value in an array of numbers.
 */
export function max(array: Array<number>): number {
    return Math.max.apply(Math, array)
}

/**
 * Returns the last element in an array.
 */
export function last<T>(array: Array<T>): T {
    return array[array.length-1]
}

/**
 * Returns a new array with the unique values in `array`, 
 * using an optional function to return the key.
 * @param array an array of values
 * @param by an optional function that returns a unique key for each value
 * @returns the unique values in `array`
 */
export function unique<T>(array: Array<T>, by?: (a: T) => number|string): Array<T> {
    if (by) {
        const map: {[id: number|string]: T} = {}
        array.forEach(a => map[by(a)] = a)
        return Object.values(map)
    }
    else {
        return [... new Set(array)]
    }
}