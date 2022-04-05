import * as messages from './messages'
import { Logger } from './logging'
import * as keyboard from './keyboard'
import { DivTag, HtmlParentTag } from './html'

const log = new Logger('Part')

export type StatelessPart = Part<{}>

export type PartParent = StatelessPart | null

/**
 * Generic type for a function that constructs a part.
 */
export type PartConstructor<PartType extends Part<StateType>, StateType> = {new (parent: PartParent, id: string, state: StateType): PartType}

/** 
 * Whether or not a particular message emit should emit on the parents as well
 */
export type EmitScope = "single" | "bubble"

type EmitOptions = {
    scope?: EmitScope
}

/**
 * Whether the part needs to be rendered (dirty), updated (stale), or neither (clean).
 */
type RenderState = "clean" | "stale" | "dirty"

type EventKey = keyof HTMLElementEventMap

/**
 * These event types do not bubble and thus should be handled in the capture phase
 */
const nonBubblingEvents: EventKey[] = [
    'blur', 'focus', 'load', 'scroll'
]

/** 
 * Parts can be mounted either directly to DOM elements or by id string
 */
export type MountPoint = HTMLElement | string

/**
 * The type of the object that gets passed to a part's render method
 */ 
export interface PartTag extends DivTag {}

export abstract class Part<StateType> {
    
    /// Root

    // root parts themselves will not have a root
    private _root?: StatelessPart

    public get root(): StatelessPart {
        return this._root || this
    }


    /// Children
    
    private children: {[id: string]: StatelessPart} = {}

    eachChild(func: (child: StatelessPart) => void) {
        for (let child of Object.values(this.children)) {
            func(child)
        }
    }

    removeChild(child: StatelessPart) {
        delete this.children[child.id]
    }


    /// Construction

    constructor(
        private readonly parent: PartParent,
        public readonly id: string,
        public readonly state: StateType
    ) {
        this._renderState = "dirty"
        if (parent) {
            this._root = parent.root
        }
    }

    makeStatelessPart<PartType extends StatelessPart>(
        constructor: {new (p: PartParent, id: string, state: {}): PartType}): PartType 
    {
        let part = this.root._makeParentedPart(constructor, this, {})
        this.children[part.id] = part
        return part
    }


    makePart<PartType extends Part<PartStateType>, PartStateType>(
        constructor: {new (p: PartParent, id: string, state: PartStateType): PartType},
        state: PartStateType): PartType 
    {
        let part = this.root._makeParentedPart(constructor, this, state)
        this.children[part.id] = part
        return part
    }
    
    private _idCount = 0

    private _makeParentedPart<PartType extends Part<PartStateType>, PartStateType>(
        constructor: {new (p: PartParent, id: string, state: PartStateType): PartType}, 
        parent: PartParent, 
        state: PartStateType): PartType 
    {
        this._idCount += 1
        let part = new constructor(parent || this, `__part-${this._idCount.toString()}__`, state)
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

    private _initialized = false

    get isInitialized(): boolean {
        return this._initialized
    }

    private _init() {
        if (!this._initialized) {
            this._initialized = true
            log.debug('Initializing', this)
            this.init()
        }
        this.eachChild(child => {
            child._init()
        })
    }

    // Parts can override this to provide custom behavior that is run
    // exactly once before the part is rendered for the first time
    init() {
    }


    /// Dirty Tracking

    private _renderState: RenderState = "dirty"

    /**
     * Mark this part as dirty, meaning it needs to be fully re-rendered.
     */
    dirty() {
        log.debug("Dirty", this)
        this._renderState = "dirty"
        this.root._requestFrame()
    }

    /**
     * Mark this part as stale, meaning it needs to be updated but not rendered.
     */
    stale() {
        log.debug("Stale", this)
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
        requestAnimationFrame(t => {
            this._frameRequested = false
            log.debug('Frame', t)
            this._markClean()
            this._attachEventListeners()
        })
    }


    /// DOM Messages

    private handlerMap = new messages.HandlerMap()

    listen<EventType extends keyof messages.EventMap, DataType>(
        type: EventType, 
        key: messages.UntypedKey,
        handler: (m: messages.Message<EventType,DataType>) => void,
        options: messages.ListenOptions): void

    listen<EventType extends keyof messages.EventMap, DataType>(
        type: EventType, 
        key: messages.TypedKey<DataType>,
        handler: (m: messages.Message<EventType,DataType>) => void,
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
        handler: (m: messages.Message<EventType,DataType>) => void,
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

    private _needsEventListeners = true

    /**
     * Tell this element and its children that they need to attach event listeners
     */
    private _childrenNeedEventListeners() {
        this._needsEventListeners = true
        this.eachChild(child => {
            child._childrenNeedEventListeners()
        })
    }

    /**
     * Attaches event listeners to this.element (if needsEventListeners() has been called)
     * Needs to be protected for FormPart.
     */
    protected _attachEventListeners() {
        if (this._needsEventListeners) {
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
            for (let e of evt.composedPath()) {
                let data = (e as any).dataset
                const typeKey = `__${type}__`
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
        evt: messages.EventMap[typeof type],
        data: DataType,
        options: EmitOptions={}) 
    {
        const message = {
            type: type,
            event: evt,
            data: data
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
        this.emit("message", key, {part: this}, data, options)
    }


    /// Key Press Events

    // Register a hanlder for a global key press event.
    onKeyPress(press: messages.KeyPress, listener: (m: messages.Message<"keypress",messages.KeyPress>) => void) {
        keyboard.registerPart(this) // make sure we're registered to receive global keyboard events
        this.listen<"keypress",messages.KeyPress>("keypress", press, listener, {attach: "active"})
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
        return !!this.element
    }

    /**
     * @returns Whether the part is a root part (doesn't have a parent, is mounted directly to a DOM element).
     */
    get isRoot(): boolean {
        return !!this._mountElement
    }

    private mount(elem: MountPoint) {
        if (elem instanceof HTMLElement) {
            this._mountElement = elem!
        }
        else {
            this._mountElement = document.getElementById(elem)!
        }
        this._requestFrame()
    }

    /** 
     * Mounts a part to a DOM element (by DOM object or id).
     */
    static mount<PartType extends Part<StateType>, StateType>(partType: PartConstructor<PartType,StateType>, mountPoint: MountPoint, state: StateType): PartType {
        const id = typeof mountPoint == 'string' ? mountPoint : mountPoint.getAttribute("id")
        if (!id) {
            throw "You must either mount a part directly to a DOM node with id attribute or provide the id value as a string"
        }
        const part = new partType(null, id, state)
        part.mount(mountPoint)
        return part
    }

    
    /// Rendering

    renderInTag(container: HtmlParentTag) {
        this._renderState = "clean"
        container.div({id: this.id}, parent => {
            this.render(parent)
        })
    }

    abstract render(parent: PartTag): any

    /**
     * Recursively crawls the children to see if any is dirty, then renders their entire branch.
     * If they're only stale, calls the update() method.
     */
    private _markClean() {
        this._init()
        if (this._renderState == "dirty") {
            // stop the chain, re-render the whole tree from here on down
            log.debugTime('Update', () => {
                this._init()
                let parent = new DivTag("")
                this.render(parent)
                let output = Array<string>()
                parent.buildInner(output)
                const elem = this.element
                if (elem) {
                    elem.innerHTML = output.join('')
                }
                else {
                    throw(`Trying to render a part with no element!`)
                }
                this._childrenNeedEventListeners()
                this._update()
            })
        }
        else if (this._renderState == "stale") {
            this._update()
        }
        else {
            // keep propagating through the tree to see if anyone else needs to be rendered or updated
            this.eachChild(child => {
                child._markClean()
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
            throw(`Trying to update a part with no element!`)
        }
        this.update(elem)
        this._renderState = "clean"
        this.eachChild(child => {
            child._update()
        })
    }



    //// Begin Listen Methods

    onAbort<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"abort",DataType>) => void, options?: messages.ListenOptions): void
    onAbort<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"abort",DataType>) => void, options?: messages.ListenOptions): void
    onAbort<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"abort",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"abort",DataType>("abort", key, listener, options)
    }
    
    onAnimationCancel<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"animationcancel",DataType>) => void, options?: messages.ListenOptions): void
    onAnimationCancel<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"animationcancel",DataType>) => void, options?: messages.ListenOptions): void
    onAnimationCancel<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"animationcancel",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"animationcancel",DataType>("animationcancel", key, listener, options)
    }
    
    onAnimationEnd<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"animationend",DataType>) => void, options?: messages.ListenOptions): void
    onAnimationEnd<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"animationend",DataType>) => void, options?: messages.ListenOptions): void
    onAnimationEnd<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"animationend",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"animationend",DataType>("animationend", key, listener, options)
    }
    
    onAnimationIteration<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"animationiteration",DataType>) => void, options?: messages.ListenOptions): void
    onAnimationIteration<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"animationiteration",DataType>) => void, options?: messages.ListenOptions): void
    onAnimationIteration<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"animationiteration",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"animationiteration",DataType>("animationiteration", key, listener, options)
    }
    
    onAnimationStart<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"animationstart",DataType>) => void, options?: messages.ListenOptions): void
    onAnimationStart<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"animationstart",DataType>) => void, options?: messages.ListenOptions): void
    onAnimationStart<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"animationstart",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"animationstart",DataType>("animationstart", key, listener, options)
    }
    
    onAuxClick<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"auxclick",DataType>) => void, options?: messages.ListenOptions): void
    onAuxClick<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"auxclick",DataType>) => void, options?: messages.ListenOptions): void
    onAuxClick<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"auxclick",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"auxclick",DataType>("auxclick", key, listener, options)
    }
    
    onBeforeInput<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"beforeinput",DataType>) => void, options?: messages.ListenOptions): void
    onBeforeInput<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"beforeinput",DataType>) => void, options?: messages.ListenOptions): void
    onBeforeInput<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"beforeinput",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"beforeinput",DataType>("beforeinput", key, listener, options)
    }
    
    onBlur<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"blur",DataType>) => void, options?: messages.ListenOptions): void
    onBlur<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"blur",DataType>) => void, options?: messages.ListenOptions): void
    onBlur<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"blur",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"blur",DataType>("blur", key, listener, options)
    }
    
    onCanPlay<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"canplay",DataType>) => void, options?: messages.ListenOptions): void
    onCanPlay<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"canplay",DataType>) => void, options?: messages.ListenOptions): void
    onCanPlay<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"canplay",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"canplay",DataType>("canplay", key, listener, options)
    }
    
    onCanPlayThrough<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"canplaythrough",DataType>) => void, options?: messages.ListenOptions): void
    onCanPlayThrough<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"canplaythrough",DataType>) => void, options?: messages.ListenOptions): void
    onCanPlayThrough<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"canplaythrough",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"canplaythrough",DataType>("canplaythrough", key, listener, options)
    }
    
    onChange<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"change",DataType>) => void, options?: messages.ListenOptions): void
    onChange<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"change",DataType>) => void, options?: messages.ListenOptions): void
    onChange<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"change",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"change",DataType>("change", key, listener, options)
    }
    
    onClick<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"click",DataType>) => void, options?: messages.ListenOptions): void
    onClick<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"click",DataType>) => void, options?: messages.ListenOptions): void
    onClick<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"click",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"click",DataType>("click", key, listener, options)
    }
    
    onClose<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"close",DataType>) => void, options?: messages.ListenOptions): void
    onClose<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"close",DataType>) => void, options?: messages.ListenOptions): void
    onClose<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"close",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"close",DataType>("close", key, listener, options)
    }
    
    onCompositionEnd<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"compositionend",DataType>) => void, options?: messages.ListenOptions): void
    onCompositionEnd<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"compositionend",DataType>) => void, options?: messages.ListenOptions): void
    onCompositionEnd<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"compositionend",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"compositionend",DataType>("compositionend", key, listener, options)
    }
    
    onCompositionStart<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"compositionstart",DataType>) => void, options?: messages.ListenOptions): void
    onCompositionStart<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"compositionstart",DataType>) => void, options?: messages.ListenOptions): void
    onCompositionStart<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"compositionstart",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"compositionstart",DataType>("compositionstart", key, listener, options)
    }
    
    onCompositionUpdate<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"compositionupdate",DataType>) => void, options?: messages.ListenOptions): void
    onCompositionUpdate<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"compositionupdate",DataType>) => void, options?: messages.ListenOptions): void
    onCompositionUpdate<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"compositionupdate",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"compositionupdate",DataType>("compositionupdate", key, listener, options)
    }
    
    onContextMenu<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"contextmenu",DataType>) => void, options?: messages.ListenOptions): void
    onContextMenu<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"contextmenu",DataType>) => void, options?: messages.ListenOptions): void
    onContextMenu<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"contextmenu",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"contextmenu",DataType>("contextmenu", key, listener, options)
    }
    
    onCopy<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"copy",DataType>) => void, options?: messages.ListenOptions): void
    onCopy<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"copy",DataType>) => void, options?: messages.ListenOptions): void
    onCopy<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"copy",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"copy",DataType>("copy", key, listener, options)
    }
    
    onCueChange<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"cuechange",DataType>) => void, options?: messages.ListenOptions): void
    onCueChange<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"cuechange",DataType>) => void, options?: messages.ListenOptions): void
    onCueChange<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"cuechange",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"cuechange",DataType>("cuechange", key, listener, options)
    }
    
    onCut<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"cut",DataType>) => void, options?: messages.ListenOptions): void
    onCut<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"cut",DataType>) => void, options?: messages.ListenOptions): void
    onCut<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"cut",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"cut",DataType>("cut", key, listener, options)
    }
    
    onDblClick<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"dblclick",DataType>) => void, options?: messages.ListenOptions): void
    onDblClick<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"dblclick",DataType>) => void, options?: messages.ListenOptions): void
    onDblClick<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"dblclick",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"dblclick",DataType>("dblclick", key, listener, options)
    }
    
    onDrag<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"drag",DataType>) => void, options?: messages.ListenOptions): void
    onDrag<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"drag",DataType>) => void, options?: messages.ListenOptions): void
    onDrag<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"drag",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"drag",DataType>("drag", key, listener, options)
    }
    
    onDragEnd<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"dragend",DataType>) => void, options?: messages.ListenOptions): void
    onDragEnd<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"dragend",DataType>) => void, options?: messages.ListenOptions): void
    onDragEnd<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"dragend",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"dragend",DataType>("dragend", key, listener, options)
    }
    
    onDragEnter<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"dragenter",DataType>) => void, options?: messages.ListenOptions): void
    onDragEnter<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"dragenter",DataType>) => void, options?: messages.ListenOptions): void
    onDragEnter<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"dragenter",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"dragenter",DataType>("dragenter", key, listener, options)
    }
    
    onDragLeave<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"dragleave",DataType>) => void, options?: messages.ListenOptions): void
    onDragLeave<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"dragleave",DataType>) => void, options?: messages.ListenOptions): void
    onDragLeave<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"dragleave",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"dragleave",DataType>("dragleave", key, listener, options)
    }
    
    onDragOver<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"dragover",DataType>) => void, options?: messages.ListenOptions): void
    onDragOver<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"dragover",DataType>) => void, options?: messages.ListenOptions): void
    onDragOver<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"dragover",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"dragover",DataType>("dragover", key, listener, options)
    }
    
    onDragStart<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"dragstart",DataType>) => void, options?: messages.ListenOptions): void
    onDragStart<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"dragstart",DataType>) => void, options?: messages.ListenOptions): void
    onDragStart<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"dragstart",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"dragstart",DataType>("dragstart", key, listener, options)
    }
    
    onDrop<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"drop",DataType>) => void, options?: messages.ListenOptions): void
    onDrop<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"drop",DataType>) => void, options?: messages.ListenOptions): void
    onDrop<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"drop",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"drop",DataType>("drop", key, listener, options)
    }
    
    onDurationChange<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"durationchange",DataType>) => void, options?: messages.ListenOptions): void
    onDurationChange<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"durationchange",DataType>) => void, options?: messages.ListenOptions): void
    onDurationChange<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"durationchange",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"durationchange",DataType>("durationchange", key, listener, options)
    }
    
    onEmptied<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"emptied",DataType>) => void, options?: messages.ListenOptions): void
    onEmptied<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"emptied",DataType>) => void, options?: messages.ListenOptions): void
    onEmptied<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"emptied",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"emptied",DataType>("emptied", key, listener, options)
    }
    
    onEnded<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"ended",DataType>) => void, options?: messages.ListenOptions): void
    onEnded<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"ended",DataType>) => void, options?: messages.ListenOptions): void
    onEnded<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"ended",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"ended",DataType>("ended", key, listener, options)
    }
    
    onError<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"error",DataType>) => void, options?: messages.ListenOptions): void
    onError<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"error",DataType>) => void, options?: messages.ListenOptions): void
    onError<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"error",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"error",DataType>("error", key, listener, options)
    }
    
    onFocus<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"focus",DataType>) => void, options?: messages.ListenOptions): void
    onFocus<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"focus",DataType>) => void, options?: messages.ListenOptions): void
    onFocus<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"focus",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"focus",DataType>("focus", key, listener, options)
    }
    
    onFocusIn<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"focusin",DataType>) => void, options?: messages.ListenOptions): void
    onFocusIn<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"focusin",DataType>) => void, options?: messages.ListenOptions): void
    onFocusIn<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"focusin",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"focusin",DataType>("focusin", key, listener, options)
    }
    
    onFocusOut<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"focusout",DataType>) => void, options?: messages.ListenOptions): void
    onFocusOut<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"focusout",DataType>) => void, options?: messages.ListenOptions): void
    onFocusOut<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"focusout",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"focusout",DataType>("focusout", key, listener, options)
    }
    
    onFormData<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"formdata",DataType>) => void, options?: messages.ListenOptions): void
    onFormData<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"formdata",DataType>) => void, options?: messages.ListenOptions): void
    onFormData<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"formdata",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"formdata",DataType>("formdata", key, listener, options)
    }
    
    onFullscreenChange<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"fullscreenchange",DataType>) => void, options?: messages.ListenOptions): void
    onFullscreenChange<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"fullscreenchange",DataType>) => void, options?: messages.ListenOptions): void
    onFullscreenChange<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"fullscreenchange",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"fullscreenchange",DataType>("fullscreenchange", key, listener, options)
    }
    
    onFullscreenError<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"fullscreenerror",DataType>) => void, options?: messages.ListenOptions): void
    onFullscreenError<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"fullscreenerror",DataType>) => void, options?: messages.ListenOptions): void
    onFullscreenError<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"fullscreenerror",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"fullscreenerror",DataType>("fullscreenerror", key, listener, options)
    }
    
    onGotPointerCapture<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"gotpointercapture",DataType>) => void, options?: messages.ListenOptions): void
    onGotPointerCapture<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"gotpointercapture",DataType>) => void, options?: messages.ListenOptions): void
    onGotPointerCapture<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"gotpointercapture",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"gotpointercapture",DataType>("gotpointercapture", key, listener, options)
    }
    
    onInput<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"input",DataType>) => void, options?: messages.ListenOptions): void
    onInput<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"input",DataType>) => void, options?: messages.ListenOptions): void
    onInput<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"input",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"input",DataType>("input", key, listener, options)
    }
    
    onInvalid<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"invalid",DataType>) => void, options?: messages.ListenOptions): void
    onInvalid<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"invalid",DataType>) => void, options?: messages.ListenOptions): void
    onInvalid<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"invalid",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"invalid",DataType>("invalid", key, listener, options)
    }
    
    onKeyDown<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"keydown",DataType>) => void, options?: messages.ListenOptions): void
    onKeyDown<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"keydown",DataType>) => void, options?: messages.ListenOptions): void
    onKeyDown<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"keydown",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"keydown",DataType>("keydown", key, listener, options)
    }
    
    onKeyUp<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"keyup",DataType>) => void, options?: messages.ListenOptions): void
    onKeyUp<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"keyup",DataType>) => void, options?: messages.ListenOptions): void
    onKeyUp<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"keyup",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"keyup",DataType>("keyup", key, listener, options)
    }
    
    onLoad<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"load",DataType>) => void, options?: messages.ListenOptions): void
    onLoad<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"load",DataType>) => void, options?: messages.ListenOptions): void
    onLoad<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"load",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"load",DataType>("load", key, listener, options)
    }
    
    onLoadedData<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"loadeddata",DataType>) => void, options?: messages.ListenOptions): void
    onLoadedData<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"loadeddata",DataType>) => void, options?: messages.ListenOptions): void
    onLoadedData<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"loadeddata",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"loadeddata",DataType>("loadeddata", key, listener, options)
    }
    
    onLoadedMetadata<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"loadedmetadata",DataType>) => void, options?: messages.ListenOptions): void
    onLoadedMetadata<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"loadedmetadata",DataType>) => void, options?: messages.ListenOptions): void
    onLoadedMetadata<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"loadedmetadata",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"loadedmetadata",DataType>("loadedmetadata", key, listener, options)
    }
    
    onLoadStart<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"loadstart",DataType>) => void, options?: messages.ListenOptions): void
    onLoadStart<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"loadstart",DataType>) => void, options?: messages.ListenOptions): void
    onLoadStart<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"loadstart",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"loadstart",DataType>("loadstart", key, listener, options)
    }
    
    onLostPointerCapture<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"lostpointercapture",DataType>) => void, options?: messages.ListenOptions): void
    onLostPointerCapture<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"lostpointercapture",DataType>) => void, options?: messages.ListenOptions): void
    onLostPointerCapture<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"lostpointercapture",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"lostpointercapture",DataType>("lostpointercapture", key, listener, options)
    }
    
    onMouseDown<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"mousedown",DataType>) => void, options?: messages.ListenOptions): void
    onMouseDown<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"mousedown",DataType>) => void, options?: messages.ListenOptions): void
    onMouseDown<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"mousedown",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"mousedown",DataType>("mousedown", key, listener, options)
    }
    
    onMouseEnter<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"mouseenter",DataType>) => void, options?: messages.ListenOptions): void
    onMouseEnter<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"mouseenter",DataType>) => void, options?: messages.ListenOptions): void
    onMouseEnter<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"mouseenter",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"mouseenter",DataType>("mouseenter", key, listener, options)
    }
    
    onMouseLeave<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"mouseleave",DataType>) => void, options?: messages.ListenOptions): void
    onMouseLeave<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"mouseleave",DataType>) => void, options?: messages.ListenOptions): void
    onMouseLeave<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"mouseleave",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"mouseleave",DataType>("mouseleave", key, listener, options)
    }
    
    onMouseMove<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"mousemove",DataType>) => void, options?: messages.ListenOptions): void
    onMouseMove<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"mousemove",DataType>) => void, options?: messages.ListenOptions): void
    onMouseMove<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"mousemove",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"mousemove",DataType>("mousemove", key, listener, options)
    }
    
    onMouseOut<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"mouseout",DataType>) => void, options?: messages.ListenOptions): void
    onMouseOut<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"mouseout",DataType>) => void, options?: messages.ListenOptions): void
    onMouseOut<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"mouseout",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"mouseout",DataType>("mouseout", key, listener, options)
    }
    
    onMouseOver<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"mouseover",DataType>) => void, options?: messages.ListenOptions): void
    onMouseOver<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"mouseover",DataType>) => void, options?: messages.ListenOptions): void
    onMouseOver<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"mouseover",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"mouseover",DataType>("mouseover", key, listener, options)
    }
    
    onMouseUp<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"mouseup",DataType>) => void, options?: messages.ListenOptions): void
    onMouseUp<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"mouseup",DataType>) => void, options?: messages.ListenOptions): void
    onMouseUp<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"mouseup",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"mouseup",DataType>("mouseup", key, listener, options)
    }
    
    onPaste<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"paste",DataType>) => void, options?: messages.ListenOptions): void
    onPaste<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"paste",DataType>) => void, options?: messages.ListenOptions): void
    onPaste<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"paste",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"paste",DataType>("paste", key, listener, options)
    }
    
    onPause<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"pause",DataType>) => void, options?: messages.ListenOptions): void
    onPause<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"pause",DataType>) => void, options?: messages.ListenOptions): void
    onPause<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"pause",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"pause",DataType>("pause", key, listener, options)
    }
    
    onPlay<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"play",DataType>) => void, options?: messages.ListenOptions): void
    onPlay<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"play",DataType>) => void, options?: messages.ListenOptions): void
    onPlay<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"play",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"play",DataType>("play", key, listener, options)
    }
    
    onPlaying<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"playing",DataType>) => void, options?: messages.ListenOptions): void
    onPlaying<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"playing",DataType>) => void, options?: messages.ListenOptions): void
    onPlaying<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"playing",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"playing",DataType>("playing", key, listener, options)
    }
    
    onPointerCancel<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"pointercancel",DataType>) => void, options?: messages.ListenOptions): void
    onPointerCancel<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"pointercancel",DataType>) => void, options?: messages.ListenOptions): void
    onPointerCancel<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"pointercancel",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"pointercancel",DataType>("pointercancel", key, listener, options)
    }
    
    onPointerDown<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"pointerdown",DataType>) => void, options?: messages.ListenOptions): void
    onPointerDown<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"pointerdown",DataType>) => void, options?: messages.ListenOptions): void
    onPointerDown<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"pointerdown",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"pointerdown",DataType>("pointerdown", key, listener, options)
    }
    
    onPointerEnter<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"pointerenter",DataType>) => void, options?: messages.ListenOptions): void
    onPointerEnter<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"pointerenter",DataType>) => void, options?: messages.ListenOptions): void
    onPointerEnter<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"pointerenter",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"pointerenter",DataType>("pointerenter", key, listener, options)
    }
    
    onPointerLeave<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"pointerleave",DataType>) => void, options?: messages.ListenOptions): void
    onPointerLeave<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"pointerleave",DataType>) => void, options?: messages.ListenOptions): void
    onPointerLeave<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"pointerleave",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"pointerleave",DataType>("pointerleave", key, listener, options)
    }
    
    onPointerMove<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"pointermove",DataType>) => void, options?: messages.ListenOptions): void
    onPointerMove<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"pointermove",DataType>) => void, options?: messages.ListenOptions): void
    onPointerMove<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"pointermove",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"pointermove",DataType>("pointermove", key, listener, options)
    }
    
    onPointerOut<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"pointerout",DataType>) => void, options?: messages.ListenOptions): void
    onPointerOut<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"pointerout",DataType>) => void, options?: messages.ListenOptions): void
    onPointerOut<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"pointerout",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"pointerout",DataType>("pointerout", key, listener, options)
    }
    
    onPointerOver<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"pointerover",DataType>) => void, options?: messages.ListenOptions): void
    onPointerOver<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"pointerover",DataType>) => void, options?: messages.ListenOptions): void
    onPointerOver<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"pointerover",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"pointerover",DataType>("pointerover", key, listener, options)
    }
    
    onPointerUp<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"pointerup",DataType>) => void, options?: messages.ListenOptions): void
    onPointerUp<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"pointerup",DataType>) => void, options?: messages.ListenOptions): void
    onPointerUp<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"pointerup",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"pointerup",DataType>("pointerup", key, listener, options)
    }
    
    onProgress<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"progress",DataType>) => void, options?: messages.ListenOptions): void
    onProgress<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"progress",DataType>) => void, options?: messages.ListenOptions): void
    onProgress<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"progress",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"progress",DataType>("progress", key, listener, options)
    }
    
    onRateChange<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"ratechange",DataType>) => void, options?: messages.ListenOptions): void
    onRateChange<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"ratechange",DataType>) => void, options?: messages.ListenOptions): void
    onRateChange<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"ratechange",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"ratechange",DataType>("ratechange", key, listener, options)
    }
    
    onReset<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"reset",DataType>) => void, options?: messages.ListenOptions): void
    onReset<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"reset",DataType>) => void, options?: messages.ListenOptions): void
    onReset<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"reset",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"reset",DataType>("reset", key, listener, options)
    }
    
    onResize<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"resize",DataType>) => void, options?: messages.ListenOptions): void
    onResize<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"resize",DataType>) => void, options?: messages.ListenOptions): void
    onResize<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"resize",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"resize",DataType>("resize", key, listener, options)
    }
    
    onScroll<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"scroll",DataType>) => void, options?: messages.ListenOptions): void
    onScroll<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"scroll",DataType>) => void, options?: messages.ListenOptions): void
    onScroll<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"scroll",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"scroll",DataType>("scroll", key, listener, options)
    }
    
    onSecurityPolicyViolation<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"securitypolicyviolation",DataType>) => void, options?: messages.ListenOptions): void
    onSecurityPolicyViolation<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"securitypolicyviolation",DataType>) => void, options?: messages.ListenOptions): void
    onSecurityPolicyViolation<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"securitypolicyviolation",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"securitypolicyviolation",DataType>("securitypolicyviolation", key, listener, options)
    }
    
    onSeeked<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"seeked",DataType>) => void, options?: messages.ListenOptions): void
    onSeeked<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"seeked",DataType>) => void, options?: messages.ListenOptions): void
    onSeeked<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"seeked",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"seeked",DataType>("seeked", key, listener, options)
    }
    
    onSeeking<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"seeking",DataType>) => void, options?: messages.ListenOptions): void
    onSeeking<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"seeking",DataType>) => void, options?: messages.ListenOptions): void
    onSeeking<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"seeking",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"seeking",DataType>("seeking", key, listener, options)
    }
    
    onSelect<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"select",DataType>) => void, options?: messages.ListenOptions): void
    onSelect<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"select",DataType>) => void, options?: messages.ListenOptions): void
    onSelect<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"select",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"select",DataType>("select", key, listener, options)
    }
    
    onSelectionChange<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"selectionchange",DataType>) => void, options?: messages.ListenOptions): void
    onSelectionChange<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"selectionchange",DataType>) => void, options?: messages.ListenOptions): void
    onSelectionChange<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"selectionchange",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"selectionchange",DataType>("selectionchange", key, listener, options)
    }
    
    onSelectStart<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"selectstart",DataType>) => void, options?: messages.ListenOptions): void
    onSelectStart<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"selectstart",DataType>) => void, options?: messages.ListenOptions): void
    onSelectStart<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"selectstart",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"selectstart",DataType>("selectstart", key, listener, options)
    }
    
    onStalled<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"stalled",DataType>) => void, options?: messages.ListenOptions): void
    onStalled<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"stalled",DataType>) => void, options?: messages.ListenOptions): void
    onStalled<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"stalled",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"stalled",DataType>("stalled", key, listener, options)
    }
    
    onSubmit<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"submit",DataType>) => void, options?: messages.ListenOptions): void
    onSubmit<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"submit",DataType>) => void, options?: messages.ListenOptions): void
    onSubmit<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"submit",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"submit",DataType>("submit", key, listener, options)
    }
    
    onSuspend<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"suspend",DataType>) => void, options?: messages.ListenOptions): void
    onSuspend<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"suspend",DataType>) => void, options?: messages.ListenOptions): void
    onSuspend<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"suspend",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"suspend",DataType>("suspend", key, listener, options)
    }
    
    onTimeUpdate<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"timeupdate",DataType>) => void, options?: messages.ListenOptions): void
    onTimeUpdate<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"timeupdate",DataType>) => void, options?: messages.ListenOptions): void
    onTimeUpdate<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"timeupdate",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"timeupdate",DataType>("timeupdate", key, listener, options)
    }
    
    onToggle<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"toggle",DataType>) => void, options?: messages.ListenOptions): void
    onToggle<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"toggle",DataType>) => void, options?: messages.ListenOptions): void
    onToggle<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"toggle",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"toggle",DataType>("toggle", key, listener, options)
    }
    
    onTouchCancel<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"touchcancel",DataType>) => void, options?: messages.ListenOptions): void
    onTouchCancel<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"touchcancel",DataType>) => void, options?: messages.ListenOptions): void
    onTouchCancel<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"touchcancel",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"touchcancel",DataType>("touchcancel", key, listener, options)
    }
    
    onTouchEnd<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"touchend",DataType>) => void, options?: messages.ListenOptions): void
    onTouchEnd<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"touchend",DataType>) => void, options?: messages.ListenOptions): void
    onTouchEnd<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"touchend",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"touchend",DataType>("touchend", key, listener, options)
    }
    
    onTouchMove<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"touchmove",DataType>) => void, options?: messages.ListenOptions): void
    onTouchMove<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"touchmove",DataType>) => void, options?: messages.ListenOptions): void
    onTouchMove<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"touchmove",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"touchmove",DataType>("touchmove", key, listener, options)
    }
    
    onTouchStart<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"touchstart",DataType>) => void, options?: messages.ListenOptions): void
    onTouchStart<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"touchstart",DataType>) => void, options?: messages.ListenOptions): void
    onTouchStart<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"touchstart",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"touchstart",DataType>("touchstart", key, listener, options)
    }
    
    onTransitionCancel<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"transitioncancel",DataType>) => void, options?: messages.ListenOptions): void
    onTransitionCancel<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"transitioncancel",DataType>) => void, options?: messages.ListenOptions): void
    onTransitionCancel<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"transitioncancel",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"transitioncancel",DataType>("transitioncancel", key, listener, options)
    }
    
    onTransitionEnd<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"transitionend",DataType>) => void, options?: messages.ListenOptions): void
    onTransitionEnd<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"transitionend",DataType>) => void, options?: messages.ListenOptions): void
    onTransitionEnd<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"transitionend",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"transitionend",DataType>("transitionend", key, listener, options)
    }
    
    onTransitionRun<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"transitionrun",DataType>) => void, options?: messages.ListenOptions): void
    onTransitionRun<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"transitionrun",DataType>) => void, options?: messages.ListenOptions): void
    onTransitionRun<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"transitionrun",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"transitionrun",DataType>("transitionrun", key, listener, options)
    }
    
    onTransitionStart<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"transitionstart",DataType>) => void, options?: messages.ListenOptions): void
    onTransitionStart<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"transitionstart",DataType>) => void, options?: messages.ListenOptions): void
    onTransitionStart<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"transitionstart",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"transitionstart",DataType>("transitionstart", key, listener, options)
    }
    
    onVolumeChange<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"volumechange",DataType>) => void, options?: messages.ListenOptions): void
    onVolumeChange<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"volumechange",DataType>) => void, options?: messages.ListenOptions): void
    onVolumeChange<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"volumechange",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"volumechange",DataType>("volumechange", key, listener, options)
    }
    
    onWaiting<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"waiting",DataType>) => void, options?: messages.ListenOptions): void
    onWaiting<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"waiting",DataType>) => void, options?: messages.ListenOptions): void
    onWaiting<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"waiting",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"waiting",DataType>("waiting", key, listener, options)
    }
    
    onWebkitAnimationEnd<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"webkitanimationend",DataType>) => void, options?: messages.ListenOptions): void
    onWebkitAnimationEnd<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"webkitanimationend",DataType>) => void, options?: messages.ListenOptions): void
    onWebkitAnimationEnd<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"webkitanimationend",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"webkitanimationend",DataType>("webkitanimationend", key, listener, options)
    }
    
    onWebkitAnimationIteration<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"webkitanimationiteration",DataType>) => void, options?: messages.ListenOptions): void
    onWebkitAnimationIteration<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"webkitanimationiteration",DataType>) => void, options?: messages.ListenOptions): void
    onWebkitAnimationIteration<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"webkitanimationiteration",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"webkitanimationiteration",DataType>("webkitanimationiteration", key, listener, options)
    }
    
    onWebkitAnimationStart<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"webkitanimationstart",DataType>) => void, options?: messages.ListenOptions): void
    onWebkitAnimationStart<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"webkitanimationstart",DataType>) => void, options?: messages.ListenOptions): void
    onWebkitAnimationStart<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"webkitanimationstart",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"webkitanimationstart",DataType>("webkitanimationstart", key, listener, options)
    }
    
    onWebkitTransitionEnd<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"webkittransitionend",DataType>) => void, options?: messages.ListenOptions): void
    onWebkitTransitionEnd<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"webkittransitionend",DataType>) => void, options?: messages.ListenOptions): void
    onWebkitTransitionEnd<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"webkittransitionend",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"webkittransitionend",DataType>("webkittransitionend", key, listener, options)
    }
    
    onWheel<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"wheel",DataType>) => void, options?: messages.ListenOptions): void
    onWheel<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"wheel",DataType>) => void, options?: messages.ListenOptions): void
    onWheel<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"wheel",DataType>) => void, options?: messages.ListenOptions): void {
        this.listen<"wheel",DataType>("wheel", key, listener, options)
    }
    
//// End Listen Methods


}
