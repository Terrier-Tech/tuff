import { Attrs, IRect, Tag, TagArgs } from './tags'
import * as strings from './strings'
import {Logger} from './logging'

const log = new Logger('SVG')

/**
 * Adds SVG presentation attributes to the regular tag attributes.
 * These aren't in the types since you can't directly assign them to SVG elements.
 */
export interface SvgBaseAttrs extends Attrs {
    alignmentBaseline?: 'auto'|'baseline'|'before-edge'|'text-before-edge'|'middle'|'central'|'after-edge'|'text-after-edge'|'ideographic'|'alphabetic'|'hanging'|'mathematical'|'inherit'
    baselineShift?: string
    clip?: string
    clipPath?: string
    clipRule?: 'nonezero'|'evenodd'|'inherit'
    color?: string // used for gradient stops
    colorInterpolation?: 'auto'|'sRGB'|'linearRGB'|'inherit'
    colorInterpolationFilters?: 'auto'|'sRGB'|'linearRGB'|'inherit'
    colorProfile?: string
    colorRendering?: 'auto'|'optimizeSpeed'|'optimizeQuality'|'inherit'
    cursor?: string
    d?: string
    direction?: 'ltr'|'rtl'|'inherit'
    display?: string
    dominantBaseline?: 'auto'|'text-bottom'|'alphabetic'|'ideographic'|'middle'|'central'|'mathematical'|'hanging'|'text-top'
    fill?: string
    fillOpacity?: number
    fillRule?: 'nonzero'|'evenodd'
    filter?: string
    floodColor?: string
    floodOpacity?: number
    href?: string
    imageRendering?: 'auto'|'optimizeQuality'|'optimizeSpeed'
    letterSpacing?: string
    markerEnd?: string
    markerMid?: string
    markerStart?: string
    mask?: string
    opacity?: number
    shapeRendering?: 'auto'|'optimizeSpeed'|'crispEdges'|'geometricPrecision'|'inherit'
    stopColor?: string
    stopOpacity?: number
    stroke?: string
    strokeDasharray?: string
    strokeDashoffset?: number
    strokeLinecap?: 'butt'|'round'|'square'
    strokeLinejoin?: 'arcs'|'bevel'|'miter'|'miter-clip'|'round'
    strokeMiterlimit?: number
    strokeOpacity?: number
    strokeWidth?: number
    textAnchor?: 'start'|'middle'|'end'|'inherit'
    textDecoration?: 'none'|'underline'|'overline'|'line-through'|'blink'|'inherit'
    textRendering?: 'auto'|'optimizeSpeed'|'optimizeLegibility'|'geometricPrecision'|'inherit'
    transform?: string
    vectorOffset?: string
    visibility?: 'visible'|'hidden'|'collapse'|'inherit'
    writingMode?: 'lr-tb'|'rl-tb'|'tb-rl'|'lr'|'rl'|'tb'|'inherit'
}

/**
 * SVG presentaion attributes are rope-case but all others are camelCase.
 * I can't think of a better way to handle this. 
 */
const ropeCaseAttributes: Record<string, boolean> = {
    alignmentBaseline: true,
    baselineShift: true,
    clipPath: true,
    clipRule: true,
    colorInterpolation: true,
    colorInterpolationFilters: true,
    colorProfile: true,
    colorRendering: true,
    dominantBaseline: true,
    fillOpacity: true,
    fillRule: true,
    floodColor: true,
    floodOpacity: true,
    imageRendering: true,
    letterSpacing: true,
    markerEnd: true,
    markerMid: true,
    markerStart: true,
    shapeRendering: true,
    stopColor: true,
    stopOpacity: true,
    strokeDasharray: true,
    strokeLinecap: true,
    strokeLinejoin: true,
    strokeMiterlimit: true,
    strokeOpacity: true,
    strokeWidth: true,
    textAnchor: true,
    textDecoration: true,
    textRendering: true,
    vectorOffset: true,
    writingMode: true
}

/**
 * General SVG tag type with no specific attributes.
 */
export type SvgParentTag = SvgTagBase<SvgBaseAttrs,any>

/**
 * Base class for all SVG tags, parameterized on their attribute types.
 */
export abstract class SvgTagBase<AttrsType extends Attrs,ElementType extends Element> extends Tag<AttrsType,ElementType> {

    serializeAttribute(name: string, value: any): string {
        if (typeof value == 'object') {
            if (name == 'viewBox') {
                return `viewBox="${value.x||0} ${value.y||0} ${value.width||0} ${value.height||0}"`
            }
            else {
                log.warn(`Don't know how to serialize value for key ${name}`, value)
            }
        }
        if (ropeCaseAttributes[name]) {
            return `${strings.ropeCase(name)}="${value}"`
        }
        else {
            return `${name}="${value}"`
        }
    }

    //// Begin Tag Methods

    a(...args: TagArgs<ATag,ATagAttrs>[]) : ATag {
        return this.child(ATag, ...args)
    }

    circle(...args: TagArgs<CircleTag,CircleTagAttrs>[]) : CircleTag {
        return this.child(CircleTag, ...args)
    }

    clipPath(...args: TagArgs<ClipPathTag,ClipPathTagAttrs>[]) : ClipPathTag {
        return this.child(ClipPathTag, ...args)
    }

    defs(...args: TagArgs<DefsTag,DefsTagAttrs>[]) : DefsTag {
        return this.child(DefsTag, ...args)
    }

    desc(...args: TagArgs<DescTag,DescTagAttrs>[]) : DescTag {
        return this.child(DescTag, ...args)
    }

    ellipse(...args: TagArgs<EllipseTag,EllipseTagAttrs>[]) : EllipseTag {
        return this.child(EllipseTag, ...args)
    }

    feBlend(...args: TagArgs<FEBlendTag,FEBlendTagAttrs>[]) : FEBlendTag {
        return this.child(FEBlendTag, ...args)
    }

    feColorMatrix(...args: TagArgs<FEColorMatrixTag,FEColorMatrixTagAttrs>[]) : FEColorMatrixTag {
        return this.child(FEColorMatrixTag, ...args)
    }

    feComponentTransfer(...args: TagArgs<FEComponentTransferTag,FEComponentTransferTagAttrs>[]) : FEComponentTransferTag {
        return this.child(FEComponentTransferTag, ...args)
    }

    feComposite(...args: TagArgs<FECompositeTag,FECompositeTagAttrs>[]) : FECompositeTag {
        return this.child(FECompositeTag, ...args)
    }

    feConvolveMatrix(...args: TagArgs<FEConvolveMatrixTag,FEConvolveMatrixTagAttrs>[]) : FEConvolveMatrixTag {
        return this.child(FEConvolveMatrixTag, ...args)
    }

    feDiffuseLighting(...args: TagArgs<FEDiffuseLightingTag,FEDiffuseLightingTagAttrs>[]) : FEDiffuseLightingTag {
        return this.child(FEDiffuseLightingTag, ...args)
    }

    feDisplacementMap(...args: TagArgs<FEDisplacementMapTag,FEDisplacementMapTagAttrs>[]) : FEDisplacementMapTag {
        return this.child(FEDisplacementMapTag, ...args)
    }

    feDistantLight(...args: TagArgs<FEDistantLightTag,FEDistantLightTagAttrs>[]) : FEDistantLightTag {
        return this.child(FEDistantLightTag, ...args)
    }

    feDropShadow(...args: TagArgs<FEDropShadowTag,FEDropShadowTagAttrs>[]) : FEDropShadowTag {
        return this.child(FEDropShadowTag, ...args)
    }

    feFlood(...args: TagArgs<FEFloodTag,FEFloodTagAttrs>[]) : FEFloodTag {
        return this.child(FEFloodTag, ...args)
    }

    feGaussianBlur(...args: TagArgs<FEGaussianBlurTag,FEGaussianBlurTagAttrs>[]) : FEGaussianBlurTag {
        return this.child(FEGaussianBlurTag, ...args)
    }

    feImage(...args: TagArgs<FEImageTag,FEImageTagAttrs>[]) : FEImageTag {
        return this.child(FEImageTag, ...args)
    }

    feMerge(...args: TagArgs<FEMergeTag,FEMergeTagAttrs>[]) : FEMergeTag {
        return this.child(FEMergeTag, ...args)
    }

    feMergeNode(...args: TagArgs<FEMergeNodeTag,FEMergeNodeTagAttrs>[]) : FEMergeNodeTag {
        return this.child(FEMergeNodeTag, ...args)
    }

    feMorphology(...args: TagArgs<FEMorphologyTag,FEMorphologyTagAttrs>[]) : FEMorphologyTag {
        return this.child(FEMorphologyTag, ...args)
    }

    feOffset(...args: TagArgs<FEOffsetTag,FEOffsetTagAttrs>[]) : FEOffsetTag {
        return this.child(FEOffsetTag, ...args)
    }

    fePointLight(...args: TagArgs<FEPointLightTag,FEPointLightTagAttrs>[]) : FEPointLightTag {
        return this.child(FEPointLightTag, ...args)
    }

    feSpecularLighting(...args: TagArgs<FESpecularLightingTag,FESpecularLightingTagAttrs>[]) : FESpecularLightingTag {
        return this.child(FESpecularLightingTag, ...args)
    }

    feSpotLight(...args: TagArgs<FESpotLightTag,FESpotLightTagAttrs>[]) : FESpotLightTag {
        return this.child(FESpotLightTag, ...args)
    }

    feTile(...args: TagArgs<FETileTag,FETileTagAttrs>[]) : FETileTag {
        return this.child(FETileTag, ...args)
    }

    feTurbulence(...args: TagArgs<FETurbulenceTag,FETurbulenceTagAttrs>[]) : FETurbulenceTag {
        return this.child(FETurbulenceTag, ...args)
    }

    filter(...args: TagArgs<FilterTag,FilterTagAttrs>[]) : FilterTag {
        return this.child(FilterTag, ...args)
    }

    foreignObject(...args: TagArgs<ForeignObjectTag,ForeignObjectTagAttrs>[]) : ForeignObjectTag {
        return this.child(ForeignObjectTag, ...args)
    }

    g(...args: TagArgs<GTag,GTagAttrs>[]) : GTag {
        return this.child(GTag, ...args)
    }

    image(...args: TagArgs<ImageTag,ImageTagAttrs>[]) : ImageTag {
        return this.child(ImageTag, ...args)
    }

    line(...args: TagArgs<LineTag,LineTagAttrs>[]) : LineTag {
        return this.child(LineTag, ...args)
    }

    linearGradient(...args: TagArgs<LinearGradientTag,LinearGradientTagAttrs>[]) : LinearGradientTag {
        return this.child(LinearGradientTag, ...args)
    }

    marker(...args: TagArgs<MarkerTag,MarkerTagAttrs>[]) : MarkerTag {
        return this.child(MarkerTag, ...args)
    }

    mask(...args: TagArgs<MaskTag,MaskTagAttrs>[]) : MaskTag {
        return this.child(MaskTag, ...args)
    }

    metadata(...args: TagArgs<MetadataTag,MetadataTagAttrs>[]) : MetadataTag {
        return this.child(MetadataTag, ...args)
    }

    mpath(...args: TagArgs<MPathTag,MPathTagAttrs>[]) : MPathTag {
        return this.child(MPathTag, ...args)
    }

    path(...args: TagArgs<PathTag,PathTagAttrs>[]) : PathTag {
        return this.child(PathTag, ...args)
    }

    pattern(...args: TagArgs<PatternTag,PatternTagAttrs>[]) : PatternTag {
        return this.child(PatternTag, ...args)
    }

    polygon(...args: TagArgs<PolygonTag,PolygonTagAttrs>[]) : PolygonTag {
        return this.child(PolygonTag, ...args)
    }

    polyline(...args: TagArgs<PolylineTag,PolylineTagAttrs>[]) : PolylineTag {
        return this.child(PolylineTag, ...args)
    }

    radialGradient(...args: TagArgs<RadialGradientTag,RadialGradientTagAttrs>[]) : RadialGradientTag {
        return this.child(RadialGradientTag, ...args)
    }

    rect(...args: TagArgs<RectTag,RectTagAttrs>[]) : RectTag {
        return this.child(RectTag, ...args)
    }

    script(...args: TagArgs<ScriptTag,ScriptTagAttrs>[]) : ScriptTag {
        return this.child(ScriptTag, ...args)
    }

    stop(...args: TagArgs<StopTag,StopTagAttrs>[]) : StopTag {
        return this.child(StopTag, ...args)
    }

    style(...args: TagArgs<StyleTag,StyleTagAttrs>[]) : StyleTag {
        return this.child(StyleTag, ...args)
    }

    svg(...args: TagArgs<SVGTag,SVGTagAttrs>[]) : SVGTag {
        return this.child(SVGTag, ...args)
    }

    switch(...args: TagArgs<SwitchTag,SwitchTagAttrs>[]) : SwitchTag {
        return this.child(SwitchTag, ...args)
    }

    symbol(...args: TagArgs<SymbolTag,SymbolTagAttrs>[]) : SymbolTag {
        return this.child(SymbolTag, ...args)
    }

    title(...args: TagArgs<TitleTag,TitleTagAttrs>[]) : TitleTag {
        return this.child(TitleTag, ...args)
    }

    use(...args: TagArgs<UseTag,UseTagAttrs>[]) : UseTag {
        return this.child(UseTag, ...args)
    }

    view(...args: TagArgs<ViewTag,ViewTagAttrs>[]) : ViewTag {
        return this.child(ViewTag, ...args)
    }

//// End Tag Methods

}


// DO NOT EDIT THE CODE BELOW!
//// Begin Tag Classes

export type ATagAttrs = GraphicsTagAttrs & {
    rel?: string
    relList?: DOMTokenList
    target?: string
}

export class ATag extends SvgTagBase<ATagAttrs,SVGAElement> {
    constructor() { super("a") }
}

export type AnimationTagAttrs = DefaultTagAttrs & {
    targetElement?: SVGElement | null
}

export class AnimationTag extends SvgTagBase<AnimationTagAttrs,SVGAnimationElement> {
    constructor() { super("") }
}

export type CircleTagAttrs = GeometryTagAttrs & {
    cx?: number
    cy?: number
    r?: number
}

export class CircleTag extends SvgTagBase<CircleTagAttrs,SVGCircleElement> {
    constructor() { super("circle") }
}

export type ClipPathTagAttrs = DefaultTagAttrs & {
    clipPathUnits?: string|number
    transform?: string
}

export class ClipPathTag extends SvgTagBase<ClipPathTagAttrs,SVGClipPathElement> {
    constructor() { super("clipPath") }
}

export type ComponentTransferFunctionTagAttrs = DefaultTagAttrs & {
    amplitude?: number
    exponent?: number
    intercept?: number
    offset?: number
    slope?: number
    tableValues?: Array<number>
    type?: string|number
    SVG_FECOMPONENTTRANSFER_TYPE_DISCRETE?: number
    SVG_FECOMPONENTTRANSFER_TYPE_GAMMA?: number
    SVG_FECOMPONENTTRANSFER_TYPE_IDENTITY?: number
    SVG_FECOMPONENTTRANSFER_TYPE_LINEAR?: number
    SVG_FECOMPONENTTRANSFER_TYPE_TABLE?: number
    SVG_FECOMPONENTTRANSFER_TYPE_UNKNOWN?: number
}

export class ComponentTransferFunctionTag extends SvgTagBase<ComponentTransferFunctionTagAttrs,SVGComponentTransferFunctionElement> {
    constructor() { super("") }
}

export type DefsTagAttrs = GraphicsTagAttrs & {
}

export class DefsTag extends SvgTagBase<DefsTagAttrs,SVGDefsElement> {
    constructor() { super("defs") }
}

export type DescTagAttrs = DefaultTagAttrs & {
}

export class DescTag extends SvgTagBase<DescTagAttrs,SVGDescElement> {
    constructor() { super("desc") }
}

export type DefaultTagAttrs = SvgBaseAttrs & {
    ownerSVGElement?: SVGSVGElement | null
    viewportElement?: SVGElement | null
}

export class DefaultTag extends SvgTagBase<DefaultTagAttrs,SVGElement> {
    constructor() { super("") }
}

export type EllipseTagAttrs = GeometryTagAttrs & {
    cx?: number
    cy?: number
    rx?: number
    ry?: number
}

export class EllipseTag extends SvgTagBase<EllipseTagAttrs,SVGEllipseElement> {
    constructor() { super("ellipse") }
}

export type FEBlendTagAttrs = DefaultTagAttrs & {
    in1?: string
    in2?: string
    mode?: string|number
    SVG_FEBLEND_MODE_COLOR?: number
    SVG_FEBLEND_MODE_COLOR_BURN?: number
    SVG_FEBLEND_MODE_COLOR_DODGE?: number
    SVG_FEBLEND_MODE_DARKEN?: number
    SVG_FEBLEND_MODE_DIFFERENCE?: number
    SVG_FEBLEND_MODE_EXCLUSION?: number
    SVG_FEBLEND_MODE_HARD_LIGHT?: number
    SVG_FEBLEND_MODE_HUE?: number
    SVG_FEBLEND_MODE_LIGHTEN?: number
    SVG_FEBLEND_MODE_LUMINOSITY?: number
    SVG_FEBLEND_MODE_MULTIPLY?: number
    SVG_FEBLEND_MODE_NORMAL?: number
    SVG_FEBLEND_MODE_OVERLAY?: number
    SVG_FEBLEND_MODE_SATURATION?: number
    SVG_FEBLEND_MODE_SCREEN?: number
    SVG_FEBLEND_MODE_SOFT_LIGHT?: number
    SVG_FEBLEND_MODE_UNKNOWN?: number
}

export class FEBlendTag extends SvgTagBase<FEBlendTagAttrs,SVGFEBlendElement> {
    constructor() { super("feBlend") }
}

export type FEColorMatrixTagAttrs = DefaultTagAttrs & {
    in1?: string
    type?: string|number
    values?: Array<number>
    SVG_FECOLORMATRIX_TYPE_HUEROTATE?: number
    SVG_FECOLORMATRIX_TYPE_LUMINANCETOALPHA?: number
    SVG_FECOLORMATRIX_TYPE_MATRIX?: number
    SVG_FECOLORMATRIX_TYPE_SATURATE?: number
    SVG_FECOLORMATRIX_TYPE_UNKNOWN?: number
}

export class FEColorMatrixTag extends SvgTagBase<FEColorMatrixTagAttrs,SVGFEColorMatrixElement> {
    constructor() { super("feColorMatrix") }
}

export type FEComponentTransferTagAttrs = DefaultTagAttrs & {
    in1?: string
}

export class FEComponentTransferTag extends SvgTagBase<FEComponentTransferTagAttrs,SVGFEComponentTransferElement> {
    constructor() { super("feComponentTransfer") }
}

export type FECompositeTagAttrs = DefaultTagAttrs & {
    in1?: string
    in2?: string
    k1?: number
    k2?: number
    k3?: number
    k4?: number
    operator?: string|number
    SVG_FECOMPOSITE_OPERATOR_ARITHMETIC?: number
    SVG_FECOMPOSITE_OPERATOR_ATOP?: number
    SVG_FECOMPOSITE_OPERATOR_IN?: number
    SVG_FECOMPOSITE_OPERATOR_OUT?: number
    SVG_FECOMPOSITE_OPERATOR_OVER?: number
    SVG_FECOMPOSITE_OPERATOR_UNKNOWN?: number
    SVG_FECOMPOSITE_OPERATOR_XOR?: number
}

export class FECompositeTag extends SvgTagBase<FECompositeTagAttrs,SVGFECompositeElement> {
    constructor() { super("feComposite") }
}

export type FEConvolveMatrixTagAttrs = DefaultTagAttrs & {
    bias?: number
    divisor?: number
    edgeMode?: string|number
    in1?: string
    kernelMatrix?: Array<number>
    kernelUnitLengthX?: number
    kernelUnitLengthY?: number
    orderX?: number
    orderY?: number
    preserveAlpha?: boolean
    targetX?: number
    targetY?: number
    SVG_EDGEMODE_DUPLICATE?: number
    SVG_EDGEMODE_NONE?: number
    SVG_EDGEMODE_UNKNOWN?: number
    SVG_EDGEMODE_WRAP?: number
}

export class FEConvolveMatrixTag extends SvgTagBase<FEConvolveMatrixTagAttrs,SVGFEConvolveMatrixElement> {
    constructor() { super("feConvolveMatrix") }
}

export type FEDiffuseLightingTagAttrs = DefaultTagAttrs & {
    diffuseConstant?: number
    in1?: string
    kernelUnitLengthX?: number
    kernelUnitLengthY?: number
    surfaceScale?: number
}

export class FEDiffuseLightingTag extends SvgTagBase<FEDiffuseLightingTagAttrs,SVGFEDiffuseLightingElement> {
    constructor() { super("feDiffuseLighting") }
}

export type FEDisplacementMapTagAttrs = DefaultTagAttrs & {
    in1?: string
    in2?: string
    scale?: number
    xChannelSelector?: string|number
    yChannelSelector?: string|number
    SVG_CHANNEL_A?: number
    SVG_CHANNEL_B?: number
    SVG_CHANNEL_G?: number
    SVG_CHANNEL_R?: number
    SVG_CHANNEL_UNKNOWN?: number
}

export class FEDisplacementMapTag extends SvgTagBase<FEDisplacementMapTagAttrs,SVGFEDisplacementMapElement> {
    constructor() { super("feDisplacementMap") }
}

export type FEDistantLightTagAttrs = DefaultTagAttrs & {
    azimuth?: number
    elevation?: number
}

export class FEDistantLightTag extends SvgTagBase<FEDistantLightTagAttrs,SVGFEDistantLightElement> {
    constructor() { super("feDistantLight") }
}

export type FEDropShadowTagAttrs = DefaultTagAttrs & {
    dx?: number
    dy?: number
    in1?: string
    stdDeviationX?: number
    stdDeviationY?: number
}

export class FEDropShadowTag extends SvgTagBase<FEDropShadowTagAttrs,SVGFEDropShadowElement> {
    constructor() { super("feDropShadow") }
}

export type FEFloodTagAttrs = DefaultTagAttrs & {
}

export class FEFloodTag extends SvgTagBase<FEFloodTagAttrs,SVGFEFloodElement> {
    constructor() { super("feFlood") }
}

export type FEGaussianBlurTagAttrs = DefaultTagAttrs & {
    in1?: string
    stdDeviationX?: number
    stdDeviationY?: number
}

export class FEGaussianBlurTag extends SvgTagBase<FEGaussianBlurTagAttrs,SVGFEGaussianBlurElement> {
    constructor() { super("feGaussianBlur") }
}

export type FEImageTagAttrs = DefaultTagAttrs & {
    preserveAspectRatio?: string
}

export class FEImageTag extends SvgTagBase<FEImageTagAttrs,SVGFEImageElement> {
    constructor() { super("feImage") }
}

export type FEMergeTagAttrs = DefaultTagAttrs & {
}

export class FEMergeTag extends SvgTagBase<FEMergeTagAttrs,SVGFEMergeElement> {
    constructor() { super("feMerge") }
}

export type FEMergeNodeTagAttrs = DefaultTagAttrs & {
    in1?: string
}

export class FEMergeNodeTag extends SvgTagBase<FEMergeNodeTagAttrs,SVGFEMergeNodeElement> {
    constructor() { super("feMergeNode") }
}

export type FEMorphologyTagAttrs = DefaultTagAttrs & {
    in1?: string
    operator?: string|number
    radiusX?: number
    radiusY?: number
    SVG_MORPHOLOGY_OPERATOR_DILATE?: number
    SVG_MORPHOLOGY_OPERATOR_ERODE?: number
    SVG_MORPHOLOGY_OPERATOR_UNKNOWN?: number
}

export class FEMorphologyTag extends SvgTagBase<FEMorphologyTagAttrs,SVGFEMorphologyElement> {
    constructor() { super("feMorphology") }
}

export type FEOffsetTagAttrs = DefaultTagAttrs & {
    dx?: number
    dy?: number
    in1?: string
}

export class FEOffsetTag extends SvgTagBase<FEOffsetTagAttrs,SVGFEOffsetElement> {
    constructor() { super("feOffset") }
}

export type FEPointLightTagAttrs = DefaultTagAttrs & {
    x?: number
    y?: number
    z?: number
}

export class FEPointLightTag extends SvgTagBase<FEPointLightTagAttrs,SVGFEPointLightElement> {
    constructor() { super("fePointLight") }
}

export type FESpecularLightingTagAttrs = DefaultTagAttrs & {
    in1?: string
    kernelUnitLengthX?: number
    kernelUnitLengthY?: number
    specularConstant?: number
    specularExponent?: number
    surfaceScale?: number
}

export class FESpecularLightingTag extends SvgTagBase<FESpecularLightingTagAttrs,SVGFESpecularLightingElement> {
    constructor() { super("feSpecularLighting") }
}

export type FESpotLightTagAttrs = DefaultTagAttrs & {
    limitingConeAngle?: number
    pointsAtX?: number
    pointsAtY?: number
    pointsAtZ?: number
    specularExponent?: number
    x?: number
    y?: number
    z?: number
}

export class FESpotLightTag extends SvgTagBase<FESpotLightTagAttrs,SVGFESpotLightElement> {
    constructor() { super("feSpotLight") }
}

export type FETileTagAttrs = DefaultTagAttrs & {
    in1?: string
}

export class FETileTag extends SvgTagBase<FETileTagAttrs,SVGFETileElement> {
    constructor() { super("feTile") }
}

export type FETurbulenceTagAttrs = DefaultTagAttrs & {
    baseFrequencyX?: number
    baseFrequencyY?: number
    numOctaves?: number
    seed?: number
    stitchTiles?: string|number
    type?: string|number
    SVG_STITCHTYPE_NOSTITCH?: number
    SVG_STITCHTYPE_STITCH?: number
    SVG_STITCHTYPE_UNKNOWN?: number
    SVG_TURBULENCE_TYPE_FRACTALNOISE?: number
    SVG_TURBULENCE_TYPE_TURBULENCE?: number
    SVG_TURBULENCE_TYPE_UNKNOWN?: number
}

export class FETurbulenceTag extends SvgTagBase<FETurbulenceTagAttrs,SVGFETurbulenceElement> {
    constructor() { super("feTurbulence") }
}

export type FilterTagAttrs = DefaultTagAttrs & {
    filterUnits?: string|number
    height?: number
    primitiveUnits?: string|number
    width?: number
    x?: number
    y?: number
}

export class FilterTag extends SvgTagBase<FilterTagAttrs,SVGFilterElement> {
    constructor() { super("filter") }
}

export type ForeignObjectTagAttrs = GraphicsTagAttrs & {
    height?: number
    width?: number
    x?: number
    y?: number
}

export class ForeignObjectTag extends SvgTagBase<ForeignObjectTagAttrs,SVGForeignObjectElement> {
    constructor() { super("foreignObject") }
}

export type GTagAttrs = GraphicsTagAttrs & {
}

export class GTag extends SvgTagBase<GTagAttrs,SVGGElement> {
    constructor() { super("g") }
}

export type GeometryTagAttrs = SvgBaseAttrs & {
    pathLength?: number
}

export class GeometryTag extends SvgTagBase<GeometryTagAttrs,SVGGeometryElement> {
    constructor() { super("") }
}

export type GradientTagAttrs = SvgBaseAttrs & {
    gradientTransform?: string
    gradientUnits?: string|number
    spreadMethod?: string|number
    SVG_SPREADMETHOD_PAD?: number
    SVG_SPREADMETHOD_REFLECT?: number
    SVG_SPREADMETHOD_REPEAT?: number
    SVG_SPREADMETHOD_UNKNOWN?: number
}

export class GradientTag extends SvgTagBase<GradientTagAttrs,SVGGradientElement> {
    constructor() { super("") }
}

export type GraphicsTagAttrs = SvgBaseAttrs & {
    transform?: string
}

export class GraphicsTag extends SvgTagBase<GraphicsTagAttrs,SVGGraphicsElement> {
    constructor() { super("") }
}

export type ImageTagAttrs = GraphicsTagAttrs & {
    height?: number
    preserveAspectRatio?: string
    width?: number
    x?: number
    y?: number
}

export class ImageTag extends SvgTagBase<ImageTagAttrs,SVGImageElement> {
    constructor() { super("image") }
}

export type LineTagAttrs = GeometryTagAttrs & {
    x1?: number
    x2?: number
    y1?: number
    y2?: number
}

export class LineTag extends SvgTagBase<LineTagAttrs,SVGLineElement> {
    constructor() { super("line") }
}

export type LinearGradientTagAttrs = GradientTagAttrs & {
    x1?: number
    x2?: number
    y1?: number
    y2?: number
}

export class LinearGradientTag extends SvgTagBase<LinearGradientTagAttrs,SVGLinearGradientElement> {
    constructor() { super("linearGradient") }
}

export type MPathTagAttrs = DefaultTagAttrs & {
}

export class MPathTag extends SvgTagBase<MPathTagAttrs,SVGMPathElement> {
    constructor() { super("mpath") }
}

export type MarkerTagAttrs = DefaultTagAttrs & {
    markerHeight?: number
    markerUnits?: string|number
    markerWidth?: number
    orientAngle?: number
    orientType?: string|number
    refX?: number
    refY?: number
    SVG_MARKERUNITS_STROKEWIDTH?: number
    SVG_MARKERUNITS_UNKNOWN?: number
    SVG_MARKERUNITS_USERSPACEONUSE?: number
    SVG_MARKER_ORIENT_ANGLE?: number
    SVG_MARKER_ORIENT_AUTO?: number
    SVG_MARKER_ORIENT_UNKNOWN?: number
    preserveAspectRatio?: string
    viewBox?: IRect
}

export class MarkerTag extends SvgTagBase<MarkerTagAttrs,SVGMarkerElement> {
    constructor() { super("marker") }
}

export type MaskTagAttrs = DefaultTagAttrs & {
    height?: number
    maskContentUnits?: string|number
    maskUnits?: string|number
    width?: number
    x?: number
    y?: number
}

export class MaskTag extends SvgTagBase<MaskTagAttrs,SVGMaskElement> {
    constructor() { super("mask") }
}

export type MetadataTagAttrs = DefaultTagAttrs & {
}

export class MetadataTag extends SvgTagBase<MetadataTagAttrs,SVGMetadataElement> {
    constructor() { super("metadata") }
}

export type PathTagAttrs = GeometryTagAttrs & {
}

export class PathTag extends SvgTagBase<PathTagAttrs,SVGPathElement> {
    constructor() { super("path") }
}

export type PatternTagAttrs = DefaultTagAttrs & {
    height?: number
    patternContentUnits?: string|number
    patternTransform?: string
    patternUnits?: string|number
    width?: number
    x?: number
    y?: number
    preserveAspectRatio?: string
    viewBox?: IRect
}

export class PatternTag extends SvgTagBase<PatternTagAttrs,SVGPatternElement> {
    constructor() { super("pattern") }
}

export type PolygonTagAttrs = GeometryTagAttrs & {
}

export class PolygonTag extends SvgTagBase<PolygonTagAttrs,SVGPolygonElement> {
    constructor() { super("polygon") }
}

export type PolylineTagAttrs = GeometryTagAttrs & {
}

export class PolylineTag extends SvgTagBase<PolylineTagAttrs,SVGPolylineElement> {
    constructor() { super("polyline") }
}

export type RadialGradientTagAttrs = GradientTagAttrs & {
    cx?: number
    cy?: number
    fr?: number
    fx?: number
    fy?: number
    r?: number
}

export class RadialGradientTag extends SvgTagBase<RadialGradientTagAttrs,SVGRadialGradientElement> {
    constructor() { super("radialGradient") }
}

export type RectTagAttrs = GeometryTagAttrs & {
    height?: number
    rx?: number
    ry?: number
    width?: number
    x?: number
    y?: number
}

export class RectTag extends SvgTagBase<RectTagAttrs,SVGRectElement> {
    constructor() { super("rect") }
}

export type SVGTagAttrs = GraphicsTagAttrs & {
    currentScale?: number
    currentTranslate?: DOMPointReadOnly
    height?: number
    width?: number
    x?: number
    y?: number
    preserveAspectRatio?: string
    viewBox?: IRect
}

export class SVGTag extends SvgTagBase<SVGTagAttrs,SVGSVGElement> {
    constructor() { super("svg") }
}

export type ScriptTagAttrs = DefaultTagAttrs & {
    type?: string
}

export class ScriptTag extends SvgTagBase<ScriptTagAttrs,SVGScriptElement> {
    constructor() { super("script") }
}

export type StopTagAttrs = DefaultTagAttrs & {
    offset?: number
}

export class StopTag extends SvgTagBase<StopTagAttrs,SVGStopElement> {
    constructor() { super("stop") }
}

export type StyleTagAttrs = DefaultTagAttrs & {
    disabled?: boolean
    media?: string
    title?: string
    type?: string
}

export class StyleTag extends SvgTagBase<StyleTagAttrs,SVGStyleElement> {
    constructor() { super("style") }
}

export type SwitchTagAttrs = GraphicsTagAttrs & {
}

export class SwitchTag extends SvgTagBase<SwitchTagAttrs,SVGSwitchElement> {
    constructor() { super("switch") }
}

export type SymbolTagAttrs = DefaultTagAttrs & {
    preserveAspectRatio?: string
    viewBox?: IRect
}

export class SymbolTag extends SvgTagBase<SymbolTagAttrs,SVGSymbolElement> {
    constructor() { super("symbol") }
}

export type TextContentTagAttrs = GraphicsTagAttrs & {
    lengthAdjust?: string|number
    textLength?: number
    LENGTHADJUST_SPACING?: number
    LENGTHADJUST_SPACINGANDGLYPHS?: number
    LENGTHADJUST_UNKNOWN?: number
}

export class TextContentTag extends SvgTagBase<TextContentTagAttrs,SVGTextContentElement> {
    constructor() { super("") }
}

export type TitleTagAttrs = DefaultTagAttrs & {
}

export class TitleTag extends SvgTagBase<TitleTagAttrs,SVGTitleElement> {
    constructor() { super("title") }
}

export type UseTagAttrs = GraphicsTagAttrs & {
    height?: number
    width?: number
    x?: number
    y?: number
}

export class UseTag extends SvgTagBase<UseTagAttrs,SVGUseElement> {
    constructor() { super("use") }
}

export type ViewTagAttrs = DefaultTagAttrs & {
    preserveAspectRatio?: string
    viewBox?: IRect
}

export class ViewTag extends SvgTagBase<ViewTagAttrs,SVGViewElement> {
    constructor() { super("view") }
}

//// End Tag Classes
