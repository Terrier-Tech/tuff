import { RequireProps } from "./types"

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
 * Creates a deep copy of `obj` by serializing then deserializing it from JSON.
 * @param obj
 */
function deepCopy<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj)) as T
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
    omit,
    omitEmpty,
    shallowCopy,
    safeToString,
    deepCopy,
    notNull,
    propNotNull,
}
export default Objects