import {Part, PartConstructor} from "./parts"
import Messages from "./messages"

type ArrayKeys<T> = {
    [P in keyof T]: T[P] extends readonly unknown[] | undefined ? P : never
}[keyof T]
type ElementOf<T> = T extends readonly (infer U)[] ? U : never

export class StateContext<T extends object> {
    part: Part<unknown>
    data: T
    changeMessageKey = Messages.typedKey<{ key: keyof T | null }>()

    constructor(part: Part<unknown>, initialData: T) {
        this.part = part
        this.data = initialData
    }

    /**
     * Bind a part to a context, forcing it to re-render whenever any value
     * on the context changes
     * @param part The part to mark as dirty on context change
     * @param beforeRender optional method to occur before rerender but after context change
     */
    bind(part: Part<unknown>, beforeRender?: () => void) {
        part.listenMessage(this.changeMessageKey, _ => {
            beforeRender?.()
            part.dirty()
        }, { attach: 'passive' })
    }

    /**
     * Bind a part to a single key on a context, triggering a re-render when that key changes
     * @param part The part to mark as dirty
     * @param key The context key
     */
    selectiveBind<K extends keyof T>(part: Part<unknown>, key: K, beforeRender?: () => void) {
        part.listenMessage(
            this.changeMessageKey,
            m => {
                // if the key is null, then the full state was assigned
                if (m.data.key === key || m.data.key === null) {
                    beforeRender?.()
                    part.dirty()
                }
            },
            { attach: 'passive' }
        )
    }

    /**
     * Bind a context key to a tuff collection
     * @param contextKey
     * @param parentPart The parent part. Will be rerendered on context key change.
     * @param collectionName
     * @param collectionPart
     * @param stateBuilder
     */
    bindKeyToCollection<
        K extends ArrayKeys<T>,
        Item extends ElementOf<NonNullable<T[K]>>,
        ElementState extends object,
    >(
        contextKey: K,
        parentPart: Part<unknown>,
        collectionName: string,
        collectionPart: PartConstructor<Part<ElementState>, ElementState>,
        stateBuilder: (item: Item, context: StateContext<T>) => ElementState
    ) {
        const items = this.data[contextKey] as Item[]
        const initialStates = items?.map(item => stateBuilder(item, this))
        if (initialStates?.length) {
            parentPart.assignCollection(collectionName, collectionPart, initialStates)
        }

        parentPart.listenMessage(
            this.changeMessageKey,
            m => {
                if (m.data.key === contextKey || m.data.key === null) {
                    const items = this.data[contextKey] as Item[]

                    const newStates: ElementState[] = items.map(item => {
                        return stateBuilder(item, this)
                    })

                    parentPart.assignCollection(collectionName, collectionPart, newStates)
                    parentPart.dirty()
                }
            }, { attach: 'passive' }
        )
    }

    /**
     * Assign the context data to a value. Will trigger rerenders on all
     * parts bound to the context.
     * @param data
     */
    assignState(data: T) {
        this.data = data
        this.part.emitMessage(this.changeMessageKey, { key: null })
    }

    /**
     * Assign a single key in the context to a value. Will trigger rerenders
     * on parts bound either to the full context or to the specified key.
     * @param key
     * @param value
     */
    assignStateValue<K extends keyof T>(key: keyof T, value: T[K]) {
        Object.assign(this.data, {[key]: value})
        this.part.emitMessage(this.changeMessageKey, { key: key })
    }
}