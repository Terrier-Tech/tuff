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

    attachEventListeners() {
        let elem = this.element
        for (let type of this.htmlHandlers.keys()) {
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


    //// Begin Listen Methods

    onAbort(key: MessageKey, listener: (m: HTMLMessage<"abort">) => void, active: ActiveOrPassive = "active") {
        this.listen("abort", key, listener, active)
    }
    
    onAnimationCancel(key: MessageKey, listener: (m: HTMLMessage<"animationcancel">) => void, active: ActiveOrPassive = "active") {
        this.listen("animationcancel", key, listener, active)
    }
    
    onAnimationEnd(key: MessageKey, listener: (m: HTMLMessage<"animationend">) => void, active: ActiveOrPassive = "active") {
        this.listen("animationend", key, listener, active)
    }
    
    onAnimationIteration(key: MessageKey, listener: (m: HTMLMessage<"animationiteration">) => void, active: ActiveOrPassive = "active") {
        this.listen("animationiteration", key, listener, active)
    }
    
    onAnimationStart(key: MessageKey, listener: (m: HTMLMessage<"animationstart">) => void, active: ActiveOrPassive = "active") {
        this.listen("animationstart", key, listener, active)
    }
    
    onAuxClick(key: MessageKey, listener: (m: HTMLMessage<"auxclick">) => void, active: ActiveOrPassive = "active") {
        this.listen("auxclick", key, listener, active)
    }
    
    onBeforeInput(key: MessageKey, listener: (m: HTMLMessage<"beforeinput">) => void, active: ActiveOrPassive = "active") {
        this.listen("beforeinput", key, listener, active)
    }
    
    onBlur(key: MessageKey, listener: (m: HTMLMessage<"blur">) => void, active: ActiveOrPassive = "active") {
        this.listen("blur", key, listener, active)
    }
    
    onCanPlay(key: MessageKey, listener: (m: HTMLMessage<"canplay">) => void, active: ActiveOrPassive = "active") {
        this.listen("canplay", key, listener, active)
    }
    
    onCanPlayThrough(key: MessageKey, listener: (m: HTMLMessage<"canplaythrough">) => void, active: ActiveOrPassive = "active") {
        this.listen("canplaythrough", key, listener, active)
    }
    
    onChange(key: MessageKey, listener: (m: HTMLMessage<"change">) => void, active: ActiveOrPassive = "active") {
        this.listen("change", key, listener, active)
    }
    
    onClick(key: MessageKey, listener: (m: HTMLMessage<"click">) => void, active: ActiveOrPassive = "active") {
        this.listen("click", key, listener, active)
    }
    
    onClose(key: MessageKey, listener: (m: HTMLMessage<"close">) => void, active: ActiveOrPassive = "active") {
        this.listen("close", key, listener, active)
    }
    
    onCompositionEnd(key: MessageKey, listener: (m: HTMLMessage<"compositionend">) => void, active: ActiveOrPassive = "active") {
        this.listen("compositionend", key, listener, active)
    }
    
    onCompositionStart(key: MessageKey, listener: (m: HTMLMessage<"compositionstart">) => void, active: ActiveOrPassive = "active") {
        this.listen("compositionstart", key, listener, active)
    }
    
    onCompositionUpdate(key: MessageKey, listener: (m: HTMLMessage<"compositionupdate">) => void, active: ActiveOrPassive = "active") {
        this.listen("compositionupdate", key, listener, active)
    }
    
    onContextMenu(key: MessageKey, listener: (m: HTMLMessage<"contextmenu">) => void, active: ActiveOrPassive = "active") {
        this.listen("contextmenu", key, listener, active)
    }
    
    onCopy(key: MessageKey, listener: (m: HTMLMessage<"copy">) => void, active: ActiveOrPassive = "active") {
        this.listen("copy", key, listener, active)
    }
    
    onCueChange(key: MessageKey, listener: (m: HTMLMessage<"cuechange">) => void, active: ActiveOrPassive = "active") {
        this.listen("cuechange", key, listener, active)
    }
    
    onCut(key: MessageKey, listener: (m: HTMLMessage<"cut">) => void, active: ActiveOrPassive = "active") {
        this.listen("cut", key, listener, active)
    }
    
    onDblClick(key: MessageKey, listener: (m: HTMLMessage<"dblclick">) => void, active: ActiveOrPassive = "active") {
        this.listen("dblclick", key, listener, active)
    }
    
    onDrag(key: MessageKey, listener: (m: HTMLMessage<"drag">) => void, active: ActiveOrPassive = "active") {
        this.listen("drag", key, listener, active)
    }
    
    onDragEnd(key: MessageKey, listener: (m: HTMLMessage<"dragend">) => void, active: ActiveOrPassive = "active") {
        this.listen("dragend", key, listener, active)
    }
    
    onDragEnter(key: MessageKey, listener: (m: HTMLMessage<"dragenter">) => void, active: ActiveOrPassive = "active") {
        this.listen("dragenter", key, listener, active)
    }
    
    onDragLeave(key: MessageKey, listener: (m: HTMLMessage<"dragleave">) => void, active: ActiveOrPassive = "active") {
        this.listen("dragleave", key, listener, active)
    }
    
    onDragOver(key: MessageKey, listener: (m: HTMLMessage<"dragover">) => void, active: ActiveOrPassive = "active") {
        this.listen("dragover", key, listener, active)
    }
    
    onDragStart(key: MessageKey, listener: (m: HTMLMessage<"dragstart">) => void, active: ActiveOrPassive = "active") {
        this.listen("dragstart", key, listener, active)
    }
    
    onDrop(key: MessageKey, listener: (m: HTMLMessage<"drop">) => void, active: ActiveOrPassive = "active") {
        this.listen("drop", key, listener, active)
    }
    
    onDurationChange(key: MessageKey, listener: (m: HTMLMessage<"durationchange">) => void, active: ActiveOrPassive = "active") {
        this.listen("durationchange", key, listener, active)
    }
    
    onEmptied(key: MessageKey, listener: (m: HTMLMessage<"emptied">) => void, active: ActiveOrPassive = "active") {
        this.listen("emptied", key, listener, active)
    }
    
    onEnded(key: MessageKey, listener: (m: HTMLMessage<"ended">) => void, active: ActiveOrPassive = "active") {
        this.listen("ended", key, listener, active)
    }
    
    onError(key: MessageKey, listener: (m: HTMLMessage<"error">) => void, active: ActiveOrPassive = "active") {
        this.listen("error", key, listener, active)
    }
    
    onFocus(key: MessageKey, listener: (m: HTMLMessage<"focus">) => void, active: ActiveOrPassive = "active") {
        this.listen("focus", key, listener, active)
    }
    
    onFocusIn(key: MessageKey, listener: (m: HTMLMessage<"focusin">) => void, active: ActiveOrPassive = "active") {
        this.listen("focusin", key, listener, active)
    }
    
    onFocusOut(key: MessageKey, listener: (m: HTMLMessage<"focusout">) => void, active: ActiveOrPassive = "active") {
        this.listen("focusout", key, listener, active)
    }
    
    onFormData(key: MessageKey, listener: (m: HTMLMessage<"formdata">) => void, active: ActiveOrPassive = "active") {
        this.listen("formdata", key, listener, active)
    }
    
    onFullscreenChange(key: MessageKey, listener: (m: HTMLMessage<"fullscreenchange">) => void, active: ActiveOrPassive = "active") {
        this.listen("fullscreenchange", key, listener, active)
    }
    
    onFullscreenError(key: MessageKey, listener: (m: HTMLMessage<"fullscreenerror">) => void, active: ActiveOrPassive = "active") {
        this.listen("fullscreenerror", key, listener, active)
    }
    
    onGotPointerCapture(key: MessageKey, listener: (m: HTMLMessage<"gotpointercapture">) => void, active: ActiveOrPassive = "active") {
        this.listen("gotpointercapture", key, listener, active)
    }
    
    onInput(key: MessageKey, listener: (m: HTMLMessage<"input">) => void, active: ActiveOrPassive = "active") {
        this.listen("input", key, listener, active)
    }
    
    onInvalid(key: MessageKey, listener: (m: HTMLMessage<"invalid">) => void, active: ActiveOrPassive = "active") {
        this.listen("invalid", key, listener, active)
    }
    
    onKeyDown(key: MessageKey, listener: (m: HTMLMessage<"keydown">) => void, active: ActiveOrPassive = "active") {
        this.listen("keydown", key, listener, active)
    }
    
    onKeyPress(key: MessageKey, listener: (m: HTMLMessage<"keypress">) => void, active: ActiveOrPassive = "active") {
        this.listen("keypress", key, listener, active)
    }
    
    onKeyUp(key: MessageKey, listener: (m: HTMLMessage<"keyup">) => void, active: ActiveOrPassive = "active") {
        this.listen("keyup", key, listener, active)
    }
    
    onLoad(key: MessageKey, listener: (m: HTMLMessage<"load">) => void, active: ActiveOrPassive = "active") {
        this.listen("load", key, listener, active)
    }
    
    onLoadedData(key: MessageKey, listener: (m: HTMLMessage<"loadeddata">) => void, active: ActiveOrPassive = "active") {
        this.listen("loadeddata", key, listener, active)
    }
    
    onLoadedMetadata(key: MessageKey, listener: (m: HTMLMessage<"loadedmetadata">) => void, active: ActiveOrPassive = "active") {
        this.listen("loadedmetadata", key, listener, active)
    }
    
    onLoadStart(key: MessageKey, listener: (m: HTMLMessage<"loadstart">) => void, active: ActiveOrPassive = "active") {
        this.listen("loadstart", key, listener, active)
    }
    
    onLostPointerCapture(key: MessageKey, listener: (m: HTMLMessage<"lostpointercapture">) => void, active: ActiveOrPassive = "active") {
        this.listen("lostpointercapture", key, listener, active)
    }
    
    onMouseDown(key: MessageKey, listener: (m: HTMLMessage<"mousedown">) => void, active: ActiveOrPassive = "active") {
        this.listen("mousedown", key, listener, active)
    }
    
    onMouseEnter(key: MessageKey, listener: (m: HTMLMessage<"mouseenter">) => void, active: ActiveOrPassive = "active") {
        this.listen("mouseenter", key, listener, active)
    }
    
    onMouseLeave(key: MessageKey, listener: (m: HTMLMessage<"mouseleave">) => void, active: ActiveOrPassive = "active") {
        this.listen("mouseleave", key, listener, active)
    }
    
    onMouseMove(key: MessageKey, listener: (m: HTMLMessage<"mousemove">) => void, active: ActiveOrPassive = "active") {
        this.listen("mousemove", key, listener, active)
    }
    
    onMouseOut(key: MessageKey, listener: (m: HTMLMessage<"mouseout">) => void, active: ActiveOrPassive = "active") {
        this.listen("mouseout", key, listener, active)
    }
    
    onMouseOver(key: MessageKey, listener: (m: HTMLMessage<"mouseover">) => void, active: ActiveOrPassive = "active") {
        this.listen("mouseover", key, listener, active)
    }
    
    onMouseUp(key: MessageKey, listener: (m: HTMLMessage<"mouseup">) => void, active: ActiveOrPassive = "active") {
        this.listen("mouseup", key, listener, active)
    }
    
    onPaste(key: MessageKey, listener: (m: HTMLMessage<"paste">) => void, active: ActiveOrPassive = "active") {
        this.listen("paste", key, listener, active)
    }
    
    onPause(key: MessageKey, listener: (m: HTMLMessage<"pause">) => void, active: ActiveOrPassive = "active") {
        this.listen("pause", key, listener, active)
    }
    
    onPlay(key: MessageKey, listener: (m: HTMLMessage<"play">) => void, active: ActiveOrPassive = "active") {
        this.listen("play", key, listener, active)
    }
    
    onPlaying(key: MessageKey, listener: (m: HTMLMessage<"playing">) => void, active: ActiveOrPassive = "active") {
        this.listen("playing", key, listener, active)
    }
    
    onPointerCancel(key: MessageKey, listener: (m: HTMLMessage<"pointercancel">) => void, active: ActiveOrPassive = "active") {
        this.listen("pointercancel", key, listener, active)
    }
    
    onPointerDown(key: MessageKey, listener: (m: HTMLMessage<"pointerdown">) => void, active: ActiveOrPassive = "active") {
        this.listen("pointerdown", key, listener, active)
    }
    
    onPointerEnter(key: MessageKey, listener: (m: HTMLMessage<"pointerenter">) => void, active: ActiveOrPassive = "active") {
        this.listen("pointerenter", key, listener, active)
    }
    
    onPointerLeave(key: MessageKey, listener: (m: HTMLMessage<"pointerleave">) => void, active: ActiveOrPassive = "active") {
        this.listen("pointerleave", key, listener, active)
    }
    
    onPointerMove(key: MessageKey, listener: (m: HTMLMessage<"pointermove">) => void, active: ActiveOrPassive = "active") {
        this.listen("pointermove", key, listener, active)
    }
    
    onPointerOut(key: MessageKey, listener: (m: HTMLMessage<"pointerout">) => void, active: ActiveOrPassive = "active") {
        this.listen("pointerout", key, listener, active)
    }
    
    onPointerOver(key: MessageKey, listener: (m: HTMLMessage<"pointerover">) => void, active: ActiveOrPassive = "active") {
        this.listen("pointerover", key, listener, active)
    }
    
    onPointerUp(key: MessageKey, listener: (m: HTMLMessage<"pointerup">) => void, active: ActiveOrPassive = "active") {
        this.listen("pointerup", key, listener, active)
    }
    
    onProgress(key: MessageKey, listener: (m: HTMLMessage<"progress">) => void, active: ActiveOrPassive = "active") {
        this.listen("progress", key, listener, active)
    }
    
    onRateChange(key: MessageKey, listener: (m: HTMLMessage<"ratechange">) => void, active: ActiveOrPassive = "active") {
        this.listen("ratechange", key, listener, active)
    }
    
    onReset(key: MessageKey, listener: (m: HTMLMessage<"reset">) => void, active: ActiveOrPassive = "active") {
        this.listen("reset", key, listener, active)
    }
    
    onResize(key: MessageKey, listener: (m: HTMLMessage<"resize">) => void, active: ActiveOrPassive = "active") {
        this.listen("resize", key, listener, active)
    }
    
    onScroll(key: MessageKey, listener: (m: HTMLMessage<"scroll">) => void, active: ActiveOrPassive = "active") {
        this.listen("scroll", key, listener, active)
    }
    
    onSecurityPolicyViolation(key: MessageKey, listener: (m: HTMLMessage<"securitypolicyviolation">) => void, active: ActiveOrPassive = "active") {
        this.listen("securitypolicyviolation", key, listener, active)
    }
    
    onSeeked(key: MessageKey, listener: (m: HTMLMessage<"seeked">) => void, active: ActiveOrPassive = "active") {
        this.listen("seeked", key, listener, active)
    }
    
    onSeeking(key: MessageKey, listener: (m: HTMLMessage<"seeking">) => void, active: ActiveOrPassive = "active") {
        this.listen("seeking", key, listener, active)
    }
    
    onSelect(key: MessageKey, listener: (m: HTMLMessage<"select">) => void, active: ActiveOrPassive = "active") {
        this.listen("select", key, listener, active)
    }
    
    onSelectionChange(key: MessageKey, listener: (m: HTMLMessage<"selectionchange">) => void, active: ActiveOrPassive = "active") {
        this.listen("selectionchange", key, listener, active)
    }
    
    onSelectStart(key: MessageKey, listener: (m: HTMLMessage<"selectstart">) => void, active: ActiveOrPassive = "active") {
        this.listen("selectstart", key, listener, active)
    }
    
    onStalled(key: MessageKey, listener: (m: HTMLMessage<"stalled">) => void, active: ActiveOrPassive = "active") {
        this.listen("stalled", key, listener, active)
    }
    
    onSubmit(key: MessageKey, listener: (m: HTMLMessage<"submit">) => void, active: ActiveOrPassive = "active") {
        this.listen("submit", key, listener, active)
    }
    
    onSuspend(key: MessageKey, listener: (m: HTMLMessage<"suspend">) => void, active: ActiveOrPassive = "active") {
        this.listen("suspend", key, listener, active)
    }
    
    onTimeUpdate(key: MessageKey, listener: (m: HTMLMessage<"timeupdate">) => void, active: ActiveOrPassive = "active") {
        this.listen("timeupdate", key, listener, active)
    }
    
    onToggle(key: MessageKey, listener: (m: HTMLMessage<"toggle">) => void, active: ActiveOrPassive = "active") {
        this.listen("toggle", key, listener, active)
    }
    
    onTouchCancel(key: MessageKey, listener: (m: HTMLMessage<"touchcancel">) => void, active: ActiveOrPassive = "active") {
        this.listen("touchcancel", key, listener, active)
    }
    
    onTouchEnd(key: MessageKey, listener: (m: HTMLMessage<"touchend">) => void, active: ActiveOrPassive = "active") {
        this.listen("touchend", key, listener, active)
    }
    
    onTouchMove(key: MessageKey, listener: (m: HTMLMessage<"touchmove">) => void, active: ActiveOrPassive = "active") {
        this.listen("touchmove", key, listener, active)
    }
    
    onTouchStart(key: MessageKey, listener: (m: HTMLMessage<"touchstart">) => void, active: ActiveOrPassive = "active") {
        this.listen("touchstart", key, listener, active)
    }
    
    onTransitionCancel(key: MessageKey, listener: (m: HTMLMessage<"transitioncancel">) => void, active: ActiveOrPassive = "active") {
        this.listen("transitioncancel", key, listener, active)
    }
    
    onTransitionEnd(key: MessageKey, listener: (m: HTMLMessage<"transitionend">) => void, active: ActiveOrPassive = "active") {
        this.listen("transitionend", key, listener, active)
    }
    
    onTransitionRun(key: MessageKey, listener: (m: HTMLMessage<"transitionrun">) => void, active: ActiveOrPassive = "active") {
        this.listen("transitionrun", key, listener, active)
    }
    
    onTransitionStart(key: MessageKey, listener: (m: HTMLMessage<"transitionstart">) => void, active: ActiveOrPassive = "active") {
        this.listen("transitionstart", key, listener, active)
    }
    
    onVolumeChange(key: MessageKey, listener: (m: HTMLMessage<"volumechange">) => void, active: ActiveOrPassive = "active") {
        this.listen("volumechange", key, listener, active)
    }
    
    onWaiting(key: MessageKey, listener: (m: HTMLMessage<"waiting">) => void, active: ActiveOrPassive = "active") {
        this.listen("waiting", key, listener, active)
    }
    
    onWebkitAnimationEnd(key: MessageKey, listener: (m: HTMLMessage<"webkitanimationend">) => void, active: ActiveOrPassive = "active") {
        this.listen("webkitanimationend", key, listener, active)
    }
    
    onWebkitAnimationIteration(key: MessageKey, listener: (m: HTMLMessage<"webkitanimationiteration">) => void, active: ActiveOrPassive = "active") {
        this.listen("webkitanimationiteration", key, listener, active)
    }
    
    onWebkitAnimationStart(key: MessageKey, listener: (m: HTMLMessage<"webkitanimationstart">) => void, active: ActiveOrPassive = "active") {
        this.listen("webkitanimationstart", key, listener, active)
    }
    
    onWebkitTransitionEnd(key: MessageKey, listener: (m: HTMLMessage<"webkittransitionend">) => void, active: ActiveOrPassive = "active") {
        this.listen("webkittransitionend", key, listener, active)
    }
    
    onWheel(key: MessageKey, listener: (m: HTMLMessage<"wheel">) => void, active: ActiveOrPassive = "active") {
        this.listen("wheel", key, listener, active)
    }
    
//// End Listen Methods


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
