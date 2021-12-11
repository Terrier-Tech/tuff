import {Tag, Attrs, Div} from './tags'
import { MessageKey } from './messages'

export type ParentTag = Tag<Attrs>

export type StatelessPart = Part<{}>

export type StatelessAssembly = Assembly<{}>

export type PartParent = StatelessPart | null

type HTMLMessage<EventType extends keyof HTMLElementEventMap> = {
    type: EventType
    event: HTMLElementEventMap[EventType]
    element: HTMLElement
}

type HTMLMessageHandler<EventType extends keyof HTMLElementEventMap> = {
    type: EventType
    key: MessageKey
    callback: (m: HTMLMessage<EventType>) => boolean
}

type HTMLMessageHandlerMap = Map<string,HTMLMessageHandler<any>>

export abstract class Part<StateType> {
    /// Assembly

    // we can't set this in the constructor since the subclass Assembly 
    // can't pass *this* to *super*
    protected _assembly?: StatelessAssembly

    protected get assembly(): StatelessAssembly {
        return this._assembly!
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
        if (parent) {
            this._assembly = parent.assembly
        }
    }

    createPart<PartType extends Part<PartStateType>, PartStateType>(
        constructor: {new (p: PartParent, id: string, state: PartStateType): PartType},
        state: PartStateType): PartType 
    {
        let part = this.assembly.createParentedPart(constructor, this, state)
        this.children[part.id] = part
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
            console.log('Initializing', this)
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
        this._dirty = true
    }


    /// Messages

    private htmlHandlers = new Map<string, HTMLMessageHandlerMap>()

    listen<EventType extends keyof HTMLElementEventMap>(
        type: EventType, 
        key: MessageKey,
        listener: (m: HTMLMessage<EventType>) => boolean,
        passive: boolean = false)
    { 
        if (passive) {
            this.assembly.listen(type, key, listener, false)
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
        listener: (m: HTMLMessage<"click">) => boolean,
        passive: boolean = false) 
    {
        this.listen("click", key, listener, passive)
    }

    attachEventListeners(elem: HTMLElement) {
        for (let type of ['click']) {
            let handlers = this.htmlHandlers.get(type)
            if (handlers?.size) {
                this.addTypeListener(elem, type as (keyof HTMLElementEventMap), handlers)
            }
        }
    }

    addTypeListener(elem: HTMLElement, type: keyof HTMLElementEventMap, handlers: HTMLMessageHandlerMap) {
        console.log(`attaching ${type} event listeners to`, elem)
        elem.addEventListener(type, function(this: HTMLElement, evt: HTMLElementEventMap[typeof type]) {
            console.log(`${type} event`, this, evt)

            // traverse the DOM path to find an event key
            let target: HTMLElement | null = null
            let key: string | null = null
            for (let e of evt.composedPath()) {
                if ((e as any).dataset[`__${type}`]) {
                    key = (e as any).dataset[`__${type}`]
                    target = e as HTMLElement
                    break
                }
            }

            if (!key?.length) return
            console.log(`${type} event key: ${key}`)
            let handler = handlers.get(key)
            if (!handler) return
            if (handler.callback({
                type: type,
                event: evt,
                element: target!
            })) {
                evt.stopPropagation()
            }
        })
    }

    
    /// Rendering

    renderInTag(container: ParentTag) {
        this._dirty = false
        container.div({id: this.id}, parent => {
            this.render(parent)
        })
    }

    abstract render(parent: Div): any


    /// Updating

    get rootElement(): HTMLElement {
        return document.getElementById(this.id)!
    }

    update() {
        this._init()
        if (this._dirty) {
            const root = this.rootElement
            console.time('Part.update')
            this._init()
            let parent = new Tag("")
            this.render(parent)
            let output = Array<string>()
            parent.buildInner(output)
            console.timeEnd('Part.update')
            root.innerHTML = output.join('')
            this._dirty = false
            this.attachEventListeners(root)
        }
        else {
            console.log('skipping clean part update')
            this.eachChild(child => {
                child.update()
            })
        }
    }

}

export abstract class Assembly<StateType> extends Part<StateType> {

    private root?: HTMLElement
    private idCount = 0
    protected grandchildren: {[id: string]: StatelessPart} = {}

    eachGrandchild(func: (child: StatelessPart) => void) {
        for (let child of Object.values(this.grandchildren)) {
            func(child)
        }
    }

    constructor(state: StateType) {
        super(null, 'assembly', state)
        this._assembly = this
        this.dirty() // so that it renders the first time
    }

    mount(root: HTMLElement | string) {
        if (root instanceof HTMLElement) {
            this.root = root!
        }
        else {
            this.root = document.getElementById(root)!
        }
        this.update()
        this.eachGrandchild(child => {
            let elem = document.getElementById(child.id)
            if (elem) {
                child.attachEventListeners(elem)
            }
        })
    }

    createParentedPart<PartType extends Part<PartStateType>, PartStateType>(
        constructor: {new (p: PartParent, id: string, state: PartStateType): PartType}, 
        parent: PartParent, 
        state: PartStateType): PartType 
    {
        this.idCount += 1
        let part = new constructor(parent || this, `__part-${this.idCount.toString()}`, state)
        this.grandchildren[part.id] = part
        if (parent) { // don't register as a root-level part if there's a different parent
            // part._assembly = this
        }
        else { 
            this.children[part.id] = part
        }
        return part
    }
        
    abstract render(parent: ParentTag): any

    get rootElement(): HTMLElement {
        return this.root!
    }

}