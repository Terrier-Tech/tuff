import Objects from "./objects"

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