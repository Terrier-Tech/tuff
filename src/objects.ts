import Sets from "./sets"
import { DeepPartial, ExpandPath, IndexPath, RequireProps, TypeAtPath } from "./types"

/**
 * Creates a shallow copy of `obj` containing only the properties specified in `props`
 * @param obj the object to copy
 * @param props the properties to include in the returned object
 */
function slice<T, K extends keyof T>(obj: T, ...props: K[]): Pick<T, K>
function slice<T>(obj: T): T
function slice<T, K extends keyof T>(obj: T, ...props: K[]): Pick<T, K> {
    if (props?.length) {
        const newObj = {} as Pick<T, K>
        for (const prop of props) {
            newObj[prop] = obj[prop]
        }
        return newObj
    } else {
        return {...obj}
    }
}

/**
 * Gets the value of the property at the given nested path
 * @param obj the object to dig into
 * @param path the path at which to dig
 */
function dig<T extends object, TPath extends IndexPath<T>>(obj: T, path: TPath): TypeAtPath<T, TPath> {
    let val: any = obj
    for (const key of path.split('.')) {
        val = val[key]
    }
    return val
}

/**
 * Puts the given value at the given index path in the given object
 */
function bury<T extends object, Path extends string, ValueType>(
    obj: T,
    path: Path,
    value: ValueType
): T & ExpandPath<Path, ValueType>  {
    let val: any = obj
    const keys = path.split('.')
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i]
        if (!val.hasOwnProperty(key)) {
            const nextKey = keys[i + 1]
            if (isNaN(Number(nextKey))) {
                val[key] = {}
            } else {
                val[key] = []
            }
        }
        val = val[key]
        if (typeof val !== "object") throw new Error(`can't bury in ${typeof val}!`)

    }

    val[keys[keys.length - 1]] = value

    return obj as T & ExpandPath<Path, ValueType>
}

export type MergeFunc<T> = (a: T | DeepPartial<T>, b: DeepPartial<T>) => T | DeepPartial<T> | undefined | void

/**
 * Deeply merges two values of the same type. Merges arrays structurally, rather than by concatenation or replacement
 * Designed for use with non-cyclic, plain old javascript objects.
 * @param a
 * @param b
 * @param customMerge a function to provide custom merge behavior, for instance to handle object types that should be
 *                    merged as a whole rather than piecemeal.
 *                    The value returned from this function will be used unless it is undefined or void.
 */
function deepMerge<T>(a: T, b: T, customMerge?: MergeFunc<T>): T
function deepMerge<T>(a: T, b: DeepPartial<T>, customMerge?: MergeFunc<T>): T
function deepMerge<T>(a: DeepPartial<T>, b: DeepPartial<T>, customMerge?: MergeFunc<T>): DeepPartial<T>
function deepMerge<T>(a: T | DeepPartial<T>, b: DeepPartial<T>, customMerge?: MergeFunc<T>): T | DeepPartial<T> {
    if (customMerge) {
        const customMerged = customMerge(a, b)
        if (customMerged || customMerged === null) return customMerged
    }

    if (b === null) {
        return b
    } else if (b === undefined) {
        return deepCopy(a)
    } else if (a === null || a === undefined) {
        return deepCopy(b)
    } else if (Array.isArray(a) && Array.isArray(b)) {
        const length = a.length > b.length ? a.length : b.length
        const newArr = [] as unknown[]
        for (let i = 0; i < length; i++) {
            newArr[i] = deepMerge(a[i], b[i])
        }
        return newArr as DeepPartial<T>
    } else if (Array.isArray(a) || Array.isArray(b)) {
        return deepCopy(b)
    } else if (a instanceof Set && b instanceof Set) {
        return Sets.union(a, b) as T
    } else if (a instanceof Map && b instanceof Map) {
        const newObj = new Map()
        const keys = Array.from(a.keys()).concat(b.keys())
        for (const key of keys) {
            newObj.set(key, deepMerge(a.get(key), b.get(key)))
        }
        return newObj as DeepPartial<T>
    } else if (isPojo(a) && isPojo(b)) {
        const newObj = {} as Record<string, unknown>
        const keys = Object.keys(a).concat(Object.keys(b))
        for (const key of keys) {
            const aVal = a[key as keyof typeof a] as DeepPartial<T[keyof T]>
            const bVal = b[key as keyof typeof b] as DeepPartial<T[keyof T]>
            newObj[key] = deepMerge<T[keyof T]>(aVal, bVal)
        }
        return newObj as DeepPartial<T>
    } else {
        return deepCopy(b)
    }
}

 /**
  * Creates a shallow copy of `obj` containing all properties not specified in `props`
  * @param obj the object ot copy
  * @param props the properties to omit in the returned object
  */
 function omit<T, K extends keyof T>(obj: T, ...props: K[]): Omit<T, K> {
     const newObj = {...obj}
     for (const prop of props) {
         delete newObj[prop]
     }
     return newObj as Omit<T, K>
 }

/**
 * Omits keys of T that are null, undefined, or length 0
 * @param obj
 */
function omitEmpty<T extends Record<string, any>>(obj: T): T {
     const newObj = {} as Record<string, any>
     for (const [key, val] of Object.entries(obj)) {
         if (val != undefined && ((typeof(val) != 'string' && !Array.isArray(val)) || val.length)) {
             newObj[key] = val
         }
     }
     return newObj as T
 }


/**
 * Whether the given value is a Plain Old Javascript Object.
 * Returns false for arrays, class instances, etc.
 * @param value
 */
function isPojo(value: object | null): value is Record<string | symbol | number, unknown> {
    return value?.constructor === Object
}

/**
 * Whether the given value is defined
 * @param value
 */
function notNull<TValue>(value: TValue | null | undefined): value is NonNullable<TValue> {
    return value != null
}

/**
 * Whether the given properties on the given value are defined
 * @param value
 * @param props
 */
function propNotNull<TValue, K extends keyof TValue>(value: TValue | null | undefined, ...props: K[]): value is RequireProps<NonNullable<TValue>, K> {
    if (value == null) return false
    for (const prop of props) {
        if (value[prop] == null) return false
    }
    return true
}


/**
 * Creates a shallow copy of `obj`
 * @param obj
 */
function shallowCopy<T>(obj: T): T {
    return Object.assign({}, obj)
}


/**
 * Creates a deep copy of `obj`.
 * @param obj
 */
function deepCopy<T>(obj: T): T {
    return structuredClone(obj)
}


/**
 * Takes an unknown value and returns a string representation of it, if possible. Otherwise throws.
 *
 * This is necessary because not every unknown value is guaranteed to be `toString`able
 * @param obj
 */
function safeToString(obj: unknown): string {
    switch (typeof obj) {
        case "object":
            if (obj && "toString" in obj && typeof obj.toString === 'function')
                return obj.toString()
            else
                break
        case "boolean":
        case "number":
        case "function":
        case "symbol":
        case "bigint":
            return obj.toString()
        case "string":
            return obj
    }
    throw "this object can't be converted to string"
}

const Objects = {
    slice,
    dig,
    bury,
    deepMerge,
    omit,
    omitEmpty,
    shallowCopy,
    safeToString,
    deepCopy,
    isPojo,
    notNull,
    propNotNull,
}
export default Objects