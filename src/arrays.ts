import { KeyOfType } from "./forms"
import { notNull, propNotNull } from "./objects"
import { RequireProps } from "./types"

/**
 * Groups the elements of `array` by the value of key `key`
 * @param array and array of objects
 * @param key the key by which to group
 * @returns on objects mapping key to grouped elements
 */
export function groupBy<T extends Record<string | symbol, any>, K extends keyof T, TK extends T[K]>(array: T[], key: K): Record<TK, T[]> {
    return array.reduce((previous, currentItem) => {
        const group = currentItem[key] as TK
        if (group) {
            if (!previous[group]) previous[group] = []
            previous[group].push(currentItem)
        }
        return previous
    }, {} as Record<TK, T[]>)
}


/**
 * Type for a function that returns a groupBy key from a type.
 */
export type KeyFun<T, K> = (item: T) => K | undefined


/**
 * Returns a Record with keys for each unique value of getKey
 * @param list an array of objects
 * @param getKey a function returning the key by which to group
 * @returns on objects mapping key to grouped elements
 */ 
export function groupByFunction<T extends Record<string | symbol, any>, TK extends string | number | symbol>(list: T[], getKey: KeyFun<T, TK>): Record<TK, T[]> {
    return list.reduce((previous, currentItem) => {
        const group = getKey(currentItem)
        if (group) {
            if (!previous[group]) previous[group] = []
            previous[group].push(currentItem)
        }
        return previous
    }, {} as Record<TK, T[]>)
}

/**
 * Iterates over the results of groupByFunction
 */
export function eachGroupByFunction<T extends Record<string | symbol, any>, TK extends string | number | symbol>(list: T[], getKey: KeyFun<T, TK>, fun: (key: TK, values: T[]) => any) {
    for (let [k, v] of Object.entries(groupByFunction(list, getKey))) {
        fun(k as TK, v as T[])
    }
}

/**
 * Similer to `groupBy`, but only matches a single object for each key.
 * @param array an array of objects
 * @param key the object key by which to index
 * @returns an object mapping the keys to the individual objects
 */
export function indexBy<T extends Record<string | symbol, any>, K extends keyof T, TK extends T[K]>(array: T[], key: K): Record<TK,T> {
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

/**
 * Whether to perform an ascending or descending sort.
 */
export type SortDir = "asc" | "desc"

/**
 * Sorts an array of objects by a key.
 * @param array an array to sort
 * @param key the field key by which to sort
 * @param dir the sort direction (default ascending)
 * @returns (a new) sorted array
 */
export function sortBy<T extends Record<string | symbol, any>, K extends keyof T>(array: T[], key: K, dir: SortDir = "asc"): T[] {
    const dirMult = dir == "asc" ? 1 : -1
    return Array(...array).sort((a, b) => {
        return dirMult * (a[key] > b[key] ? 1 : -1)
    })
}

/**
 * Sorts an array of objects by a function.
 * @param array an array to sort
 * @param getKey a function returning the sort key for the given element
 * @param dir the sort direction (default ascending)
 * @returns (a new) sorted array
 */
export function sortByFunction<T extends Record<string | symbol, any>>(array: T[], getKey: (e: T) => number | string, dir: SortDir = "asc"): T[] {
    const dirMult = dir == "asc" ? 1 : -1
    return Array(...array).sort((a, b) => {
        const aSort = getKey(a)
        const bSort = getKey(b)
        return dirMult * (aSort > bSort ? 1 : -1)
    })
}

/**
 * The order of magnitude considered for niceRound().
 */
const N = 100000

/**
 * Rounds a number to it's nearest 'nice' number, e.g. rounds 0.30000000000000004 to 0.3
 * @param n a number
 * @returns the number rounded to the nearest 'nice' number
 */
export function niceRound(n: number): number {
    return (Math.round(n*N))/N
}

/**
 * Generates an array ranging between two numbers
 * @param start The starting number
 * @param end The ending number
 * @param step The increment used to step between the start and end
 * @returns An array containing numbers from `start` to `end`
 */
export function range(start: number, end: number, step: number=1): number[] {
    const numElems = Math.floor((end - start) / step + 1)
    return Array.from(Array(numElems).keys()).map(x => niceRound(x*step + start))
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
 * Returns the maximum value in an array of numbers.
 */
export function sum(array: Array<number>): number {
    return array.reduce((a, v) => a + v, 0)
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

/**
 * Removes all null and undefined values from the array.
 * @param array an array
 * @returns a new array without any null or undefined values
 */
export function compact<T>(array: Array<T | null | undefined>): NonNullable<T>[] {
    return array.filter(notNull)
}

/**
 * Filters out elements for which the given properties are null or undefined.
 * Elements that are null or undefined themselves are filtered out.
 * @param array the array to filter
 * @param props the properties by which to compact the array
 */
export function compactBy<T, K extends keyof T>(array: Array<T | null | undefined>, ...props: Array<K>): RequireProps<NonNullable<T>, K>[] {
    return array.filter((el): el is RequireProps<NonNullable<T>, K> => propNotNull(el, ...props))
}

/**
 * Create a new array without the given element.
 * @param array the input array
 * @param element the element to remove
 * @returns a new array without element
 */
export function without<T>(array: Array<T>, element: T): Array<T> {
    return array.filter(el => {
        return el != element
    })
}

/**
 * Find the first element of an array that satisfies the callback.
 * @param array the input array
 * @param callback the callback functioning as a search query
 * @returns the first element satisfying the callback, or null
 */
export function find<T>(array: T[], callback: (value: T, index: number, array: T[]) => boolean): T | null {
    for (let i = 0; i < array.length; i++) {
        if (callback(array[i], i, array)) {
            return array[i];
        }
    }
    return null;
}

/**
 * Extracts an array of values from an array of objects, based on a given key.
 * @param array the input array
 * @param key the key to extract values from objects in the array
 * @returns an array of values extracted from the objects in the input array
 * @throws an error if a key is not found in an object
 */
export function pluck<T extends object, K extends keyof T & string>(array: T[], key: K): T[K][] {
    return array.map(item => {
        if (key in item) {
            return item[key];
        } else {
            throw new Error(`Key '${key}' not found in object: ${JSON.stringify(item)}`);
        }
    });
}

/**
 * Searches an array of objects for those that match a given search query based on a specific key.
 * @param array the input array of objects
 * @param key the key to search for a match in the objects in the array
 * @param query the search query to match against the value of the specified key
 * @returns an array of objects that contain a matching key-value pair
 */
export function ilike(array: any[], key: string, query: string) {
    const lowercaseQuery = query.toLowerCase();
    return array.filter((item) => {
        if (!(key in item)) return false;
        return item[key].toLowerCase().includes(lowercaseQuery);
    });
}

/**
 * Finds the index of the first element in an array that satisfies a given callback function.
 * @param array the input array
 * @param callback the function to test each element with
 * @returns the index of the first element that satisfies the callback function, or null if no element satisfies the callback function
 */
export function findIndex<T>(array: T[], callback: (element: T, index: number, array: T[]) => boolean): number | null {
    for (let i = 0; i < array.length; i++) {
        if (callback(array[i], i, array)) {
            return i;
        }
    }
    return null;
}

/// Stream

/**
 * A readonly wrapper around an array that lets you chain method calls.
 */
export class Stream<T> {
    constructor(readonly array: T[]) {}

    /**
     * Exits the chain by returning the modified array
     * @returns the actual array
     */
    toArray(): T[] {
        return this.array
    }

    /**
     * Exits the chain by grouping elements into an object of arrays based on the given property key
     * @param key the property to group by
     */
    groupBy<K extends keyof T, TK extends T[K] & (string | number | symbol)>(key: K): Record<TK, T[]> {
        // have to cast here because the compiler doesn't know for sure that T as defined on the Stream class is an object
        type TAsObject = (Record<keyof T, T[keyof T]> & T)
        return groupBy(this.array as TAsObject[], key)
    }

    /**
     * Exits the chain by grouping elements into an object of arrays based on the results the getKey function
     * @param getKey a function that returns the value to group by
     */
    groupByFunction<TK extends string | number | symbol>(getKey: KeyFun<T, TK>): Record<TK, T[]> {
        // have to cast here because the compiler doesn't know for sure that T as defined on the Stream class is an object
        type TAsObject = (Record<keyof T, T[keyof T]> & T)
        return groupByFunction(this.array as TAsObject[], getKey as KeyFun<TAsObject, TK>)
    }

    /**
     * Exits the chain by mapping each item to a unique key
     * @param key
     */
    indexBy<K extends keyof T, TK extends T[K] & (string | number | symbol)>(key: K): Record<TK,T> {
        // have to cast here because the compiler doesn't know for sure that T as defined on the Stream class is an object
        type TAsObject = (Record<keyof T, T[keyof T]> & T)
        return indexBy(this.array as TAsObject[], key)
    }

    /**
     * Filters the array by a predicate function.
     * @param predicate a function by which to filter
     * @returns a new stream with the filtered result
     */
    filter(predicate: (value: T) => boolean): Stream<T> {
        return new Stream(this.array.filter(predicate))
    }

    /**
     * Maps the elements in the array using a function.
     * @param fn a function that operates on each value in the array
     * @returns a new stream with the mapped array values
     */
    map<S>(fn: (value: T) => S): Stream<S> {
        return new Stream(this.array.map(fn))
    }

    /**
     * Returns the unique elements of the array.
     * @param by an optional comparison function
     * @returns a new stream with the unique elements
     */
    unique(by?: (a: T) => number|string): Stream<T> {
        return new Stream(unique(this.array, by))
    }

    /**
     * Sorts the array by an object key.
     * @param key the sort key
     * @param dir the sort direction
     * @returns the sorted array
     */
    sortBy<S extends object & T, K extends KeyOfType<S,string> & string>(key: K, dir: SortDir = "asc"): Stream<S> {
        return new Stream(sortBy<S, K>(this.array as any as S[], key, dir) as S[])
    }

    /**
     * Removes all null and undefined values from the array.
     * @returns a new array without any null or undefined values
     */
    compact(): Stream<NonNullable<T>> {
        return new Stream(compact(this.array))
    }

    /**
     * Filters out elements for which the given properties are null or undefined.
     * Elements that are null or undefined themselves are filtered out.
     */
    compactBy<K extends keyof T>(...props: K[]): Stream<RequireProps<NonNullable<T>, K>> {
        return new Stream(compactBy(this.array, ...props))
    }
}

/**
 * Starts a new array stream so that method calls can be chained together.
 * @param array an array to wrap
 * @returns the wrapped array stream
 */
export function stream<T>(array: T[]): Stream<T> {
    return new Stream(array)
}
