import Objects from "./objects"

/**
 * Internal type representing one part of a full index path
 */
type IndexPart<T, IsRoot = true, K extends keyof T = keyof T> =
    K extends string | number
        ? `${IsRoot extends true ? K : `.${K}`}${'' | (T[K] extends object ? IndexPath<T[K], false> : '')}`
        : never

/**
 * Represents a dot-separated path to a nested property within type T
 *
 * @example
 *    type Example = { alpha: { bravo: string }, charlie: { delta: number }[] }
 *    type ExamplePath = IndexPath<Example> // 'alpha' | 'alpha.bravo' | 'charlie' | `charlie.${number}` | `charlie.${number}.delta`
 */
export type IndexPath<T, IsRoot = true, K extends keyof T = keyof T> =
    K extends string | number
        ? T extends unknown[]
            ? K extends string
                ? never
                : IndexPart<T, IsRoot, K>
            : IndexPart<T, IsRoot, K>
        : never

/**
 * Given a nested index path, returns a type matching the structure implied by the path.
 *
 * @example
 *     type Example = ExpandPath<'foo.bar.0.baz'> // { foo: { bar: { baz: any }[] } }
 */
export type ExpandPath<Path extends string, ValueType = any> = Path extends `${infer Head}.${infer Rest}`
    ? Head extends `${infer _N extends number}`
        ? ExpandPath<Rest>[]
        : { [k in Head]: ExpandPath<Rest> }
    : Path extends `${infer _N extends number}`
        ? ValueType[]
        : { [k in Path]: ValueType }

/**
 * Given a type and an IndexPath for that type, gives the type of the property at that path for that type.
 *
 * @example
 *    type Example = { alpha: { bravo: string }, charlie: { delta: number }[] }
 *    type PropertyType = TypeAtPath<Example, 'charlie.0.delta'> // number
 */
export type TypeAtPath<T, Path extends string> = T extends (infer TElement)[]
    ? Path extends `${infer Head}.${infer Rest}`
        ? Head extends `${infer _N extends number}`
            ? TypeAtPath<TElement, Rest>
            : never
        : TElement
    : Path extends `${infer Head}.${infer Rest}`
        ? Head extends keyof T
            ? TypeAtPath<T[Head], Rest>
            : never
        : Path extends keyof T
            ? T[Path]
            : never

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

/**
 * Makes all properties of T and it's recursive children optional
 */
export type DeepPartial<T> = T extends object
    ? T extends (infer TElem)[]
        ? DeepPartial<TElem>[]
        : T extends null
            ? null
            : { [P in keyof T]?: DeepPartial<T[P]> }
    : T;

/**
 * Indicates a type annotated with a type property that can be used to distinguish it from other types
 */
export type TypeAnnotated<Type, Annotation extends string> = Type & { _type: Annotation }

/**
 * Annotates an object with the given type annotation. Makes a shallow copy of the original object, rather than mutating it.
 * @param obj - the object to annotate
 * @param type - the type annotation to add
 */
function annotate<Type, Annotation extends string>(obj: Type, type: Annotation): TypeAnnotated<Type, Annotation> {
    const newObj = Objects.shallowCopy(obj) as TypeAnnotated<Type, Annotation>
    newObj._type = type
    return newObj
}

/**
 * Annotates an object with the given type annotation. Mutates the original object, rather than copying.
 * @param obj - the object to annotate
 * @param type - the type annotation to add
 */
function annotateMut<Type, Annotation extends string>(obj: Type, type: Annotation): TypeAnnotated<Type, Annotation> {
    const annotatedObj = obj as TypeAnnotated<Type, Annotation>
    annotatedObj._type = type
    return annotatedObj
}


const Types = {
    annotate,
    annotateMut,
}
export default Types