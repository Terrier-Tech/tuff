import {Tag, ParentTag, DivTag} from './tags'
import * as messages from './messages'
import Logger from './logger'

const log = new Logger('Part')

export type StatelessPart = Part<{}>

export type PartParent = StatelessPart | null

// Whether or not a particular event listener is on the current part or only when the event hits the root
export type ActiveOrPassive = "active" | "passive"

// Whether or not a particular message emit should emit on the parents as well
export type EmitScope = "single" | "bubble"

// Parts can be mounted either directly to DOM elements or by id string
export type MountPoint = HTMLElement | string

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

    removeChild(child: StatelessPart) {
        delete this.children[child.id]
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

    _makeParentedPart<PartType extends Part<PartStateType>, PartStateType>(
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

    private handlerMap = new messages.HandlerMap()

    listen<EventType extends keyof messages.EventMap, DataType>(
        type: EventType, 
        key: messages.UntypedKey,
        listener: (m: messages.Message<EventType,DataType>) => void,
        active?: ActiveOrPassive): void

    listen<EventType extends keyof messages.EventMap, DataType>(
        type: EventType, 
        key: messages.TypedKey<DataType>,
        listener: (m: messages.Message<EventType,DataType>) => void,
        active?: ActiveOrPassive): void

    listen<EventType extends keyof messages.EventMap, DataType>(
        type: EventType, 
        key: messages.UntypedKey | messages.TypedKey<DataType>,
        listener: (m: messages.Message<EventType,DataType>) => void,
        active?: ActiveOrPassive): void
    { 
        if (active == "passive") {
            this.root.listen(type, key, listener, "active")
            return
        }
        this.handlerMap.add({
            type: type,
            key: key,
            callback: listener
        })
    }

    private _needsEventListeners = true

    // Tell this element and its children that they need to attach event listeners
    protected needsEventListeners() {
        this._needsEventListeners = true
        this.eachChild(child => {
            child.needsEventListeners()
        })
    }

    // Attaches event listeners to this.element (if needsEventListeners() has been called)
    attachEventListeners() {
        if (this._needsEventListeners) {
            this._needsEventListeners = false
            let elem = this.element
            for (let type of this.handlerMap.allTypes()) {
                this.addTypeListener(elem, type as (keyof HTMLElementEventMap))
            }
        }
        this.eachChild(child => {
            child.attachEventListeners()
        })
    }

    // Attaches an event listener for a particular type of HTML event.
    // Only event types with Tuff listeners will have HTML listeners attached.
    private addTypeListener(elem: HTMLElement, type: keyof HTMLElementEventMap) {
        log.debug(`Attaching ${type} event listeners to`, elem)
        const part = this
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
        })
    }

    // Creates and emits a message for the given type and key
    emit<EventType extends keyof messages.EventMap, DataType>(
        type: EventType, 
        key: messages.TypedKey<DataType>,
        evt: messages.EventMap[typeof type],
        data: DataType,
        scope: EmitScope = "single") 
    {
        const message = {
            type: type,
            event: evt,
            data: data
        }
        this.handlerMap.each(type, key, handler => {
            handler.callback(message)
        })
        if (scope == "bubble" && this.parent && this.parent != this) {
            this.parent.emit(type, key, evt, data, scope)
        }
    }


    //// Begin Listen Methods

    onAbort<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"abort",DataType>) => void, active?: ActiveOrPassive): void
    onAbort<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"abort",DataType>) => void, active?: ActiveOrPassive): void
    onAbort<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"abort",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"abort",DataType>("abort", key, listener, active)
    }
    
    onAnimationCancel<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"animationcancel",DataType>) => void, active?: ActiveOrPassive): void
    onAnimationCancel<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"animationcancel",DataType>) => void, active?: ActiveOrPassive): void
    onAnimationCancel<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"animationcancel",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"animationcancel",DataType>("animationcancel", key, listener, active)
    }
    
    onAnimationEnd<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"animationend",DataType>) => void, active?: ActiveOrPassive): void
    onAnimationEnd<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"animationend",DataType>) => void, active?: ActiveOrPassive): void
    onAnimationEnd<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"animationend",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"animationend",DataType>("animationend", key, listener, active)
    }
    
    onAnimationIteration<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"animationiteration",DataType>) => void, active?: ActiveOrPassive): void
    onAnimationIteration<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"animationiteration",DataType>) => void, active?: ActiveOrPassive): void
    onAnimationIteration<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"animationiteration",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"animationiteration",DataType>("animationiteration", key, listener, active)
    }
    
    onAnimationStart<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"animationstart",DataType>) => void, active?: ActiveOrPassive): void
    onAnimationStart<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"animationstart",DataType>) => void, active?: ActiveOrPassive): void
    onAnimationStart<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"animationstart",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"animationstart",DataType>("animationstart", key, listener, active)
    }
    
    onAuxClick<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"auxclick",DataType>) => void, active?: ActiveOrPassive): void
    onAuxClick<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"auxclick",DataType>) => void, active?: ActiveOrPassive): void
    onAuxClick<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"auxclick",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"auxclick",DataType>("auxclick", key, listener, active)
    }
    
    onBeforeInput<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"beforeinput",DataType>) => void, active?: ActiveOrPassive): void
    onBeforeInput<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"beforeinput",DataType>) => void, active?: ActiveOrPassive): void
    onBeforeInput<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"beforeinput",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"beforeinput",DataType>("beforeinput", key, listener, active)
    }
    
    onBlur<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"blur",DataType>) => void, active?: ActiveOrPassive): void
    onBlur<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"blur",DataType>) => void, active?: ActiveOrPassive): void
    onBlur<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"blur",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"blur",DataType>("blur", key, listener, active)
    }
    
    onCanPlay<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"canplay",DataType>) => void, active?: ActiveOrPassive): void
    onCanPlay<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"canplay",DataType>) => void, active?: ActiveOrPassive): void
    onCanPlay<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"canplay",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"canplay",DataType>("canplay", key, listener, active)
    }
    
    onCanPlayThrough<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"canplaythrough",DataType>) => void, active?: ActiveOrPassive): void
    onCanPlayThrough<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"canplaythrough",DataType>) => void, active?: ActiveOrPassive): void
    onCanPlayThrough<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"canplaythrough",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"canplaythrough",DataType>("canplaythrough", key, listener, active)
    }
    
    onChange<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"change",DataType>) => void, active?: ActiveOrPassive): void
    onChange<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"change",DataType>) => void, active?: ActiveOrPassive): void
    onChange<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"change",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"change",DataType>("change", key, listener, active)
    }
    
    onClick<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"click",DataType>) => void, active?: ActiveOrPassive): void
    onClick<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"click",DataType>) => void, active?: ActiveOrPassive): void
    onClick<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"click",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"click",DataType>("click", key, listener, active)
    }
    
    onClose<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"close",DataType>) => void, active?: ActiveOrPassive): void
    onClose<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"close",DataType>) => void, active?: ActiveOrPassive): void
    onClose<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"close",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"close",DataType>("close", key, listener, active)
    }
    
    onCompositionEnd<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"compositionend",DataType>) => void, active?: ActiveOrPassive): void
    onCompositionEnd<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"compositionend",DataType>) => void, active?: ActiveOrPassive): void
    onCompositionEnd<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"compositionend",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"compositionend",DataType>("compositionend", key, listener, active)
    }
    
    onCompositionStart<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"compositionstart",DataType>) => void, active?: ActiveOrPassive): void
    onCompositionStart<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"compositionstart",DataType>) => void, active?: ActiveOrPassive): void
    onCompositionStart<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"compositionstart",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"compositionstart",DataType>("compositionstart", key, listener, active)
    }
    
    onCompositionUpdate<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"compositionupdate",DataType>) => void, active?: ActiveOrPassive): void
    onCompositionUpdate<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"compositionupdate",DataType>) => void, active?: ActiveOrPassive): void
    onCompositionUpdate<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"compositionupdate",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"compositionupdate",DataType>("compositionupdate", key, listener, active)
    }
    
    onContextMenu<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"contextmenu",DataType>) => void, active?: ActiveOrPassive): void
    onContextMenu<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"contextmenu",DataType>) => void, active?: ActiveOrPassive): void
    onContextMenu<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"contextmenu",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"contextmenu",DataType>("contextmenu", key, listener, active)
    }
    
    onCopy<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"copy",DataType>) => void, active?: ActiveOrPassive): void
    onCopy<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"copy",DataType>) => void, active?: ActiveOrPassive): void
    onCopy<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"copy",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"copy",DataType>("copy", key, listener, active)
    }
    
    onCueChange<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"cuechange",DataType>) => void, active?: ActiveOrPassive): void
    onCueChange<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"cuechange",DataType>) => void, active?: ActiveOrPassive): void
    onCueChange<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"cuechange",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"cuechange",DataType>("cuechange", key, listener, active)
    }
    
    onCut<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"cut",DataType>) => void, active?: ActiveOrPassive): void
    onCut<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"cut",DataType>) => void, active?: ActiveOrPassive): void
    onCut<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"cut",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"cut",DataType>("cut", key, listener, active)
    }
    
    onDblClick<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"dblclick",DataType>) => void, active?: ActiveOrPassive): void
    onDblClick<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"dblclick",DataType>) => void, active?: ActiveOrPassive): void
    onDblClick<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"dblclick",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"dblclick",DataType>("dblclick", key, listener, active)
    }
    
    onDrag<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"drag",DataType>) => void, active?: ActiveOrPassive): void
    onDrag<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"drag",DataType>) => void, active?: ActiveOrPassive): void
    onDrag<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"drag",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"drag",DataType>("drag", key, listener, active)
    }
    
    onDragEnd<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"dragend",DataType>) => void, active?: ActiveOrPassive): void
    onDragEnd<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"dragend",DataType>) => void, active?: ActiveOrPassive): void
    onDragEnd<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"dragend",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"dragend",DataType>("dragend", key, listener, active)
    }
    
    onDragEnter<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"dragenter",DataType>) => void, active?: ActiveOrPassive): void
    onDragEnter<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"dragenter",DataType>) => void, active?: ActiveOrPassive): void
    onDragEnter<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"dragenter",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"dragenter",DataType>("dragenter", key, listener, active)
    }
    
    onDragLeave<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"dragleave",DataType>) => void, active?: ActiveOrPassive): void
    onDragLeave<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"dragleave",DataType>) => void, active?: ActiveOrPassive): void
    onDragLeave<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"dragleave",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"dragleave",DataType>("dragleave", key, listener, active)
    }
    
    onDragOver<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"dragover",DataType>) => void, active?: ActiveOrPassive): void
    onDragOver<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"dragover",DataType>) => void, active?: ActiveOrPassive): void
    onDragOver<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"dragover",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"dragover",DataType>("dragover", key, listener, active)
    }
    
    onDragStart<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"dragstart",DataType>) => void, active?: ActiveOrPassive): void
    onDragStart<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"dragstart",DataType>) => void, active?: ActiveOrPassive): void
    onDragStart<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"dragstart",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"dragstart",DataType>("dragstart", key, listener, active)
    }
    
    onDrop<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"drop",DataType>) => void, active?: ActiveOrPassive): void
    onDrop<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"drop",DataType>) => void, active?: ActiveOrPassive): void
    onDrop<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"drop",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"drop",DataType>("drop", key, listener, active)
    }
    
    onDurationChange<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"durationchange",DataType>) => void, active?: ActiveOrPassive): void
    onDurationChange<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"durationchange",DataType>) => void, active?: ActiveOrPassive): void
    onDurationChange<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"durationchange",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"durationchange",DataType>("durationchange", key, listener, active)
    }
    
    onEmptied<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"emptied",DataType>) => void, active?: ActiveOrPassive): void
    onEmptied<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"emptied",DataType>) => void, active?: ActiveOrPassive): void
    onEmptied<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"emptied",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"emptied",DataType>("emptied", key, listener, active)
    }
    
    onEnded<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"ended",DataType>) => void, active?: ActiveOrPassive): void
    onEnded<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"ended",DataType>) => void, active?: ActiveOrPassive): void
    onEnded<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"ended",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"ended",DataType>("ended", key, listener, active)
    }
    
    onError<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"error",DataType>) => void, active?: ActiveOrPassive): void
    onError<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"error",DataType>) => void, active?: ActiveOrPassive): void
    onError<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"error",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"error",DataType>("error", key, listener, active)
    }
    
    onFocus<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"focus",DataType>) => void, active?: ActiveOrPassive): void
    onFocus<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"focus",DataType>) => void, active?: ActiveOrPassive): void
    onFocus<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"focus",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"focus",DataType>("focus", key, listener, active)
    }
    
    onFocusIn<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"focusin",DataType>) => void, active?: ActiveOrPassive): void
    onFocusIn<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"focusin",DataType>) => void, active?: ActiveOrPassive): void
    onFocusIn<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"focusin",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"focusin",DataType>("focusin", key, listener, active)
    }
    
    onFocusOut<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"focusout",DataType>) => void, active?: ActiveOrPassive): void
    onFocusOut<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"focusout",DataType>) => void, active?: ActiveOrPassive): void
    onFocusOut<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"focusout",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"focusout",DataType>("focusout", key, listener, active)
    }
    
    onFormData<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"formdata",DataType>) => void, active?: ActiveOrPassive): void
    onFormData<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"formdata",DataType>) => void, active?: ActiveOrPassive): void
    onFormData<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"formdata",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"formdata",DataType>("formdata", key, listener, active)
    }
    
    onFullscreenChange<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"fullscreenchange",DataType>) => void, active?: ActiveOrPassive): void
    onFullscreenChange<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"fullscreenchange",DataType>) => void, active?: ActiveOrPassive): void
    onFullscreenChange<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"fullscreenchange",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"fullscreenchange",DataType>("fullscreenchange", key, listener, active)
    }
    
    onFullscreenError<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"fullscreenerror",DataType>) => void, active?: ActiveOrPassive): void
    onFullscreenError<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"fullscreenerror",DataType>) => void, active?: ActiveOrPassive): void
    onFullscreenError<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"fullscreenerror",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"fullscreenerror",DataType>("fullscreenerror", key, listener, active)
    }
    
    onGotPointerCapture<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"gotpointercapture",DataType>) => void, active?: ActiveOrPassive): void
    onGotPointerCapture<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"gotpointercapture",DataType>) => void, active?: ActiveOrPassive): void
    onGotPointerCapture<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"gotpointercapture",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"gotpointercapture",DataType>("gotpointercapture", key, listener, active)
    }
    
    onInput<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"input",DataType>) => void, active?: ActiveOrPassive): void
    onInput<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"input",DataType>) => void, active?: ActiveOrPassive): void
    onInput<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"input",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"input",DataType>("input", key, listener, active)
    }
    
    onInvalid<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"invalid",DataType>) => void, active?: ActiveOrPassive): void
    onInvalid<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"invalid",DataType>) => void, active?: ActiveOrPassive): void
    onInvalid<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"invalid",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"invalid",DataType>("invalid", key, listener, active)
    }
    
    onKeyDown<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"keydown",DataType>) => void, active?: ActiveOrPassive): void
    onKeyDown<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"keydown",DataType>) => void, active?: ActiveOrPassive): void
    onKeyDown<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"keydown",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"keydown",DataType>("keydown", key, listener, active)
    }
    
    onKeyPress<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"keypress",DataType>) => void, active?: ActiveOrPassive): void
    onKeyPress<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"keypress",DataType>) => void, active?: ActiveOrPassive): void
    onKeyPress<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"keypress",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"keypress",DataType>("keypress", key, listener, active)
    }
    
    onKeyUp<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"keyup",DataType>) => void, active?: ActiveOrPassive): void
    onKeyUp<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"keyup",DataType>) => void, active?: ActiveOrPassive): void
    onKeyUp<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"keyup",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"keyup",DataType>("keyup", key, listener, active)
    }
    
    onLoad<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"load",DataType>) => void, active?: ActiveOrPassive): void
    onLoad<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"load",DataType>) => void, active?: ActiveOrPassive): void
    onLoad<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"load",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"load",DataType>("load", key, listener, active)
    }
    
    onLoadedData<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"loadeddata",DataType>) => void, active?: ActiveOrPassive): void
    onLoadedData<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"loadeddata",DataType>) => void, active?: ActiveOrPassive): void
    onLoadedData<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"loadeddata",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"loadeddata",DataType>("loadeddata", key, listener, active)
    }
    
    onLoadedMetadata<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"loadedmetadata",DataType>) => void, active?: ActiveOrPassive): void
    onLoadedMetadata<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"loadedmetadata",DataType>) => void, active?: ActiveOrPassive): void
    onLoadedMetadata<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"loadedmetadata",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"loadedmetadata",DataType>("loadedmetadata", key, listener, active)
    }
    
    onLoadStart<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"loadstart",DataType>) => void, active?: ActiveOrPassive): void
    onLoadStart<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"loadstart",DataType>) => void, active?: ActiveOrPassive): void
    onLoadStart<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"loadstart",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"loadstart",DataType>("loadstart", key, listener, active)
    }
    
    onLostPointerCapture<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"lostpointercapture",DataType>) => void, active?: ActiveOrPassive): void
    onLostPointerCapture<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"lostpointercapture",DataType>) => void, active?: ActiveOrPassive): void
    onLostPointerCapture<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"lostpointercapture",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"lostpointercapture",DataType>("lostpointercapture", key, listener, active)
    }
    
    onMouseDown<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"mousedown",DataType>) => void, active?: ActiveOrPassive): void
    onMouseDown<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"mousedown",DataType>) => void, active?: ActiveOrPassive): void
    onMouseDown<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"mousedown",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"mousedown",DataType>("mousedown", key, listener, active)
    }
    
    onMouseEnter<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"mouseenter",DataType>) => void, active?: ActiveOrPassive): void
    onMouseEnter<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"mouseenter",DataType>) => void, active?: ActiveOrPassive): void
    onMouseEnter<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"mouseenter",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"mouseenter",DataType>("mouseenter", key, listener, active)
    }
    
    onMouseLeave<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"mouseleave",DataType>) => void, active?: ActiveOrPassive): void
    onMouseLeave<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"mouseleave",DataType>) => void, active?: ActiveOrPassive): void
    onMouseLeave<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"mouseleave",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"mouseleave",DataType>("mouseleave", key, listener, active)
    }
    
    onMouseMove<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"mousemove",DataType>) => void, active?: ActiveOrPassive): void
    onMouseMove<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"mousemove",DataType>) => void, active?: ActiveOrPassive): void
    onMouseMove<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"mousemove",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"mousemove",DataType>("mousemove", key, listener, active)
    }
    
    onMouseOut<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"mouseout",DataType>) => void, active?: ActiveOrPassive): void
    onMouseOut<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"mouseout",DataType>) => void, active?: ActiveOrPassive): void
    onMouseOut<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"mouseout",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"mouseout",DataType>("mouseout", key, listener, active)
    }
    
    onMouseOver<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"mouseover",DataType>) => void, active?: ActiveOrPassive): void
    onMouseOver<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"mouseover",DataType>) => void, active?: ActiveOrPassive): void
    onMouseOver<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"mouseover",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"mouseover",DataType>("mouseover", key, listener, active)
    }
    
    onMouseUp<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"mouseup",DataType>) => void, active?: ActiveOrPassive): void
    onMouseUp<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"mouseup",DataType>) => void, active?: ActiveOrPassive): void
    onMouseUp<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"mouseup",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"mouseup",DataType>("mouseup", key, listener, active)
    }
    
    onPaste<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"paste",DataType>) => void, active?: ActiveOrPassive): void
    onPaste<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"paste",DataType>) => void, active?: ActiveOrPassive): void
    onPaste<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"paste",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"paste",DataType>("paste", key, listener, active)
    }
    
    onPause<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"pause",DataType>) => void, active?: ActiveOrPassive): void
    onPause<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"pause",DataType>) => void, active?: ActiveOrPassive): void
    onPause<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"pause",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"pause",DataType>("pause", key, listener, active)
    }
    
    onPlay<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"play",DataType>) => void, active?: ActiveOrPassive): void
    onPlay<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"play",DataType>) => void, active?: ActiveOrPassive): void
    onPlay<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"play",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"play",DataType>("play", key, listener, active)
    }
    
    onPlaying<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"playing",DataType>) => void, active?: ActiveOrPassive): void
    onPlaying<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"playing",DataType>) => void, active?: ActiveOrPassive): void
    onPlaying<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"playing",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"playing",DataType>("playing", key, listener, active)
    }
    
    onPointerCancel<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"pointercancel",DataType>) => void, active?: ActiveOrPassive): void
    onPointerCancel<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"pointercancel",DataType>) => void, active?: ActiveOrPassive): void
    onPointerCancel<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"pointercancel",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"pointercancel",DataType>("pointercancel", key, listener, active)
    }
    
    onPointerDown<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"pointerdown",DataType>) => void, active?: ActiveOrPassive): void
    onPointerDown<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"pointerdown",DataType>) => void, active?: ActiveOrPassive): void
    onPointerDown<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"pointerdown",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"pointerdown",DataType>("pointerdown", key, listener, active)
    }
    
    onPointerEnter<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"pointerenter",DataType>) => void, active?: ActiveOrPassive): void
    onPointerEnter<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"pointerenter",DataType>) => void, active?: ActiveOrPassive): void
    onPointerEnter<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"pointerenter",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"pointerenter",DataType>("pointerenter", key, listener, active)
    }
    
    onPointerLeave<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"pointerleave",DataType>) => void, active?: ActiveOrPassive): void
    onPointerLeave<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"pointerleave",DataType>) => void, active?: ActiveOrPassive): void
    onPointerLeave<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"pointerleave",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"pointerleave",DataType>("pointerleave", key, listener, active)
    }
    
    onPointerMove<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"pointermove",DataType>) => void, active?: ActiveOrPassive): void
    onPointerMove<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"pointermove",DataType>) => void, active?: ActiveOrPassive): void
    onPointerMove<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"pointermove",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"pointermove",DataType>("pointermove", key, listener, active)
    }
    
    onPointerOut<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"pointerout",DataType>) => void, active?: ActiveOrPassive): void
    onPointerOut<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"pointerout",DataType>) => void, active?: ActiveOrPassive): void
    onPointerOut<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"pointerout",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"pointerout",DataType>("pointerout", key, listener, active)
    }
    
    onPointerOver<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"pointerover",DataType>) => void, active?: ActiveOrPassive): void
    onPointerOver<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"pointerover",DataType>) => void, active?: ActiveOrPassive): void
    onPointerOver<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"pointerover",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"pointerover",DataType>("pointerover", key, listener, active)
    }
    
    onPointerUp<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"pointerup",DataType>) => void, active?: ActiveOrPassive): void
    onPointerUp<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"pointerup",DataType>) => void, active?: ActiveOrPassive): void
    onPointerUp<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"pointerup",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"pointerup",DataType>("pointerup", key, listener, active)
    }
    
    onProgress<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"progress",DataType>) => void, active?: ActiveOrPassive): void
    onProgress<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"progress",DataType>) => void, active?: ActiveOrPassive): void
    onProgress<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"progress",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"progress",DataType>("progress", key, listener, active)
    }
    
    onRateChange<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"ratechange",DataType>) => void, active?: ActiveOrPassive): void
    onRateChange<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"ratechange",DataType>) => void, active?: ActiveOrPassive): void
    onRateChange<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"ratechange",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"ratechange",DataType>("ratechange", key, listener, active)
    }
    
    onReset<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"reset",DataType>) => void, active?: ActiveOrPassive): void
    onReset<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"reset",DataType>) => void, active?: ActiveOrPassive): void
    onReset<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"reset",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"reset",DataType>("reset", key, listener, active)
    }
    
    onResize<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"resize",DataType>) => void, active?: ActiveOrPassive): void
    onResize<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"resize",DataType>) => void, active?: ActiveOrPassive): void
    onResize<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"resize",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"resize",DataType>("resize", key, listener, active)
    }
    
    onScroll<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"scroll",DataType>) => void, active?: ActiveOrPassive): void
    onScroll<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"scroll",DataType>) => void, active?: ActiveOrPassive): void
    onScroll<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"scroll",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"scroll",DataType>("scroll", key, listener, active)
    }
    
    onSecurityPolicyViolation<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"securitypolicyviolation",DataType>) => void, active?: ActiveOrPassive): void
    onSecurityPolicyViolation<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"securitypolicyviolation",DataType>) => void, active?: ActiveOrPassive): void
    onSecurityPolicyViolation<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"securitypolicyviolation",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"securitypolicyviolation",DataType>("securitypolicyviolation", key, listener, active)
    }
    
    onSeeked<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"seeked",DataType>) => void, active?: ActiveOrPassive): void
    onSeeked<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"seeked",DataType>) => void, active?: ActiveOrPassive): void
    onSeeked<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"seeked",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"seeked",DataType>("seeked", key, listener, active)
    }
    
    onSeeking<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"seeking",DataType>) => void, active?: ActiveOrPassive): void
    onSeeking<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"seeking",DataType>) => void, active?: ActiveOrPassive): void
    onSeeking<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"seeking",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"seeking",DataType>("seeking", key, listener, active)
    }
    
    onSelect<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"select",DataType>) => void, active?: ActiveOrPassive): void
    onSelect<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"select",DataType>) => void, active?: ActiveOrPassive): void
    onSelect<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"select",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"select",DataType>("select", key, listener, active)
    }
    
    onSelectionChange<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"selectionchange",DataType>) => void, active?: ActiveOrPassive): void
    onSelectionChange<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"selectionchange",DataType>) => void, active?: ActiveOrPassive): void
    onSelectionChange<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"selectionchange",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"selectionchange",DataType>("selectionchange", key, listener, active)
    }
    
    onSelectStart<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"selectstart",DataType>) => void, active?: ActiveOrPassive): void
    onSelectStart<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"selectstart",DataType>) => void, active?: ActiveOrPassive): void
    onSelectStart<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"selectstart",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"selectstart",DataType>("selectstart", key, listener, active)
    }
    
    onStalled<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"stalled",DataType>) => void, active?: ActiveOrPassive): void
    onStalled<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"stalled",DataType>) => void, active?: ActiveOrPassive): void
    onStalled<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"stalled",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"stalled",DataType>("stalled", key, listener, active)
    }
    
    onSubmit<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"submit",DataType>) => void, active?: ActiveOrPassive): void
    onSubmit<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"submit",DataType>) => void, active?: ActiveOrPassive): void
    onSubmit<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"submit",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"submit",DataType>("submit", key, listener, active)
    }
    
    onSuspend<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"suspend",DataType>) => void, active?: ActiveOrPassive): void
    onSuspend<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"suspend",DataType>) => void, active?: ActiveOrPassive): void
    onSuspend<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"suspend",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"suspend",DataType>("suspend", key, listener, active)
    }
    
    onTimeUpdate<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"timeupdate",DataType>) => void, active?: ActiveOrPassive): void
    onTimeUpdate<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"timeupdate",DataType>) => void, active?: ActiveOrPassive): void
    onTimeUpdate<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"timeupdate",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"timeupdate",DataType>("timeupdate", key, listener, active)
    }
    
    onToggle<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"toggle",DataType>) => void, active?: ActiveOrPassive): void
    onToggle<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"toggle",DataType>) => void, active?: ActiveOrPassive): void
    onToggle<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"toggle",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"toggle",DataType>("toggle", key, listener, active)
    }
    
    onTouchCancel<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"touchcancel",DataType>) => void, active?: ActiveOrPassive): void
    onTouchCancel<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"touchcancel",DataType>) => void, active?: ActiveOrPassive): void
    onTouchCancel<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"touchcancel",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"touchcancel",DataType>("touchcancel", key, listener, active)
    }
    
    onTouchEnd<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"touchend",DataType>) => void, active?: ActiveOrPassive): void
    onTouchEnd<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"touchend",DataType>) => void, active?: ActiveOrPassive): void
    onTouchEnd<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"touchend",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"touchend",DataType>("touchend", key, listener, active)
    }
    
    onTouchMove<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"touchmove",DataType>) => void, active?: ActiveOrPassive): void
    onTouchMove<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"touchmove",DataType>) => void, active?: ActiveOrPassive): void
    onTouchMove<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"touchmove",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"touchmove",DataType>("touchmove", key, listener, active)
    }
    
    onTouchStart<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"touchstart",DataType>) => void, active?: ActiveOrPassive): void
    onTouchStart<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"touchstart",DataType>) => void, active?: ActiveOrPassive): void
    onTouchStart<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"touchstart",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"touchstart",DataType>("touchstart", key, listener, active)
    }
    
    onTransitionCancel<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"transitioncancel",DataType>) => void, active?: ActiveOrPassive): void
    onTransitionCancel<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"transitioncancel",DataType>) => void, active?: ActiveOrPassive): void
    onTransitionCancel<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"transitioncancel",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"transitioncancel",DataType>("transitioncancel", key, listener, active)
    }
    
    onTransitionEnd<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"transitionend",DataType>) => void, active?: ActiveOrPassive): void
    onTransitionEnd<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"transitionend",DataType>) => void, active?: ActiveOrPassive): void
    onTransitionEnd<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"transitionend",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"transitionend",DataType>("transitionend", key, listener, active)
    }
    
    onTransitionRun<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"transitionrun",DataType>) => void, active?: ActiveOrPassive): void
    onTransitionRun<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"transitionrun",DataType>) => void, active?: ActiveOrPassive): void
    onTransitionRun<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"transitionrun",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"transitionrun",DataType>("transitionrun", key, listener, active)
    }
    
    onTransitionStart<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"transitionstart",DataType>) => void, active?: ActiveOrPassive): void
    onTransitionStart<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"transitionstart",DataType>) => void, active?: ActiveOrPassive): void
    onTransitionStart<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"transitionstart",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"transitionstart",DataType>("transitionstart", key, listener, active)
    }
    
    onVolumeChange<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"volumechange",DataType>) => void, active?: ActiveOrPassive): void
    onVolumeChange<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"volumechange",DataType>) => void, active?: ActiveOrPassive): void
    onVolumeChange<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"volumechange",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"volumechange",DataType>("volumechange", key, listener, active)
    }
    
    onWaiting<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"waiting",DataType>) => void, active?: ActiveOrPassive): void
    onWaiting<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"waiting",DataType>) => void, active?: ActiveOrPassive): void
    onWaiting<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"waiting",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"waiting",DataType>("waiting", key, listener, active)
    }
    
    onWebkitAnimationEnd<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"webkitanimationend",DataType>) => void, active?: ActiveOrPassive): void
    onWebkitAnimationEnd<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"webkitanimationend",DataType>) => void, active?: ActiveOrPassive): void
    onWebkitAnimationEnd<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"webkitanimationend",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"webkitanimationend",DataType>("webkitanimationend", key, listener, active)
    }
    
    onWebkitAnimationIteration<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"webkitanimationiteration",DataType>) => void, active?: ActiveOrPassive): void
    onWebkitAnimationIteration<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"webkitanimationiteration",DataType>) => void, active?: ActiveOrPassive): void
    onWebkitAnimationIteration<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"webkitanimationiteration",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"webkitanimationiteration",DataType>("webkitanimationiteration", key, listener, active)
    }
    
    onWebkitAnimationStart<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"webkitanimationstart",DataType>) => void, active?: ActiveOrPassive): void
    onWebkitAnimationStart<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"webkitanimationstart",DataType>) => void, active?: ActiveOrPassive): void
    onWebkitAnimationStart<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"webkitanimationstart",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"webkitanimationstart",DataType>("webkitanimationstart", key, listener, active)
    }
    
    onWebkitTransitionEnd<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"webkittransitionend",DataType>) => void, active?: ActiveOrPassive): void
    onWebkitTransitionEnd<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"webkittransitionend",DataType>) => void, active?: ActiveOrPassive): void
    onWebkitTransitionEnd<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"webkittransitionend",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"webkittransitionend",DataType>("webkittransitionend", key, listener, active)
    }
    
    onWheel<DataType>(key: messages.UntypedKey, listener: (m: messages.Message<"wheel",DataType>) => void, active?: ActiveOrPassive): void
    onWheel<DataType>(key: messages.TypedKey<DataType>, listener: (m: messages.Message<"wheel",DataType>) => void, active?: ActiveOrPassive): void
    onWheel<DataType>(key: messages.UntypedKey | messages.TypedKey<DataType>, listener: (m: messages.Message<"wheel",DataType>) => void, active?: ActiveOrPassive): void {
        this.listen<"wheel",DataType>("wheel", key, listener, active)
    }
    
//// End Listen Methods


    /// Mounting
    
    private _element?: HTMLElement

    get element(): HTMLElement {
        return this._element || document.getElementById(this.id)!
    }

    private mount(elem: MountPoint) {
        if (elem instanceof HTMLElement) {
            this._element = elem!
        }
        else {
            this._element = document.getElementById(elem)!
        }
        this.requestFrame()
    }

    // Mounts a part to a DOM element (by DOM object or id)
    static mount<PartType extends Part<StateType>, StateType>(partType: {new (parent: PartParent, id: string, state: StateType): PartType}, mountPoint: MountPoint, state: StateType): PartType {
        const id = typeof mountPoint == 'string' ? mountPoint : mountPoint.getAttribute("id")
        if (!id) {
            throw "You must either mount a part directly to a DOM node with id attribute or provide the id value as a string"
        }
        const part = new partType(null, id, state)
        part.mount(mountPoint)
        return part
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
            // stop the update chain, re-render the whole tree from here on down
            const elem = this.element
            log.debugTime('Update', () => {
                this._init()
                let parent = new Tag("")
                this.render(parent)
                let output = Array<string>()
                parent.buildInner(output)
                elem.innerHTML = output.join('')
                this.eachChild(child => {
                    child.needsEventListeners()
                })
            })
            this._dirty = false
            this.attachEventListeners()
        }
        else {
            // keep propagating through the tree to see if anyone else needs to be rendered
            this.eachChild(child => {
                child.update()
            })
        }
    }

}
