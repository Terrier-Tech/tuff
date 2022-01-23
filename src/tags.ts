import { Part } from "./parts"
import * as messages from './messages'
import * as strings from './strings'

type DataAttrs = {[key: string]: any}

/**
 * Resursively constructs data attributes into key/value strings.
 * Nested keys are joined with dashes.
 * @param builder - An array of strings on which to append the attributes
 * @param data - The data attributes object
 * @param prefix - A prefix for each attribute name
 */
const buildDataAttrs = (builder: string[], data: DataAttrs, prefix='data-') => {
    for (let kv of Object.entries(data)) {
        const k = strings.ropeCase(kv[0])
        if (typeof kv[1] == 'object') {
            buildDataAttrs(builder, kv[1], `${prefix}${k}-`)
        }
        else {
            builder.push(`${prefix}${k}="${kv[1]}"`)
        }
    }
}

/**
 * An object containing inline style declarations.
 */
export type InlineStyle = Partial<CSSStyleDeclaration>

/**
 * Constructs a style attribute value from an {InlineStyle} object.
 * @param styles - An object containing inline style definitions
 * @returns An inline style string
 */
const buildStyleAttr = (styles: InlineStyle): string => {
    return Object.entries(styles).map(([k, v]): string => {
        return `${strings.ropeCase(k)}: ${v};`
    }).join('; ')
}

/**
 * Common attributes shared amongst all tags.
 */
export type Attrs = {
    id?: string
    class?: string
    classes?: string[]
    sel?: string
    text?: string
    title?: string
    data?: DataAttrs
    css?: InlineStyle
}

// don't add these attributes directly to the HTML, they're managed separately
const _attrsBlacklist = ['id', 'class', 'classes', 'sel', 'text', 'data', 'css']

// each argument to a tag can be a callback, selector string, or attribute literal
type Args<TagType extends Tag<AttrsType>, AttrsType extends Attrs> =
    ((n: TagType) => any) | AttrsType | string | undefined

// a general tag type when you don't care about the specifics
export type ParentTag = Tag<Attrs>

export class Tag<AttrsType extends Attrs> {

    private children: Tag<Attrs>[] = []
    private _text?: string
    private _id?: string
    private _classes: string[] = []
    private _attrs: {[key: string]: string} = {}
    private _data?: DataAttrs
    private _css?: InlineStyle

    constructor(public readonly tag: string) {
    }


    /// Attributes

    /**
     * Assigns one or more classes and/or an id to the element.
     * @param {string} s - A CSS selector containing classes (.-prefixed) and/or an id (#-prefixed)
     * @returns this
     */
    sel(selector: string): Tag<AttrsType> {
        if (!selector || selector.length == 0) {
            return this
        }
        let comps = selector.split(/(?=\.)|(?=#)/)
        for (let comp of comps) {
            switch (comp[0]) {
                case '.':
                    this._classes.push(comp.substring(1))
                    break
                case '#':
                    this._id = comp.substring(1)
                    break
                default: // assume it's a class
                    this._classes.push(comp)
            }
        }
        return this
    }

    /**
     * Assigns a single class to the element.
     * @param {string} s - A single class name
     * @returns this
     */
    class(...s: string[]): Tag<AttrsType> {
        this._classes = this._classes.concat(s)
        return this
    }

    /**
     * Assigns the element's id attribute.
     * @param s - an id
     * @returns this
     */
    id(s: string): Tag<AttrsType> {
        this._id = s
        return this
    }

    /**
     * Set the inner text content of the element.
     * @param {string} s - The inner text of the element
     * @returns this
     */
    text(s: string): Tag<AttrsType> {
        this._text = s
        return this
    }

    /**
     * Apply an inline style using the +style+ attribute.
     * @param {InlineStyle} s - An inline style to apply to the element
     * @returns this
     */
    css(s: InlineStyle): Tag<AttrsType> {
        if (this._css) {
            this._css = {...this._css, ...s}
        }
        else {
            this._css = {...s}
        }
        return this
    }

    /**
     * Assign raw data- attributes to the element.
     * @param {DataAttrs} d - Some raw data attributes
     * @returns this
     */
    data(d: DataAttrs): Tag<AttrsType> {
        if (this._data) {
            this._data = {...this._data, ...d}
        }
        else {
            this._data = {...d}
        }
        return this
    }

    // Assignes a single data attribute without having to create a new object
    dataAttr(key: string, value: any): Tag<AttrsType> {
        if (!this._data) {
            this._data = {}
        }
        this._data[key] = value
        return this
    }

    attrs(attrs: AttrsType): Tag<AttrsType> {
        if (attrs.class?.length) {
            this.class(attrs.class)
        }
        if (attrs.classes?.length) {
            this._classes = this._classes.concat(attrs.classes)
        }
        if (attrs.id?.length) {
            this._id = attrs.id
        }
        if (attrs.sel?.length) {
            this.sel(attrs.sel)
        }
        if (attrs.text?.length) {
            this.text(attrs.text)
        }
        if (attrs.data?.length) {
            this.data(attrs.data)
        }
        if (attrs.css) {
            this.css(attrs.css)
        }
        for (let key of Object.keys(attrs)) {
            if (!_attrsBlacklist.includes(key)) {
                const value = (attrs as any)[key]
                if (value) {
                    this._attrs[key] = value.toString()
                }
            }
        }
        return this
    }


    /// Children

    child<TagType extends Tag<ChildAttrsType>, ChildAttrsType extends Attrs>(
            c: { new (t: string): TagType }, 
            tag: string,
            ...args: Args<TagType,ChildAttrsType>[]
    ): TagType {
        let node = new c(tag)
        this.children.push(node)
        for (let arg of args) {
            if (arg instanceof Function) {
                arg(node)
            }
            else if (typeof arg == 'string') {
                node.sel(arg)
            }
            else if (arg) {
                node.attrs(arg)
            }
        }
        return node
    }

    part(part: Part<{}>) {
        part.renderInTag(this)
    }

    //// Begin Tag Methods

    a(...args: Args<AnchorTag,AnchorTagAttrs>[]) : AnchorTag {
        return this.child(AnchorTag, "a", ...args)
    }

    abbr(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "abbr", ...args)
    }

    address(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "address", ...args)
    }

    area(...args: Args<AreaTag,AreaTagAttrs>[]) : AreaTag {
        return this.child(AreaTag, "area", ...args)
    }

    article(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "article", ...args)
    }

    aside(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "aside", ...args)
    }

    b(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "b", ...args)
    }

    base(...args: Args<BaseTag,BaseTagAttrs>[]) : BaseTag {
        return this.child(BaseTag, "base", ...args)
    }

    bdi(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "bdi", ...args)
    }

    bdo(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "bdo", ...args)
    }

    blockquote(...args: Args<QuoteTag,QuoteTagAttrs>[]) : QuoteTag {
        return this.child(QuoteTag, "blockquote", ...args)
    }

    body(...args: Args<BodyTag,BodyTagAttrs>[]) : BodyTag {
        return this.child(BodyTag, "body", ...args)
    }

    br(...args: Args<BRTag,BRTagAttrs>[]) : BRTag {
        return this.child(BRTag, "br", ...args)
    }

    button(...args: Args<ButtonTag,ButtonTagAttrs>[]) : ButtonTag {
        return this.child(ButtonTag, "button", ...args)
    }

    canvas(...args: Args<CanvasTag,CanvasTagAttrs>[]) : CanvasTag {
        return this.child(CanvasTag, "canvas", ...args)
    }

    caption(...args: Args<TableCaptionTag,TableCaptionTagAttrs>[]) : TableCaptionTag {
        return this.child(TableCaptionTag, "caption", ...args)
    }

    cite(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "cite", ...args)
    }

    code(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "code", ...args)
    }

    col(...args: Args<TableColTag,TableColTagAttrs>[]) : TableColTag {
        return this.child(TableColTag, "col", ...args)
    }

    colgroup(...args: Args<TableColTag,TableColTagAttrs>[]) : TableColTag {
        return this.child(TableColTag, "colgroup", ...args)
    }

    dataTag(...args: Args<DataTag,DataTagAttrs>[]) : DataTag {
        return this.child(DataTag, "data", ...args)
    }

    datalist(...args: Args<DataListTag,DataListTagAttrs>[]) : DataListTag {
        return this.child(DataListTag, "datalist", ...args)
    }

    dd(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "dd", ...args)
    }

    del(...args: Args<ModTag,ModTagAttrs>[]) : ModTag {
        return this.child(ModTag, "del", ...args)
    }

    details(...args: Args<DetailsTag,DetailsTagAttrs>[]) : DetailsTag {
        return this.child(DetailsTag, "details", ...args)
    }

    dfn(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "dfn", ...args)
    }

    div(...args: Args<DivTag,DivTagAttrs>[]) : DivTag {
        return this.child(DivTag, "div", ...args)
    }

    dl(...args: Args<DListTag,DListTagAttrs>[]) : DListTag {
        return this.child(DListTag, "dl", ...args)
    }

    dt(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "dt", ...args)
    }

    em(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "em", ...args)
    }

    embed(...args: Args<EmbedTag,EmbedTagAttrs>[]) : EmbedTag {
        return this.child(EmbedTag, "embed", ...args)
    }

    fieldset(...args: Args<FieldSetTag,FieldSetTagAttrs>[]) : FieldSetTag {
        return this.child(FieldSetTag, "fieldset", ...args)
    }

    figcaption(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "figcaption", ...args)
    }

    figure(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "figure", ...args)
    }

    footer(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "footer", ...args)
    }

    form(...args: Args<FormTag,FormTagAttrs>[]) : FormTag {
        return this.child(FormTag, "form", ...args)
    }

    frameset(...args: Args<FrameSetTag,FrameSetTagAttrs>[]) : FrameSetTag {
        return this.child(FrameSetTag, "frameset", ...args)
    }

    h1(...args: Args<HeadingTag,HeadingTagAttrs>[]) : HeadingTag {
        return this.child(HeadingTag, "h1", ...args)
    }

    h2(...args: Args<HeadingTag,HeadingTagAttrs>[]) : HeadingTag {
        return this.child(HeadingTag, "h2", ...args)
    }

    h3(...args: Args<HeadingTag,HeadingTagAttrs>[]) : HeadingTag {
        return this.child(HeadingTag, "h3", ...args)
    }

    h4(...args: Args<HeadingTag,HeadingTagAttrs>[]) : HeadingTag {
        return this.child(HeadingTag, "h4", ...args)
    }

    h5(...args: Args<HeadingTag,HeadingTagAttrs>[]) : HeadingTag {
        return this.child(HeadingTag, "h5", ...args)
    }

    h6(...args: Args<HeadingTag,HeadingTagAttrs>[]) : HeadingTag {
        return this.child(HeadingTag, "h6", ...args)
    }

    head(...args: Args<HeadTag,HeadTagAttrs>[]) : HeadTag {
        return this.child(HeadTag, "head", ...args)
    }

    header(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "header", ...args)
    }

    hgroup(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "hgroup", ...args)
    }

    hr(...args: Args<HRTag,HRTagAttrs>[]) : HRTag {
        return this.child(HRTag, "hr", ...args)
    }

    html(...args: Args<HtmlTag,HtmlTagAttrs>[]) : HtmlTag {
        return this.child(HtmlTag, "html", ...args)
    }

    i(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "i", ...args)
    }

    iframe(...args: Args<IFrameTag,IFrameTagAttrs>[]) : IFrameTag {
        return this.child(IFrameTag, "iframe", ...args)
    }

    img(...args: Args<ImageTag,ImageTagAttrs>[]) : ImageTag {
        return this.child(ImageTag, "img", ...args)
    }

    input(...args: Args<InputTag,InputTagAttrs>[]) : InputTag {
        return this.child(InputTag, "input", ...args)
    }

    ins(...args: Args<ModTag,ModTagAttrs>[]) : ModTag {
        return this.child(ModTag, "ins", ...args)
    }

    kbd(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "kbd", ...args)
    }

    label(...args: Args<LabelTag,LabelTagAttrs>[]) : LabelTag {
        return this.child(LabelTag, "label", ...args)
    }

    legend(...args: Args<LegendTag,LegendTagAttrs>[]) : LegendTag {
        return this.child(LegendTag, "legend", ...args)
    }

    li(...args: Args<LITag,LITagAttrs>[]) : LITag {
        return this.child(LITag, "li", ...args)
    }

    link(...args: Args<LinkTag,LinkTagAttrs>[]) : LinkTag {
        return this.child(LinkTag, "link", ...args)
    }

    main(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "main", ...args)
    }

    map(...args: Args<MapTag,MapTagAttrs>[]) : MapTag {
        return this.child(MapTag, "map", ...args)
    }

    mark(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "mark", ...args)
    }

    menu(...args: Args<MenuTag,MenuTagAttrs>[]) : MenuTag {
        return this.child(MenuTag, "menu", ...args)
    }

    meta(...args: Args<MetaTag,MetaTagAttrs>[]) : MetaTag {
        return this.child(MetaTag, "meta", ...args)
    }

    meter(...args: Args<MeterTag,MeterTagAttrs>[]) : MeterTag {
        return this.child(MeterTag, "meter", ...args)
    }

    nav(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "nav", ...args)
    }

    noscript(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "noscript", ...args)
    }

    object(...args: Args<ObjectTag,ObjectTagAttrs>[]) : ObjectTag {
        return this.child(ObjectTag, "object", ...args)
    }

    ol(...args: Args<OListTag,OListTagAttrs>[]) : OListTag {
        return this.child(OListTag, "ol", ...args)
    }

    optgroup(...args: Args<OptGroupTag,OptGroupTagAttrs>[]) : OptGroupTag {
        return this.child(OptGroupTag, "optgroup", ...args)
    }

    option(...args: Args<OptionTag,OptionTagAttrs>[]) : OptionTag {
        return this.child(OptionTag, "option", ...args)
    }

    output(...args: Args<OutputTag,OutputTagAttrs>[]) : OutputTag {
        return this.child(OutputTag, "output", ...args)
    }

    p(...args: Args<ParagraphTag,ParagraphTagAttrs>[]) : ParagraphTag {
        return this.child(ParagraphTag, "p", ...args)
    }

    param(...args: Args<ParamTag,ParamTagAttrs>[]) : ParamTag {
        return this.child(ParamTag, "param", ...args)
    }

    picture(...args: Args<PictureTag,PictureTagAttrs>[]) : PictureTag {
        return this.child(PictureTag, "picture", ...args)
    }

    pre(...args: Args<PreTag,PreTagAttrs>[]) : PreTag {
        return this.child(PreTag, "pre", ...args)
    }

    progress(...args: Args<ProgressTag,ProgressTagAttrs>[]) : ProgressTag {
        return this.child(ProgressTag, "progress", ...args)
    }

    q(...args: Args<QuoteTag,QuoteTagAttrs>[]) : QuoteTag {
        return this.child(QuoteTag, "q", ...args)
    }

    rp(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "rp", ...args)
    }

    rt(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "rt", ...args)
    }

    ruby(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "ruby", ...args)
    }

    s(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "s", ...args)
    }

    samp(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "samp", ...args)
    }

    script(...args: Args<ScriptTag,ScriptTagAttrs>[]) : ScriptTag {
        return this.child(ScriptTag, "script", ...args)
    }

    section(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "section", ...args)
    }

    select(...args: Args<SelectTag,SelectTagAttrs>[]) : SelectTag {
        return this.child(SelectTag, "select", ...args)
    }

    slot(...args: Args<SlotTag,SlotTagAttrs>[]) : SlotTag {
        return this.child(SlotTag, "slot", ...args)
    }

    small(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "small", ...args)
    }

    source(...args: Args<SourceTag,SourceTagAttrs>[]) : SourceTag {
        return this.child(SourceTag, "source", ...args)
    }

    span(...args: Args<SpanTag,SpanTagAttrs>[]) : SpanTag {
        return this.child(SpanTag, "span", ...args)
    }

    strong(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "strong", ...args)
    }

    style(...args: Args<StyleTag,StyleTagAttrs>[]) : StyleTag {
        return this.child(StyleTag, "style", ...args)
    }

    sub(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "sub", ...args)
    }

    summary(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "summary", ...args)
    }

    sup(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "sup", ...args)
    }

    table(...args: Args<TableTag,TableTagAttrs>[]) : TableTag {
        return this.child(TableTag, "table", ...args)
    }

    tbody(...args: Args<TableSectionTag,TableSectionTagAttrs>[]) : TableSectionTag {
        return this.child(TableSectionTag, "tbody", ...args)
    }

    td(...args: Args<TableCellTag,TableCellTagAttrs>[]) : TableCellTag {
        return this.child(TableCellTag, "td", ...args)
    }

    template(...args: Args<TemplateTag,TemplateTagAttrs>[]) : TemplateTag {
        return this.child(TemplateTag, "template", ...args)
    }

    textarea(...args: Args<TextAreaTag,TextAreaTagAttrs>[]) : TextAreaTag {
        return this.child(TextAreaTag, "textarea", ...args)
    }

    tfoot(...args: Args<TableSectionTag,TableSectionTagAttrs>[]) : TableSectionTag {
        return this.child(TableSectionTag, "tfoot", ...args)
    }

    th(...args: Args<TableCellTag,TableCellTagAttrs>[]) : TableCellTag {
        return this.child(TableCellTag, "th", ...args)
    }

    thead(...args: Args<TableSectionTag,TableSectionTagAttrs>[]) : TableSectionTag {
        return this.child(TableSectionTag, "thead", ...args)
    }

    time(...args: Args<TimeTag,TimeTagAttrs>[]) : TimeTag {
        return this.child(TimeTag, "time", ...args)
    }

    title(...args: Args<TitleTag,TitleTagAttrs>[]) : TitleTag {
        return this.child(TitleTag, "title", ...args)
    }

    tr(...args: Args<TableRowTag,TableRowTagAttrs>[]) : TableRowTag {
        return this.child(TableRowTag, "tr", ...args)
    }

    track(...args: Args<TrackTag,TrackTagAttrs>[]) : TrackTag {
        return this.child(TrackTag, "track", ...args)
    }

    u(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "u", ...args)
    }

    ul(...args: Args<UListTag,UListTagAttrs>[]) : UListTag {
        return this.child(UListTag, "ul", ...args)
    }

    var(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "var", ...args)
    }

    wbr(...args: Args<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "wbr", ...args)
    }

//// End Tag Methods


    /// Messages

    private messageKeys: {[type: string]: string[]} | null = null

    private addMessageKey(type: string, key: string) {
        if (!this.messageKeys) {
            this.messageKeys = {}
        }
        if (this.messageKeys[type]) {
            this.messageKeys[type].push(key)
        }
        else {
            this.messageKeys[type] = [key]
        }
    }

    private addMessageKeys(output: string[]) {
        if (!this.messageKeys) return
        for (let typeKeys of Object.entries(this.messageKeys)) {
            let keys = typeKeys[1].map(k => {return k}).join(';')
            output.push(`data-__${typeKeys[0]}__="${keys}"`)
        }
    }

    emit<DataType>(type: keyof messages.EventMap, key: messages.UntypedKey): Tag<AttrsType>
    
    // Force the caller to pass data if the message key is typed
    emit<DataType>(type: keyof messages.EventMap, key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>

    emit<DataType>(type: keyof messages.EventMap, key: messages.UntypedKey | messages.TypedKey<DataType>, data?: DataType): Tag<AttrsType> {
        this.addMessageKey(type, key.id)
        if (data) {
            this.dataAttr(key.id, encodeURIComponent(JSON.stringify(data)))
        }
        return this
    }

    //// Begin Emit Methods

    emitAbort<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitAbort<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitAbort<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('abort', key, data)
        return this
    }
    
    emitAnimationCancel<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitAnimationCancel<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitAnimationCancel<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('animationcancel', key, data)
        return this
    }
    
    emitAnimationEnd<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitAnimationEnd<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitAnimationEnd<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('animationend', key, data)
        return this
    }
    
    emitAnimationIteration<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitAnimationIteration<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitAnimationIteration<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('animationiteration', key, data)
        return this
    }
    
    emitAnimationStart<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitAnimationStart<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitAnimationStart<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('animationstart', key, data)
        return this
    }
    
    emitAuxClick<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitAuxClick<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitAuxClick<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('auxclick', key, data)
        return this
    }
    
    emitBeforeInput<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitBeforeInput<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitBeforeInput<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('beforeinput', key, data)
        return this
    }
    
    emitBlur<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitBlur<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitBlur<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('blur', key, data)
        return this
    }
    
    emitCanPlay<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitCanPlay<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitCanPlay<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('canplay', key, data)
        return this
    }
    
    emitCanPlayThrough<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitCanPlayThrough<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitCanPlayThrough<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('canplaythrough', key, data)
        return this
    }
    
    emitChange<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitChange<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitChange<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('change', key, data)
        return this
    }
    
    emitClick<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitClick<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitClick<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('click', key, data)
        return this
    }
    
    emitClose<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitClose<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitClose<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('close', key, data)
        return this
    }
    
    emitCompositionEnd<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitCompositionEnd<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitCompositionEnd<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('compositionend', key, data)
        return this
    }
    
    emitCompositionStart<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitCompositionStart<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitCompositionStart<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('compositionstart', key, data)
        return this
    }
    
    emitCompositionUpdate<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitCompositionUpdate<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitCompositionUpdate<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('compositionupdate', key, data)
        return this
    }
    
    emitContextMenu<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitContextMenu<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitContextMenu<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('contextmenu', key, data)
        return this
    }
    
    emitCopy<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitCopy<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitCopy<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('copy', key, data)
        return this
    }
    
    emitCueChange<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitCueChange<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitCueChange<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('cuechange', key, data)
        return this
    }
    
    emitCut<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitCut<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitCut<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('cut', key, data)
        return this
    }
    
    emitDblClick<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitDblClick<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitDblClick<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('dblclick', key, data)
        return this
    }
    
    emitDrag<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitDrag<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitDrag<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('drag', key, data)
        return this
    }
    
    emitDragEnd<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitDragEnd<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitDragEnd<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('dragend', key, data)
        return this
    }
    
    emitDragEnter<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitDragEnter<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitDragEnter<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('dragenter', key, data)
        return this
    }
    
    emitDragLeave<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitDragLeave<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitDragLeave<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('dragleave', key, data)
        return this
    }
    
    emitDragOver<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitDragOver<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitDragOver<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('dragover', key, data)
        return this
    }
    
    emitDragStart<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitDragStart<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitDragStart<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('dragstart', key, data)
        return this
    }
    
    emitDrop<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitDrop<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitDrop<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('drop', key, data)
        return this
    }
    
    emitDurationChange<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitDurationChange<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitDurationChange<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('durationchange', key, data)
        return this
    }
    
    emitEmptied<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitEmptied<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitEmptied<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('emptied', key, data)
        return this
    }
    
    emitEnded<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitEnded<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitEnded<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('ended', key, data)
        return this
    }
    
    emitError<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitError<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitError<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('error', key, data)
        return this
    }
    
    emitFocus<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitFocus<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitFocus<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('focus', key, data)
        return this
    }
    
    emitFocusIn<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitFocusIn<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitFocusIn<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('focusin', key, data)
        return this
    }
    
    emitFocusOut<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitFocusOut<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitFocusOut<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('focusout', key, data)
        return this
    }
    
    emitFormData<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitFormData<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitFormData<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('formdata', key, data)
        return this
    }
    
    emitFullscreenChange<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitFullscreenChange<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitFullscreenChange<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('fullscreenchange', key, data)
        return this
    }
    
    emitFullscreenError<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitFullscreenError<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitFullscreenError<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('fullscreenerror', key, data)
        return this
    }
    
    emitGotPointerCapture<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitGotPointerCapture<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitGotPointerCapture<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('gotpointercapture', key, data)
        return this
    }
    
    emitInput<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitInput<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitInput<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('input', key, data)
        return this
    }
    
    emitInvalid<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitInvalid<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitInvalid<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('invalid', key, data)
        return this
    }
    
    emitKeyDown<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitKeyDown<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitKeyDown<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('keydown', key, data)
        return this
    }
    
    emitKeyUp<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitKeyUp<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitKeyUp<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('keyup', key, data)
        return this
    }
    
    emitLoad<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitLoad<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitLoad<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('load', key, data)
        return this
    }
    
    emitLoadedData<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitLoadedData<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitLoadedData<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('loadeddata', key, data)
        return this
    }
    
    emitLoadedMetadata<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitLoadedMetadata<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitLoadedMetadata<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('loadedmetadata', key, data)
        return this
    }
    
    emitLoadStart<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitLoadStart<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitLoadStart<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('loadstart', key, data)
        return this
    }
    
    emitLostPointerCapture<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitLostPointerCapture<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitLostPointerCapture<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('lostpointercapture', key, data)
        return this
    }
    
    emitMouseDown<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitMouseDown<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitMouseDown<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('mousedown', key, data)
        return this
    }
    
    emitMouseEnter<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitMouseEnter<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitMouseEnter<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('mouseenter', key, data)
        return this
    }
    
    emitMouseLeave<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitMouseLeave<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitMouseLeave<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('mouseleave', key, data)
        return this
    }
    
    emitMouseMove<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitMouseMove<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitMouseMove<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('mousemove', key, data)
        return this
    }
    
    emitMouseOut<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitMouseOut<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitMouseOut<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('mouseout', key, data)
        return this
    }
    
    emitMouseOver<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitMouseOver<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitMouseOver<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('mouseover', key, data)
        return this
    }
    
    emitMouseUp<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitMouseUp<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitMouseUp<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('mouseup', key, data)
        return this
    }
    
    emitPaste<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitPaste<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitPaste<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('paste', key, data)
        return this
    }
    
    emitPause<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitPause<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitPause<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('pause', key, data)
        return this
    }
    
    emitPlay<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitPlay<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitPlay<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('play', key, data)
        return this
    }
    
    emitPlaying<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitPlaying<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitPlaying<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('playing', key, data)
        return this
    }
    
    emitPointerCancel<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitPointerCancel<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitPointerCancel<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('pointercancel', key, data)
        return this
    }
    
    emitPointerDown<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitPointerDown<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitPointerDown<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('pointerdown', key, data)
        return this
    }
    
    emitPointerEnter<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitPointerEnter<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitPointerEnter<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('pointerenter', key, data)
        return this
    }
    
    emitPointerLeave<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitPointerLeave<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitPointerLeave<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('pointerleave', key, data)
        return this
    }
    
    emitPointerMove<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitPointerMove<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitPointerMove<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('pointermove', key, data)
        return this
    }
    
    emitPointerOut<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitPointerOut<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitPointerOut<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('pointerout', key, data)
        return this
    }
    
    emitPointerOver<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitPointerOver<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitPointerOver<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('pointerover', key, data)
        return this
    }
    
    emitPointerUp<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitPointerUp<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitPointerUp<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('pointerup', key, data)
        return this
    }
    
    emitProgress<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitProgress<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitProgress<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('progress', key, data)
        return this
    }
    
    emitRateChange<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitRateChange<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitRateChange<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('ratechange', key, data)
        return this
    }
    
    emitReset<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitReset<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitReset<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('reset', key, data)
        return this
    }
    
    emitResize<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitResize<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitResize<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('resize', key, data)
        return this
    }
    
    emitScroll<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitScroll<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitScroll<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('scroll', key, data)
        return this
    }
    
    emitSecurityPolicyViolation<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitSecurityPolicyViolation<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitSecurityPolicyViolation<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('securitypolicyviolation', key, data)
        return this
    }
    
    emitSeeked<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitSeeked<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitSeeked<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('seeked', key, data)
        return this
    }
    
    emitSeeking<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitSeeking<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitSeeking<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('seeking', key, data)
        return this
    }
    
    emitSelect<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitSelect<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitSelect<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('select', key, data)
        return this
    }
    
    emitSelectionChange<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitSelectionChange<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitSelectionChange<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('selectionchange', key, data)
        return this
    }
    
    emitSelectStart<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitSelectStart<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitSelectStart<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('selectstart', key, data)
        return this
    }
    
    emitStalled<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitStalled<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitStalled<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('stalled', key, data)
        return this
    }
    
    emitSubmit<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitSubmit<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitSubmit<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('submit', key, data)
        return this
    }
    
    emitSuspend<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitSuspend<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitSuspend<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('suspend', key, data)
        return this
    }
    
    emitTimeUpdate<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitTimeUpdate<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitTimeUpdate<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('timeupdate', key, data)
        return this
    }
    
    emitToggle<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitToggle<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitToggle<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('toggle', key, data)
        return this
    }
    
    emitTouchCancel<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitTouchCancel<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitTouchCancel<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('touchcancel', key, data)
        return this
    }
    
    emitTouchEnd<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitTouchEnd<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitTouchEnd<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('touchend', key, data)
        return this
    }
    
    emitTouchMove<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitTouchMove<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitTouchMove<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('touchmove', key, data)
        return this
    }
    
    emitTouchStart<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitTouchStart<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitTouchStart<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('touchstart', key, data)
        return this
    }
    
    emitTransitionCancel<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitTransitionCancel<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitTransitionCancel<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('transitioncancel', key, data)
        return this
    }
    
    emitTransitionEnd<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitTransitionEnd<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitTransitionEnd<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('transitionend', key, data)
        return this
    }
    
    emitTransitionRun<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitTransitionRun<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitTransitionRun<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('transitionrun', key, data)
        return this
    }
    
    emitTransitionStart<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitTransitionStart<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitTransitionStart<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('transitionstart', key, data)
        return this
    }
    
    emitVolumeChange<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitVolumeChange<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitVolumeChange<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('volumechange', key, data)
        return this
    }
    
    emitWaiting<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitWaiting<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitWaiting<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('waiting', key, data)
        return this
    }
    
    emitWebkitAnimationEnd<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitWebkitAnimationEnd<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitWebkitAnimationEnd<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('webkitanimationend', key, data)
        return this
    }
    
    emitWebkitAnimationIteration<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitWebkitAnimationIteration<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitWebkitAnimationIteration<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('webkitanimationiteration', key, data)
        return this
    }
    
    emitWebkitAnimationStart<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitWebkitAnimationStart<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitWebkitAnimationStart<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('webkitanimationstart', key, data)
        return this
    }
    
    emitWebkitTransitionEnd<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitWebkitTransitionEnd<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitWebkitTransitionEnd<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('webkittransitionend', key, data)
        return this
    }
    
    emitWheel<DataType>(key: messages.UntypedKey): Tag<AttrsType>
    emitWheel<DataType>(key: messages.TypedKey<DataType>, data: DataType): Tag<AttrsType>
    emitWheel<DataType>(key: messages.TypedKey<DataType> | messages.UntypedKey, data?: DataType): Tag<AttrsType> {
        this.emit('wheel', key, data)
        return this
    }
    
//// End Emit Methods


    /// Building

    /**
     * Builds the resulting HTML by appending lines to the {output} array.
     * @param output - A string array on which to append the output
     */
    build(output: string[]) {
        output.push(`<${this.tag}`)
        let allAttrs = Array<string>()
        if (this._classes.length) {
            allAttrs.push(`class="${this._classes.join(' ')}"`)
        }
        if (this._id) {
            allAttrs.push(`id="${this._id}"`)
        }
        for (let kv of Object.entries(this._attrs)) {
            allAttrs.push(`${kv[0]}="${kv[1]}"`)
        }
        if (this._data) {
            buildDataAttrs(allAttrs, this._data)
        }
        if (this._css) {
            allAttrs.push(`style="${buildStyleAttr(this._css)}"`)
        }
        this.addMessageKeys(allAttrs)
        if (allAttrs.length) {
            output.push(` ${allAttrs.join(' ')}`)
        }
        output.push('>')
        if (this._text) {
            output.push(this._text)
        }
        this.buildInner(output)
        output.push(`</${this.tag}>`)
    }

    buildInner(output: string[]) {
        for (let child of this.children) {
            child.build(output)
        }
    }

}


// DO NOT EDIT THE CODE BELOW!
//// Begin Tag Classes

export type AnchorTagAttrs = DefaultTagAttrs & {
    download?: string
    hreflang?: string
    ping?: string
    referrerPolicy?: string
    rel?: string
    target?: string
    text?: string
    type?: string
}

export class AnchorTag extends Tag<AnchorTagAttrs> {}

export type AreaTagAttrs = DefaultTagAttrs & {
    alt?: string
    coords?: string
    download?: string
    ping?: string
    referrerPolicy?: string
    rel?: string
    shape?: string
    target?: string
}

export class AreaTag extends Tag<AreaTagAttrs> {}

export type BRTagAttrs = DefaultTagAttrs & {
}

export class BRTag extends Tag<BRTagAttrs> {}

export type BaseTagAttrs = DefaultTagAttrs & {
    href?: string
    target?: string
}

export class BaseTag extends Tag<BaseTagAttrs> {}

export type BodyTagAttrs = DefaultTagAttrs & {
}

export class BodyTag extends Tag<BodyTagAttrs> {}

export type ButtonTagAttrs = DefaultTagAttrs & {
    disabled?: boolean
    formAction?: string
    formEnctype?: string
    formMethod?: string
    formNoValidate?: boolean
    formTarget?: string
    name?: string
    type?: string
    value?: string
}

export class ButtonTag extends Tag<ButtonTagAttrs> {}

export type CanvasTagAttrs = DefaultTagAttrs & {
    height?: number
    width?: number
}

export class CanvasTag extends Tag<CanvasTagAttrs> {}

export type DListTagAttrs = DefaultTagAttrs & {
}

export class DListTag extends Tag<DListTagAttrs> {}

export type DataTagAttrs = DefaultTagAttrs & {
    value?: string
}

export class DataTag extends Tag<DataTagAttrs> {}

export type DataListTagAttrs = DefaultTagAttrs & {
}

export class DataListTag extends Tag<DataListTagAttrs> {}

export type DetailsTagAttrs = DefaultTagAttrs & {
    open?: boolean
}

export class DetailsTag extends Tag<DetailsTagAttrs> {}

export type DivTagAttrs = DefaultTagAttrs & {
}

export class DivTag extends Tag<DivTagAttrs> {}

export type DefaultTagAttrs = Attrs & {
    accessKey?: string
    autocapitalize?: string
    dir?: string
    draggable?: boolean
    hidden?: boolean
    innerText?: string
    lang?: string
    outerText?: string
    spellcheck?: boolean
    title?: string
    translate?: boolean
}

export class DefaultTag extends Tag<DefaultTagAttrs> {}

export type EmbedTagAttrs = DefaultTagAttrs & {
    height?: string
    src?: string
    type?: string
    width?: string
}

export class EmbedTag extends Tag<EmbedTagAttrs> {}

export type FieldSetTagAttrs = DefaultTagAttrs & {
    disabled?: boolean
    name?: string
}

export class FieldSetTag extends Tag<FieldSetTagAttrs> {}

export type FormTagAttrs = DefaultTagAttrs & {
    acceptCharset?: string
    action?: string
    autocomplete?: string
    encoding?: string
    enctype?: string
    method?: string
    name?: string
    noValidate?: boolean
    target?: string
}

export class FormTag extends Tag<FormTagAttrs> {}

export type FrameSetTagAttrs = DefaultTagAttrs & {
}

export class FrameSetTag extends Tag<FrameSetTagAttrs> {}

export type HRTagAttrs = DefaultTagAttrs & {
}

export class HRTag extends Tag<HRTagAttrs> {}

export type HeadTagAttrs = DefaultTagAttrs & {
}

export class HeadTag extends Tag<HeadTagAttrs> {}

export type HeadingTagAttrs = DefaultTagAttrs & {
}

export class HeadingTag extends Tag<HeadingTagAttrs> {}

export type HtmlTagAttrs = DefaultTagAttrs & {
}

export class HtmlTag extends Tag<HtmlTagAttrs> {}

export type IFrameTagAttrs = DefaultTagAttrs & {
    allow?: string
    allowFullscreen?: boolean
    height?: string
    name?: string
    referrerPolicy?: ReferrerPolicy
    src?: string
    srcdoc?: string
    width?: string
}

export class IFrameTag extends Tag<IFrameTagAttrs> {}

export type ImageTagAttrs = DefaultTagAttrs & {
    alt?: string
    crossOrigin?: string | null
    decoding?: "async" | "sync" | "auto"
    height?: number
    isMap?: boolean
    loading?: string
    referrerPolicy?: string
    sizes?: string
    src?: string
    srcset?: string
    useMap?: string
    width?: number
}

export class ImageTag extends Tag<ImageTagAttrs> {}

export type InputTagAttrs = DefaultTagAttrs & {
    accept?: string
    alt?: string
    autocomplete?: string
    capture?: string
    checked?: boolean
    defaultChecked?: boolean
    defaultValue?: string
    dirName?: string
    disabled?: boolean
    files?: FileList | null
    formAction?: string
    formEnctype?: string
    formMethod?: string
    formNoValidate?: boolean
    formTarget?: string
    height?: number
    indeterminate?: boolean
    max?: string
    maxLength?: number
    min?: string
    minLength?: number
    multiple?: boolean
    name?: string
    pattern?: string
    placeholder?: string
    readOnly?: boolean
    required?: boolean
    selectionDirection?: "forward" | "backward" | "none" | null
    selectionEnd?: number | null
    selectionStart?: number | null
    size?: number
    src?: string
    step?: string
    type?: string
    value?: string
    valueAsDate?: Date | null
    valueAsNumber?: number
    webkitdirectory?: boolean
    width?: number
}

export class InputTag extends Tag<InputTagAttrs> {}

export type LITagAttrs = DefaultTagAttrs & {
    value?: number
}

export class LITag extends Tag<LITagAttrs> {}

export type LabelTagAttrs = DefaultTagAttrs & {
    htmlFor?: string
}

export class LabelTag extends Tag<LabelTagAttrs> {}

export type LegendTagAttrs = DefaultTagAttrs & {
}

export class LegendTag extends Tag<LegendTagAttrs> {}

export type LinkTagAttrs = DefaultTagAttrs & {
    as?: string
    crossOrigin?: string | null
    disabled?: boolean
    href?: string
    hreflang?: string
    imageSizes?: string
    imageSrcset?: string
    integrity?: string
    media?: string
    referrerPolicy?: string
    rel?: string
    type?: string
}

export class LinkTag extends Tag<LinkTagAttrs> {}

export type MapTagAttrs = DefaultTagAttrs & {
    name?: string
}

export class MapTag extends Tag<MapTagAttrs> {}

export type MediaTagAttrs = DefaultTagAttrs & {
    autoplay?: boolean
    controls?: boolean
    crossOrigin?: string | null
    currentTime?: number
    defaultMuted?: boolean
    defaultPlaybackRate?: number
    disableRemotePlayback?: boolean
    loop?: boolean
    muted?: boolean
    onencrypted?: ((this: HTMLMediaElement, ev: MediaEncryptedEvent) => any) | null
    onwaitingforkey?: ((this: HTMLMediaElement, ev: Event) => any) | null
    playbackRate?: number
    preload?: "none" | "metadata" | "auto" | ""
    src?: string
    srcObject?: MediaProvider | null
    volume?: number
}

export class MediaTag extends Tag<MediaTagAttrs> {}

export type MenuTagAttrs = DefaultTagAttrs & {
}

export class MenuTag extends Tag<MenuTagAttrs> {}

export type MetaTagAttrs = DefaultTagAttrs & {
    content?: string
    httpEquiv?: string
    name?: string
}

export class MetaTag extends Tag<MetaTagAttrs> {}

export type MeterTagAttrs = DefaultTagAttrs & {
    high?: number
    low?: number
    max?: number
    min?: number
    optimum?: number
    value?: number
}

export class MeterTag extends Tag<MeterTagAttrs> {}

export type ModTagAttrs = DefaultTagAttrs & {
    cite?: string
    dateTime?: string
}

export class ModTag extends Tag<ModTagAttrs> {}

export type OListTagAttrs = DefaultTagAttrs & {
    reversed?: boolean
    start?: number
    type?: string
}

export class OListTag extends Tag<OListTagAttrs> {}

export type ObjectTagAttrs = DefaultTagAttrs & {
    data?: string
    height?: string
    name?: string
    type?: string
    useMap?: string
    width?: string
}

export class ObjectTag extends Tag<ObjectTagAttrs> {}

export type OptGroupTagAttrs = DefaultTagAttrs & {
    disabled?: boolean
    label?: string
}

export class OptGroupTag extends Tag<OptGroupTagAttrs> {}

export type OptionTagAttrs = DefaultTagAttrs & {
    defaultSelected?: boolean
    disabled?: boolean
    label?: string
    selected?: boolean
    text?: string
    value?: string
}

export class OptionTag extends Tag<OptionTagAttrs> {}

export type OutputTagAttrs = DefaultTagAttrs & {
    defaultValue?: string
    name?: string
    value?: string
}

export class OutputTag extends Tag<OutputTagAttrs> {}

export type ParagraphTagAttrs = DefaultTagAttrs & {
}

export class ParagraphTag extends Tag<ParagraphTagAttrs> {}

export type ParamTagAttrs = DefaultTagAttrs & {
    name?: string
    value?: string
}

export class ParamTag extends Tag<ParamTagAttrs> {}

export type PictureTagAttrs = DefaultTagAttrs & {
}

export class PictureTag extends Tag<PictureTagAttrs> {}

export type PreTagAttrs = DefaultTagAttrs & {
}

export class PreTag extends Tag<PreTagAttrs> {}

export type ProgressTagAttrs = DefaultTagAttrs & {
    max?: number
    value?: number
}

export class ProgressTag extends Tag<ProgressTagAttrs> {}

export type QuoteTagAttrs = DefaultTagAttrs & {
    cite?: string
}

export class QuoteTag extends Tag<QuoteTagAttrs> {}

export type ScriptTagAttrs = DefaultTagAttrs & {
    async?: boolean
    crossOrigin?: string | null
    defer?: boolean
    integrity?: string
    noModule?: boolean
    referrerPolicy?: string
    src?: string
    text?: string
    type?: string
}

export class ScriptTag extends Tag<ScriptTagAttrs> {}

export type SelectTagAttrs = DefaultTagAttrs & {
    autocomplete?: string
    disabled?: boolean
    length?: number
    multiple?: boolean
    name?: string
    required?: boolean
    selectedIndex?: number
    size?: number
    value?: string
}

export class SelectTag extends Tag<SelectTagAttrs> {}

export type SlotTagAttrs = DefaultTagAttrs & {
    name?: string
}

export class SlotTag extends Tag<SlotTagAttrs> {}

export type SourceTagAttrs = DefaultTagAttrs & {
    media?: string
    sizes?: string
    src?: string
    srcset?: string
    type?: string
}

export class SourceTag extends Tag<SourceTagAttrs> {}

export type SpanTagAttrs = DefaultTagAttrs & {
}

export class SpanTag extends Tag<SpanTagAttrs> {}

export type StyleTagAttrs = DefaultTagAttrs & {
    media?: string
}

export class StyleTag extends Tag<StyleTagAttrs> {}

export type TableCaptionTagAttrs = DefaultTagAttrs & {
}

export class TableCaptionTag extends Tag<TableCaptionTagAttrs> {}

export type TableCellTagAttrs = DefaultTagAttrs & {
    abbr?: string
    colSpan?: number
    headers?: string
    rowSpan?: number
    scope?: string
}

export class TableCellTag extends Tag<TableCellTagAttrs> {}

export type TableColTagAttrs = DefaultTagAttrs & {
    span?: number
}

export class TableColTag extends Tag<TableColTagAttrs> {}

export type TableTagAttrs = DefaultTagAttrs & {
    caption?: HTMLTableCaptionElement | null
    tFoot?: HTMLTableSectionElement | null
    tHead?: HTMLTableSectionElement | null
}

export class TableTag extends Tag<TableTagAttrs> {}

export type TableRowTagAttrs = DefaultTagAttrs & {
}

export class TableRowTag extends Tag<TableRowTagAttrs> {}

export type TableSectionTagAttrs = DefaultTagAttrs & {
}

export class TableSectionTag extends Tag<TableSectionTagAttrs> {}

export type TemplateTagAttrs = DefaultTagAttrs & {
}

export class TemplateTag extends Tag<TemplateTagAttrs> {}

export type TextAreaTagAttrs = DefaultTagAttrs & {
    autocomplete?: string
    cols?: number
    defaultValue?: string
    dirName?: string
    disabled?: boolean
    maxLength?: number
    minLength?: number
    name?: string
    placeholder?: string
    readOnly?: boolean
    required?: boolean
    rows?: number
    selectionDirection?: "forward" | "backward" | "none"
    selectionEnd?: number
    selectionStart?: number
    value?: string
    wrap?: string
}

export class TextAreaTag extends Tag<TextAreaTagAttrs> {}

export type TimeTagAttrs = DefaultTagAttrs & {
    dateTime?: string
}

export class TimeTag extends Tag<TimeTagAttrs> {}

export type TitleTagAttrs = DefaultTagAttrs & {
    text?: string
}

export class TitleTag extends Tag<TitleTagAttrs> {}

export type TrackTagAttrs = DefaultTagAttrs & {
    default?: boolean
    kind?: string
    label?: string
    src?: string
    srclang?: string
}

export class TrackTag extends Tag<TrackTagAttrs> {}

export type UListTagAttrs = DefaultTagAttrs & {
}

export class UListTag extends Tag<UListTagAttrs> {}

export type UnknownTagAttrs = DefaultTagAttrs & {
}

export class UnknownTag extends Tag<UnknownTagAttrs> {}

//// End Tag Classes

