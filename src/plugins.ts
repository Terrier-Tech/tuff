import {StatelessPart} from "./parts"
import {Logger} from "./logging"

const log = new Logger('Plugin')

/**
 * Counter for incrementing tuff plugin ids
 */
let _idCount: number = 0

/**
 * Type for a plugin constructor.
 */
export type PluginConstructor<PluginType extends PartPlugin<StateType>, StateType> = {
    new(parent: StatelessPart, state: StateType): PluginType
}

/**
 * Plugins can be mixed into parts with `makePlugin` and are able to integrate into the part's lifecyle.
 */
export class PartPlugin<StateType> {

    id!: string
    _isInitialized = false

    constructor(readonly part: StatelessPart, protected state: StateType) {
        _idCount += 1
        this.id = `tuff-plugin-${_idCount.toString()}`
    }

    async _initIfNeeded() {
        if (this._isInitialized) {
            return
        }
        else {
            log.debug(`Initializing plugin ${this.id}`, this)
            await this.init()
            this._isInitialized = true
        }
    }

    /**
     * Mark the part dirty.
     */
    dirty() {
        this.part?.dirty()
    }

    /**
     * Override this method to provide functionality that is guaranteed to run once and only once.
     */
    async init() {
    }

    /**
     * Override this method to provide functionality that will run after `init()` and whenever the page changes.
     */
    load() {
    }

    /**
     * Override this method to provide functionality that runs after each render and can interact directly with the part's DOM.
     * @param _elem the part's DOM element
     */
    update(_elem: HTMLElement) {

    }

}

export type StatelessPlugin = PartPlugin<any>