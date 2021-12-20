import { Part } from "./part"
import { MessageKey } from "./messages"

type DataAttrs = {[key: string]: any}

// resursively constructs data attributes into key/value strings
// nested keys are joined with dashes
let buildDataAttrs = (builder: string[], data: DataAttrs, prefix='data-') => {
    for (let kv of Object.entries(data)) {
        if (typeof kv[1] == 'object') {
            buildDataAttrs(builder, kv[1], `${prefix}${kv[0]}-`)
        }
        else {
            builder.push(`${prefix}${kv[0]}="${kv[1]}"`)
        }
    }
}


export type Attrs = {
    id?: string
    class?: string
    classes?: string[]
    sel?: string
    text?: string
    title?: string
    data?: DataAttrs
}

// don't add these attributes directly to the HTML, they're managed separately
const _attrsBlacklist = ['id', 'class', 'classes', 'sel', 'text', 'data']

// each argument to a tag can be a callback, selector string, or attribute literal
type Args<TagType extends Tag<AttrsType>, AttrsType extends Attrs> =
    ((n: TagType) => any) | AttrsType | string | undefined

export class Tag<AttrsType extends Attrs> {

    private children: Tag<Attrs>[] = []
    private _text?: string
    private _id?: string
    private _classes: string[] = []
    private _attrs: {[key: string]: string} = {}
    private _data?: DataAttrs

    constructor(public readonly tag: string) {
    }


    /// Attributes

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
                default:
                    throw `Don't know what to do with selector component '${comp}'`
            }
        }
        return this
    }

    class(s: string): Tag<AttrsType> {
        this._classes.push(s)
        return this
    }

    id(s: string): Tag<AttrsType> {
        this._id = s
        return this
    }

    text(s: string): Tag<AttrsType> {
        this._text = s
        return this
    }

    dataAttrs(d: DataAttrs): Tag<AttrsType> {
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
        for (let key of Object.keys(attrs)) {
            if (!_attrsBlacklist.includes(key)) {
                this._attrs[key] = (attrs as any)[key].toString()
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

    data(...args: Args<DataTag,DataTagAttrs>[]) : DataTag {
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

    private messageKeys: {[type: string]: MessageKey[]} | null = null

    private addMessageKey(type: string, key: MessageKey) {
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
            let keys = typeKeys[1].map(k => {return k.id}).join(';')
            output.push(`data-__${typeKeys[0]}__="${keys}"`)
        }
    }

    emit(type: keyof HTMLElementEventMap, key: MessageKey): Tag<AttrsType> {
        this.addMessageKey(type, key)
        return this
    }

    click(key: MessageKey): Tag<AttrsType> {
        this.emit('click', key)
        return this
    }


    /// Building

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

type AnchorTagAttrs = DefaultTagAttrs & {
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

type AreaTagAttrs = DefaultTagAttrs & {
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

type BRTagAttrs = DefaultTagAttrs & {
}

export class BRTag extends Tag<BRTagAttrs> {}

type BaseTagAttrs = DefaultTagAttrs & {
    href?: string
    target?: string
}

export class BaseTag extends Tag<BaseTagAttrs> {}

type BodyTagAttrs = DefaultTagAttrs & {
}

export class BodyTag extends Tag<BodyTagAttrs> {}

type ButtonTagAttrs = DefaultTagAttrs & {
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

type CanvasTagAttrs = DefaultTagAttrs & {
    height?: number
    width?: number
}

export class CanvasTag extends Tag<CanvasTagAttrs> {}

type DListTagAttrs = DefaultTagAttrs & {
}

export class DListTag extends Tag<DListTagAttrs> {}

type DataTagAttrs = DefaultTagAttrs & {
    value?: string
}

export class DataTag extends Tag<DataTagAttrs> {}

type DataListTagAttrs = DefaultTagAttrs & {
}

export class DataListTag extends Tag<DataListTagAttrs> {}

type DetailsTagAttrs = DefaultTagAttrs & {
    open?: boolean
}

export class DetailsTag extends Tag<DetailsTagAttrs> {}

type DivTagAttrs = DefaultTagAttrs & {
}

export class DivTag extends Tag<DivTagAttrs> {}

type DefaultTagAttrs = Attrs & {
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

type EmbedTagAttrs = DefaultTagAttrs & {
    height?: string
    src?: string
    type?: string
    width?: string
}

export class EmbedTag extends Tag<EmbedTagAttrs> {}

type FieldSetTagAttrs = DefaultTagAttrs & {
    disabled?: boolean
    name?: string
}

export class FieldSetTag extends Tag<FieldSetTagAttrs> {}

type FormTagAttrs = DefaultTagAttrs & {
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

type FrameSetTagAttrs = DefaultTagAttrs & {
}

export class FrameSetTag extends Tag<FrameSetTagAttrs> {}

type HRTagAttrs = DefaultTagAttrs & {
}

export class HRTag extends Tag<HRTagAttrs> {}

type HeadTagAttrs = DefaultTagAttrs & {
}

export class HeadTag extends Tag<HeadTagAttrs> {}

type HeadingTagAttrs = DefaultTagAttrs & {
}

export class HeadingTag extends Tag<HeadingTagAttrs> {}

type HtmlTagAttrs = DefaultTagAttrs & {
}

export class HtmlTag extends Tag<HtmlTagAttrs> {}

type IFrameTagAttrs = DefaultTagAttrs & {
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

type ImageTagAttrs = DefaultTagAttrs & {
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

type InputTagAttrs = DefaultTagAttrs & {
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

type LITagAttrs = DefaultTagAttrs & {
    value?: number
}

export class LITag extends Tag<LITagAttrs> {}

type LabelTagAttrs = DefaultTagAttrs & {
    htmlFor?: string
}

export class LabelTag extends Tag<LabelTagAttrs> {}

type LegendTagAttrs = DefaultTagAttrs & {
}

export class LegendTag extends Tag<LegendTagAttrs> {}

type LinkTagAttrs = DefaultTagAttrs & {
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

type MapTagAttrs = DefaultTagAttrs & {
    name?: string
}

export class MapTag extends Tag<MapTagAttrs> {}

type MediaTagAttrs = DefaultTagAttrs & {
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

type MenuTagAttrs = DefaultTagAttrs & {
}

export class MenuTag extends Tag<MenuTagAttrs> {}

type MetaTagAttrs = DefaultTagAttrs & {
    content?: string
    httpEquiv?: string
    name?: string
}

export class MetaTag extends Tag<MetaTagAttrs> {}

type MeterTagAttrs = DefaultTagAttrs & {
    high?: number
    low?: number
    max?: number
    min?: number
    optimum?: number
    value?: number
}

export class MeterTag extends Tag<MeterTagAttrs> {}

type ModTagAttrs = DefaultTagAttrs & {
    cite?: string
    dateTime?: string
}

export class ModTag extends Tag<ModTagAttrs> {}

type OListTagAttrs = DefaultTagAttrs & {
    reversed?: boolean
    start?: number
    type?: string
}

export class OListTag extends Tag<OListTagAttrs> {}

type ObjectTagAttrs = DefaultTagAttrs & {
    data?: string
    height?: string
    name?: string
    type?: string
    useMap?: string
    width?: string
}

export class ObjectTag extends Tag<ObjectTagAttrs> {}

type OptGroupTagAttrs = DefaultTagAttrs & {
    disabled?: boolean
    label?: string
}

export class OptGroupTag extends Tag<OptGroupTagAttrs> {}

type OptionTagAttrs = DefaultTagAttrs & {
    defaultSelected?: boolean
    disabled?: boolean
    label?: string
    selected?: boolean
    text?: string
    value?: string
}

export class OptionTag extends Tag<OptionTagAttrs> {}

type OutputTagAttrs = DefaultTagAttrs & {
    defaultValue?: string
    name?: string
    value?: string
}

export class OutputTag extends Tag<OutputTagAttrs> {}

type ParagraphTagAttrs = DefaultTagAttrs & {
}

export class ParagraphTag extends Tag<ParagraphTagAttrs> {}

type ParamTagAttrs = DefaultTagAttrs & {
    name?: string
    value?: string
}

export class ParamTag extends Tag<ParamTagAttrs> {}

type PictureTagAttrs = DefaultTagAttrs & {
}

export class PictureTag extends Tag<PictureTagAttrs> {}

type PreTagAttrs = DefaultTagAttrs & {
}

export class PreTag extends Tag<PreTagAttrs> {}

type ProgressTagAttrs = DefaultTagAttrs & {
    max?: number
    value?: number
}

export class ProgressTag extends Tag<ProgressTagAttrs> {}

type QuoteTagAttrs = DefaultTagAttrs & {
    cite?: string
}

export class QuoteTag extends Tag<QuoteTagAttrs> {}

type ScriptTagAttrs = DefaultTagAttrs & {
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

type SelectTagAttrs = DefaultTagAttrs & {
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

type SlotTagAttrs = DefaultTagAttrs & {
    name?: string
}

export class SlotTag extends Tag<SlotTagAttrs> {}

type SourceTagAttrs = DefaultTagAttrs & {
    media?: string
    sizes?: string
    src?: string
    srcset?: string
    type?: string
}

export class SourceTag extends Tag<SourceTagAttrs> {}

type SpanTagAttrs = DefaultTagAttrs & {
}

export class SpanTag extends Tag<SpanTagAttrs> {}

type StyleTagAttrs = DefaultTagAttrs & {
    media?: string
}

export class StyleTag extends Tag<StyleTagAttrs> {}

type TableCaptionTagAttrs = DefaultTagAttrs & {
}

export class TableCaptionTag extends Tag<TableCaptionTagAttrs> {}

type TableCellTagAttrs = DefaultTagAttrs & {
    abbr?: string
    colSpan?: number
    headers?: string
    rowSpan?: number
    scope?: string
}

export class TableCellTag extends Tag<TableCellTagAttrs> {}

type TableColTagAttrs = DefaultTagAttrs & {
    span?: number
}

export class TableColTag extends Tag<TableColTagAttrs> {}

type TableTagAttrs = DefaultTagAttrs & {
    caption?: HTMLTableCaptionElement | null
    tFoot?: HTMLTableSectionElement | null
    tHead?: HTMLTableSectionElement | null
}

export class TableTag extends Tag<TableTagAttrs> {}

type TableRowTagAttrs = DefaultTagAttrs & {
}

export class TableRowTag extends Tag<TableRowTagAttrs> {}

type TableSectionTagAttrs = DefaultTagAttrs & {
}

export class TableSectionTag extends Tag<TableSectionTagAttrs> {}

type TemplateTagAttrs = DefaultTagAttrs & {
}

export class TemplateTag extends Tag<TemplateTagAttrs> {}

type TextAreaTagAttrs = DefaultTagAttrs & {
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

type TimeTagAttrs = DefaultTagAttrs & {
    dateTime?: string
}

export class TimeTag extends Tag<TimeTagAttrs> {}

type TitleTagAttrs = DefaultTagAttrs & {
    text?: string
}

export class TitleTag extends Tag<TitleTagAttrs> {}

type TrackTagAttrs = DefaultTagAttrs & {
    default?: boolean
    kind?: string
    label?: string
    src?: string
    srclang?: string
}

export class TrackTag extends Tag<TrackTagAttrs> {}

type UListTagAttrs = DefaultTagAttrs & {
}

export class UListTag extends Tag<UListTagAttrs> {}

type UnknownTagAttrs = DefaultTagAttrs & {
}

export class UnknownTag extends Tag<UnknownTagAttrs> {}
//// End Tag Classes

