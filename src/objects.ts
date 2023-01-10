import { RequireProps } from "./types"

/**
 * Creates a shallow copy of `obj` containing only the properties specified in `props`
 * @param obj the object to copy
 * @param props the properties to include in the returned object
 */
export function slice<T, K extends keyof T>(obj: T, ...props: K[]): Pick<T, K>
 export function slice<T>(obj: T): T
 export function slice<T, K extends keyof T>(obj: T, ...props: K[]): Pick<T, K> {
     if (props?.length) {
         const newObj = {} as Pick<T, K>
         for (const prop of props) {
             newObj[prop] = obj[prop]
         }
         return newObj
     }
     else {
         return {...obj}
     }
 }
 
 /**
  * Creates a shallow copy of `obj` containing all properties not specified in `props`
  * @param obj the object ot copy
  * @param props the properties to omit in the returned object
  */
 export function omit<T, K extends keyof T>(obj: T, ...props: K[]): Omit<T, K> {
     const newObj = {...obj}
     for (const prop of props) {
         delete newObj[prop]
     }
     return newObj as Omit<T, K>
 }

/**
 * Whether the given value is defined
 * @param value
 */
export function notNull<TValue>(value: TValue | null | undefined): value is NonNullable<TValue> {
    return value != null
}

/**
 * Whether the given properties on the given value are defined
 * @param value
 * @param props
 */
export function propNotNull<TValue, K extends keyof TValue>(value: TValue | null | undefined, ...props: K[]): value is RequireProps<NonNullable<TValue>, K> {
    if (value == null) return false
    for (const prop of props) {
        if (value[prop] == null) return false
    }
    return true
}
