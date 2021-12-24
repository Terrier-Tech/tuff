import {Tag, Attrs, DivTag} from './tags'
import { MessageKey } from './messages'
import Logger from './logger'

const log = new Logger('Part')

export type ParentTag = Tag<Attrs>

export type StatelessPart = Part<{}>

export type PartParent = StatelessPart | null

type HTMLMessage<EventType extends keyof HTMLElementEventMap> = {
    type: EventType
    event: HTMLElementEventMap[EventType]
    element: HTMLElement
}

type HTMLMessageHandler<EventType extends keyof HTMLElementEventMap> = {
    type: EventType
    key: MessageKey
    callback: (m: HTMLMessage<EventType>) => void
}

type HTMLMessageHandlerMap = Map<string,HTMLMessageHandler<any>>

type ActiveOrPassive = "active" | "passive"

export abstract class Part<StateType> {
    
    /// Root

    // root parts themselves will not have a root
    protected _root?: StatelessPart

    protected get root(): StatelessPart {
        return this._root || this
    }


    /// Children
    
    protected children: {[id: string]: StatelessPart} = {}

    eachChild(func: (child: StatelessPart) => void) {
        for (let child of Object.values(this.children)) {
            func(child)
        }
    }


    /// Construction

    constructor(
        protected readonly parent: PartParent,
        public readonly id: string,
        public readonly state: StateType
    ) {
        this._dirty = true
        if (parent) {
            this._root = parent.root
        }
    }

    makePart<PartType extends Part<PartStateType>, PartStateType>(
        constructor: {new (p: PartParent, id: string, state: PartStateType): PartType},
        state: PartStateType): PartType 
    {
        let part = this.root.makeParentedPart(constructor, this, state)
        this.children[part.id] = part
        return part
    }
    
    private _idCount = 0

    makeParentedPart<PartType extends Part<PartStateType>, PartStateType>(
        constructor: {new (p: PartParent, id: string, state: PartStateType): PartType}, 
        parent: PartParent, 
        state: PartStateType): PartType 
    {
        this._idCount += 1
        let part = new constructor(parent || this, `__part-${this._idCount.toString()}__`, state)
        if (parent) { // don't register as a root-level part if there's a different parent
            // part._assembly = this
        }
        else { 
            this.children[part.id] = part
        }
        return part
    }


    /// Initialization

    private _initialized = false

    get isInitialized(): boolean {
        return this._initialized
    }

    protected _init() {
        if (!this._initialized) {
            this._initialized = true
            log.info('Initializing', this)
            this.init()
        }
        this.eachChild(child => {
            child._init()
        })
    }

    init() {
    }


    /// Dirty Tracking

    private _dirty = false

    // mark this part as dirty
    dirty() {
        log.debug("Dirty", this)
        this._dirty = true
        this.root.requestFrame()
    }

    private _frameRequested = false

    requestFrame() {
        if (this._frameRequested) return
        this._frameRequested = true
        requestAnimationFrame(t => {
            log.debug('Frame', t)
            this._frameRequested = false
            this.update()
        })
    }


    /// Messages

    private htmlHandlers = new Map<string, HTMLMessageHandlerMap>()

    listen<EventType extends keyof HTMLElementEventMap>(
        type: EventType, 
        key: MessageKey,
        listener: (m: HTMLMessage<EventType>) => void,
        active: ActiveOrPassive = "active")
    { 
        if (active == "passive") {
            this.root.listen(type, key, listener, "active")
            return
        }
        let handlers = this.htmlHandlers.get(type)
        if (!handlers) {
            handlers = new Map<string,HTMLMessageHandler<any>>()
            this.htmlHandlers.set(type, handlers)
        }
        handlers.set(key.id, {
            type: type,
            key: key,
            callback: listener
        })
    }

    onClick(
        key: MessageKey,
        listener: (m: HTMLMessage<"click">) => void,
        active: ActiveOrPassive = "active") 
    {
        this.listen("click", key, listener, active)
    }

    attachEventListeners() {
        let elem = this.element
        for (let type of ['click']) {
            let handlers = this.htmlHandlers.get(type)
            if (handlers?.size) {
                this.addTypeListener(elem, type as (keyof HTMLElementEventMap), handlers)
            }
        }
        this.eachChild(child => {
            child.attachEventListeners()
        })
    }

    addTypeListener(elem: HTMLElement, type: keyof HTMLElementEventMap, handlers: HTMLMessageHandlerMap) {
        log.info(`Attaching ${handlers.size} ${type} event listeners to`, elem)
        elem.addEventListener(type, function(this: HTMLElement, evt: HTMLElementEventMap[typeof type]) {

            // traverse the DOM path to find an event key
            let target: HTMLElement | null = null
            let keys: string[] | null = null
            for (let e of evt.composedPath()) {
                let data = (e as any).dataset
                if (data && data[`__${type}__`]?.length) {
                    keys = data[`__${type}__`].split(';')
                    target = e as HTMLElement
                    break
                }
            }

            if (!keys?.length) return
            console.log(`${type} event: ${keys.join(';')}`, this, evt)
            for (let k of keys) {
                let handler = handlers.get(k)
                if (!handler) continue
                handler.callback({
                    type: type,
                    event: evt,
                    element: target!
                })
            }
        })
    }


    /// Mounting
    
    private _element?: HTMLElement

    get element(): HTMLElement {
        return this._element || document.getElementById(this.id)!
    }

    mount(elem: HTMLElement | string) {
        if (elem instanceof HTMLElement) {
            this._element = elem!
        }
        else {
            this._element = document.getElementById(elem)!
        }
        this.requestFrame()
    }

    
    /// Rendering

    renderInTag(container: ParentTag) {
        this._dirty = false
        container.div({id: this.id}, parent => {
            this.render(parent)
        })
    }

    abstract render(parent: DivTag): any


    /// Updating

    update() {
        this._init()
        if (this._dirty) {
            const elem = this.element
            log.time('Update', () => {
                this._init()
                let parent = new Tag("")
                this.render(parent)
                let output = Array<string>()
                parent.buildInner(output)
                elem.innerHTML = output.join('')
            })
            this._dirty = false
            this.attachEventListeners()
            
        }
        else {
            this.eachChild(child => {
                child.update()
            })
        }
    }

}
