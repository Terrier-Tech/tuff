import Messages from "./messages"
import {Part, PartConstructor} from "./parts"

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
    selectiveBind<K extends keyof T>(part: Part<unknown>, key: K) {
        part.listenMessage(
            this.changeMessageKey,
            m => {
                // if key is null, then full state was assigned
                if (m.data.key === key || m.data.key === null) {
                    part.dirty()
                }
            },
            { attach: 'passive' }
        )
    }

    /**
     * Bind a context key to a tuff collection
     * @param part The parent part. Will be rerendered on context key change.
     * @param contextKey
     * @param collectionName
     * @param collectionPartKey
     * @param partType
     */
    bindKeyToCollection<
        K extends ArrayKeys<T>,
        Item extends ElementOf<NonNullable<T[K]>>,
        CollectionKey extends string,
        State extends Record<CollectionKey, Item>
    >(
        part: Part<unknown>,
        contextKey: K,
        collectionName: string,
        collectionPartKey: CollectionKey,
        partType: PartConstructor<Part<State>, State>
    ) {
        part.listenMessage(
            this.changeMessageKey,
            m => {
                if (m.data.key === contextKey || m.data.key === null) {
                    const existingCollectionStates = (part.getCollectionParts(collectionName) as Part<State>[])
                        .map(part => part.state)

                    const items = this.data[contextKey] as Item[]

                    const newStates: State[] = items.map((item, index) => {
                        const existingState = existingCollectionStates[index]
                        return {
                            ...(existingState ?? {}),
                            [collectionPartKey]: item,
                        } as State
                    })

                    part.assignCollection(collectionName, partType, newStates)
                    part.dirty()
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