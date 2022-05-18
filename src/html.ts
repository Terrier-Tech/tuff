import { Part } from './parts'
import { Attrs, Tag, TagArgs } from './tags'
import { SVGTag } from "./svg"
import * as strings from './strings'
import {Logger} from './logging'

const log = new Logger('HTML')

/**
 * Any HTML-specific attributes that aren't in the types would go here.
 */
export interface HtmlBaseAttrs extends Attrs {

}

/**
 * General HTML tag type with no specific attributes.
 */
export type HtmlParentTag = HtmlTagBase<HtmlBaseAttrs,any>


/**
 * Base class for all HTML tags, parameterized on their attribute types.
 */
export abstract class HtmlTagBase<AttrsType extends Attrs,ElementType extends HTMLElement> extends Tag<AttrsType,ElementType> {
    
    serializeAttribute(name: string, value: any): string {
        if (typeof value == 'object') {
            log.warn(`Don't know how to serialize value for key ${name}`, value)
        }
        return `${strings.ropeCase(name)}="${value.toString()}"`
    }


    /// Elements

    /**
     * @returns an actual `ElementType` generated for this tag, in the current document.
     */
    createElement(): ElementType {
        const output = Array<string>()
        this.build(output)
        const elem = document.createElement(this.tag) as ElementType
        elem.innerHTML = output.join('')
        return elem
    }


    /// Parts

    part(part: Part<{}>) {
        part.renderInTag(this)
    }


    /// SVG

    svg(...args: TagArgs<SVGTag,Attrs>[]) : SVGTag {
        return this.child(SVGTag, "svg", ...args)
    }


    //// Begin Tag Methods

    a(...args: TagArgs<AnchorTag,AnchorTagAttrs>[]) : AnchorTag {
        return this.child(AnchorTag, ...args)
    }

    abbr(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    address(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    area(...args: TagArgs<AreaTag,AreaTagAttrs>[]) : AreaTag {
        return this.child(AreaTag, ...args)
    }

    article(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    aside(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    b(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    base(...args: TagArgs<BaseTag,BaseTagAttrs>[]) : BaseTag {
        return this.child(BaseTag, ...args)
    }

    bdi(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    bdo(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    blockquote(...args: TagArgs<QuoteTag,QuoteTagAttrs>[]) : QuoteTag {
        return this.child(QuoteTag, ...args)
    }

    body(...args: TagArgs<BodyTag,BodyTagAttrs>[]) : BodyTag {
        return this.child(BodyTag, ...args)
    }

    br(...args: TagArgs<BRTag,BRTagAttrs>[]) : BRTag {
        return this.child(BRTag, ...args)
    }

    button(...args: TagArgs<ButtonTag,ButtonTagAttrs>[]) : ButtonTag {
        return this.child(ButtonTag, ...args)
    }

    canvas(...args: TagArgs<CanvasTag,CanvasTagAttrs>[]) : CanvasTag {
        return this.child(CanvasTag, ...args)
    }

    caption(...args: TagArgs<TableCaptionTag,TableCaptionTagAttrs>[]) : TableCaptionTag {
        return this.child(TableCaptionTag, ...args)
    }

    cite(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    code(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    col(...args: TagArgs<TableColTag,TableColTagAttrs>[]) : TableColTag {
        return this.child(TableColTag, ...args)
    }

    colgroup(...args: TagArgs<TableColTag,TableColTagAttrs>[]) : TableColTag {
        return this.child(TableColTag, ...args)
    }

    dataTag(...args: TagArgs<DataTag,DataTagAttrs>[]) : DataTag {
        return this.child(DataTag, ...args)
    }

    datalist(...args: TagArgs<DataListTag,DataListTagAttrs>[]) : DataListTag {
        return this.child(DataListTag, ...args)
    }

    dd(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    del(...args: TagArgs<ModTag,ModTagAttrs>[]) : ModTag {
        return this.child(ModTag, ...args)
    }

    details(...args: TagArgs<DetailsTag,DetailsTagAttrs>[]) : DetailsTag {
        return this.child(DetailsTag, ...args)
    }

    dfn(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    div(...args: TagArgs<DivTag,DivTagAttrs>[]) : DivTag {
        return this.child(DivTag, ...args)
    }

    dl(...args: TagArgs<DListTag,DListTagAttrs>[]) : DListTag {
        return this.child(DListTag, ...args)
    }

    dt(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    em(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    embed(...args: TagArgs<EmbedTag,EmbedTagAttrs>[]) : EmbedTag {
        return this.child(EmbedTag, ...args)
    }

    fieldset(...args: TagArgs<FieldSetTag,FieldSetTagAttrs>[]) : FieldSetTag {
        return this.child(FieldSetTag, ...args)
    }

    figcaption(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    figure(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    footer(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    form(...args: TagArgs<FormTag,FormTagAttrs>[]) : FormTag {
        return this.child(FormTag, ...args)
    }

    frameset(...args: TagArgs<FrameSetTag,FrameSetTagAttrs>[]) : FrameSetTag {
        return this.child(FrameSetTag, ...args)
    }

    h1(...args: TagArgs<HeadingTag,HeadingTagAttrs>[]) : HeadingTag {
        return this.child(HeadingTag, ...args)
    }

    h2(...args: TagArgs<HeadingTag,HeadingTagAttrs>[]) : HeadingTag {
        return this.child(HeadingTag, ...args)
    }

    h3(...args: TagArgs<HeadingTag,HeadingTagAttrs>[]) : HeadingTag {
        return this.child(HeadingTag, ...args)
    }

    h4(...args: TagArgs<HeadingTag,HeadingTagAttrs>[]) : HeadingTag {
        return this.child(HeadingTag, ...args)
    }

    h5(...args: TagArgs<HeadingTag,HeadingTagAttrs>[]) : HeadingTag {
        return this.child(HeadingTag, ...args)
    }

    h6(...args: TagArgs<HeadingTag,HeadingTagAttrs>[]) : HeadingTag {
        return this.child(HeadingTag, ...args)
    }

    head(...args: TagArgs<HeadTag,HeadTagAttrs>[]) : HeadTag {
        return this.child(HeadTag, ...args)
    }

    header(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    hgroup(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    hr(...args: TagArgs<HRTag,HRTagAttrs>[]) : HRTag {
        return this.child(HRTag, ...args)
    }

    html(...args: TagArgs<HtmlTag,HtmlTagAttrs>[]) : HtmlTag {
        return this.child(HtmlTag, ...args)
    }

    i(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    iframe(...args: TagArgs<IFrameTag,IFrameTagAttrs>[]) : IFrameTag {
        return this.child(IFrameTag, ...args)
    }

    img(...args: TagArgs<ImageTag,ImageTagAttrs>[]) : ImageTag {
        return this.child(ImageTag, ...args)
    }

    input(...args: TagArgs<InputTag,InputTagAttrs>[]) : InputTag {
        return this.child(InputTag, ...args)
    }

    ins(...args: TagArgs<ModTag,ModTagAttrs>[]) : ModTag {
        return this.child(ModTag, ...args)
    }

    kbd(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    label(...args: TagArgs<LabelTag,LabelTagAttrs>[]) : LabelTag {
        return this.child(LabelTag, ...args)
    }

    legend(...args: TagArgs<LegendTag,LegendTagAttrs>[]) : LegendTag {
        return this.child(LegendTag, ...args)
    }

    li(...args: TagArgs<LITag,LITagAttrs>[]) : LITag {
        return this.child(LITag, ...args)
    }

    link(...args: TagArgs<LinkTag,LinkTagAttrs>[]) : LinkTag {
        return this.child(LinkTag, ...args)
    }

    main(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    map(...args: TagArgs<MapTag,MapTagAttrs>[]) : MapTag {
        return this.child(MapTag, ...args)
    }

    mark(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    menu(...args: TagArgs<MenuTag,MenuTagAttrs>[]) : MenuTag {
        return this.child(MenuTag, ...args)
    }

    meta(...args: TagArgs<MetaTag,MetaTagAttrs>[]) : MetaTag {
        return this.child(MetaTag, ...args)
    }

    meter(...args: TagArgs<MeterTag,MeterTagAttrs>[]) : MeterTag {
        return this.child(MeterTag, ...args)
    }

    nav(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    noscript(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    object(...args: TagArgs<ObjectTag,ObjectTagAttrs>[]) : ObjectTag {
        return this.child(ObjectTag, ...args)
    }

    ol(...args: TagArgs<OListTag,OListTagAttrs>[]) : OListTag {
        return this.child(OListTag, ...args)
    }

    optgroup(...args: TagArgs<OptGroupTag,OptGroupTagAttrs>[]) : OptGroupTag {
        return this.child(OptGroupTag, ...args)
    }

    option(...args: TagArgs<OptionTag,OptionTagAttrs>[]) : OptionTag {
        return this.child(OptionTag, ...args)
    }

    output(...args: TagArgs<OutputTag,OutputTagAttrs>[]) : OutputTag {
        return this.child(OutputTag, ...args)
    }

    p(...args: TagArgs<ParagraphTag,ParagraphTagAttrs>[]) : ParagraphTag {
        return this.child(ParagraphTag, ...args)
    }

    param(...args: TagArgs<ParamTag,ParamTagAttrs>[]) : ParamTag {
        return this.child(ParamTag, ...args)
    }

    picture(...args: TagArgs<PictureTag,PictureTagAttrs>[]) : PictureTag {
        return this.child(PictureTag, ...args)
    }

    pre(...args: TagArgs<PreTag,PreTagAttrs>[]) : PreTag {
        return this.child(PreTag, ...args)
    }

    progress(...args: TagArgs<ProgressTag,ProgressTagAttrs>[]) : ProgressTag {
        return this.child(ProgressTag, ...args)
    }

    q(...args: TagArgs<QuoteTag,QuoteTagAttrs>[]) : QuoteTag {
        return this.child(QuoteTag, ...args)
    }

    rp(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    rt(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    ruby(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    s(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    samp(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    script(...args: TagArgs<ScriptTag,ScriptTagAttrs>[]) : ScriptTag {
        return this.child(ScriptTag, ...args)
    }

    section(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    select(...args: TagArgs<SelectTag,SelectTagAttrs>[]) : SelectTag {
        return this.child(SelectTag, ...args)
    }

    slot(...args: TagArgs<SlotTag,SlotTagAttrs>[]) : SlotTag {
        return this.child(SlotTag, ...args)
    }

    small(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    source(...args: TagArgs<SourceTag,SourceTagAttrs>[]) : SourceTag {
        return this.child(SourceTag, ...args)
    }

    span(...args: TagArgs<SpanTag,SpanTagAttrs>[]) : SpanTag {
        return this.child(SpanTag, ...args)
    }

    strong(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    style(...args: TagArgs<StyleTag,StyleTagAttrs>[]) : StyleTag {
        return this.child(StyleTag, ...args)
    }

    sub(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    summary(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    sup(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    table(...args: TagArgs<TableTag,TableTagAttrs>[]) : TableTag {
        return this.child(TableTag, ...args)
    }

    tbody(...args: TagArgs<TableSectionTag,TableSectionTagAttrs>[]) : TableSectionTag {
        return this.child(TableSectionTag, ...args)
    }

    td(...args: TagArgs<TableCellTag,TableCellTagAttrs>[]) : TableCellTag {
        return this.child(TableCellTag, ...args)
    }

    template(...args: TagArgs<TemplateTag,TemplateTagAttrs>[]) : TemplateTag {
        return this.child(TemplateTag, ...args)
    }

    textarea(...args: TagArgs<TextAreaTag,TextAreaTagAttrs>[]) : TextAreaTag {
        return this.child(TextAreaTag, ...args)
    }

    tfoot(...args: TagArgs<TableSectionTag,TableSectionTagAttrs>[]) : TableSectionTag {
        return this.child(TableSectionTag, ...args)
    }

    th(...args: TagArgs<TableCellTag,TableCellTagAttrs>[]) : TableCellTag {
        return this.child(TableCellTag, ...args)
    }

    thead(...args: TagArgs<TableSectionTag,TableSectionTagAttrs>[]) : TableSectionTag {
        return this.child(TableSectionTag, ...args)
    }

    time(...args: TagArgs<TimeTag,TimeTagAttrs>[]) : TimeTag {
        return this.child(TimeTag, ...args)
    }

    title(...args: TagArgs<TitleTag,TitleTagAttrs>[]) : TitleTag {
        return this.child(TitleTag, ...args)
    }

    tr(...args: TagArgs<TableRowTag,TableRowTagAttrs>[]) : TableRowTag {
        return this.child(TableRowTag, ...args)
    }

    track(...args: TagArgs<TrackTag,TrackTagAttrs>[]) : TrackTag {
        return this.child(TrackTag, ...args)
    }

    u(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    ul(...args: TagArgs<UListTag,UListTagAttrs>[]) : UListTag {
        return this.child(UListTag, ...args)
    }

    var(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

    wbr(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, ...args)
    }

//// End Tag Methods
}


// DO NOT EDIT THE CODE BELOW!
//// Begin Tag Classes

export type AnchorTagAttrs = DefaultTagAttrs & {
    href?: string
    download?: string
    hreflang?: string
    ping?: string
    referrerPolicy?: string
    rel?: string
    target?: string
    text?: string
    type?: string
}

export class AnchorTag extends HtmlTagBase<AnchorTagAttrs,HTMLAnchorElement> {
    constructor() { super("a") }
}

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

export class AreaTag extends HtmlTagBase<AreaTagAttrs,HTMLAreaElement> {
    constructor() { super("area") }
}

export type BRTagAttrs = DefaultTagAttrs & {
}

export class BRTag extends HtmlTagBase<BRTagAttrs,HTMLBRElement> {
    constructor() { super("br") }
}

export type BaseTagAttrs = DefaultTagAttrs & {
    href?: string
    target?: string
}

export class BaseTag extends HtmlTagBase<BaseTagAttrs,HTMLBaseElement> {
    constructor() { super("base") }
}

export type BodyTagAttrs = DefaultTagAttrs & {
}

export class BodyTag extends HtmlTagBase<BodyTagAttrs,HTMLBodyElement> {
    constructor() { super("body") }
}

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

export class ButtonTag extends HtmlTagBase<ButtonTagAttrs,HTMLButtonElement> {
    constructor() { super("button") }
}

export type CanvasTagAttrs = DefaultTagAttrs & {
    height?: number
    width?: number
}

export class CanvasTag extends HtmlTagBase<CanvasTagAttrs,HTMLCanvasElement> {
    constructor() { super("canvas") }
}

export type DListTagAttrs = DefaultTagAttrs & {
}

export class DListTag extends HtmlTagBase<DListTagAttrs,HTMLDListElement> {
    constructor() { super("dl") }
}

export type DataTagAttrs = DefaultTagAttrs & {
    value?: string
}

export class DataTag extends HtmlTagBase<DataTagAttrs,HTMLDataElement> {
    constructor() { super("data") }
}

export type DataListTagAttrs = DefaultTagAttrs & {
}

export class DataListTag extends HtmlTagBase<DataListTagAttrs,HTMLDataListElement> {
    constructor() { super("datalist") }
}

export type DetailsTagAttrs = DefaultTagAttrs & {
    open?: boolean
}

export class DetailsTag extends HtmlTagBase<DetailsTagAttrs,HTMLDetailsElement> {
    constructor() { super("details") }
}

export type DivTagAttrs = DefaultTagAttrs & {
}

export class DivTag extends HtmlTagBase<DivTagAttrs,HTMLDivElement> {
    constructor() { super("div") }
}

export type DefaultTagAttrs = HtmlBaseAttrs & {
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

export class DefaultTag extends HtmlTagBase<DefaultTagAttrs,HTMLElement> {
    constructor() { super("wbr") }
}

export type EmbedTagAttrs = DefaultTagAttrs & {
    height?: string
    src?: string
    type?: string
    width?: string
}

export class EmbedTag extends HtmlTagBase<EmbedTagAttrs,HTMLEmbedElement> {
    constructor() { super("embed") }
}

export type FieldSetTagAttrs = DefaultTagAttrs & {
    disabled?: boolean
    name?: string
}

export class FieldSetTag extends HtmlTagBase<FieldSetTagAttrs,HTMLFieldSetElement> {
    constructor() { super("fieldset") }
}

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

export class FormTag extends HtmlTagBase<FormTagAttrs,HTMLFormElement> {
    constructor() { super("form") }
}

export type FrameSetTagAttrs = DefaultTagAttrs & {
}

export class FrameSetTag extends HtmlTagBase<FrameSetTagAttrs,HTMLFrameSetElement> {
    constructor() { super("frameset") }
}

export type HRTagAttrs = DefaultTagAttrs & {
}

export class HRTag extends HtmlTagBase<HRTagAttrs,HTMLHRElement> {
    constructor() { super("hr") }
}

export type HeadTagAttrs = DefaultTagAttrs & {
}

export class HeadTag extends HtmlTagBase<HeadTagAttrs,HTMLHeadElement> {
    constructor() { super("head") }
}

export type HeadingTagAttrs = DefaultTagAttrs & {
}

export class HeadingTag extends HtmlTagBase<HeadingTagAttrs,HTMLHeadingElement> {
    constructor() { super("h6") }
}

export type HtmlTagAttrs = DefaultTagAttrs & {
}

export class HtmlTag extends HtmlTagBase<HtmlTagAttrs,HTMLHtmlElement> {
    constructor() { super("html") }
}

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

export class IFrameTag extends HtmlTagBase<IFrameTagAttrs,HTMLIFrameElement> {
    constructor() { super("iframe") }
}

export type ImageTagAttrs = DefaultTagAttrs & {
    alt?: string
    crossOrigin?: string | null
    decoding?: "async" | "sync" | "auto"
    height?: number
    isMap?: boolean
    loading?: "eager" | "lazy"
    referrerPolicy?: string
    sizes?: string
    src?: string
    srcset?: string
    useMap?: string
    width?: number
}

export class ImageTag extends HtmlTagBase<ImageTagAttrs,HTMLImageElement> {
    constructor() { super("img") }
}

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

export class InputTag extends HtmlTagBase<InputTagAttrs,HTMLInputElement> {
    constructor() { super("input") }
}

export type LITagAttrs = DefaultTagAttrs & {
    value?: number
}

export class LITag extends HtmlTagBase<LITagAttrs,HTMLLIElement> {
    constructor() { super("li") }
}

export type LabelTagAttrs = DefaultTagAttrs & {
    htmlFor?: string
}

export class LabelTag extends HtmlTagBase<LabelTagAttrs,HTMLLabelElement> {
    constructor() { super("label") }
}

export type LegendTagAttrs = DefaultTagAttrs & {
}

export class LegendTag extends HtmlTagBase<LegendTagAttrs,HTMLLegendElement> {
    constructor() { super("legend") }
}

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

export class LinkTag extends HtmlTagBase<LinkTagAttrs,HTMLLinkElement> {
    constructor() { super("link") }
}

export type MapTagAttrs = DefaultTagAttrs & {
    name?: string
}

export class MapTag extends HtmlTagBase<MapTagAttrs,HTMLMapElement> {
    constructor() { super("map") }
}

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

export class MediaTag extends HtmlTagBase<MediaTagAttrs,HTMLMediaElement> {
    constructor() { super("") }
}

export type MenuTagAttrs = DefaultTagAttrs & {
}

export class MenuTag extends HtmlTagBase<MenuTagAttrs,HTMLMenuElement> {
    constructor() { super("menu") }
}

export type MetaTagAttrs = DefaultTagAttrs & {
    content?: string
    httpEquiv?: string
    media?: string
    name?: string
}

export class MetaTag extends HtmlTagBase<MetaTagAttrs,HTMLMetaElement> {
    constructor() { super("meta") }
}

export type MeterTagAttrs = DefaultTagAttrs & {
    high?: number
    low?: number
    max?: number
    min?: number
    optimum?: number
    value?: number
}

export class MeterTag extends HtmlTagBase<MeterTagAttrs,HTMLMeterElement> {
    constructor() { super("meter") }
}

export type ModTagAttrs = DefaultTagAttrs & {
    cite?: string
    dateTime?: string
}

export class ModTag extends HtmlTagBase<ModTagAttrs,HTMLModElement> {
    constructor() { super("ins") }
}

export type OListTagAttrs = DefaultTagAttrs & {
    reversed?: boolean
    start?: number
    type?: string
}

export class OListTag extends HtmlTagBase<OListTagAttrs,HTMLOListElement> {
    constructor() { super("ol") }
}

export type ObjectTagAttrs = DefaultTagAttrs & {
    data?: string
    height?: string
    name?: string
    type?: string
    useMap?: string
    width?: string
}

export class ObjectTag extends HtmlTagBase<ObjectTagAttrs,HTMLObjectElement> {
    constructor() { super("object") }
}

export type OptGroupTagAttrs = DefaultTagAttrs & {
    disabled?: boolean
    label?: string
}

export class OptGroupTag extends HtmlTagBase<OptGroupTagAttrs,HTMLOptGroupElement> {
    constructor() { super("optgroup") }
}

export type OptionTagAttrs = DefaultTagAttrs & {
    defaultSelected?: boolean
    disabled?: boolean
    label?: string
    selected?: boolean
    text?: string
    value?: string
}

export class OptionTag extends HtmlTagBase<OptionTagAttrs,HTMLOptionElement> {
    constructor() { super("option") }
}

export type OutputTagAttrs = DefaultTagAttrs & {
    defaultValue?: string
    name?: string
    value?: string
}

export class OutputTag extends HtmlTagBase<OutputTagAttrs,HTMLOutputElement> {
    constructor() { super("output") }
}

export type ParagraphTagAttrs = DefaultTagAttrs & {
}

export class ParagraphTag extends HtmlTagBase<ParagraphTagAttrs,HTMLParagraphElement> {
    constructor() { super("p") }
}

export type ParamTagAttrs = DefaultTagAttrs & {
    name?: string
    value?: string
}

export class ParamTag extends HtmlTagBase<ParamTagAttrs,HTMLParamElement> {
    constructor() { super("param") }
}

export type PictureTagAttrs = DefaultTagAttrs & {
}

export class PictureTag extends HtmlTagBase<PictureTagAttrs,HTMLPictureElement> {
    constructor() { super("picture") }
}

export type PreTagAttrs = DefaultTagAttrs & {
}

export class PreTag extends HtmlTagBase<PreTagAttrs,HTMLPreElement> {
    constructor() { super("pre") }
}

export type ProgressTagAttrs = DefaultTagAttrs & {
    max?: number
    value?: number
}

export class ProgressTag extends HtmlTagBase<ProgressTagAttrs,HTMLProgressElement> {
    constructor() { super("progress") }
}

export type QuoteTagAttrs = DefaultTagAttrs & {
    cite?: string
}

export class QuoteTag extends HtmlTagBase<QuoteTagAttrs,HTMLQuoteElement> {
    constructor() { super("q") }
}

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

export class ScriptTag extends HtmlTagBase<ScriptTagAttrs,HTMLScriptElement> {
    constructor() { super("script") }
}

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

export class SelectTag extends HtmlTagBase<SelectTagAttrs,HTMLSelectElement> {
    constructor() { super("select") }
}

export type SlotTagAttrs = DefaultTagAttrs & {
    name?: string
}

export class SlotTag extends HtmlTagBase<SlotTagAttrs,HTMLSlotElement> {
    constructor() { super("slot") }
}

export type SourceTagAttrs = DefaultTagAttrs & {
    height?: number
    media?: string
    sizes?: string
    src?: string
    srcset?: string
    type?: string
    width?: number
}

export class SourceTag extends HtmlTagBase<SourceTagAttrs,HTMLSourceElement> {
    constructor() { super("source") }
}

export type SpanTagAttrs = DefaultTagAttrs & {
}

export class SpanTag extends HtmlTagBase<SpanTagAttrs,HTMLSpanElement> {
    constructor() { super("span") }
}

export type StyleTagAttrs = DefaultTagAttrs & {
    media?: string
}

export class StyleTag extends HtmlTagBase<StyleTagAttrs,HTMLStyleElement> {
    constructor() { super("style") }
}

export type TableCaptionTagAttrs = DefaultTagAttrs & {
}

export class TableCaptionTag extends HtmlTagBase<TableCaptionTagAttrs,HTMLTableCaptionElement> {
    constructor() { super("caption") }
}

export type TableCellTagAttrs = DefaultTagAttrs & {
    abbr?: string
    colSpan?: number
    headers?: string
    rowSpan?: number
    scope?: string
}

export class TableCellTag extends HtmlTagBase<TableCellTagAttrs,HTMLTableCellElement> {
    constructor() { super("th") }
}

export type TableColTagAttrs = DefaultTagAttrs & {
    span?: number
}

export class TableColTag extends HtmlTagBase<TableColTagAttrs,HTMLTableColElement> {
    constructor() { super("colgroup") }
}

export type TableTagAttrs = DefaultTagAttrs & {
    caption?: HTMLTableCaptionElement | null
    tFoot?: HTMLTableSectionElement | null
    tHead?: HTMLTableSectionElement | null
}

export class TableTag extends HtmlTagBase<TableTagAttrs,HTMLTableElement> {
    constructor() { super("table") }
}

export type TableRowTagAttrs = DefaultTagAttrs & {
}

export class TableRowTag extends HtmlTagBase<TableRowTagAttrs,HTMLTableRowElement> {
    constructor() { super("tr") }
}

export type TableSectionTagAttrs = DefaultTagAttrs & {
}

export class TableSectionTag extends HtmlTagBase<TableSectionTagAttrs,HTMLTableSectionElement> {
    constructor() { super("thead") }
}

export type TemplateTagAttrs = DefaultTagAttrs & {
}

export class TemplateTag extends HtmlTagBase<TemplateTagAttrs,HTMLTemplateElement> {
    constructor() { super("template") }
}

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

export class TextAreaTag extends HtmlTagBase<TextAreaTagAttrs,HTMLTextAreaElement> {
    constructor() { super("textarea") }
}

export type TimeTagAttrs = DefaultTagAttrs & {
    dateTime?: string
}

export class TimeTag extends HtmlTagBase<TimeTagAttrs,HTMLTimeElement> {
    constructor() { super("time") }
}

export type TitleTagAttrs = DefaultTagAttrs & {
    text?: string
}

export class TitleTag extends HtmlTagBase<TitleTagAttrs,HTMLTitleElement> {
    constructor() { super("title") }
}

export type TrackTagAttrs = DefaultTagAttrs & {
    default?: boolean
    kind?: string
    label?: string
    src?: string
    srclang?: string
}

export class TrackTag extends HtmlTagBase<TrackTagAttrs,HTMLTrackElement> {
    constructor() { super("track") }
}

export type UListTagAttrs = DefaultTagAttrs & {
}

export class UListTag extends HtmlTagBase<UListTagAttrs,HTMLUListElement> {
    constructor() { super("ul") }
}

export type UnknownTagAttrs = DefaultTagAttrs & {
}

export class UnknownTag extends HtmlTagBase<UnknownTagAttrs,HTMLUnknownElement> {
    constructor() { super("") }
}

//// End Tag Classes