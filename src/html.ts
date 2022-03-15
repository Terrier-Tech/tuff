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
export type HtmlParentTag = HtmlTagBase<HtmlBaseAttrs>


/**
 * Base class for all HTML tags, parameterized on their attribute types.
 */
export abstract class HtmlTagBase<AttrsType extends Attrs> extends Tag<AttrsType> {
    
    serializeAttribute(name: string, value: any): string {
        if (typeof value == 'object') {
            log.warn(`Don't know how to serialize value for key ${name}`, value)
        }
        return `${strings.ropeCase(name)}="${value.toString()}"`
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
        return this.child(AnchorTag, "a", ...args)
    }

    abbr(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "abbr", ...args)
    }

    address(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "address", ...args)
    }

    area(...args: TagArgs<AreaTag,AreaTagAttrs>[]) : AreaTag {
        return this.child(AreaTag, "area", ...args)
    }

    article(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "article", ...args)
    }

    aside(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "aside", ...args)
    }

    b(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "b", ...args)
    }

    base(...args: TagArgs<BaseTag,BaseTagAttrs>[]) : BaseTag {
        return this.child(BaseTag, "base", ...args)
    }

    bdi(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "bdi", ...args)
    }

    bdo(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "bdo", ...args)
    }

    blockquote(...args: TagArgs<QuoteTag,QuoteTagAttrs>[]) : QuoteTag {
        return this.child(QuoteTag, "blockquote", ...args)
    }

    body(...args: TagArgs<BodyTag,BodyTagAttrs>[]) : BodyTag {
        return this.child(BodyTag, "body", ...args)
    }

    br(...args: TagArgs<BRTag,BRTagAttrs>[]) : BRTag {
        return this.child(BRTag, "br", ...args)
    }

    button(...args: TagArgs<ButtonTag,ButtonTagAttrs>[]) : ButtonTag {
        return this.child(ButtonTag, "button", ...args)
    }

    canvas(...args: TagArgs<CanvasTag,CanvasTagAttrs>[]) : CanvasTag {
        return this.child(CanvasTag, "canvas", ...args)
    }

    caption(...args: TagArgs<TableCaptionTag,TableCaptionTagAttrs>[]) : TableCaptionTag {
        return this.child(TableCaptionTag, "caption", ...args)
    }

    cite(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "cite", ...args)
    }

    code(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "code", ...args)
    }

    col(...args: TagArgs<TableColTag,TableColTagAttrs>[]) : TableColTag {
        return this.child(TableColTag, "col", ...args)
    }

    colgroup(...args: TagArgs<TableColTag,TableColTagAttrs>[]) : TableColTag {
        return this.child(TableColTag, "colgroup", ...args)
    }

    dataTag(...args: TagArgs<DataTag,DataTagAttrs>[]) : DataTag {
        return this.child(DataTag, "data", ...args)
    }

    datalist(...args: TagArgs<DataListTag,DataListTagAttrs>[]) : DataListTag {
        return this.child(DataListTag, "datalist", ...args)
    }

    dd(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "dd", ...args)
    }

    del(...args: TagArgs<ModTag,ModTagAttrs>[]) : ModTag {
        return this.child(ModTag, "del", ...args)
    }

    details(...args: TagArgs<DetailsTag,DetailsTagAttrs>[]) : DetailsTag {
        return this.child(DetailsTag, "details", ...args)
    }

    dfn(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "dfn", ...args)
    }

    div(...args: TagArgs<DivTag,DivTagAttrs>[]) : DivTag {
        return this.child(DivTag, "div", ...args)
    }

    dl(...args: TagArgs<DListTag,DListTagAttrs>[]) : DListTag {
        return this.child(DListTag, "dl", ...args)
    }

    dt(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "dt", ...args)
    }

    em(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "em", ...args)
    }

    embed(...args: TagArgs<EmbedTag,EmbedTagAttrs>[]) : EmbedTag {
        return this.child(EmbedTag, "embed", ...args)
    }

    fieldset(...args: TagArgs<FieldSetTag,FieldSetTagAttrs>[]) : FieldSetTag {
        return this.child(FieldSetTag, "fieldset", ...args)
    }

    figcaption(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "figcaption", ...args)
    }

    figure(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "figure", ...args)
    }

    footer(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "footer", ...args)
    }

    form(...args: TagArgs<FormTag,FormTagAttrs>[]) : FormTag {
        return this.child(FormTag, "form", ...args)
    }

    frameset(...args: TagArgs<FrameSetTag,FrameSetTagAttrs>[]) : FrameSetTag {
        return this.child(FrameSetTag, "frameset", ...args)
    }

    h1(...args: TagArgs<HeadingTag,HeadingTagAttrs>[]) : HeadingTag {
        return this.child(HeadingTag, "h1", ...args)
    }

    h2(...args: TagArgs<HeadingTag,HeadingTagAttrs>[]) : HeadingTag {
        return this.child(HeadingTag, "h2", ...args)
    }

    h3(...args: TagArgs<HeadingTag,HeadingTagAttrs>[]) : HeadingTag {
        return this.child(HeadingTag, "h3", ...args)
    }

    h4(...args: TagArgs<HeadingTag,HeadingTagAttrs>[]) : HeadingTag {
        return this.child(HeadingTag, "h4", ...args)
    }

    h5(...args: TagArgs<HeadingTag,HeadingTagAttrs>[]) : HeadingTag {
        return this.child(HeadingTag, "h5", ...args)
    }

    h6(...args: TagArgs<HeadingTag,HeadingTagAttrs>[]) : HeadingTag {
        return this.child(HeadingTag, "h6", ...args)
    }

    head(...args: TagArgs<HeadTag,HeadTagAttrs>[]) : HeadTag {
        return this.child(HeadTag, "head", ...args)
    }

    header(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "header", ...args)
    }

    hgroup(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "hgroup", ...args)
    }

    hr(...args: TagArgs<HRTag,HRTagAttrs>[]) : HRTag {
        return this.child(HRTag, "hr", ...args)
    }

    html(...args: TagArgs<HtmlTag,HtmlTagAttrs>[]) : HtmlTag {
        return this.child(HtmlTag, "html", ...args)
    }

    i(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "i", ...args)
    }

    iframe(...args: TagArgs<IFrameTag,IFrameTagAttrs>[]) : IFrameTag {
        return this.child(IFrameTag, "iframe", ...args)
    }

    img(...args: TagArgs<ImageTag,ImageTagAttrs>[]) : ImageTag {
        return this.child(ImageTag, "img", ...args)
    }

    input(...args: TagArgs<InputTag,InputTagAttrs>[]) : InputTag {
        return this.child(InputTag, "input", ...args)
    }

    ins(...args: TagArgs<ModTag,ModTagAttrs>[]) : ModTag {
        return this.child(ModTag, "ins", ...args)
    }

    kbd(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "kbd", ...args)
    }

    label(...args: TagArgs<LabelTag,LabelTagAttrs>[]) : LabelTag {
        return this.child(LabelTag, "label", ...args)
    }

    legend(...args: TagArgs<LegendTag,LegendTagAttrs>[]) : LegendTag {
        return this.child(LegendTag, "legend", ...args)
    }

    li(...args: TagArgs<LITag,LITagAttrs>[]) : LITag {
        return this.child(LITag, "li", ...args)
    }

    link(...args: TagArgs<LinkTag,LinkTagAttrs>[]) : LinkTag {
        return this.child(LinkTag, "link", ...args)
    }

    main(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "main", ...args)
    }

    map(...args: TagArgs<MapTag,MapTagAttrs>[]) : MapTag {
        return this.child(MapTag, "map", ...args)
    }

    mark(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "mark", ...args)
    }

    menu(...args: TagArgs<MenuTag,MenuTagAttrs>[]) : MenuTag {
        return this.child(MenuTag, "menu", ...args)
    }

    meta(...args: TagArgs<MetaTag,MetaTagAttrs>[]) : MetaTag {
        return this.child(MetaTag, "meta", ...args)
    }

    meter(...args: TagArgs<MeterTag,MeterTagAttrs>[]) : MeterTag {
        return this.child(MeterTag, "meter", ...args)
    }

    nav(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "nav", ...args)
    }

    noscript(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "noscript", ...args)
    }

    object(...args: TagArgs<ObjectTag,ObjectTagAttrs>[]) : ObjectTag {
        return this.child(ObjectTag, "object", ...args)
    }

    ol(...args: TagArgs<OListTag,OListTagAttrs>[]) : OListTag {
        return this.child(OListTag, "ol", ...args)
    }

    optgroup(...args: TagArgs<OptGroupTag,OptGroupTagAttrs>[]) : OptGroupTag {
        return this.child(OptGroupTag, "optgroup", ...args)
    }

    option(...args: TagArgs<OptionTag,OptionTagAttrs>[]) : OptionTag {
        return this.child(OptionTag, "option", ...args)
    }

    output(...args: TagArgs<OutputTag,OutputTagAttrs>[]) : OutputTag {
        return this.child(OutputTag, "output", ...args)
    }

    p(...args: TagArgs<ParagraphTag,ParagraphTagAttrs>[]) : ParagraphTag {
        return this.child(ParagraphTag, "p", ...args)
    }

    param(...args: TagArgs<ParamTag,ParamTagAttrs>[]) : ParamTag {
        return this.child(ParamTag, "param", ...args)
    }

    picture(...args: TagArgs<PictureTag,PictureTagAttrs>[]) : PictureTag {
        return this.child(PictureTag, "picture", ...args)
    }

    pre(...args: TagArgs<PreTag,PreTagAttrs>[]) : PreTag {
        return this.child(PreTag, "pre", ...args)
    }

    progress(...args: TagArgs<ProgressTag,ProgressTagAttrs>[]) : ProgressTag {
        return this.child(ProgressTag, "progress", ...args)
    }

    q(...args: TagArgs<QuoteTag,QuoteTagAttrs>[]) : QuoteTag {
        return this.child(QuoteTag, "q", ...args)
    }

    rp(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "rp", ...args)
    }

    rt(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "rt", ...args)
    }

    ruby(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "ruby", ...args)
    }

    s(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "s", ...args)
    }

    samp(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "samp", ...args)
    }

    script(...args: TagArgs<ScriptTag,ScriptTagAttrs>[]) : ScriptTag {
        return this.child(ScriptTag, "script", ...args)
    }

    section(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "section", ...args)
    }

    select(...args: TagArgs<SelectTag,SelectTagAttrs>[]) : SelectTag {
        return this.child(SelectTag, "select", ...args)
    }

    slot(...args: TagArgs<SlotTag,SlotTagAttrs>[]) : SlotTag {
        return this.child(SlotTag, "slot", ...args)
    }

    small(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "small", ...args)
    }

    source(...args: TagArgs<SourceTag,SourceTagAttrs>[]) : SourceTag {
        return this.child(SourceTag, "source", ...args)
    }

    span(...args: TagArgs<SpanTag,SpanTagAttrs>[]) : SpanTag {
        return this.child(SpanTag, "span", ...args)
    }

    strong(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "strong", ...args)
    }

    style(...args: TagArgs<StyleTag,StyleTagAttrs>[]) : StyleTag {
        return this.child(StyleTag, "style", ...args)
    }

    sub(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "sub", ...args)
    }

    summary(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "summary", ...args)
    }

    sup(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "sup", ...args)
    }

    table(...args: TagArgs<TableTag,TableTagAttrs>[]) : TableTag {
        return this.child(TableTag, "table", ...args)
    }

    tbody(...args: TagArgs<TableSectionTag,TableSectionTagAttrs>[]) : TableSectionTag {
        return this.child(TableSectionTag, "tbody", ...args)
    }

    td(...args: TagArgs<TableCellTag,TableCellTagAttrs>[]) : TableCellTag {
        return this.child(TableCellTag, "td", ...args)
    }

    template(...args: TagArgs<TemplateTag,TemplateTagAttrs>[]) : TemplateTag {
        return this.child(TemplateTag, "template", ...args)
    }

    textarea(...args: TagArgs<TextAreaTag,TextAreaTagAttrs>[]) : TextAreaTag {
        return this.child(TextAreaTag, "textarea", ...args)
    }

    tfoot(...args: TagArgs<TableSectionTag,TableSectionTagAttrs>[]) : TableSectionTag {
        return this.child(TableSectionTag, "tfoot", ...args)
    }

    th(...args: TagArgs<TableCellTag,TableCellTagAttrs>[]) : TableCellTag {
        return this.child(TableCellTag, "th", ...args)
    }

    thead(...args: TagArgs<TableSectionTag,TableSectionTagAttrs>[]) : TableSectionTag {
        return this.child(TableSectionTag, "thead", ...args)
    }

    time(...args: TagArgs<TimeTag,TimeTagAttrs>[]) : TimeTag {
        return this.child(TimeTag, "time", ...args)
    }

    title(...args: TagArgs<TitleTag,TitleTagAttrs>[]) : TitleTag {
        return this.child(TitleTag, "title", ...args)
    }

    tr(...args: TagArgs<TableRowTag,TableRowTagAttrs>[]) : TableRowTag {
        return this.child(TableRowTag, "tr", ...args)
    }

    track(...args: TagArgs<TrackTag,TrackTagAttrs>[]) : TrackTag {
        return this.child(TrackTag, "track", ...args)
    }

    u(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "u", ...args)
    }

    ul(...args: TagArgs<UListTag,UListTagAttrs>[]) : UListTag {
        return this.child(UListTag, "ul", ...args)
    }

    var(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "var", ...args)
    }

    wbr(...args: TagArgs<DefaultTag,DefaultTagAttrs>[]) : DefaultTag {
        return this.child(DefaultTag, "wbr", ...args)
    }

//// End Tag Methods
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

export class AnchorTag extends HtmlTagBase<AnchorTagAttrs> {}

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

export class AreaTag extends HtmlTagBase<AreaTagAttrs> {}

export type BRTagAttrs = DefaultTagAttrs & {
}

export class BRTag extends HtmlTagBase<BRTagAttrs> {}

export type BaseTagAttrs = DefaultTagAttrs & {
    href?: string
    target?: string
}

export class BaseTag extends HtmlTagBase<BaseTagAttrs> {}

export type BodyTagAttrs = DefaultTagAttrs & {
}

export class BodyTag extends HtmlTagBase<BodyTagAttrs> {}

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

export class ButtonTag extends HtmlTagBase<ButtonTagAttrs> {}

export type CanvasTagAttrs = DefaultTagAttrs & {
    height?: number
    width?: number
}

export class CanvasTag extends HtmlTagBase<CanvasTagAttrs> {}

export type DListTagAttrs = DefaultTagAttrs & {
}

export class DListTag extends HtmlTagBase<DListTagAttrs> {}

export type DataTagAttrs = DefaultTagAttrs & {
    value?: string
}

export class DataTag extends HtmlTagBase<DataTagAttrs> {}

export type DataListTagAttrs = DefaultTagAttrs & {
}

export class DataListTag extends HtmlTagBase<DataListTagAttrs> {}

export type DetailsTagAttrs = DefaultTagAttrs & {
    open?: boolean
}

export class DetailsTag extends HtmlTagBase<DetailsTagAttrs> {}

export type DivTagAttrs = DefaultTagAttrs & {
}

export class DivTag extends HtmlTagBase<DivTagAttrs> {}

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

export class DefaultTag extends HtmlTagBase<DefaultTagAttrs> {}

export type EmbedTagAttrs = DefaultTagAttrs & {
    height?: string
    src?: string
    type?: string
    width?: string
}

export class EmbedTag extends HtmlTagBase<EmbedTagAttrs> {}

export type FieldSetTagAttrs = DefaultTagAttrs & {
    disabled?: boolean
    name?: string
}

export class FieldSetTag extends HtmlTagBase<FieldSetTagAttrs> {}

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

export class FormTag extends HtmlTagBase<FormTagAttrs> {}

export type FrameSetTagAttrs = DefaultTagAttrs & {
}

export class FrameSetTag extends HtmlTagBase<FrameSetTagAttrs> {}

export type HRTagAttrs = DefaultTagAttrs & {
}

export class HRTag extends HtmlTagBase<HRTagAttrs> {}

export type HeadTagAttrs = DefaultTagAttrs & {
}

export class HeadTag extends HtmlTagBase<HeadTagAttrs> {}

export type HeadingTagAttrs = DefaultTagAttrs & {
}

export class HeadingTag extends HtmlTagBase<HeadingTagAttrs> {}

export type HtmlTagAttrs = DefaultTagAttrs & {
}

export class HtmlTag extends HtmlTagBase<HtmlTagAttrs> {}

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

export class IFrameTag extends HtmlTagBase<IFrameTagAttrs> {}

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

export class ImageTag extends HtmlTagBase<ImageTagAttrs> {}

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

export class InputTag extends HtmlTagBase<InputTagAttrs> {}

export type LITagAttrs = DefaultTagAttrs & {
    value?: number
}

export class LITag extends HtmlTagBase<LITagAttrs> {}

export type LabelTagAttrs = DefaultTagAttrs & {
    htmlFor?: string
}

export class LabelTag extends HtmlTagBase<LabelTagAttrs> {}

export type LegendTagAttrs = DefaultTagAttrs & {
}

export class LegendTag extends HtmlTagBase<LegendTagAttrs> {}

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

export class LinkTag extends HtmlTagBase<LinkTagAttrs> {}

export type MapTagAttrs = DefaultTagAttrs & {
    name?: string
}

export class MapTag extends HtmlTagBase<MapTagAttrs> {}

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

export class MediaTag extends HtmlTagBase<MediaTagAttrs> {}

export type MenuTagAttrs = DefaultTagAttrs & {
}

export class MenuTag extends HtmlTagBase<MenuTagAttrs> {}

export type MetaTagAttrs = DefaultTagAttrs & {
    content?: string
    httpEquiv?: string
    name?: string
}

export class MetaTag extends HtmlTagBase<MetaTagAttrs> {}

export type MeterTagAttrs = DefaultTagAttrs & {
    high?: number
    low?: number
    max?: number
    min?: number
    optimum?: number
    value?: number
}

export class MeterTag extends HtmlTagBase<MeterTagAttrs> {}

export type ModTagAttrs = DefaultTagAttrs & {
    cite?: string
    dateTime?: string
}

export class ModTag extends HtmlTagBase<ModTagAttrs> {}

export type OListTagAttrs = DefaultTagAttrs & {
    reversed?: boolean
    start?: number
    type?: string
}

export class OListTag extends HtmlTagBase<OListTagAttrs> {}

export type ObjectTagAttrs = DefaultTagAttrs & {
    data?: string
    height?: string
    name?: string
    type?: string
    useMap?: string
    width?: string
}

export class ObjectTag extends HtmlTagBase<ObjectTagAttrs> {}

export type OptGroupTagAttrs = DefaultTagAttrs & {
    disabled?: boolean
    label?: string
}

export class OptGroupTag extends HtmlTagBase<OptGroupTagAttrs> {}

export type OptionTagAttrs = DefaultTagAttrs & {
    defaultSelected?: boolean
    disabled?: boolean
    label?: string
    selected?: boolean
    text?: string
    value?: string
}

export class OptionTag extends HtmlTagBase<OptionTagAttrs> {}

export type OutputTagAttrs = DefaultTagAttrs & {
    defaultValue?: string
    name?: string
    value?: string
}

export class OutputTag extends HtmlTagBase<OutputTagAttrs> {}

export type ParagraphTagAttrs = DefaultTagAttrs & {
}

export class ParagraphTag extends HtmlTagBase<ParagraphTagAttrs> {}

export type ParamTagAttrs = DefaultTagAttrs & {
    name?: string
    value?: string
}

export class ParamTag extends HtmlTagBase<ParamTagAttrs> {}

export type PictureTagAttrs = DefaultTagAttrs & {
}

export class PictureTag extends HtmlTagBase<PictureTagAttrs> {}

export type PreTagAttrs = DefaultTagAttrs & {
}

export class PreTag extends HtmlTagBase<PreTagAttrs> {}

export type ProgressTagAttrs = DefaultTagAttrs & {
    max?: number
    value?: number
}

export class ProgressTag extends HtmlTagBase<ProgressTagAttrs> {}

export type QuoteTagAttrs = DefaultTagAttrs & {
    cite?: string
}

export class QuoteTag extends HtmlTagBase<QuoteTagAttrs> {}

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

export class ScriptTag extends HtmlTagBase<ScriptTagAttrs> {}

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

export class SelectTag extends HtmlTagBase<SelectTagAttrs> {}

export type SlotTagAttrs = DefaultTagAttrs & {
    name?: string
}

export class SlotTag extends HtmlTagBase<SlotTagAttrs> {}

export type SourceTagAttrs = DefaultTagAttrs & {
    media?: string
    sizes?: string
    src?: string
    srcset?: string
    type?: string
}

export class SourceTag extends HtmlTagBase<SourceTagAttrs> {}

export type SpanTagAttrs = DefaultTagAttrs & {
}

export class SpanTag extends HtmlTagBase<SpanTagAttrs> {}

export type StyleTagAttrs = DefaultTagAttrs & {
    media?: string
}

export class StyleTag extends HtmlTagBase<StyleTagAttrs> {}

export type TableCaptionTagAttrs = DefaultTagAttrs & {
}

export class TableCaptionTag extends HtmlTagBase<TableCaptionTagAttrs> {}

export type TableCellTagAttrs = DefaultTagAttrs & {
    abbr?: string
    colSpan?: number
    headers?: string
    rowSpan?: number
    scope?: string
}

export class TableCellTag extends HtmlTagBase<TableCellTagAttrs> {}

export type TableColTagAttrs = DefaultTagAttrs & {
    span?: number
}

export class TableColTag extends HtmlTagBase<TableColTagAttrs> {}

export type TableTagAttrs = DefaultTagAttrs & {
    caption?: HTMLTableCaptionElement | null
    tFoot?: HTMLTableSectionElement | null
    tHead?: HTMLTableSectionElement | null
}

export class TableTag extends HtmlTagBase<TableTagAttrs> {}

export type TableRowTagAttrs = DefaultTagAttrs & {
}

export class TableRowTag extends HtmlTagBase<TableRowTagAttrs> {}

export type TableSectionTagAttrs = DefaultTagAttrs & {
}

export class TableSectionTag extends HtmlTagBase<TableSectionTagAttrs> {}

export type TemplateTagAttrs = DefaultTagAttrs & {
}

export class TemplateTag extends HtmlTagBase<TemplateTagAttrs> {}

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

export class TextAreaTag extends HtmlTagBase<TextAreaTagAttrs> {}

export type TimeTagAttrs = DefaultTagAttrs & {
    dateTime?: string
}

export class TimeTag extends HtmlTagBase<TimeTagAttrs> {}

export type TitleTagAttrs = DefaultTagAttrs & {
    text?: string
}

export class TitleTag extends HtmlTagBase<TitleTagAttrs> {}

export type TrackTagAttrs = DefaultTagAttrs & {
    default?: boolean
    kind?: string
    label?: string
    src?: string
    srclang?: string
}

export class TrackTag extends HtmlTagBase<TrackTagAttrs> {}

export type UListTagAttrs = DefaultTagAttrs & {
}

export class UListTag extends HtmlTagBase<UListTagAttrs> {}

export type UnknownTagAttrs = DefaultTagAttrs & {
}

export class UnknownTag extends HtmlTagBase<UnknownTagAttrs> {}

//// End Tag Classes