/**
 * Returns a Record with keys for each unique value of getKey
 */ 
export function groupBy<T, K extends keyof any>(list: T[], getKey: (item: T) => K): Record<K, T[]> {
    return list.reduce((previous, currentItem) => {
        const group = getKey(currentItem)
        if (!previous[group]) previous[group] = []
        previous[group].push(currentItem)
        return previous
    }, {} as Record<K, T[]>)
}

/**
 * Iterates over the results of groupBy
 */
export function eachGroupBy<T, K extends keyof any>(list: T[], getKey: (item: T) => K, fun: (key: K, values: T[]) => any) {
    for (let [k, v] of Object.entries(groupBy(list, getKey))) {
        fun(k as K, v as T[])
    }
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