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
 * Creates an arbitray HTML element using the associated tag builder.
 * @param tagName the name of the HTML tag
 * @param fn a function to call on the tag before it's created
 * @returns the resulting element
 */
export function createHtmlElement<T extends keyof HtmlTagMap & keyof HTMLElementTagNameMap>(tagName: T, fn: (t: HtmlTagMap[T]) => any): HTMLElementTagNameMap[T] {
    const tag = new htmlTagMap[tagName](tagName) as HtmlTagMap[T]
    fn(tag)
    return tag.createElement() as HTMLElementTagNameMap[T]
}


/**
 * Base class for all HTML tags, parameterized on their attribute types.
 */
export abstract class HtmlTagBase<AttrsType extends Attrs,ElementType extends HTMLElement> extends Tag<AttrsType,ElementType> {
    
    serializeAttribute(name: string, value: any): string {
        if (typeof value == 'object') {
            log.warn(`Don't know how to serialize value for key ${name}`, value)
        }
        return `${strings.ropeCase(name)}="${this.escapeAttrValue(value.toString())}"`
    }


    /// Elements

    /**
     * @returns an actual `ElementType` generated for this tag, in the current document.
     */
    createElement(): ElementType {
        const output = Array<string>()
        this.build(output)
        // use a temporary container so that setting the innerHTML will insert the entire element
        const container = document.createElement('div')
        container.innerHTML = output.join("\n")
        const elem = container.childNodes[0] as ElementType
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
        return this.child(AnchorTag, 'a', ...args)
    }

    abbr(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'abbr', ...args)
    }

    address(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'address', ...args)
    }

    area(...args: TagArgs<AreaTag,AreaTagAttrs>[]) : AreaTag {
        return this.child(AreaTag, 'area', ...args)
    }

    article(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'article', ...args)
    }

    aside(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'aside', ...args)
    }

    b(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'b', ...args)
    }

    base(...args: TagArgs<BaseTag,BaseTagAttrs>[]) : BaseTag {
        return this.child(BaseTag, 'base', ...args)
    }

    bdi(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'bdi', ...args)
    }

    bdo(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'bdo', ...args)
    }

    blockquote(...args: TagArgs<QuoteTag,QuoteTagAttrs>[]) : QuoteTag {
        return this.child(QuoteTag, 'blockquote', ...args)
    }

    body(...args: TagArgs<BodyTag,BodyTagAttrs>[]) : BodyTag {
        return this.child(BodyTag, 'body', ...args)
    }

    br(...args: TagArgs<BRTag,BRTagAttrs>[]) : BRTag {
        return this.child(BRTag, 'br', ...args)
    }

    button(...args: TagArgs<ButtonTag,ButtonTagAttrs>[]) : ButtonTag {
        return this.child(ButtonTag, 'button', ...args)
    }

    canvas(...args: TagArgs<CanvasTag,CanvasTagAttrs>[]) : CanvasTag {
        return this.child(CanvasTag, 'canvas', ...args)
    }

    caption(...args: TagArgs<TableCaptionTag,TableCaptionTagAttrs>[]) : TableCaptionTag {
        return this.child(TableCaptionTag, 'caption', ...args)
    }

    cite(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'cite', ...args)
    }

    code(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'code', ...args)
    }

    col(...args: TagArgs<TableColTag,TableColTagAttrs>[]) : TableColTag {
        return this.child(TableColTag, 'col', ...args)
    }

    colgroup(...args: TagArgs<TableColTag,TableColTagAttrs>[]) : TableColTag {
        return this.child(TableColTag, 'colgroup', ...args)
    }

    dataTag(...args: TagArgs<DataTag,DataTagAttrs>[]) : DataTag {
        return this.child(DataTag, 'data', ...args)
    }

    datalist(...args: TagArgs<DataListTag,DataListTagAttrs>[]) : DataListTag {
        return this.child(DataListTag, 'datalist', ...args)
    }

    dd(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'dd', ...args)
    }

    del(...args: TagArgs<ModTag,ModTagAttrs>[]) : ModTag {
        return this.child(ModTag, 'del', ...args)
    }

    details(...args: TagArgs<DetailsTag,DetailsTagAttrs>[]) : DetailsTag {
        return this.child(DetailsTag, 'details', ...args)
    }

    dfn(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'dfn', ...args)
    }

    div(...args: TagArgs<DivTag,DivTagAttrs>[]) : DivTag {
        return this.child(DivTag, 'div', ...args)
    }

    dl(...args: TagArgs<DListTag,DListTagAttrs>[]) : DListTag {
        return this.child(DListTag, 'dl', ...args)
    }

    dt(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'dt', ...args)
    }

    em(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'em', ...args)
    }

    embed(...args: TagArgs<EmbedTag,EmbedTagAttrs>[]) : EmbedTag {
        return this.child(EmbedTag, 'embed', ...args)
    }

    fieldset(...args: TagArgs<FieldSetTag,FieldSetTagAttrs>[]) : FieldSetTag {
        return this.child(FieldSetTag, 'fieldset', ...args)
    }

    figcaption(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'figcaption', ...args)
    }

    figure(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'figure', ...args)
    }

    footer(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'footer', ...args)
    }

    form(...args: TagArgs<FormTag,FormTagAttrs>[]) : FormTag {
        return this.child(FormTag, 'form', ...args)
    }

    frameset(...args: TagArgs<FrameSetTag,FrameSetTagAttrs>[]) : FrameSetTag {
        return this.child(FrameSetTag, 'frameset', ...args)
    }

    h1(...args: TagArgs<HeadingTag,HeadingTagAttrs>[]) : HeadingTag {
        return this.child(HeadingTag, 'h1', ...args)
    }

    h2(...args: TagArgs<HeadingTag,HeadingTagAttrs>[]) : HeadingTag {
        return this.child(HeadingTag, 'h2', ...args)
    }

    h3(...args: TagArgs<HeadingTag,HeadingTagAttrs>[]) : HeadingTag {
        return this.child(HeadingTag, 'h3', ...args)
    }

    h4(...args: TagArgs<HeadingTag,HeadingTagAttrs>[]) : HeadingTag {
        return this.child(HeadingTag, 'h4', ...args)
    }

    h5(...args: TagArgs<HeadingTag,HeadingTagAttrs>[]) : HeadingTag {
        return this.child(HeadingTag, 'h5', ...args)
    }

    h6(...args: TagArgs<HeadingTag,HeadingTagAttrs>[]) : HeadingTag {
        return this.child(HeadingTag, 'h6', ...args)
    }

    head(...args: TagArgs<HeadTag,HeadTagAttrs>[]) : HeadTag {
        return this.child(HeadTag, 'head', ...args)
    }

    header(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'header', ...args)
    }

    hgroup(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'hgroup', ...args)
    }

    hr(...args: TagArgs<HRTag,HRTagAttrs>[]) : HRTag {
        return this.child(HRTag, 'hr', ...args)
    }

    html(...args: TagArgs<HtmlTag,HtmlTagAttrs>[]) : HtmlTag {
        return this.child(HtmlTag, 'html', ...args)
    }

    i(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'i', ...args)
    }

    iframe(...args: TagArgs<IFrameTag,IFrameTagAttrs>[]) : IFrameTag {
        return this.child(IFrameTag, 'iframe', ...args)
    }

    img(...args: TagArgs<ImageTag,ImageTagAttrs>[]) : ImageTag {
        return this.child(ImageTag, 'img', ...args)
    }

    input(...args: TagArgs<InputTag,InputTagAttrs>[]) : InputTag {
        return this.child(InputTag, 'input', ...args)
    }

    ins(...args: TagArgs<ModTag,ModTagAttrs>[]) : ModTag {
        return this.child(ModTag, 'ins', ...args)
    }

    kbd(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'kbd', ...args)
    }

    label(...args: TagArgs<LabelTag,LabelTagAttrs>[]) : LabelTag {
        return this.child(LabelTag, 'label', ...args)
    }

    legend(...args: TagArgs<LegendTag,LegendTagAttrs>[]) : LegendTag {
        return this.child(LegendTag, 'legend', ...args)
    }

    li(...args: TagArgs<LITag,LITagAttrs>[]) : LITag {
        return this.child(LITag, 'li', ...args)
    }

    link(...args: TagArgs<LinkTag,LinkTagAttrs>[]) : LinkTag {
        return this.child(LinkTag, 'link', ...args)
    }

    main(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'main', ...args)
    }

    map(...args: TagArgs<MapTag,MapTagAttrs>[]) : MapTag {
        return this.child(MapTag, 'map', ...args)
    }

    mark(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'mark', ...args)
    }

    menu(...args: TagArgs<MenuTag,MenuTagAttrs>[]) : MenuTag {
        return this.child(MenuTag, 'menu', ...args)
    }

    meta(...args: TagArgs<MetaTag,MetaTagAttrs>[]) : MetaTag {
        return this.child(MetaTag, 'meta', ...args)
    }

    meter(...args: TagArgs<MeterTag,MeterTagAttrs>[]) : MeterTag {
        return this.child(MeterTag, 'meter', ...args)
    }

    nav(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'nav', ...args)
    }

    noscript(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'noscript', ...args)
    }

    object(...args: TagArgs<ObjectTag,ObjectTagAttrs>[]) : ObjectTag {
        return this.child(ObjectTag, 'object', ...args)
    }

    ol(...args: TagArgs<OListTag,OListTagAttrs>[]) : OListTag {
        return this.child(OListTag, 'ol', ...args)
    }

    optgroup(...args: TagArgs<OptGroupTag,OptGroupTagAttrs>[]) : OptGroupTag {
        return this.child(OptGroupTag, 'optgroup', ...args)
    }

    option(...args: TagArgs<OptionTag,OptionTagAttrs>[]) : OptionTag {
        return this.child(OptionTag, 'option', ...args)
    }

    output(...args: TagArgs<OutputTag,OutputTagAttrs>[]) : OutputTag {
        return this.child(OutputTag, 'output', ...args)
    }

    p(...args: TagArgs<ParagraphTag,ParagraphTagAttrs>[]) : ParagraphTag {
        return this.child(ParagraphTag, 'p', ...args)
    }

    param(...args: TagArgs<ParamTag,ParamTagAttrs>[]) : ParamTag {
        return this.child(ParamTag, 'param', ...args)
    }

    picture(...args: TagArgs<PictureTag,PictureTagAttrs>[]) : PictureTag {
        return this.child(PictureTag, 'picture', ...args)
    }

    pre(...args: TagArgs<PreTag,PreTagAttrs>[]) : PreTag {
        return this.child(PreTag, 'pre', ...args)
    }

    progress(...args: TagArgs<ProgressTag,ProgressTagAttrs>[]) : ProgressTag {
        return this.child(ProgressTag, 'progress', ...args)
    }

    q(...args: TagArgs<QuoteTag,QuoteTagAttrs>[]) : QuoteTag {
        return this.child(QuoteTag, 'q', ...args)
    }

    rp(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'rp', ...args)
    }

    rt(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'rt', ...args)
    }

    ruby(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'ruby', ...args)
    }

    s(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 's', ...args)
    }

    samp(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'samp', ...args)
    }

    script(...args: TagArgs<ScriptTag,ScriptTagAttrs>[]) : ScriptTag {
        return this.child(ScriptTag, 'script', ...args)
    }

    section(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'section', ...args)
    }

    select(...args: TagArgs<SelectTag,SelectTagAttrs>[]) : SelectTag {
        return this.child(SelectTag, 'select', ...args)
    }

    slot(...args: TagArgs<SlotTag,SlotTagAttrs>[]) : SlotTag {
        return this.child(SlotTag, 'slot', ...args)
    }

    small(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'small', ...args)
    }

    source(...args: TagArgs<SourceTag,SourceTagAttrs>[]) : SourceTag {
        return this.child(SourceTag, 'source', ...args)
    }

    span(...args: TagArgs<SpanTag,SpanTagAttrs>[]) : SpanTag {
        return this.child(SpanTag, 'span', ...args)
    }

    strong(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'strong', ...args)
    }

    style(...args: TagArgs<StyleTag,StyleTagAttrs>[]) : StyleTag {
        return this.child(StyleTag, 'style', ...args)
    }

    sub(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'sub', ...args)
    }

    summary(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'summary', ...args)
    }

    sup(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'sup', ...args)
    }

    table(...args: TagArgs<TableTag,TableTagAttrs>[]) : TableTag {
        return this.child(TableTag, 'table', ...args)
    }

    tbody(...args: TagArgs<TableSectionTag,TableSectionTagAttrs>[]) : TableSectionTag {
        return this.child(TableSectionTag, 'tbody', ...args)
    }

    td(...args: TagArgs<TableCellTag,TableCellTagAttrs>[]) : TableCellTag {
        return this.child(TableCellTag, 'td', ...args)
    }

    template(...args: TagArgs<TemplateTag,TemplateTagAttrs>[]) : TemplateTag {
        return this.child(TemplateTag, 'template', ...args)
    }

    textarea(...args: TagArgs<TextAreaTag,TextAreaTagAttrs>[]) : TextAreaTag {
        return this.child(TextAreaTag, 'textarea', ...args)
    }

    tfoot(...args: TagArgs<TableSectionTag,TableSectionTagAttrs>[]) : TableSectionTag {
        return this.child(TableSectionTag, 'tfoot', ...args)
    }

    th(...args: TagArgs<TableCellTag,TableCellTagAttrs>[]) : TableCellTag {
        return this.child(TableCellTag, 'th', ...args)
    }

    thead(...args: TagArgs<TableSectionTag,TableSectionTagAttrs>[]) : TableSectionTag {
        return this.child(TableSectionTag, 'thead', ...args)
    }

    time(...args: TagArgs<TimeTag,TimeTagAttrs>[]) : TimeTag {
        return this.child(TimeTag, 'time', ...args)
    }

    title(...args: TagArgs<TitleTag,TitleTagAttrs>[]) : TitleTag {
        return this.child(TitleTag, 'title', ...args)
    }

    tr(...args: TagArgs<TableRowTag,TableRowTagAttrs>[]) : TableRowTag {
        return this.child(TableRowTag, 'tr', ...args)
    }

    track(...args: TagArgs<TrackTag,TrackTagAttrs>[]) : TrackTag {
        return this.child(TrackTag, 'track', ...args)
    }

    u(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'u', ...args)
    }

    ul(...args: TagArgs<UListTag,UListTagAttrs>[]) : UListTag {
        return this.child(UListTag, 'ul', ...args)
    }

    var(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'var', ...args)
    }

    wbr(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, 'wbr', ...args)
    }

//// End Tag Methods
}


// DO NOT EDIT THE CODE BELOW!
//// Begin Tag Classes

/** HTMLAnchorElement Attributes */
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

/** HTMLAnchorElement Tag */
export class AnchorTag extends HtmlTagBase<AnchorTagAttrs,HTMLAnchorElement> {}

/** HTMLAreaElement Attributes */
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

/** HTMLAreaElement Tag */
export class AreaTag extends HtmlTagBase<AreaTagAttrs,HTMLAreaElement> {}

/** HTMLBRElement Attributes */
export type BRTagAttrs = DefaultTagAttrs & {
}

/** HTMLBRElement Tag */
export class BRTag extends HtmlTagBase<BRTagAttrs,HTMLBRElement> {}

/** HTMLBaseElement Attributes */
export type BaseTagAttrs = DefaultTagAttrs & {
    href?: string
    target?: string
}

/** HTMLBaseElement Tag */
export class BaseTag extends HtmlTagBase<BaseTagAttrs,HTMLBaseElement> {}

/** HTMLBodyElement Attributes */
export type BodyTagAttrs = DefaultTagAttrs & {
}

/** HTMLBodyElement Tag */
export class BodyTag extends HtmlTagBase<BodyTagAttrs,HTMLBodyElement> {}

/** HTMLButtonElement Attributes */
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

/** HTMLButtonElement Tag */
export class ButtonTag extends HtmlTagBase<ButtonTagAttrs,HTMLButtonElement> {}

/** HTMLCanvasElement Attributes */
export type CanvasTagAttrs = DefaultTagAttrs & {
    height?: number
    width?: number
}

/** HTMLCanvasElement Tag */
export class CanvasTag extends HtmlTagBase<CanvasTagAttrs,HTMLCanvasElement> {}

/** HTMLDListElement Attributes */
export type DListTagAttrs = DefaultTagAttrs & {
}

/** HTMLDListElement Tag */
export class DListTag extends HtmlTagBase<DListTagAttrs,HTMLDListElement> {}

/** HTMLDataElement Attributes */
export type DataTagAttrs = DefaultTagAttrs & {
    value?: string
}

/** HTMLDataElement Tag */
export class DataTag extends HtmlTagBase<DataTagAttrs,HTMLDataElement> {}

/** HTMLDataListElement Attributes */
export type DataListTagAttrs = DefaultTagAttrs & {
}

/** HTMLDataListElement Tag */
export class DataListTag extends HtmlTagBase<DataListTagAttrs,HTMLDataListElement> {}

/** HTMLDetailsElement Attributes */
export type DetailsTagAttrs = DefaultTagAttrs & {
    open?: boolean
}

/** HTMLDetailsElement Tag */
export class DetailsTag extends HtmlTagBase<DetailsTagAttrs,HTMLDetailsElement> {}

/** HTMLDivElement Attributes */
export type DivTagAttrs = DefaultTagAttrs & {
}

/** HTMLDivElement Tag */
export class DivTag extends HtmlTagBase<DivTagAttrs,HTMLDivElement> {}

/** HTMLElement Attributes */
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

/** HTMLElement Tag */
export class DefaultTag extends HtmlTagBase<DefaultTagAttrs,HTMLElement> {}

/** HTMLEmbedElement Attributes */
export type EmbedTagAttrs = DefaultTagAttrs & {
    height?: string
    src?: string
    type?: string
    width?: string
}

/** HTMLEmbedElement Tag */
export class EmbedTag extends HtmlTagBase<EmbedTagAttrs,HTMLEmbedElement> {}

/** HTMLFieldSetElement Attributes */
export type FieldSetTagAttrs = DefaultTagAttrs & {
    disabled?: boolean
    name?: string
}

/** HTMLFieldSetElement Tag */
export class FieldSetTag extends HtmlTagBase<FieldSetTagAttrs,HTMLFieldSetElement> {}

/** HTMLFormElement Attributes */
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

/** HTMLFormElement Tag */
export class FormTag extends HtmlTagBase<FormTagAttrs,HTMLFormElement> {}

/** HTMLFrameSetElement Attributes */
export type FrameSetTagAttrs = DefaultTagAttrs & {
}

/** HTMLFrameSetElement Tag */
export class FrameSetTag extends HtmlTagBase<FrameSetTagAttrs,HTMLFrameSetElement> {}

/** HTMLHRElement Attributes */
export type HRTagAttrs = DefaultTagAttrs & {
}

/** HTMLHRElement Tag */
export class HRTag extends HtmlTagBase<HRTagAttrs,HTMLHRElement> {}

/** HTMLHeadElement Attributes */
export type HeadTagAttrs = DefaultTagAttrs & {
}

/** HTMLHeadElement Tag */
export class HeadTag extends HtmlTagBase<HeadTagAttrs,HTMLHeadElement> {}

/** HTMLHeadingElement Attributes */
export type HeadingTagAttrs = DefaultTagAttrs & {
}

/** HTMLHeadingElement Tag */
export class HeadingTag extends HtmlTagBase<HeadingTagAttrs,HTMLHeadingElement> {}

/** HTMLHtmlElement Attributes */
export type HtmlTagAttrs = DefaultTagAttrs & {
}

/** HTMLHtmlElement Tag */
export class HtmlTag extends HtmlTagBase<HtmlTagAttrs,HTMLHtmlElement> {}

/** HTMLIFrameElement Attributes */
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

/** HTMLIFrameElement Tag */
export class IFrameTag extends HtmlTagBase<IFrameTagAttrs,HTMLIFrameElement> {}

/** HTMLImageElement Attributes */
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

/** HTMLImageElement Tag */
export class ImageTag extends HtmlTagBase<ImageTagAttrs,HTMLImageElement> {}

/** HTMLInputElement Attributes */
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

/** HTMLInputElement Tag */
export class InputTag extends HtmlTagBase<InputTagAttrs,HTMLInputElement> {}

/** HTMLLIElement Attributes */
export type LITagAttrs = DefaultTagAttrs & {
    value?: number
}

/** HTMLLIElement Tag */
export class LITag extends HtmlTagBase<LITagAttrs,HTMLLIElement> {}

/** HTMLLabelElement Attributes */
export type LabelTagAttrs = DefaultTagAttrs & {
    htmlFor?: string
}

/** HTMLLabelElement Tag */
export class LabelTag extends HtmlTagBase<LabelTagAttrs,HTMLLabelElement> {}

/** HTMLLegendElement Attributes */
export type LegendTagAttrs = DefaultTagAttrs & {
}

/** HTMLLegendElement Tag */
export class LegendTag extends HtmlTagBase<LegendTagAttrs,HTMLLegendElement> {}

/** HTMLLinkElement Attributes */
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

/** HTMLLinkElement Tag */
export class LinkTag extends HtmlTagBase<LinkTagAttrs,HTMLLinkElement> {}

/** HTMLMapElement Attributes */
export type MapTagAttrs = DefaultTagAttrs & {
    name?: string
}

/** HTMLMapElement Tag */
export class MapTag extends HtmlTagBase<MapTagAttrs,HTMLMapElement> {}

/** HTMLMediaElement Attributes */
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

/** HTMLMediaElement Tag */
export class MediaTag extends HtmlTagBase<MediaTagAttrs,HTMLMediaElement> {}

/** HTMLMenuElement Attributes */
export type MenuTagAttrs = DefaultTagAttrs & {
}

/** HTMLMenuElement Tag */
export class MenuTag extends HtmlTagBase<MenuTagAttrs,HTMLMenuElement> {}

/** HTMLMetaElement Attributes */
export type MetaTagAttrs = DefaultTagAttrs & {
    content?: string
    httpEquiv?: string
    media?: string
    name?: string
}

/** HTMLMetaElement Tag */
export class MetaTag extends HtmlTagBase<MetaTagAttrs,HTMLMetaElement> {}

/** HTMLMeterElement Attributes */
export type MeterTagAttrs = DefaultTagAttrs & {
    high?: number
    low?: number
    max?: number
    min?: number
    optimum?: number
    value?: number
}

/** HTMLMeterElement Tag */
export class MeterTag extends HtmlTagBase<MeterTagAttrs,HTMLMeterElement> {}

/** HTMLModElement Attributes */
export type ModTagAttrs = DefaultTagAttrs & {
    cite?: string
    dateTime?: string
}

/** HTMLModElement Tag */
export class ModTag extends HtmlTagBase<ModTagAttrs,HTMLModElement> {}

/** HTMLOListElement Attributes */
export type OListTagAttrs = DefaultTagAttrs & {
    reversed?: boolean
    start?: number
    type?: string
}

/** HTMLOListElement Tag */
export class OListTag extends HtmlTagBase<OListTagAttrs,HTMLOListElement> {}

/** HTMLObjectElement Attributes */
export type ObjectTagAttrs = DefaultTagAttrs & {
    data?: string
    height?: string
    name?: string
    type?: string
    useMap?: string
    width?: string
}

/** HTMLObjectElement Tag */
export class ObjectTag extends HtmlTagBase<ObjectTagAttrs,HTMLObjectElement> {}

/** HTMLOptGroupElement Attributes */
export type OptGroupTagAttrs = DefaultTagAttrs & {
    disabled?: boolean
    label?: string
}

/** HTMLOptGroupElement Tag */
export class OptGroupTag extends HtmlTagBase<OptGroupTagAttrs,HTMLOptGroupElement> {}

/** HTMLOptionElement Attributes */
export type OptionTagAttrs = DefaultTagAttrs & {
    defaultSelected?: boolean
    disabled?: boolean
    label?: string
    selected?: boolean
    text?: string
    value?: string
}

/** HTMLOptionElement Tag */
export class OptionTag extends HtmlTagBase<OptionTagAttrs,HTMLOptionElement> {}

/** HTMLOutputElement Attributes */
export type OutputTagAttrs = DefaultTagAttrs & {
    defaultValue?: string
    name?: string
    value?: string
}

/** HTMLOutputElement Tag */
export class OutputTag extends HtmlTagBase<OutputTagAttrs,HTMLOutputElement> {}

/** HTMLParagraphElement Attributes */
export type ParagraphTagAttrs = DefaultTagAttrs & {
}

/** HTMLParagraphElement Tag */
export class ParagraphTag extends HtmlTagBase<ParagraphTagAttrs,HTMLParagraphElement> {}

/** HTMLParamElement Attributes */
export type ParamTagAttrs = DefaultTagAttrs & {
    name?: string
    value?: string
}

/** HTMLParamElement Tag */
export class ParamTag extends HtmlTagBase<ParamTagAttrs,HTMLParamElement> {}

/** HTMLPictureElement Attributes */
export type PictureTagAttrs = DefaultTagAttrs & {
}

/** HTMLPictureElement Tag */
export class PictureTag extends HtmlTagBase<PictureTagAttrs,HTMLPictureElement> {}

/** HTMLPreElement Attributes */
export type PreTagAttrs = DefaultTagAttrs & {
}

/** HTMLPreElement Tag */
export class PreTag extends HtmlTagBase<PreTagAttrs,HTMLPreElement> {}

/** HTMLProgressElement Attributes */
export type ProgressTagAttrs = DefaultTagAttrs & {
    max?: number
    value?: number
}

/** HTMLProgressElement Tag */
export class ProgressTag extends HtmlTagBase<ProgressTagAttrs,HTMLProgressElement> {}

/** HTMLQuoteElement Attributes */
export type QuoteTagAttrs = DefaultTagAttrs & {
    cite?: string
}

/** HTMLQuoteElement Tag */
export class QuoteTag extends HtmlTagBase<QuoteTagAttrs,HTMLQuoteElement> {}

/** HTMLScriptElement Attributes */
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

/** HTMLScriptElement Tag */
export class ScriptTag extends HtmlTagBase<ScriptTagAttrs,HTMLScriptElement> {}

/** HTMLSelectElement Attributes */
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

/** HTMLSelectElement Tag */
export class SelectTag extends HtmlTagBase<SelectTagAttrs,HTMLSelectElement> {}

/** HTMLSlotElement Attributes */
export type SlotTagAttrs = DefaultTagAttrs & {
    name?: string
}

/** HTMLSlotElement Tag */
export class SlotTag extends HtmlTagBase<SlotTagAttrs,HTMLSlotElement> {}

/** HTMLSourceElement Attributes */
export type SourceTagAttrs = DefaultTagAttrs & {
    height?: number
    media?: string
    sizes?: string
    src?: string
    srcset?: string
    type?: string
    width?: number
}

/** HTMLSourceElement Tag */
export class SourceTag extends HtmlTagBase<SourceTagAttrs,HTMLSourceElement> {}

/** HTMLSpanElement Attributes */
export type SpanTagAttrs = DefaultTagAttrs & {
}

/** HTMLSpanElement Tag */
export class SpanTag extends HtmlTagBase<SpanTagAttrs,HTMLSpanElement> {}

/** HTMLStyleElement Attributes */
export type StyleTagAttrs = DefaultTagAttrs & {
    media?: string
}

/** HTMLStyleElement Tag */
export class StyleTag extends HtmlTagBase<StyleTagAttrs,HTMLStyleElement> {}

/** HTMLTableCaptionElement Attributes */
export type TableCaptionTagAttrs = DefaultTagAttrs & {
}

/** HTMLTableCaptionElement Tag */
export class TableCaptionTag extends HtmlTagBase<TableCaptionTagAttrs,HTMLTableCaptionElement> {}

/** HTMLTableCellElement Attributes */
export type TableCellTagAttrs = DefaultTagAttrs & {
    abbr?: string
    colSpan?: number
    headers?: string
    rowSpan?: number
    scope?: string
}

/** HTMLTableCellElement Tag */
export class TableCellTag extends HtmlTagBase<TableCellTagAttrs,HTMLTableCellElement> {}

/** HTMLTableColElement Attributes */
export type TableColTagAttrs = DefaultTagAttrs & {
    span?: number
}

/** HTMLTableColElement Tag */
export class TableColTag extends HtmlTagBase<TableColTagAttrs,HTMLTableColElement> {}

/** HTMLTableElement Attributes */
export type TableTagAttrs = DefaultTagAttrs & {
    caption?: HTMLTableCaptionElement | null
    tFoot?: HTMLTableSectionElement | null
    tHead?: HTMLTableSectionElement | null
}

/** HTMLTableElement Tag */
export class TableTag extends HtmlTagBase<TableTagAttrs,HTMLTableElement> {}

/** HTMLTableRowElement Attributes */
export type TableRowTagAttrs = DefaultTagAttrs & {
}

/** HTMLTableRowElement Tag */
export class TableRowTag extends HtmlTagBase<TableRowTagAttrs,HTMLTableRowElement> {}

/** HTMLTableSectionElement Attributes */
export type TableSectionTagAttrs = DefaultTagAttrs & {
}

/** HTMLTableSectionElement Tag */
export class TableSectionTag extends HtmlTagBase<TableSectionTagAttrs,HTMLTableSectionElement> {}

/** HTMLTemplateElement Attributes */
export type TemplateTagAttrs = DefaultTagAttrs & {
}

/** HTMLTemplateElement Tag */
export class TemplateTag extends HtmlTagBase<TemplateTagAttrs,HTMLTemplateElement> {}

/** HTMLTextAreaElement Attributes */
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

/** HTMLTextAreaElement Tag */
export class TextAreaTag extends HtmlTagBase<TextAreaTagAttrs,HTMLTextAreaElement> {}

/** HTMLTimeElement Attributes */
export type TimeTagAttrs = DefaultTagAttrs & {
    dateTime?: string
}

/** HTMLTimeElement Tag */
export class TimeTag extends HtmlTagBase<TimeTagAttrs,HTMLTimeElement> {}

/** HTMLTitleElement Attributes */
export type TitleTagAttrs = DefaultTagAttrs & {
    text?: string
}

/** HTMLTitleElement Tag */
export class TitleTag extends HtmlTagBase<TitleTagAttrs,HTMLTitleElement> {}

/** HTMLTrackElement Attributes */
export type TrackTagAttrs = DefaultTagAttrs & {
    default?: boolean
    kind?: string
    label?: string
    src?: string
    srclang?: string
}

/** HTMLTrackElement Tag */
export class TrackTag extends HtmlTagBase<TrackTagAttrs,HTMLTrackElement> {}

/** HTMLUListElement Attributes */
export type UListTagAttrs = DefaultTagAttrs & {
}

/** HTMLUListElement Tag */
export class UListTag extends HtmlTagBase<UListTagAttrs,HTMLUListElement> {}

/** HTMLUnknownElement Attributes */
export type UnknownTagAttrs = DefaultTagAttrs & {
}

/** HTMLUnknownElement Tag */
export class UnknownTag extends HtmlTagBase<UnknownTagAttrs,HTMLUnknownElement> {}

//// End Tag Classes

//// Begin Tag Map

/** Map the names of HTML tags to their classes. */
export interface HtmlTagMap {
    "a": AnchorTag
    "abbr": DefaultTag
    "address": DefaultTag
    "area": AreaTag
    "article": DefaultTag
    "aside": DefaultTag
    "b": DefaultTag
    "base": BaseTag
    "bdi": DefaultTag
    "bdo": DefaultTag
    "blockquote": QuoteTag
    "body": BodyTag
    "br": BRTag
    "button": ButtonTag
    "canvas": CanvasTag
    "caption": TableCaptionTag
    "cite": DefaultTag
    "code": DefaultTag
    "col": TableColTag
    "colgroup": TableColTag
    "data": DataTag
    "datalist": DataListTag
    "dd": DefaultTag
    "del": ModTag
    "details": DetailsTag
    "dfn": DefaultTag
    "div": DivTag
    "dl": DListTag
    "dt": DefaultTag
    "em": DefaultTag
    "embed": EmbedTag
    "fieldset": FieldSetTag
    "figcaption": DefaultTag
    "figure": DefaultTag
    "footer": DefaultTag
    "form": FormTag
    "frameset": FrameSetTag
    "h1": HeadingTag
    "h2": HeadingTag
    "h3": HeadingTag
    "h4": HeadingTag
    "h5": HeadingTag
    "h6": HeadingTag
    "head": HeadTag
    "header": DefaultTag
    "hgroup": DefaultTag
    "hr": HRTag
    "html": HtmlTag
    "i": DefaultTag
    "iframe": IFrameTag
    "img": ImageTag
    "input": InputTag
    "ins": ModTag
    "kbd": DefaultTag
    "label": LabelTag
    "legend": LegendTag
    "li": LITag
    "link": LinkTag
    "main": DefaultTag
    "map": MapTag
    "mark": DefaultTag
    "menu": MenuTag
    "meta": MetaTag
    "meter": MeterTag
    "nav": DefaultTag
    "noscript": DefaultTag
    "object": ObjectTag
    "ol": OListTag
    "optgroup": OptGroupTag
    "option": OptionTag
    "output": OutputTag
    "p": ParagraphTag
    "param": ParamTag
    "picture": PictureTag
    "pre": PreTag
    "progress": ProgressTag
    "q": QuoteTag
    "rp": DefaultTag
    "rt": DefaultTag
    "ruby": DefaultTag
    "s": DefaultTag
    "samp": DefaultTag
    "script": ScriptTag
    "section": DefaultTag
    "select": SelectTag
    "slot": SlotTag
    "small": DefaultTag
    "source": SourceTag
    "span": SpanTag
    "strong": DefaultTag
    "style": StyleTag
    "sub": DefaultTag
    "summary": DefaultTag
    "sup": DefaultTag
    "table": TableTag
    "tbody": TableSectionTag
    "td": TableCellTag
    "template": TemplateTag
    "textarea": TextAreaTag
    "tfoot": TableSectionTag
    "th": TableCellTag
    "thead": TableSectionTag
    "time": TimeTag
    "title": TitleTag
    "tr": TableRowTag
    "track": TrackTag
    "u": DefaultTag
    "ul": UListTag
    "var": DefaultTag
    "wbr": DefaultTag
}


export type HtmlTagName = keyof HtmlTagMap

export const htmlTagMap: Record<HtmlTagName, {new (tag: HtmlTagName): HtmlTagMap[typeof tag]}> = {
    a: AnchorTag,
    abbr: DefaultTag,
    address: DefaultTag,
    area: AreaTag,
    article: DefaultTag,
    aside: DefaultTag,
    b: DefaultTag,
    base: BaseTag,
    bdi: DefaultTag,
    bdo: DefaultTag,
    blockquote: QuoteTag,
    body: BodyTag,
    br: BRTag,
    button: ButtonTag,
    canvas: CanvasTag,
    caption: TableCaptionTag,
    cite: DefaultTag,
    code: DefaultTag,
    col: TableColTag,
    colgroup: TableColTag,
    data: DataTag,
    datalist: DataListTag,
    dd: DefaultTag,
    del: ModTag,
    details: DetailsTag,
    dfn: DefaultTag,
    div: DivTag,
    dl: DListTag,
    dt: DefaultTag,
    em: DefaultTag,
    embed: EmbedTag,
    fieldset: FieldSetTag,
    figcaption: DefaultTag,
    figure: DefaultTag,
    footer: DefaultTag,
    form: FormTag,
    frameset: FrameSetTag,
    h1: HeadingTag,
    h2: HeadingTag,
    h3: HeadingTag,
    h4: HeadingTag,
    h5: HeadingTag,
    h6: HeadingTag,
    head: HeadTag,
    header: DefaultTag,
    hgroup: DefaultTag,
    hr: HRTag,
    html: HtmlTag,
    i: DefaultTag,
    iframe: IFrameTag,
    img: ImageTag,
    input: InputTag,
    ins: ModTag,
    kbd: DefaultTag,
    label: LabelTag,
    legend: LegendTag,
    li: LITag,
    link: LinkTag,
    main: DefaultTag,
    map: MapTag,
    mark: DefaultTag,
    menu: MenuTag,
    meta: MetaTag,
    meter: MeterTag,
    nav: DefaultTag,
    noscript: DefaultTag,
    object: ObjectTag,
    ol: OListTag,
    optgroup: OptGroupTag,
    option: OptionTag,
    output: OutputTag,
    p: ParagraphTag,
    param: ParamTag,
    picture: PictureTag,
    pre: PreTag,
    progress: ProgressTag,
    q: QuoteTag,
    rp: DefaultTag,
    rt: DefaultTag,
    ruby: DefaultTag,
    s: DefaultTag,
    samp: DefaultTag,
    script: ScriptTag,
    section: DefaultTag,
    select: SelectTag,
    slot: SlotTag,
    small: DefaultTag,
    source: SourceTag,
    span: SpanTag,
    strong: DefaultTag,
    style: StyleTag,
    sub: DefaultTag,
    summary: DefaultTag,
    sup: DefaultTag,
    table: TableTag,
    tbody: TableSectionTag,
    td: TableCellTag,
    template: TemplateTag,
    textarea: TextAreaTag,
    tfoot: TableSectionTag,
    th: TableCellTag,
    thead: TableSectionTag,
    time: TimeTag,
    title: TitleTag,
    tr: TableRowTag,
    track: TrackTag,
    u: DefaultTag,
    ul: UListTag,
    var: DefaultTag,
    wbr: DefaultTag,
}

//// End Tag Map
