import * as messages from './messages'
import {EventMessageTypeMap, ValueEvents, ValueMessage} from './messages'
import {Logger} from './logging'
import * as keyboard from './keyboard'
import * as urls from './urls'
import Html, {DivTag, HtmlBaseAttrs, HtmlParentTag, HtmlTagBase} from './html'
import Nav from './nav'
import {slugify} from "./strings"

const log = new Logger('Part')

/**
 * A part that can have any state.
 */
export type StatelessPart = Part<any>

/**
 * The state type for a Part that should have *empty* state.
 */
export type NoState = Record<string, never>

/**
 * Parent parts can possibly be null.
 */
export type PartParent = StatelessPart | null

/**
 * Generic type for a function that constructs a part.
 */
export type PartConstructor<PartType extends Part<StateType>, StateType> = {new (parent: PartParent, id: string, state: StateType): PartType}

/** 
 * Whether or not a particular message emit should emit on the parents as well
 */
export type EmitScope = "single" | "bubble"

/**
 * Options for emitting messages.
 */
export type EmitOptions = {
    scope?: EmitScope
}

/**
 * Whether the part needs to be rendered (dirty), updated (stale), or neither (clean).
 */
type RenderState = "clean" | "stale" | "dirty"

/**
 * Currently, only HTML events are mapped.
 */
type EventKey = keyof HTMLElementEventMap

/**
 * These event types do not bubble and thus should be handled in the capture phase
 */
const nonBubblingEvents: EventKey[] = [
    'blur', 'focus', 'load', 'scroll'
]

/**
 * Counter for incrementing tuff part ids
 */
let _idCount : number = 0

/** 
 * Parts can be mounted either directly to DOM elements or by id string
 */
export type MountPoint = HTMLElement | string

/**
 * The type of the object that gets passed to a part's render() method.
 * You're not allowed to alter the parent's attributes from inside a render() method
 * in order to preserve encapsulation and since the parent may not actually be 
 * rendered during a particular call.
 */ 
export type PartTag = Omit<HtmlTagBase<HtmlBaseAttrs,any>, 'sel' | 'class' | 'id' | 'data' | 'css'>

/**
 * A context containing information about the current page/frame.
 */
export type PartContext = {
    frame: number
    href: string
    host: string
    path: string
    queryParams: urls.QueryParams
}

/**
 * Options passed to a Part's `mount()` method.
 */
export type MountOptions = {
    capturePath?: string
}

/**
 * Base class for all parts.
 */
export abstract class Part<StateType> {
    
    /// Root

    // root parts themselves will not have a root
    private _root?: StatelessPart

    public get root(): StatelessPart {
        return this._root || this
    }


    /// Children
    
    private children: {[id: string]: StatelessPart} = {}
    private namedChildren: {[id: string]: StatelessPart} = {}

    /**
     * Iterates over each direct child part.
     */
    eachChild(func: (child: StatelessPart) => void) {
        for (let child of Object.values(this.children)) {
            func(child)
        }
    }

    /**
     * Removes a child part by id.
     * @param child the id of the part
     */
    removeChild(child: StatelessPart) {
        // remove the corresponding DOM node, if it exists
        const elem = child._attachedElement
        if (elem) {
            log.debug(`Deleting DOM node for part ${child.name} ${child.id}`, elem)
            elem.remove()
        }
        delete this.children[child.id]
    }

    /**
     * Looks up a child part by name.
     * @param name the name of the child part assigned during `makePart` or `makeStatelessPart`
     */
    namedChild(name: string): StatelessPart | undefined {
        return this.namedChildren[name]
    }


    /// Construction

    constructor(
        private readonly parent: PartParent,
        public readonly id: string,
        public state: StateType
    ) {
        this._renderState = "dirty"
        if (parent) {
            this._root = parent.root
        }
    }

    /**
     * @return the name of the part class.
     */
    get name(): string {
        return this.constructor.name
    }

    makeStatelessPart<PartType extends StatelessPart>(
        constructor: {new (p: PartParent, id: string, state: {}): PartType},
        name?: string): PartType 
    {
        let part = this.root._makeParentedPart(constructor, this, {})
        this.children[part.id] = part
        if (name) {
            if (this.namedChildren[name]) {
                this.removeChild(this.namedChildren[name])
            }
            this.namedChildren[name] = part
        }
        return part
    }


    makePart<
        PartType extends Part<PartStateType>,
        PartStateType,
        InferredPartStateType extends PartStateType
    >(
        constructor: {new (p: PartParent, id: string, state: PartStateType): PartType},
        state: InferredPartStateType,
        name?: string
    ): PartType {
        let part = this.root._makeParentedPart(constructor, this, state)
        this.children[part.id] = part
        if (name) {
            if (this.namedChildren[name]) {
                this.removeChild(this.namedChildren[name])
            }
            this.namedChildren[name] = part
        }
        return part
    }

    private _makeParentedPart<
        PartType extends Part<PartStateType>,
        PartStateType,
        InferredPartStateType extends PartStateType
    >(
        constructor: {new (p: PartParent, id: string, state: PartStateType): PartType}, 
        parent: PartParent, 
        state: InferredPartStateType
    ): PartType {
        _idCount += 1
        let part = new constructor(parent || this, `tuff-part-${ _idCount.toString() }`, state)
        if (parent) { 
            // don't register as a root-level part if there's a different parent
        }
        else { 
            this.children[part.id] = part
        }
        part._init()
        return part
    }


    /// Initialization

    private _initializing = false
    private _initialized = false

    get isInitializing(): boolean {
        return this._initializing
    }

    get isInitialized(): boolean {
        return this._initialized
    }

    private _init() {
        const root = this.root
        this._context = root._context
        if (!this._initializing) { // don't initialize more than once, even if the first time hasn't completed
            this._initializing = true
            log.debug(`Initializing ${this.name}`, this)
            this.init().then(_ => {
                this._initialized = true
                log.debug(`Loading ${this.name} after init at frame ${this._context.frame}`, this)
                this.load()
            })
        }
        this.eachChild(child => {
            child._init()
        })
    }

    /**
     * Parts can override this to provide custom behavior that is run
     * exactly once before the part is rendered for the first time.
     */
    async init() {
    }


    /// Loading

    /**
     * Parts can override this to provide custom behavior that is run after init()
     * and whenever the page changes.
     */
    load() {

    }

    /**
     * Computes a new context and loads this and all child parts.
     * Meant to be used by Nav.
     */
    loadAll() {
        this._computeContext()
        this._load()
    }

    private _load() {
        if (!this.isInitialized) {
            // don't load before init() is done
            return
        }
        this.load()
        this.eachChild(child => {
            child._context = this._context
            child._load()
        })
    }


    /// Context

    protected _context!: PartContext

    /**
     * Returns the current context.
     */
    get context(): PartContext {
        return this._context
    }

    /**
     * Returns the query params from the current context.
     */
    get params(): urls.QueryParams {
        return this._context.queryParams
    }

    _computeContext(frame: number = 0): PartContext {
        log.debug(`Computing context with ${window.location.href}`)
        return this._context = {
            frame,
            href: window.location.href,
            host: window.location.host,
            path: window.location.pathname,
            queryParams: urls.parseQueryParams(window.location.search)
        }
    }


    /// Dirty Tracking

    private _renderState: RenderState = "dirty"

    /**
     * Assigns a new state and marks the part dirty if it's different than the old one.
     * @param state
     * @return true if the state is different
     */
    assignState(state: StateType): boolean {
        if (state == this.state) {
            return false
        }
        this.state = state
        this.dirty()
        return true
    }

    /**
     * Mark this part as dirty, meaning it needs to be fully re-rendered.
     */
    dirty() {
        log.debug(`Dirty ${this.name}`, this)
        this._renderState = "dirty"
        this.root._requestFrame()
    }

    /**
     * Mark this part as stale, meaning it needs to be updated but not rendered.
     */
    stale() {
        log.debug(`Stale ${this.name}`, this)
        if (this._renderState == "clean") {
            this._renderState = "stale"
            this.root._requestFrame()
        }
    }

    private _frameRequested = false

    /**
     * Requests the next animation frame to render the part.
     */
    private _requestFrame() {
        if (this._frameRequested) return
        this._frameRequested = true
        requestAnimationFrame(frame => {
            this._frameRequested = false
            log.debug('Animation frame', frame)
            this._context.frame = frame
            this._markClean(frame)
            this._attachEventListeners()
        })
    }


    /// DOM Messages

    private handlerMap = new messages.HandlerMap()

    listen<EventType extends keyof messages.EventMap, DataType>(
        type: EventType, 
        key: messages.UntypedKey,
        handler: (m: messages.EventMessageTypeMap<EventType,DataType>[EventType]) => void,
        options: messages.ListenOptions): void

    listen<EventType extends keyof messages.EventMap, DataType>(
        type: EventType, 
        key: messages.TypedKey<DataType>,
        handler: (m: messages.EventMessageTypeMap<EventType,DataType>[EventType]) => void,
        options?: messages.ListenOptions): void

    /**
     * Registers a message handler to listen for messages.
     * @param type the event type
     * @param key the message key
     * @param handler the function to get called in response to the message
     * @param options configures how the handler listens for the messages
     */
    listen<EventType extends keyof messages.EventMap, DataType>(
        type: EventType, 
        key: messages.UntypedKey | messages.TypedKey<DataType>,
        handler: (m: messages.EventMessageTypeMap<EventType,DataType>[EventType]) => void,
        options: messages.ListenOptions={}): void
    { 
        if (options?.attach == "passive" && this != this.root) {
            const newOptions = {attach: "active" as messages.ListenAttach, ...options}
            this.root.listen(type, key, handler, newOptions)
            return
        }
        this.handlerMap.add({
            type: type,
            key: key,
            options: options,
            callback: handler
        })
    }

    /**
     * Listens for a generic message on the part (emitted with emitMessage()).
     * @param key the message key
     * @param handler the message handler
     * @param options message handling options
     */
    listenMessage<DataType>(
        key: messages.UntypedKey | messages.TypedKey<DataType>,
        handler: (m: messages.Message<"message",DataType>) => void,
        options: messages.ListenOptions={})
    {
        this.listen("message", key, handler, options)
    }

    protected _needsEventListeners = true

    /**
     * Tells the children that they need to attach event listeners.
     * @param includeMe only set _needsEventListeners on this if it's true
     */
    private _setNeedsEventListeners(includeMe: boolean) {
        if (includeMe) {
            this._needsEventListeners = true
        }
        this.eachChild(child => {
            child._setNeedsEventListeners(true)
        })
    }

    /**
     * Attaches event listeners to this.element (if needsEventListeners() has been called)
     * Needs to be protected for FormPart.
     */
    protected _attachEventListeners() {
        if (this._initialized && this._needsEventListeners) {
            this._needsEventListeners = false
            let elem = this.element
            if (elem) {
                for (let type of this.handlerMap.allTypes()) {
                    this.addDomListener(elem, type as EventKey)
                }
            }
            else {
                log.warn("Trying to attach event listeners to a part without an element", this)
            }
        }
        this.eachChild(child => {
            child._attachEventListeners()
        })
    }

    /**
     * Attaches an event listener for a particular type of HTML event.
     * Only event types with Tuff listeners will have HTML listeners attached.
     */
    private addDomListener(elem: HTMLElement, type: EventKey) {
        const part = this
        let opts: AddEventListenerOptions | undefined = undefined
        if (nonBubblingEvents.includes(type)) {
            opts = {capture: true, passive: true}
        }
        log.debug(`Attaching ${type} event listeners to`, elem, opts)
        elem.addEventListener(type, function(this: HTMLElement, evt: HTMLElementEventMap[typeof type]) {

            // traverse the DOM path to find an event key
            let maybeTarget: HTMLElement | null = null
            let keys: string[] | null = null
            const typeKey = `tuff${type}`
            for (let e of evt.composedPath()) {
                let data = (e as any).dataset
                if (data && data[typeKey]?.length) {
                    keys = data[typeKey].split(';')
                    maybeTarget = e as HTMLElement
                    break
                }
            }
            const target = maybeTarget!

            if (!keys?.length) return
            for (let k of keys) {
                let data = {}
                if (target.dataset[k]) {
                    data = JSON.parse(decodeURIComponent(target.dataset[k] as string))
                }
                part.emit(type, {id: k}, evt, data)
            }
        }, opts)
    }

    /** 
     * Creates and emits a message for the given type and key.
     */
    emit<EventType extends keyof messages.EventMap, DataType>(
        type: EventType,
        key: messages.TypedKey<DataType>,
        evt: messages.EventMap[EventType],
        data: DataType,
        options: EmitOptions={}
    ): void {
        const message = {
            type: type,
            event: evt,
            data: data
        } as EventMessageTypeMap<EventType, DataType>[EventType]

        if ('target' in evt && evt.target && 'value' in evt.target) {
            if (type === 'change' || type === 'input') {
                (message as ValueMessage<ValueEvents, DataType>).value = evt.target.value as string
            }
        }

        this.handlerMap.each(type, key, handler => {
            handler.callback(message)
        })
        if (options.scope == "bubble" && this.parent && this.parent != this) {
            this.parent.emit(type, key, evt, data, options)
        }
    }

    /**
     * Emits a generic message associated with the part (as opposed to a DOM event).
     * @param key the message key
     * @param data data associated with the message
     * @param options configures how the message is emitted 
     */
    emitMessage<DataType>(
        key: messages.TypedKey<DataType>,
        data: DataType,
        options?: EmitOptions)
    {
        options ||= {scope: 'bubble'}
        this.emit("message", key, {part: this}, data, options)
    }


    /// Key Press Events

    /**
     * Register a listener for a specific global key press event.
     */ 
    onKeyPress(press: messages.KeyPress, listener: (m: messages.Message<"keypress",messages.KeyPress>) => void) {
        keyboard.registerPart(this) // make sure we're registered to receive global keyboard events
        this.listen<"keypress",messages.KeyPress>("keypress", press, listener, {attach: "active"})
    }


    /**
     * Register a wildcard listener for all global keyboard events.
     * @param listener the listener function
     */
    onAnyKeyPress(listener: keyboard.Listener) {
        keyboard.registerPart(this, listener) // make sure we're registered to receive global keyboard events
    }


    /// Mounting
    
    /**
     * The DOM element to which which this part has been explicitly mounted.
     * (Will be undefined for all except root parts)
     */
    private _mountElement?: HTMLElement
    
    /**
     * The DOM element to which this part was last rendered.
     */
    private _attachedElement?: HTMLElement

    /**
     * @returns Either this part's explicit mount element, or the element found by its id.
     * This will return null if the part is un-attached parts, i.e.:
     * - Root elements that have never been mounted
     * - Child elements that have never been rendered
     * - Child elements that have since been orphaned by their parents
    */
    get element(): HTMLElement | null {
        return this._attachedElement || this._mountElement || null
    }

    /** 
     * @returns Whether or not the part is currently in the DOM tree with either a parent or a valid DOM element mount point.
    */
    get isAttached(): boolean {
        return !!this.element && !!this.element.isConnected
    }

    /**
     * @returns Whether the part is a root part (doesn't have a parent, is mounted directly to a DOM element).
     */
    get isRoot(): boolean {
        return !!this._mountElement
    }

    private mount(elem: MountPoint, mountOptions?: MountOptions) {
        if (elem instanceof HTMLElement) {
            this._mountElement = elem!
        }
        else {
            this._mountElement = document.getElementById(elem)!
        }

        const partClass = this.name
        this._mountElement.classList.add(`tuff-part-${partClass}`)
        this._mountElement.dataset.tuffPart = partClass

        if (mountOptions?.capturePath?.length) {
            Nav.initCapture(this, mountOptions.capturePath)
        }

        this._computeContext()
        this._requestFrame()
    }

    /** 
     * Mounts a part to a DOM element (by DOM object or id).
     */
    static mount<PartType extends Part<StateType>, StateType>
            (partType: PartConstructor<PartType,StateType>, mountPoint: MountPoint, state: StateType, mountOptions?: MountOptions): PartType {
        const id = typeof mountPoint == 'string' ? mountPoint : mountPoint.getAttribute("id")
        if (!id) {
            throw "You must either mount a part directly to a DOM node with id attribute or provide the id value as a string"
        }
        const part = new partType(null, id, state)
        part.mount(mountPoint, mountOptions)
        return part
    }

    
    /// Rendering

    renderInTag(container: HtmlParentTag) {
        const partClass = this.name;
        container.div({ id: this.id, class: `tuff-part-${partClass}`, data: { tuffPart: partClass }}, parent => {
            parent.class(...this.parentClasses)
            if (this.isInitialized) {
                this._renderState = "clean"
                this.render(parent)
            }
        })
    }

    abstract render(parent: PartTag): any

    /**
     * Subclasses can override this to provide a list of 
     * classes to apply to the parent element.
     */
    get parentClasses(): Array<string> {
        return []
    }

    /**
     * Recursively crawls the children to see if any is dirty, then renders their entire branch.
     * If they're only stale, calls the update() method.
     */
    private _markClean(frame: number) {
        this._init()
        // init() is async, so we don't actually know if it finished
        if (!this.isInitialized) {
            return
        }
        if (this._renderState == "dirty") {
            // get the exiting container element
            const elem = this.element
            if (!elem) {
                // trying to render part with no container element, it's parent must not've been rendered yet
                return
            }

            // stop the chain, re-render the whole tree from here on down
            log.debugTime(`Render ${this.id}`, () => {
                // render the part's content to the container
                let parent = new DivTag('div')
                parent.class(...this.parentClasses)
                this._context.frame = frame
                this.render(parent)
                let output = Array<string>()
                parent.buildInner(output)
                elem.innerHTML = output.join('')

                // this element doesn't need new event listeners since only the innerHTML was replaced
                this._setNeedsEventListeners(false)
                this._update()
            })
        }
        else if (this._renderState == "stale") {
            this._update()
        }
        else {
            // keep propagating through the tree to see if anyone else needs to be rendered or updated
            this.eachChild(child => {
                child._markClean(frame)
            })
        }
    }


    /// Updating

    /**
     * Gets called every time the part is rendered.
     * @param _elem the actual DOM element containing the part
     */
    update(_elem: HTMLElement) {

    }

    /**
     * Recursively calls `update()` on this part and all of its children.
     */
    private _update() {
        let elem = this.element
        if (!elem || !elem.isConnected) {
            elem = document.getElementById(this.id)
            this._attachedElement = elem!
        }
        if (!elem) {
            // if the part has no element, it likely hasn't been rendered yet
            // it's fine to silently skip it for now
            return
        }
        this.update(elem)
        this._renderState = "clean"
        this.eachChild(child => {
            child._update()
        })
    }


    /// Collections

    /**
     * Computes the element ID where the given collection will be rendered.
     * @param name the collection name passed to `assignCollection()` and `renderCollection()`.
     */
    computeCollectionId(name: string): string {
        return `${this.id}-collection-${slugify(name)}`
    }

    /**
     * Gets the DOM element that contains the rendered collection of the given name (if it's been rendered).
     * @param name the collection name passed to `assignCollection()` and `renderCollection()`.
     */
    getCollectionContainer(name: string): HTMLElement | null {
        return document.getElementById(this.computeCollectionId(name))
    }

    private _collectionParts: Record<string, StatelessPart[]> = {}

    /**
     * Gets the last generated set of parts for the given named collection.
     * @param name the name passed to `assignCollection()` and `renderCollection()`
     */
    getCollectionParts(name: string): StatelessPart[] {
        return this._collectionParts[name] || []
    }

    /**
     * Creates/updates the parts used to render a named collection of states.
     * This will intelligently make the parts dirty only if their state has changed.
     * @param name the collection name passed to `renderCollection()` to render
     * @param partType the type of part to create
     * @param states an array of states to map to parts
     */
    assignCollection<ChildState>(name: string, partType: PartConstructor<Part<ChildState>, ChildState>, states: ChildState[]): StatelessPart[] {
        log.debug(`Assigning ${name} collection`, states)
        let parts = this._collectionParts[name] || []
        const oldCount = parts.length

        // determine where to add new children
        const container = this.getCollectionContainer(name)
        if (container) {
            log.debug(`Collection ${name} container exists, appending new child parts to it`)
        }
        else {
            // the collection must not have been rendered,
            // mark this part dirty so that the whole thing gets rendered
            log.debug(`Collection ${name} container doesn't exist, marking this part dirty`)
            this.dirty()
        }

        // iterate through the states and assign them to the parts,
        // creating new ones when necessary
        for (let i = 0; i<states.length; i++) {
            let state = states[i]
            if (i < oldCount) {
                // re-use an existing part, just updating its state
                const part = parts[i]
                if (part.assignState(state)) {
                    log.debug(`State changed for ${name} collection part ${part.id} (${i}), marking it dirty`)
                }
                else {
                    log.debug(`State remained the same for ${name} collection part ${part.id} (${i})`)
                }
            }
            else {
                // make a new part and attach it to the DOM
                log.debug(`Creating new ${name} collection part (${i}) for`, state)
                const part = this.makePart(partType, state)
                parts.push(part)
                if (container) {
                    // if the collection has already been rendered,
                    // add a new container for this part and attach it
                    const elem = Html.createElement("div", div => {
                        div.id(part.id)
                    })
                    container.append(elem)
                    log.debug(`Created new ${name} collection part (${i}) element`, elem)
                    part._attachedElement = elem
                    part.dirty()
                }

            }
        }

        // remove any unused parts
        if (parts.length > states.length) {
            for (let i = states.length; i < parts.length; i++) {
                log.debug(`Removing unused ${name} collection part ${i}`, parts[i])
                this.removeChild(parts[i])
            }
            this._collectionParts[name] = parts.slice(0, states.length)
        }
        else {
            this._collectionParts[name] = parts
        }

        // return the updated parts collection
        return this._collectionParts[name]
    }

    /**
     * Renders a named collection into the given parent.
     * Note: you should call `assignCollection()` with this name first.
     * @param parent the tag into which to render the collection
     * @param name the name of the collection passed to `assignCollection()`
     * @return the collection container tag
     */
    renderCollection(parent: PartTag, name: string) {
        const parts = this._collectionParts[name] || []
        // create the container even if there are no parts so that
        // inserting new ones doesn't force this part to dirty
        return parent.div({id: this.computeCollectionId(name)}, container => {
            for (const part of parts) {
                container.part(part)
            }
        })
    }



    //// Begin Listen Methods

    onAbort<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"abort", DataType>["abort"]) => void, options?: messages.ListenOptions): void
    onAbort<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"abort", DataType>["abort"]) => void, options?: messages.ListenOptions): void
    onAbort<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"abort", DataType>["abort"]) => void, options?: messages.ListenOptions): void {
        this.listen<"abort",DataType>("abort", key, listener, options)
    }
    
    onAnimationCancel<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"animationcancel", DataType>["animationcancel"]) => void, options?: messages.ListenOptions): void
    onAnimationCancel<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"animationcancel", DataType>["animationcancel"]) => void, options?: messages.ListenOptions): void
    onAnimationCancel<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"animationcancel", DataType>["animationcancel"]) => void, options?: messages.ListenOptions): void {
        this.listen<"animationcancel",DataType>("animationcancel", key, listener, options)
    }
    
    onAnimationEnd<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"animationend", DataType>["animationend"]) => void, options?: messages.ListenOptions): void
    onAnimationEnd<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"animationend", DataType>["animationend"]) => void, options?: messages.ListenOptions): void
    onAnimationEnd<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"animationend", DataType>["animationend"]) => void, options?: messages.ListenOptions): void {
        this.listen<"animationend",DataType>("animationend", key, listener, options)
    }
    
    onAnimationIteration<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"animationiteration", DataType>["animationiteration"]) => void, options?: messages.ListenOptions): void
    onAnimationIteration<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"animationiteration", DataType>["animationiteration"]) => void, options?: messages.ListenOptions): void
    onAnimationIteration<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"animationiteration", DataType>["animationiteration"]) => void, options?: messages.ListenOptions): void {
        this.listen<"animationiteration",DataType>("animationiteration", key, listener, options)
    }
    
    onAnimationStart<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"animationstart", DataType>["animationstart"]) => void, options?: messages.ListenOptions): void
    onAnimationStart<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"animationstart", DataType>["animationstart"]) => void, options?: messages.ListenOptions): void
    onAnimationStart<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"animationstart", DataType>["animationstart"]) => void, options?: messages.ListenOptions): void {
        this.listen<"animationstart",DataType>("animationstart", key, listener, options)
    }
    
    onAuxClick<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"auxclick", DataType>["auxclick"]) => void, options?: messages.ListenOptions): void
    onAuxClick<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"auxclick", DataType>["auxclick"]) => void, options?: messages.ListenOptions): void
    onAuxClick<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"auxclick", DataType>["auxclick"]) => void, options?: messages.ListenOptions): void {
        this.listen<"auxclick",DataType>("auxclick", key, listener, options)
    }
    
    onBeforeInput<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"beforeinput", DataType>["beforeinput"]) => void, options?: messages.ListenOptions): void
    onBeforeInput<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"beforeinput", DataType>["beforeinput"]) => void, options?: messages.ListenOptions): void
    onBeforeInput<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"beforeinput", DataType>["beforeinput"]) => void, options?: messages.ListenOptions): void {
        this.listen<"beforeinput",DataType>("beforeinput", key, listener, options)
    }
    
    onBlur<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"blur", DataType>["blur"]) => void, options?: messages.ListenOptions): void
    onBlur<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"blur", DataType>["blur"]) => void, options?: messages.ListenOptions): void
    onBlur<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"blur", DataType>["blur"]) => void, options?: messages.ListenOptions): void {
        this.listen<"blur",DataType>("blur", key, listener, options)
    }
    
    onCancel<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.Message<"cancel",DataType>) => void, options?: messages.ListenOptions): void
    onCancel<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"cancel",DataType>) => void, options?: messages.ListenOptions): void
    onCancel<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"cancel",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"cancel",DataType>("cancel", key, listener, options)
    }

    onCanPlay<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.Message<"canplay",DataType>) => void, options?: messages.ListenOptions): void
    onCanPlay<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"canplay",DataType>) => void, options?: messages.ListenOptions): void
    onCanPlay<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"canplay",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"canplay",DataType>("canplay", key, listener, options)
    }
    
    onCanPlayThrough<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"canplaythrough", DataType>["canplaythrough"]) => void, options?: messages.ListenOptions): void
    onCanPlayThrough<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"canplaythrough", DataType>["canplaythrough"]) => void, options?: messages.ListenOptions): void
    onCanPlayThrough<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"canplaythrough", DataType>["canplaythrough"]) => void, options?: messages.ListenOptions): void {
        this.listen<"canplaythrough",DataType>("canplaythrough", key, listener, options)
    }
    
    onChange<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"change", DataType>["change"]) => void, options?: messages.ListenOptions): void
    onChange<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"change", DataType>["change"]) => void, options?: messages.ListenOptions): void
    onChange<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"change", DataType>["change"]) => void, options?: messages.ListenOptions): void {
        this.listen<"change",DataType>("change", key, listener, options)
    }
    
    onClick<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"click", DataType>["click"]) => void, options?: messages.ListenOptions): void
    onClick<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"click", DataType>["click"]) => void, options?: messages.ListenOptions): void
    onClick<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"click", DataType>["click"]) => void, options?: messages.ListenOptions): void {
        this.listen<"click",DataType>("click", key, listener, options)
    }
    
    onClose<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"close", DataType>["close"]) => void, options?: messages.ListenOptions): void
    onClose<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"close", DataType>["close"]) => void, options?: messages.ListenOptions): void
    onClose<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"close", DataType>["close"]) => void, options?: messages.ListenOptions): void {
        this.listen<"close",DataType>("close", key, listener, options)
    }
    
    onCompositionEnd<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"compositionend", DataType>["compositionend"]) => void, options?: messages.ListenOptions): void
    onCompositionEnd<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"compositionend", DataType>["compositionend"]) => void, options?: messages.ListenOptions): void
    onCompositionEnd<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"compositionend", DataType>["compositionend"]) => void, options?: messages.ListenOptions): void {
        this.listen<"compositionend",DataType>("compositionend", key, listener, options)
    }
    
    onCompositionStart<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"compositionstart", DataType>["compositionstart"]) => void, options?: messages.ListenOptions): void
    onCompositionStart<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"compositionstart", DataType>["compositionstart"]) => void, options?: messages.ListenOptions): void
    onCompositionStart<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"compositionstart", DataType>["compositionstart"]) => void, options?: messages.ListenOptions): void {
        this.listen<"compositionstart",DataType>("compositionstart", key, listener, options)
    }
    
    onCompositionUpdate<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"compositionupdate", DataType>["compositionupdate"]) => void, options?: messages.ListenOptions): void
    onCompositionUpdate<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"compositionupdate", DataType>["compositionupdate"]) => void, options?: messages.ListenOptions): void
    onCompositionUpdate<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"compositionupdate", DataType>["compositionupdate"]) => void, options?: messages.ListenOptions): void {
        this.listen<"compositionupdate",DataType>("compositionupdate", key, listener, options)
    }
    
    onContextMenu<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"contextmenu", DataType>["contextmenu"]) => void, options?: messages.ListenOptions): void
    onContextMenu<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"contextmenu", DataType>["contextmenu"]) => void, options?: messages.ListenOptions): void
    onContextMenu<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"contextmenu", DataType>["contextmenu"]) => void, options?: messages.ListenOptions): void {
        this.listen<"contextmenu",DataType>("contextmenu", key, listener, options)
    }
    
    onCopy<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"copy", DataType>["copy"]) => void, options?: messages.ListenOptions): void
    onCopy<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"copy", DataType>["copy"]) => void, options?: messages.ListenOptions): void
    onCopy<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"copy", DataType>["copy"]) => void, options?: messages.ListenOptions): void {
        this.listen<"copy",DataType>("copy", key, listener, options)
    }
    
    onCueChange<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"cuechange", DataType>["cuechange"]) => void, options?: messages.ListenOptions): void
    onCueChange<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"cuechange", DataType>["cuechange"]) => void, options?: messages.ListenOptions): void
    onCueChange<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"cuechange", DataType>["cuechange"]) => void, options?: messages.ListenOptions): void {
        this.listen<"cuechange",DataType>("cuechange", key, listener, options)
    }
    
    onCut<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"cut", DataType>["cut"]) => void, options?: messages.ListenOptions): void
    onCut<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"cut", DataType>["cut"]) => void, options?: messages.ListenOptions): void
    onCut<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"cut", DataType>["cut"]) => void, options?: messages.ListenOptions): void {
        this.listen<"cut",DataType>("cut", key, listener, options)
    }
    
    onDblClick<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"dblclick", DataType>["dblclick"]) => void, options?: messages.ListenOptions): void
    onDblClick<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"dblclick", DataType>["dblclick"]) => void, options?: messages.ListenOptions): void
    onDblClick<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"dblclick", DataType>["dblclick"]) => void, options?: messages.ListenOptions): void {
        this.listen<"dblclick",DataType>("dblclick", key, listener, options)
    }
    
    onDrag<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"drag", DataType>["drag"]) => void, options?: messages.ListenOptions): void
    onDrag<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"drag", DataType>["drag"]) => void, options?: messages.ListenOptions): void
    onDrag<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"drag", DataType>["drag"]) => void, options?: messages.ListenOptions): void {
        this.listen<"drag",DataType>("drag", key, listener, options)
    }
    
    onDragEnd<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"dragend", DataType>["dragend"]) => void, options?: messages.ListenOptions): void
    onDragEnd<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"dragend", DataType>["dragend"]) => void, options?: messages.ListenOptions): void
    onDragEnd<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"dragend", DataType>["dragend"]) => void, options?: messages.ListenOptions): void {
        this.listen<"dragend",DataType>("dragend", key, listener, options)
    }
    
    onDragEnter<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"dragenter", DataType>["dragenter"]) => void, options?: messages.ListenOptions): void
    onDragEnter<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"dragenter", DataType>["dragenter"]) => void, options?: messages.ListenOptions): void
    onDragEnter<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"dragenter", DataType>["dragenter"]) => void, options?: messages.ListenOptions): void {
        this.listen<"dragenter",DataType>("dragenter", key, listener, options)
    }
    
    onDragLeave<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"dragleave", DataType>["dragleave"]) => void, options?: messages.ListenOptions): void
    onDragLeave<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"dragleave", DataType>["dragleave"]) => void, options?: messages.ListenOptions): void
    onDragLeave<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"dragleave", DataType>["dragleave"]) => void, options?: messages.ListenOptions): void {
        this.listen<"dragleave",DataType>("dragleave", key, listener, options)
    }
    
    onDragOver<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"dragover", DataType>["dragover"]) => void, options?: messages.ListenOptions): void
    onDragOver<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"dragover", DataType>["dragover"]) => void, options?: messages.ListenOptions): void
    onDragOver<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"dragover", DataType>["dragover"]) => void, options?: messages.ListenOptions): void {
        this.listen<"dragover",DataType>("dragover", key, listener, options)
    }
    
    onDragStart<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"dragstart", DataType>["dragstart"]) => void, options?: messages.ListenOptions): void
    onDragStart<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"dragstart", DataType>["dragstart"]) => void, options?: messages.ListenOptions): void
    onDragStart<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"dragstart", DataType>["dragstart"]) => void, options?: messages.ListenOptions): void {
        this.listen<"dragstart",DataType>("dragstart", key, listener, options)
    }
    
    onDrop<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"drop", DataType>["drop"]) => void, options?: messages.ListenOptions): void
    onDrop<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"drop", DataType>["drop"]) => void, options?: messages.ListenOptions): void
    onDrop<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"drop", DataType>["drop"]) => void, options?: messages.ListenOptions): void {
        this.listen<"drop",DataType>("drop", key, listener, options)
    }
    
    onDurationChange<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"durationchange", DataType>["durationchange"]) => void, options?: messages.ListenOptions): void
    onDurationChange<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"durationchange", DataType>["durationchange"]) => void, options?: messages.ListenOptions): void
    onDurationChange<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"durationchange", DataType>["durationchange"]) => void, options?: messages.ListenOptions): void {
        this.listen<"durationchange",DataType>("durationchange", key, listener, options)
    }
    
    onEmptied<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"emptied", DataType>["emptied"]) => void, options?: messages.ListenOptions): void
    onEmptied<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"emptied", DataType>["emptied"]) => void, options?: messages.ListenOptions): void
    onEmptied<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"emptied", DataType>["emptied"]) => void, options?: messages.ListenOptions): void {
        this.listen<"emptied",DataType>("emptied", key, listener, options)
    }
    
    onEnded<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"ended", DataType>["ended"]) => void, options?: messages.ListenOptions): void
    onEnded<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"ended", DataType>["ended"]) => void, options?: messages.ListenOptions): void
    onEnded<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"ended", DataType>["ended"]) => void, options?: messages.ListenOptions): void {
        this.listen<"ended",DataType>("ended", key, listener, options)
    }
    
    onError<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"error", DataType>["error"]) => void, options?: messages.ListenOptions): void
    onError<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"error", DataType>["error"]) => void, options?: messages.ListenOptions): void
    onError<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"error", DataType>["error"]) => void, options?: messages.ListenOptions): void {
        this.listen<"error",DataType>("error", key, listener, options)
    }
    
    onFocus<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"focus", DataType>["focus"]) => void, options?: messages.ListenOptions): void
    onFocus<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"focus", DataType>["focus"]) => void, options?: messages.ListenOptions): void
    onFocus<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"focus", DataType>["focus"]) => void, options?: messages.ListenOptions): void {
        this.listen<"focus",DataType>("focus", key, listener, options)
    }
    
    onFocusIn<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"focusin", DataType>["focusin"]) => void, options?: messages.ListenOptions): void
    onFocusIn<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"focusin", DataType>["focusin"]) => void, options?: messages.ListenOptions): void
    onFocusIn<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"focusin", DataType>["focusin"]) => void, options?: messages.ListenOptions): void {
        this.listen<"focusin",DataType>("focusin", key, listener, options)
    }
    
    onFocusOut<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"focusout", DataType>["focusout"]) => void, options?: messages.ListenOptions): void
    onFocusOut<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"focusout", DataType>["focusout"]) => void, options?: messages.ListenOptions): void
    onFocusOut<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"focusout", DataType>["focusout"]) => void, options?: messages.ListenOptions): void {
        this.listen<"focusout",DataType>("focusout", key, listener, options)
    }
    
    onFormData<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"formdata", DataType>["formdata"]) => void, options?: messages.ListenOptions): void
    onFormData<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"formdata", DataType>["formdata"]) => void, options?: messages.ListenOptions): void
    onFormData<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"formdata", DataType>["formdata"]) => void, options?: messages.ListenOptions): void {
        this.listen<"formdata",DataType>("formdata", key, listener, options)
    }
    
    onFullscreenChange<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"fullscreenchange", DataType>["fullscreenchange"]) => void, options?: messages.ListenOptions): void
    onFullscreenChange<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"fullscreenchange", DataType>["fullscreenchange"]) => void, options?: messages.ListenOptions): void
    onFullscreenChange<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"fullscreenchange", DataType>["fullscreenchange"]) => void, options?: messages.ListenOptions): void {
        this.listen<"fullscreenchange",DataType>("fullscreenchange", key, listener, options)
    }
    
    onFullscreenError<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"fullscreenerror", DataType>["fullscreenerror"]) => void, options?: messages.ListenOptions): void
    onFullscreenError<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"fullscreenerror", DataType>["fullscreenerror"]) => void, options?: messages.ListenOptions): void
    onFullscreenError<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"fullscreenerror", DataType>["fullscreenerror"]) => void, options?: messages.ListenOptions): void {
        this.listen<"fullscreenerror",DataType>("fullscreenerror", key, listener, options)
    }
    
    onGotPointerCapture<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"gotpointercapture", DataType>["gotpointercapture"]) => void, options?: messages.ListenOptions): void
    onGotPointerCapture<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"gotpointercapture", DataType>["gotpointercapture"]) => void, options?: messages.ListenOptions): void
    onGotPointerCapture<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"gotpointercapture", DataType>["gotpointercapture"]) => void, options?: messages.ListenOptions): void {
        this.listen<"gotpointercapture",DataType>("gotpointercapture", key, listener, options)
    }
    
    onInput<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"input", DataType>["input"]) => void, options?: messages.ListenOptions): void
    onInput<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"input", DataType>["input"]) => void, options?: messages.ListenOptions): void
    onInput<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"input", DataType>["input"]) => void, options?: messages.ListenOptions): void {
        this.listen<"input",DataType>("input", key, listener, options)
    }
    
    onInvalid<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"invalid", DataType>["invalid"]) => void, options?: messages.ListenOptions): void
    onInvalid<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"invalid", DataType>["invalid"]) => void, options?: messages.ListenOptions): void
    onInvalid<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"invalid", DataType>["invalid"]) => void, options?: messages.ListenOptions): void {
        this.listen<"invalid",DataType>("invalid", key, listener, options)
    }
    
    onKeyDown<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"keydown", DataType>["keydown"]) => void, options?: messages.ListenOptions): void
    onKeyDown<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"keydown", DataType>["keydown"]) => void, options?: messages.ListenOptions): void
    onKeyDown<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"keydown", DataType>["keydown"]) => void, options?: messages.ListenOptions): void {
        this.listen<"keydown",DataType>("keydown", key, listener, options)
    }
    
    onKeyUp<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"keyup", DataType>["keyup"]) => void, options?: messages.ListenOptions): void
    onKeyUp<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"keyup", DataType>["keyup"]) => void, options?: messages.ListenOptions): void
    onKeyUp<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"keyup", DataType>["keyup"]) => void, options?: messages.ListenOptions): void {
        this.listen<"keyup",DataType>("keyup", key, listener, options)
    }
    
    onLoad<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"load", DataType>["load"]) => void, options?: messages.ListenOptions): void
    onLoad<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"load", DataType>["load"]) => void, options?: messages.ListenOptions): void
    onLoad<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"load", DataType>["load"]) => void, options?: messages.ListenOptions): void {
        this.listen<"load",DataType>("load", key, listener, options)
    }
    
    onLoadedData<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"loadeddata", DataType>["loadeddata"]) => void, options?: messages.ListenOptions): void
    onLoadedData<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"loadeddata", DataType>["loadeddata"]) => void, options?: messages.ListenOptions): void
    onLoadedData<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"loadeddata", DataType>["loadeddata"]) => void, options?: messages.ListenOptions): void {
        this.listen<"loadeddata",DataType>("loadeddata", key, listener, options)
    }
    
    onLoadedMetadata<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"loadedmetadata", DataType>["loadedmetadata"]) => void, options?: messages.ListenOptions): void
    onLoadedMetadata<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"loadedmetadata", DataType>["loadedmetadata"]) => void, options?: messages.ListenOptions): void
    onLoadedMetadata<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"loadedmetadata", DataType>["loadedmetadata"]) => void, options?: messages.ListenOptions): void {
        this.listen<"loadedmetadata",DataType>("loadedmetadata", key, listener, options)
    }
    
    onLoadStart<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"loadstart", DataType>["loadstart"]) => void, options?: messages.ListenOptions): void
    onLoadStart<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"loadstart", DataType>["loadstart"]) => void, options?: messages.ListenOptions): void
    onLoadStart<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"loadstart", DataType>["loadstart"]) => void, options?: messages.ListenOptions): void {
        this.listen<"loadstart",DataType>("loadstart", key, listener, options)
    }
    
    onLostPointerCapture<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"lostpointercapture", DataType>["lostpointercapture"]) => void, options?: messages.ListenOptions): void
    onLostPointerCapture<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"lostpointercapture", DataType>["lostpointercapture"]) => void, options?: messages.ListenOptions): void
    onLostPointerCapture<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"lostpointercapture", DataType>["lostpointercapture"]) => void, options?: messages.ListenOptions): void {
        this.listen<"lostpointercapture",DataType>("lostpointercapture", key, listener, options)
    }
    
    onMouseDown<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"mousedown", DataType>["mousedown"]) => void, options?: messages.ListenOptions): void
    onMouseDown<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"mousedown", DataType>["mousedown"]) => void, options?: messages.ListenOptions): void
    onMouseDown<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"mousedown", DataType>["mousedown"]) => void, options?: messages.ListenOptions): void {
        this.listen<"mousedown",DataType>("mousedown", key, listener, options)
    }
    
    onMouseEnter<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"mouseenter", DataType>["mouseenter"]) => void, options?: messages.ListenOptions): void
    onMouseEnter<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"mouseenter", DataType>["mouseenter"]) => void, options?: messages.ListenOptions): void
    onMouseEnter<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"mouseenter", DataType>["mouseenter"]) => void, options?: messages.ListenOptions): void {
        this.listen<"mouseenter",DataType>("mouseenter", key, listener, options)
    }
    
    onMouseLeave<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"mouseleave", DataType>["mouseleave"]) => void, options?: messages.ListenOptions): void
    onMouseLeave<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"mouseleave", DataType>["mouseleave"]) => void, options?: messages.ListenOptions): void
    onMouseLeave<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"mouseleave", DataType>["mouseleave"]) => void, options?: messages.ListenOptions): void {
        this.listen<"mouseleave",DataType>("mouseleave", key, listener, options)
    }
    
    onMouseMove<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"mousemove", DataType>["mousemove"]) => void, options?: messages.ListenOptions): void
    onMouseMove<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"mousemove", DataType>["mousemove"]) => void, options?: messages.ListenOptions): void
    onMouseMove<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"mousemove", DataType>["mousemove"]) => void, options?: messages.ListenOptions): void {
        this.listen<"mousemove",DataType>("mousemove", key, listener, options)
    }
    
    onMouseOut<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"mouseout", DataType>["mouseout"]) => void, options?: messages.ListenOptions): void
    onMouseOut<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"mouseout", DataType>["mouseout"]) => void, options?: messages.ListenOptions): void
    onMouseOut<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"mouseout", DataType>["mouseout"]) => void, options?: messages.ListenOptions): void {
        this.listen<"mouseout",DataType>("mouseout", key, listener, options)
    }
    
    onMouseOver<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"mouseover", DataType>["mouseover"]) => void, options?: messages.ListenOptions): void
    onMouseOver<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"mouseover", DataType>["mouseover"]) => void, options?: messages.ListenOptions): void
    onMouseOver<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"mouseover", DataType>["mouseover"]) => void, options?: messages.ListenOptions): void {
        this.listen<"mouseover",DataType>("mouseover", key, listener, options)
    }
    
    onMouseUp<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"mouseup", DataType>["mouseup"]) => void, options?: messages.ListenOptions): void
    onMouseUp<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"mouseup", DataType>["mouseup"]) => void, options?: messages.ListenOptions): void
    onMouseUp<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"mouseup", DataType>["mouseup"]) => void, options?: messages.ListenOptions): void {
        this.listen<"mouseup",DataType>("mouseup", key, listener, options)
    }
    
    onPaste<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"paste", DataType>["paste"]) => void, options?: messages.ListenOptions): void
    onPaste<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"paste", DataType>["paste"]) => void, options?: messages.ListenOptions): void
    onPaste<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"paste", DataType>["paste"]) => void, options?: messages.ListenOptions): void {
        this.listen<"paste",DataType>("paste", key, listener, options)
    }
    
    onPause<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"pause", DataType>["pause"]) => void, options?: messages.ListenOptions): void
    onPause<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"pause", DataType>["pause"]) => void, options?: messages.ListenOptions): void
    onPause<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"pause", DataType>["pause"]) => void, options?: messages.ListenOptions): void {
        this.listen<"pause",DataType>("pause", key, listener, options)
    }
    
    onPlay<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"play", DataType>["play"]) => void, options?: messages.ListenOptions): void
    onPlay<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"play", DataType>["play"]) => void, options?: messages.ListenOptions): void
    onPlay<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"play", DataType>["play"]) => void, options?: messages.ListenOptions): void {
        this.listen<"play",DataType>("play", key, listener, options)
    }
    
    onPlaying<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"playing", DataType>["playing"]) => void, options?: messages.ListenOptions): void
    onPlaying<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"playing", DataType>["playing"]) => void, options?: messages.ListenOptions): void
    onPlaying<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"playing", DataType>["playing"]) => void, options?: messages.ListenOptions): void {
        this.listen<"playing",DataType>("playing", key, listener, options)
    }
    
    onPointerCancel<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"pointercancel", DataType>["pointercancel"]) => void, options?: messages.ListenOptions): void
    onPointerCancel<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"pointercancel", DataType>["pointercancel"]) => void, options?: messages.ListenOptions): void
    onPointerCancel<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"pointercancel", DataType>["pointercancel"]) => void, options?: messages.ListenOptions): void {
        this.listen<"pointercancel",DataType>("pointercancel", key, listener, options)
    }
    
    onPointerDown<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"pointerdown", DataType>["pointerdown"]) => void, options?: messages.ListenOptions): void
    onPointerDown<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"pointerdown", DataType>["pointerdown"]) => void, options?: messages.ListenOptions): void
    onPointerDown<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"pointerdown", DataType>["pointerdown"]) => void, options?: messages.ListenOptions): void {
        this.listen<"pointerdown",DataType>("pointerdown", key, listener, options)
    }
    
    onPointerEnter<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"pointerenter", DataType>["pointerenter"]) => void, options?: messages.ListenOptions): void
    onPointerEnter<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"pointerenter", DataType>["pointerenter"]) => void, options?: messages.ListenOptions): void
    onPointerEnter<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"pointerenter", DataType>["pointerenter"]) => void, options?: messages.ListenOptions): void {
        this.listen<"pointerenter",DataType>("pointerenter", key, listener, options)
    }
    
    onPointerLeave<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"pointerleave", DataType>["pointerleave"]) => void, options?: messages.ListenOptions): void
    onPointerLeave<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"pointerleave", DataType>["pointerleave"]) => void, options?: messages.ListenOptions): void
    onPointerLeave<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"pointerleave", DataType>["pointerleave"]) => void, options?: messages.ListenOptions): void {
        this.listen<"pointerleave",DataType>("pointerleave", key, listener, options)
    }
    
    onPointerMove<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"pointermove", DataType>["pointermove"]) => void, options?: messages.ListenOptions): void
    onPointerMove<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"pointermove", DataType>["pointermove"]) => void, options?: messages.ListenOptions): void
    onPointerMove<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"pointermove", DataType>["pointermove"]) => void, options?: messages.ListenOptions): void {
        this.listen<"pointermove",DataType>("pointermove", key, listener, options)
    }
    
    onPointerOut<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"pointerout", DataType>["pointerout"]) => void, options?: messages.ListenOptions): void
    onPointerOut<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"pointerout", DataType>["pointerout"]) => void, options?: messages.ListenOptions): void
    onPointerOut<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"pointerout", DataType>["pointerout"]) => void, options?: messages.ListenOptions): void {
        this.listen<"pointerout",DataType>("pointerout", key, listener, options)
    }
    
    onPointerOver<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"pointerover", DataType>["pointerover"]) => void, options?: messages.ListenOptions): void
    onPointerOver<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"pointerover", DataType>["pointerover"]) => void, options?: messages.ListenOptions): void
    onPointerOver<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"pointerover", DataType>["pointerover"]) => void, options?: messages.ListenOptions): void {
        this.listen<"pointerover",DataType>("pointerover", key, listener, options)
    }
    
    onPointerUp<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"pointerup", DataType>["pointerup"]) => void, options?: messages.ListenOptions): void
    onPointerUp<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"pointerup", DataType>["pointerup"]) => void, options?: messages.ListenOptions): void
    onPointerUp<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"pointerup", DataType>["pointerup"]) => void, options?: messages.ListenOptions): void {
        this.listen<"pointerup",DataType>("pointerup", key, listener, options)
    }
    
    onProgress<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"progress", DataType>["progress"]) => void, options?: messages.ListenOptions): void
    onProgress<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"progress", DataType>["progress"]) => void, options?: messages.ListenOptions): void
    onProgress<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"progress", DataType>["progress"]) => void, options?: messages.ListenOptions): void {
        this.listen<"progress",DataType>("progress", key, listener, options)
    }
    
    onRateChange<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"ratechange", DataType>["ratechange"]) => void, options?: messages.ListenOptions): void
    onRateChange<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"ratechange", DataType>["ratechange"]) => void, options?: messages.ListenOptions): void
    onRateChange<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"ratechange", DataType>["ratechange"]) => void, options?: messages.ListenOptions): void {
        this.listen<"ratechange",DataType>("ratechange", key, listener, options)
    }
    
    onReset<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"reset", DataType>["reset"]) => void, options?: messages.ListenOptions): void
    onReset<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"reset", DataType>["reset"]) => void, options?: messages.ListenOptions): void
    onReset<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"reset", DataType>["reset"]) => void, options?: messages.ListenOptions): void {
        this.listen<"reset",DataType>("reset", key, listener, options)
    }
    
    onResize<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"resize", DataType>["resize"]) => void, options?: messages.ListenOptions): void
    onResize<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"resize", DataType>["resize"]) => void, options?: messages.ListenOptions): void
    onResize<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"resize", DataType>["resize"]) => void, options?: messages.ListenOptions): void {
        this.listen<"resize",DataType>("resize", key, listener, options)
    }
    
    onScroll<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"scroll", DataType>["scroll"]) => void, options?: messages.ListenOptions): void
    onScroll<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"scroll", DataType>["scroll"]) => void, options?: messages.ListenOptions): void
    onScroll<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"scroll", DataType>["scroll"]) => void, options?: messages.ListenOptions): void {
        this.listen<"scroll",DataType>("scroll", key, listener, options)
    }
    
    onSecurityPolicyViolation<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"securitypolicyviolation", DataType>["securitypolicyviolation"]) => void, options?: messages.ListenOptions): void
    onSecurityPolicyViolation<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"securitypolicyviolation", DataType>["securitypolicyviolation"]) => void, options?: messages.ListenOptions): void
    onSecurityPolicyViolation<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"securitypolicyviolation", DataType>["securitypolicyviolation"]) => void, options?: messages.ListenOptions): void {
        this.listen<"securitypolicyviolation",DataType>("securitypolicyviolation", key, listener, options)
    }
    
    onSeeked<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"seeked", DataType>["seeked"]) => void, options?: messages.ListenOptions): void
    onSeeked<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"seeked", DataType>["seeked"]) => void, options?: messages.ListenOptions): void
    onSeeked<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"seeked", DataType>["seeked"]) => void, options?: messages.ListenOptions): void {
        this.listen<"seeked",DataType>("seeked", key, listener, options)
    }
    
    onSeeking<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"seeking", DataType>["seeking"]) => void, options?: messages.ListenOptions): void
    onSeeking<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"seeking", DataType>["seeking"]) => void, options?: messages.ListenOptions): void
    onSeeking<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"seeking", DataType>["seeking"]) => void, options?: messages.ListenOptions): void {
        this.listen<"seeking",DataType>("seeking", key, listener, options)
    }
    
    onSelect<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"select", DataType>["select"]) => void, options?: messages.ListenOptions): void
    onSelect<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"select", DataType>["select"]) => void, options?: messages.ListenOptions): void
    onSelect<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"select", DataType>["select"]) => void, options?: messages.ListenOptions): void {
        this.listen<"select",DataType>("select", key, listener, options)
    }
    
    onSelectionChange<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"selectionchange", DataType>["selectionchange"]) => void, options?: messages.ListenOptions): void
    onSelectionChange<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"selectionchange", DataType>["selectionchange"]) => void, options?: messages.ListenOptions): void
    onSelectionChange<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"selectionchange", DataType>["selectionchange"]) => void, options?: messages.ListenOptions): void {
        this.listen<"selectionchange",DataType>("selectionchange", key, listener, options)
    }
    
    onSelectStart<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"selectstart", DataType>["selectstart"]) => void, options?: messages.ListenOptions): void
    onSelectStart<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"selectstart", DataType>["selectstart"]) => void, options?: messages.ListenOptions): void
    onSelectStart<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"selectstart", DataType>["selectstart"]) => void, options?: messages.ListenOptions): void {
        this.listen<"selectstart",DataType>("selectstart", key, listener, options)
    }
    
    onSlotChange<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"slotchange", DataType>["slotchange"]) => void, options?: messages.ListenOptions): void
    onSlotChange<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"slotchange", DataType>["slotchange"]) => void, options?: messages.ListenOptions): void
    onSlotChange<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"slotchange", DataType>["slotchange"]) => void, options?: messages.ListenOptions): void {
        this.listen<"slotchange",DataType>("slotchange", key, listener, options)
    }
    
    onStalled<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"stalled", DataType>["stalled"]) => void, options?: messages.ListenOptions): void
    onStalled<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"stalled", DataType>["stalled"]) => void, options?: messages.ListenOptions): void
    onStalled<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"stalled", DataType>["stalled"]) => void, options?: messages.ListenOptions): void {
        this.listen<"stalled",DataType>("stalled", key, listener, options)
    }
    
    onSubmit<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"submit", DataType>["submit"]) => void, options?: messages.ListenOptions): void
    onSubmit<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"submit", DataType>["submit"]) => void, options?: messages.ListenOptions): void
    onSubmit<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"submit", DataType>["submit"]) => void, options?: messages.ListenOptions): void {
        this.listen<"submit",DataType>("submit", key, listener, options)
    }
    
    onSuspend<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"suspend", DataType>["suspend"]) => void, options?: messages.ListenOptions): void
    onSuspend<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"suspend", DataType>["suspend"]) => void, options?: messages.ListenOptions): void
    onSuspend<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"suspend", DataType>["suspend"]) => void, options?: messages.ListenOptions): void {
        this.listen<"suspend",DataType>("suspend", key, listener, options)
    }
    
    onTimeUpdate<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"timeupdate", DataType>["timeupdate"]) => void, options?: messages.ListenOptions): void
    onTimeUpdate<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"timeupdate", DataType>["timeupdate"]) => void, options?: messages.ListenOptions): void
    onTimeUpdate<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"timeupdate", DataType>["timeupdate"]) => void, options?: messages.ListenOptions): void {
        this.listen<"timeupdate",DataType>("timeupdate", key, listener, options)
    }
    
    onToggle<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"toggle", DataType>["toggle"]) => void, options?: messages.ListenOptions): void
    onToggle<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"toggle", DataType>["toggle"]) => void, options?: messages.ListenOptions): void
    onToggle<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"toggle", DataType>["toggle"]) => void, options?: messages.ListenOptions): void {
        this.listen<"toggle",DataType>("toggle", key, listener, options)
    }
    
    onTouchCancel<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"touchcancel", DataType>["touchcancel"]) => void, options?: messages.ListenOptions): void
    onTouchCancel<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"touchcancel", DataType>["touchcancel"]) => void, options?: messages.ListenOptions): void
    onTouchCancel<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"touchcancel", DataType>["touchcancel"]) => void, options?: messages.ListenOptions): void {
        this.listen<"touchcancel",DataType>("touchcancel", key, listener, options)
    }
    
    onTouchEnd<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"touchend", DataType>["touchend"]) => void, options?: messages.ListenOptions): void
    onTouchEnd<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"touchend", DataType>["touchend"]) => void, options?: messages.ListenOptions): void
    onTouchEnd<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"touchend", DataType>["touchend"]) => void, options?: messages.ListenOptions): void {
        this.listen<"touchend",DataType>("touchend", key, listener, options)
    }
    
    onTouchMove<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"touchmove", DataType>["touchmove"]) => void, options?: messages.ListenOptions): void
    onTouchMove<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"touchmove", DataType>["touchmove"]) => void, options?: messages.ListenOptions): void
    onTouchMove<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"touchmove", DataType>["touchmove"]) => void, options?: messages.ListenOptions): void {
        this.listen<"touchmove",DataType>("touchmove", key, listener, options)
    }
    
    onTouchStart<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"touchstart", DataType>["touchstart"]) => void, options?: messages.ListenOptions): void
    onTouchStart<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"touchstart", DataType>["touchstart"]) => void, options?: messages.ListenOptions): void
    onTouchStart<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"touchstart", DataType>["touchstart"]) => void, options?: messages.ListenOptions): void {
        this.listen<"touchstart",DataType>("touchstart", key, listener, options)
    }
    
    onTransitionCancel<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"transitioncancel", DataType>["transitioncancel"]) => void, options?: messages.ListenOptions): void
    onTransitionCancel<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"transitioncancel", DataType>["transitioncancel"]) => void, options?: messages.ListenOptions): void
    onTransitionCancel<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"transitioncancel", DataType>["transitioncancel"]) => void, options?: messages.ListenOptions): void {
        this.listen<"transitioncancel",DataType>("transitioncancel", key, listener, options)
    }
    
    onTransitionEnd<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"transitionend", DataType>["transitionend"]) => void, options?: messages.ListenOptions): void
    onTransitionEnd<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"transitionend", DataType>["transitionend"]) => void, options?: messages.ListenOptions): void
    onTransitionEnd<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"transitionend", DataType>["transitionend"]) => void, options?: messages.ListenOptions): void {
        this.listen<"transitionend",DataType>("transitionend", key, listener, options)
    }
    
    onTransitionRun<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"transitionrun", DataType>["transitionrun"]) => void, options?: messages.ListenOptions): void
    onTransitionRun<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"transitionrun", DataType>["transitionrun"]) => void, options?: messages.ListenOptions): void
    onTransitionRun<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"transitionrun", DataType>["transitionrun"]) => void, options?: messages.ListenOptions): void {
        this.listen<"transitionrun",DataType>("transitionrun", key, listener, options)
    }
    
    onTransitionStart<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"transitionstart", DataType>["transitionstart"]) => void, options?: messages.ListenOptions): void
    onTransitionStart<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"transitionstart", DataType>["transitionstart"]) => void, options?: messages.ListenOptions): void
    onTransitionStart<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"transitionstart", DataType>["transitionstart"]) => void, options?: messages.ListenOptions): void {
        this.listen<"transitionstart",DataType>("transitionstart", key, listener, options)
    }
    
    onVolumeChange<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"volumechange", DataType>["volumechange"]) => void, options?: messages.ListenOptions): void
    onVolumeChange<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"volumechange", DataType>["volumechange"]) => void, options?: messages.ListenOptions): void
    onVolumeChange<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"volumechange", DataType>["volumechange"]) => void, options?: messages.ListenOptions): void {
        this.listen<"volumechange",DataType>("volumechange", key, listener, options)
    }
    
    onWaiting<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"waiting", DataType>["waiting"]) => void, options?: messages.ListenOptions): void
    onWaiting<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"waiting", DataType>["waiting"]) => void, options?: messages.ListenOptions): void
    onWaiting<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"waiting", DataType>["waiting"]) => void, options?: messages.ListenOptions): void {
        this.listen<"waiting",DataType>("waiting", key, listener, options)
    }
    
    onWebkitAnimationEnd<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"webkitanimationend", DataType>["webkitanimationend"]) => void, options?: messages.ListenOptions): void
    onWebkitAnimationEnd<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"webkitanimationend", DataType>["webkitanimationend"]) => void, options?: messages.ListenOptions): void
    onWebkitAnimationEnd<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"webkitanimationend", DataType>["webkitanimationend"]) => void, options?: messages.ListenOptions): void {
        this.listen<"webkitanimationend",DataType>("webkitanimationend", key, listener, options)
    }
    
    onWebkitAnimationIteration<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"webkitanimationiteration", DataType>["webkitanimationiteration"]) => void, options?: messages.ListenOptions): void
    onWebkitAnimationIteration<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"webkitanimationiteration", DataType>["webkitanimationiteration"]) => void, options?: messages.ListenOptions): void
    onWebkitAnimationIteration<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"webkitanimationiteration", DataType>["webkitanimationiteration"]) => void, options?: messages.ListenOptions): void {
        this.listen<"webkitanimationiteration",DataType>("webkitanimationiteration", key, listener, options)
    }
    
    onWebkitAnimationStart<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"webkitanimationstart", DataType>["webkitanimationstart"]) => void, options?: messages.ListenOptions): void
    onWebkitAnimationStart<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"webkitanimationstart", DataType>["webkitanimationstart"]) => void, options?: messages.ListenOptions): void
    onWebkitAnimationStart<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"webkitanimationstart", DataType>["webkitanimationstart"]) => void, options?: messages.ListenOptions): void {
        this.listen<"webkitanimationstart",DataType>("webkitanimationstart", key, listener, options)
    }
    
    onWebkitTransitionEnd<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"webkittransitionend", DataType>["webkittransitionend"]) => void, options?: messages.ListenOptions): void
    onWebkitTransitionEnd<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"webkittransitionend", DataType>["webkittransitionend"]) => void, options?: messages.ListenOptions): void
    onWebkitTransitionEnd<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"webkittransitionend", DataType>["webkittransitionend"]) => void, options?: messages.ListenOptions): void {
        this.listen<"webkittransitionend",DataType>("webkittransitionend", key, listener, options)
    }
    
    onWheel<DataType extends object>(key: messages.UntypedKey, listener: (m: messages.EventMessageTypeMap<"wheel", DataType>["wheel"]) => void, options?: messages.ListenOptions): void
    onWheel<DataType extends object>(key: messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"wheel", DataType>["wheel"]) => void, options?: messages.ListenOptions): void
    onWheel<DataType extends object>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.EventMessageTypeMap<"wheel", DataType>["wheel"]) => void, options?: messages.ListenOptions): void {
        this.listen<"wheel",DataType>("wheel", key, listener, options)
    }
    
//// End Listen Methods


}
