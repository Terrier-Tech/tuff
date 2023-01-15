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
    fontFamily?: string
    fontSize?: number
    fontSizeAdjust?: string
    fontStretch?: string
    fontStyle?: 'normal' | 'italic' | 'oblique'
    fontVariant?: string
    fontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
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
            return `${strings.ropeCase(name)}="${this.escapeAttrValue(value.toString())}"`
        }
        else {
            return `${name}="${this.escapeAttrValue(value.toString())}"`
        }
    }

    //// Begin Tag Methods

    a(...args: TagArgs<ATag,ATagAttrs>[]) : ATag {
        return this.child(ATag, 'a', ...args)
    }

    circle(...args: TagArgs<CircleTag,CircleTagAttrs>[]) : CircleTag {
        return this.child(CircleTag, 'circle', ...args)
    }

    clipPath(...args: TagArgs<ClipPathTag,ClipPathTagAttrs>[]) : ClipPathTag {
        return this.child(ClipPathTag, 'clipPath', ...args)
    }

    defs(...args: TagArgs<DefsTag,DefsTagAttrs>[]) : DefsTag {
        return this.child(DefsTag, 'defs', ...args)
    }

    desc(...args: TagArgs<DescTag,DescTagAttrs>[]) : DescTag {
        return this.child(DescTag, 'desc', ...args)
    }

    ellipse(...args: TagArgs<EllipseTag,EllipseTagAttrs>[]) : EllipseTag {
        return this.child(EllipseTag, 'ellipse', ...args)
    }

    feBlend(...args: TagArgs<FEBlendTag,FEBlendTagAttrs>[]) : FEBlendTag {
        return this.child(FEBlendTag, 'feBlend', ...args)
    }

    feColorMatrix(...args: TagArgs<FEColorMatrixTag,FEColorMatrixTagAttrs>[]) : FEColorMatrixTag {
        return this.child(FEColorMatrixTag, 'feColorMatrix', ...args)
    }

    feComponentTransfer(...args: TagArgs<FEComponentTransferTag,FEComponentTransferTagAttrs>[]) : FEComponentTransferTag {
        return this.child(FEComponentTransferTag, 'feComponentTransfer', ...args)
    }

    feComposite(...args: TagArgs<FECompositeTag,FECompositeTagAttrs>[]) : FECompositeTag {
        return this.child(FECompositeTag, 'feComposite', ...args)
    }

    feConvolveMatrix(...args: TagArgs<FEConvolveMatrixTag,FEConvolveMatrixTagAttrs>[]) : FEConvolveMatrixTag {
        return this.child(FEConvolveMatrixTag, 'feConvolveMatrix', ...args)
    }

    feDiffuseLighting(...args: TagArgs<FEDiffuseLightingTag,FEDiffuseLightingTagAttrs>[]) : FEDiffuseLightingTag {
        return this.child(FEDiffuseLightingTag, 'feDiffuseLighting', ...args)
    }

    feDisplacementMap(...args: TagArgs<FEDisplacementMapTag,FEDisplacementMapTagAttrs>[]) : FEDisplacementMapTag {
        return this.child(FEDisplacementMapTag, 'feDisplacementMap', ...args)
    }

    feDistantLight(...args: TagArgs<FEDistantLightTag,FEDistantLightTagAttrs>[]) : FEDistantLightTag {
        return this.child(FEDistantLightTag, 'feDistantLight', ...args)
    }

    feDropShadow(...args: TagArgs<FEDropShadowTag,FEDropShadowTagAttrs>[]) : FEDropShadowTag {
        return this.child(FEDropShadowTag, 'feDropShadow', ...args)
    }

    feFlood(...args: TagArgs<FEFloodTag,FEFloodTagAttrs>[]) : FEFloodTag {
        return this.child(FEFloodTag, 'feFlood', ...args)
    }

    feGaussianBlur(...args: TagArgs<FEGaussianBlurTag,FEGaussianBlurTagAttrs>[]) : FEGaussianBlurTag {
        return this.child(FEGaussianBlurTag, 'feGaussianBlur', ...args)
    }

    feImage(...args: TagArgs<FEImageTag,FEImageTagAttrs>[]) : FEImageTag {
        return this.child(FEImageTag, 'feImage', ...args)
    }

    feMerge(...args: TagArgs<FEMergeTag,FEMergeTagAttrs>[]) : FEMergeTag {
        return this.child(FEMergeTag, 'feMerge', ...args)
    }

    feMergeNode(...args: TagArgs<FEMergeNodeTag,FEMergeNodeTagAttrs>[]) : FEMergeNodeTag {
        return this.child(FEMergeNodeTag, 'feMergeNode', ...args)
    }

    feMorphology(...args: TagArgs<FEMorphologyTag,FEMorphologyTagAttrs>[]) : FEMorphologyTag {
        return this.child(FEMorphologyTag, 'feMorphology', ...args)
    }

    feOffset(...args: TagArgs<FEOffsetTag,FEOffsetTagAttrs>[]) : FEOffsetTag {
        return this.child(FEOffsetTag, 'feOffset', ...args)
    }

    fePointLight(...args: TagArgs<FEPointLightTag,FEPointLightTagAttrs>[]) : FEPointLightTag {
        return this.child(FEPointLightTag, 'fePointLight', ...args)
    }

    feSpecularLighting(...args: TagArgs<FESpecularLightingTag,FESpecularLightingTagAttrs>[]) : FESpecularLightingTag {
        return this.child(FESpecularLightingTag, 'feSpecularLighting', ...args)
    }

    feSpotLight(...args: TagArgs<FESpotLightTag,FESpotLightTagAttrs>[]) : FESpotLightTag {
        return this.child(FESpotLightTag, 'feSpotLight', ...args)
    }

    feTile(...args: TagArgs<FETileTag,FETileTagAttrs>[]) : FETileTag {
        return this.child(FETileTag, 'feTile', ...args)
    }

    feTurbulence(...args: TagArgs<FETurbulenceTag,FETurbulenceTagAttrs>[]) : FETurbulenceTag {
        return this.child(FETurbulenceTag, 'feTurbulence', ...args)
    }

    filter(...args: TagArgs<FilterTag,FilterTagAttrs>[]) : FilterTag {
        return this.child(FilterTag, 'filter', ...args)
    }

    foreignObject(...args: TagArgs<ForeignObjectTag,ForeignObjectTagAttrs>[]) : ForeignObjectTag {
        return this.child(ForeignObjectTag, 'foreignObject', ...args)
    }

    g(...args: TagArgs<GTag,GTagAttrs>[]) : GTag {
        return this.child(GTag, 'g', ...args)
    }

    image(...args: TagArgs<ImageTag,ImageTagAttrs>[]) : ImageTag {
        return this.child(ImageTag, 'image', ...args)
    }

    line(...args: TagArgs<LineTag,LineTagAttrs>[]) : LineTag {
        return this.child(LineTag, 'line', ...args)
    }

    linearGradient(...args: TagArgs<LinearGradientTag,LinearGradientTagAttrs>[]) : LinearGradientTag {
        return this.child(LinearGradientTag, 'linearGradient', ...args)
    }

    marker(...args: TagArgs<MarkerTag,MarkerTagAttrs>[]) : MarkerTag {
        return this.child(MarkerTag, 'marker', ...args)
    }

    mask(...args: TagArgs<MaskTag,MaskTagAttrs>[]) : MaskTag {
        return this.child(MaskTag, 'mask', ...args)
    }

    metadata(...args: TagArgs<MetadataTag,MetadataTagAttrs>[]) : MetadataTag {
        return this.child(MetadataTag, 'metadata', ...args)
    }

    mpath(...args: TagArgs<MPathTag,MPathTagAttrs>[]) : MPathTag {
        return this.child(MPathTag, 'mpath', ...args)
    }

    path(...args: TagArgs<PathTag,PathTagAttrs>[]) : PathTag {
        return this.child(PathTag, 'path', ...args)
    }

    pattern(...args: TagArgs<PatternTag,PatternTagAttrs>[]) : PatternTag {
        return this.child(PatternTag, 'pattern', ...args)
    }

    polygon(...args: TagArgs<PolygonTag,PolygonTagAttrs>[]) : PolygonTag {
        return this.child(PolygonTag, 'polygon', ...args)
    }

    polyline(...args: TagArgs<PolylineTag,PolylineTagAttrs>[]) : PolylineTag {
        return this.child(PolylineTag, 'polyline', ...args)
    }

    radialGradient(...args: TagArgs<RadialGradientTag,RadialGradientTagAttrs>[]) : RadialGradientTag {
        return this.child(RadialGradientTag, 'radialGradient', ...args)
    }

    rect(...args: TagArgs<RectTag,RectTagAttrs>[]) : RectTag {
        return this.child(RectTag, 'rect', ...args)
    }

    script(...args: TagArgs<ScriptTag,ScriptTagAttrs>[]) : ScriptTag {
        return this.child(ScriptTag, 'script', ...args)
    }

    stop(...args: TagArgs<StopTag,StopTagAttrs>[]) : StopTag {
        return this.child(StopTag, 'stop', ...args)
    }

    style(...args: TagArgs<StyleTag,StyleTagAttrs>[]) : StyleTag {
        return this.child(StyleTag, 'style', ...args)
    }

    svg(...args: TagArgs<SVGTag,SVGTagAttrs>[]) : SVGTag {
        return this.child(SVGTag, 'svg', ...args)
    }

    switch(...args: TagArgs<SwitchTag,SwitchTagAttrs>[]) : SwitchTag {
        return this.child(SwitchTag, 'switch', ...args)
    }

    symbol(...args: TagArgs<SymbolTag,SymbolTagAttrs>[]) : SymbolTag {
        return this.child(SymbolTag, 'symbol', ...args)
    }

    text(...args: TagArgs<TextTag,TextTagAttrs>[]) : TextTag {
        return this.child(TextTag, 'text', ...args)
    }

    title(...args: TagArgs<TitleTag,TitleTagAttrs>[]) : TitleTag {
        return this.child(TitleTag, 'title', ...args)
    }

    tspan(...args: TagArgs<TSpanTag,TSpanTagAttrs>[]) : TSpanTag {
        return this.child(TSpanTag, 'tspan', ...args)
    }

    use(...args: TagArgs<UseTag,UseTagAttrs>[]) : UseTag {
        return this.child(UseTag, 'use', ...args)
    }

    view(...args: TagArgs<ViewTag,ViewTagAttrs>[]) : ViewTag {
        return this.child(ViewTag, 'view', ...args)
    }

//// End Tag Methods

}


// DO NOT EDIT THE CODE BELOW!
//// Begin Tag Classes

/** SVGAElement Attributes */
export type ATagAttrs = GraphicsTagAttrs & {
    rel?: string
    relList?: DOMTokenList
    target?: string
}

/** SVGAElement Tag */
export class ATag extends SvgTagBase<ATagAttrs,SVGAElement> {}

/** SVGAnimationElement Attributes */
export type AnimationTagAttrs = DefaultTagAttrs & {
    targetElement?: SVGElement | null
}

/** SVGAnimationElement Tag */
export class AnimationTag extends SvgTagBase<AnimationTagAttrs,SVGAnimationElement> {}

/** SVGCircleElement Attributes */
export type CircleTagAttrs = GeometryTagAttrs & {
    cx?: number
    cy?: number
    r?: number
}

/** SVGCircleElement Tag */
export class CircleTag extends SvgTagBase<CircleTagAttrs,SVGCircleElement> {}

/** SVGClipPathElement Attributes */
export type ClipPathTagAttrs = DefaultTagAttrs & {
    clipPathUnits?: string|number
    transform?: string
}

/** SVGClipPathElement Tag */
export class ClipPathTag extends SvgTagBase<ClipPathTagAttrs,SVGClipPathElement> {}

/** SVGComponentTransferFunctionElement Attributes */
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

/** SVGComponentTransferFunctionElement Tag */
export class ComponentTransferFunctionTag extends SvgTagBase<ComponentTransferFunctionTagAttrs,SVGComponentTransferFunctionElement> {}

/** SVGDefsElement Attributes */
export type DefsTagAttrs = GraphicsTagAttrs & {
}

/** SVGDefsElement Tag */
export class DefsTag extends SvgTagBase<DefsTagAttrs,SVGDefsElement> {}

/** SVGDescElement Attributes */
export type DescTagAttrs = DefaultTagAttrs & {
}

/** SVGDescElement Tag */
export class DescTag extends SvgTagBase<DescTagAttrs,SVGDescElement> {}

/** SVGElement Attributes */
export type DefaultTagAttrs = SvgBaseAttrs & {
    ownerSVGElement?: SVGSVGElement | null
    viewportElement?: SVGElement | null
}

/** SVGElement Tag */
export class DefaultTag extends SvgTagBase<DefaultTagAttrs,SVGElement> {}

/** SVGEllipseElement Attributes */
export type EllipseTagAttrs = GeometryTagAttrs & {
    cx?: number
    cy?: number
    rx?: number
    ry?: number
}

/** SVGEllipseElement Tag */
export class EllipseTag extends SvgTagBase<EllipseTagAttrs,SVGEllipseElement> {}

/** SVGFEBlendElement Attributes */
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

/** SVGFEBlendElement Tag */
export class FEBlendTag extends SvgTagBase<FEBlendTagAttrs,SVGFEBlendElement> {}

/** SVGFEColorMatrixElement Attributes */
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

/** SVGFEColorMatrixElement Tag */
export class FEColorMatrixTag extends SvgTagBase<FEColorMatrixTagAttrs,SVGFEColorMatrixElement> {}

/** SVGFEComponentTransferElement Attributes */
export type FEComponentTransferTagAttrs = DefaultTagAttrs & {
    in1?: string
}

/** SVGFEComponentTransferElement Tag */
export class FEComponentTransferTag extends SvgTagBase<FEComponentTransferTagAttrs,SVGFEComponentTransferElement> {}

/** SVGFECompositeElement Attributes */
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

/** SVGFECompositeElement Tag */
export class FECompositeTag extends SvgTagBase<FECompositeTagAttrs,SVGFECompositeElement> {}

/** SVGFEConvolveMatrixElement Attributes */
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

/** SVGFEConvolveMatrixElement Tag */
export class FEConvolveMatrixTag extends SvgTagBase<FEConvolveMatrixTagAttrs,SVGFEConvolveMatrixElement> {}

/** SVGFEDiffuseLightingElement Attributes */
export type FEDiffuseLightingTagAttrs = DefaultTagAttrs & {
    diffuseConstant?: number
    in1?: string
    kernelUnitLengthX?: number
    kernelUnitLengthY?: number
    surfaceScale?: number
}

/** SVGFEDiffuseLightingElement Tag */
export class FEDiffuseLightingTag extends SvgTagBase<FEDiffuseLightingTagAttrs,SVGFEDiffuseLightingElement> {}

/** SVGFEDisplacementMapElement Attributes */
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

/** SVGFEDisplacementMapElement Tag */
export class FEDisplacementMapTag extends SvgTagBase<FEDisplacementMapTagAttrs,SVGFEDisplacementMapElement> {}

/** SVGFEDistantLightElement Attributes */
export type FEDistantLightTagAttrs = DefaultTagAttrs & {
    azimuth?: number
    elevation?: number
}

/** SVGFEDistantLightElement Tag */
export class FEDistantLightTag extends SvgTagBase<FEDistantLightTagAttrs,SVGFEDistantLightElement> {}

/** SVGFEDropShadowElement Attributes */
export type FEDropShadowTagAttrs = DefaultTagAttrs & {
    dx?: number
    dy?: number
    in1?: string
    stdDeviationX?: number
    stdDeviationY?: number
}

/** SVGFEDropShadowElement Tag */
export class FEDropShadowTag extends SvgTagBase<FEDropShadowTagAttrs,SVGFEDropShadowElement> {}

/** SVGFEFloodElement Attributes */
export type FEFloodTagAttrs = DefaultTagAttrs & {
}

/** SVGFEFloodElement Tag */
export class FEFloodTag extends SvgTagBase<FEFloodTagAttrs,SVGFEFloodElement> {}

/** SVGFEGaussianBlurElement Attributes */
export type FEGaussianBlurTagAttrs = DefaultTagAttrs & {
    in1?: string
    stdDeviationX?: number
    stdDeviationY?: number
}

/** SVGFEGaussianBlurElement Tag */
export class FEGaussianBlurTag extends SvgTagBase<FEGaussianBlurTagAttrs,SVGFEGaussianBlurElement> {}

/** SVGFEImageElement Attributes */
export type FEImageTagAttrs = DefaultTagAttrs & {
    preserveAspectRatio?: string
}

/** SVGFEImageElement Tag */
export class FEImageTag extends SvgTagBase<FEImageTagAttrs,SVGFEImageElement> {}

/** SVGFEMergeElement Attributes */
export type FEMergeTagAttrs = DefaultTagAttrs & {
}

/** SVGFEMergeElement Tag */
export class FEMergeTag extends SvgTagBase<FEMergeTagAttrs,SVGFEMergeElement> {}

/** SVGFEMergeNodeElement Attributes */
export type FEMergeNodeTagAttrs = DefaultTagAttrs & {
    in1?: string
}

/** SVGFEMergeNodeElement Tag */
export class FEMergeNodeTag extends SvgTagBase<FEMergeNodeTagAttrs,SVGFEMergeNodeElement> {}

/** SVGFEMorphologyElement Attributes */
export type FEMorphologyTagAttrs = DefaultTagAttrs & {
    in1?: string
    operator?: string|number
    radiusX?: number
    radiusY?: number
    SVG_MORPHOLOGY_OPERATOR_DILATE?: number
    SVG_MORPHOLOGY_OPERATOR_ERODE?: number
    SVG_MORPHOLOGY_OPERATOR_UNKNOWN?: number
}

/** SVGFEMorphologyElement Tag */
export class FEMorphologyTag extends SvgTagBase<FEMorphologyTagAttrs,SVGFEMorphologyElement> {}

/** SVGFEOffsetElement Attributes */
export type FEOffsetTagAttrs = DefaultTagAttrs & {
    dx?: number
    dy?: number
    in1?: string
}

/** SVGFEOffsetElement Tag */
export class FEOffsetTag extends SvgTagBase<FEOffsetTagAttrs,SVGFEOffsetElement> {}

/** SVGFEPointLightElement Attributes */
export type FEPointLightTagAttrs = DefaultTagAttrs & {
    x?: number
    y?: number
    z?: number
}

/** SVGFEPointLightElement Tag */
export class FEPointLightTag extends SvgTagBase<FEPointLightTagAttrs,SVGFEPointLightElement> {}

/** SVGFESpecularLightingElement Attributes */
export type FESpecularLightingTagAttrs = DefaultTagAttrs & {
    in1?: string
    kernelUnitLengthX?: number
    kernelUnitLengthY?: number
    specularConstant?: number
    specularExponent?: number
    surfaceScale?: number
}

/** SVGFESpecularLightingElement Tag */
export class FESpecularLightingTag extends SvgTagBase<FESpecularLightingTagAttrs,SVGFESpecularLightingElement> {}

/** SVGFESpotLightElement Attributes */
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

/** SVGFESpotLightElement Tag */
export class FESpotLightTag extends SvgTagBase<FESpotLightTagAttrs,SVGFESpotLightElement> {}

/** SVGFETileElement Attributes */
export type FETileTagAttrs = DefaultTagAttrs & {
    in1?: string
}

/** SVGFETileElement Tag */
export class FETileTag extends SvgTagBase<FETileTagAttrs,SVGFETileElement> {}

/** SVGFETurbulenceElement Attributes */
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

/** SVGFETurbulenceElement Tag */
export class FETurbulenceTag extends SvgTagBase<FETurbulenceTagAttrs,SVGFETurbulenceElement> {}

/** SVGFilterElement Attributes */
export type FilterTagAttrs = DefaultTagAttrs & {
    filterUnits?: string|number
    height?: number
    primitiveUnits?: string|number
    width?: number
    x?: number
    y?: number
}

/** SVGFilterElement Tag */
export class FilterTag extends SvgTagBase<FilterTagAttrs,SVGFilterElement> {}

/** SVGForeignObjectElement Attributes */
export type ForeignObjectTagAttrs = GraphicsTagAttrs & {
    height?: number
    width?: number
    x?: number
    y?: number
}

/** SVGForeignObjectElement Tag */
export class ForeignObjectTag extends SvgTagBase<ForeignObjectTagAttrs,SVGForeignObjectElement> {}

/** SVGGElement Attributes */
export type GTagAttrs = GraphicsTagAttrs & {
}

/** SVGGElement Tag */
export class GTag extends SvgTagBase<GTagAttrs,SVGGElement> {}

/** SVGGeometryElement Attributes */
export type GeometryTagAttrs = SvgBaseAttrs & {
    pathLength?: number
}

/** SVGGeometryElement Tag */
export class GeometryTag extends SvgTagBase<GeometryTagAttrs,SVGGeometryElement> {}

/** SVGGradientElement Attributes */
export type GradientTagAttrs = SvgBaseAttrs & {
    gradientTransform?: string
    gradientUnits?: string|number
    spreadMethod?: string|number
    SVG_SPREADMETHOD_PAD?: number
    SVG_SPREADMETHOD_REFLECT?: number
    SVG_SPREADMETHOD_REPEAT?: number
    SVG_SPREADMETHOD_UNKNOWN?: number
}

/** SVGGradientElement Tag */
export class GradientTag extends SvgTagBase<GradientTagAttrs,SVGGradientElement> {}

/** SVGGraphicsElement Attributes */
export type GraphicsTagAttrs = SvgBaseAttrs & {
    transform?: string
}

/** SVGGraphicsElement Tag */
export class GraphicsTag extends SvgTagBase<GraphicsTagAttrs,SVGGraphicsElement> {}

/** SVGImageElement Attributes */
export type ImageTagAttrs = GraphicsTagAttrs & {
    height?: number
    preserveAspectRatio?: string
    width?: number
    x?: number
    y?: number
}

/** SVGImageElement Tag */
export class ImageTag extends SvgTagBase<ImageTagAttrs,SVGImageElement> {}

/** SVGLineElement Attributes */
export type LineTagAttrs = GeometryTagAttrs & {
    x1?: number
    x2?: number
    y1?: number
    y2?: number
}

/** SVGLineElement Tag */
export class LineTag extends SvgTagBase<LineTagAttrs,SVGLineElement> {}

/** SVGLinearGradientElement Attributes */
export type LinearGradientTagAttrs = GradientTagAttrs & {
    x1?: number
    x2?: number
    y1?: number
    y2?: number
}

/** SVGLinearGradientElement Tag */
export class LinearGradientTag extends SvgTagBase<LinearGradientTagAttrs,SVGLinearGradientElement> {}

/** SVGMPathElement Attributes */
export type MPathTagAttrs = DefaultTagAttrs & {
}

/** SVGMPathElement Tag */
export class MPathTag extends SvgTagBase<MPathTagAttrs,SVGMPathElement> {}

/** SVGMarkerElement Attributes */
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

/** SVGMarkerElement Tag */
export class MarkerTag extends SvgTagBase<MarkerTagAttrs,SVGMarkerElement> {}

/** SVGMaskElement Attributes */
export type MaskTagAttrs = DefaultTagAttrs & {
    height?: number
    maskContentUnits?: string|number
    maskUnits?: string|number
    width?: number
    x?: number
    y?: number
}

/** SVGMaskElement Tag */
export class MaskTag extends SvgTagBase<MaskTagAttrs,SVGMaskElement> {}

/** SVGMetadataElement Attributes */
export type MetadataTagAttrs = DefaultTagAttrs & {
}

/** SVGMetadataElement Tag */
export class MetadataTag extends SvgTagBase<MetadataTagAttrs,SVGMetadataElement> {}

/** SVGPathElement Attributes */
export type PathTagAttrs = GeometryTagAttrs & {
}

/** SVGPathElement Tag */
export class PathTag extends SvgTagBase<PathTagAttrs,SVGPathElement> {}

/** SVGPatternElement Attributes */
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

/** SVGPatternElement Tag */
export class PatternTag extends SvgTagBase<PatternTagAttrs,SVGPatternElement> {}

/** SVGPolygonElement Attributes */
export type PolygonTagAttrs = GeometryTagAttrs & {
    animatedPoints?: string
    points?: string
}

/** SVGPolygonElement Tag */
export class PolygonTag extends SvgTagBase<PolygonTagAttrs,SVGPolygonElement> {}

/** SVGPolylineElement Attributes */
export type PolylineTagAttrs = GeometryTagAttrs & {
    animatedPoints?: string
    points?: string
}

/** SVGPolylineElement Tag */
export class PolylineTag extends SvgTagBase<PolylineTagAttrs,SVGPolylineElement> {}

/** SVGRadialGradientElement Attributes */
export type RadialGradientTagAttrs = GradientTagAttrs & {
    cx?: number
    cy?: number
    fr?: number
    fx?: number
    fy?: number
    r?: number
}

/** SVGRadialGradientElement Tag */
export class RadialGradientTag extends SvgTagBase<RadialGradientTagAttrs,SVGRadialGradientElement> {}

/** SVGRectElement Attributes */
export type RectTagAttrs = GeometryTagAttrs & {
    height?: number
    rx?: number
    ry?: number
    width?: number
    x?: number
    y?: number
}

/** SVGRectElement Tag */
export class RectTag extends SvgTagBase<RectTagAttrs,SVGRectElement> {}

/** SVGSVGElement Attributes */
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

/** SVGSVGElement Tag */
export class SVGTag extends SvgTagBase<SVGTagAttrs,SVGSVGElement> {}

/** SVGScriptElement Attributes */
export type ScriptTagAttrs = DefaultTagAttrs & {
    type?: string
}

/** SVGScriptElement Tag */
export class ScriptTag extends SvgTagBase<ScriptTagAttrs,SVGScriptElement> {}

/** SVGStopElement Attributes */
export type StopTagAttrs = DefaultTagAttrs & {
    offset?: number
}

/** SVGStopElement Tag */
export class StopTag extends SvgTagBase<StopTagAttrs,SVGStopElement> {}

/** SVGStyleElement Attributes */
export type StyleTagAttrs = DefaultTagAttrs & {
    disabled?: boolean
    media?: string
    title?: string
    type?: string
}

/** SVGStyleElement Tag */
export class StyleTag extends SvgTagBase<StyleTagAttrs,SVGStyleElement> {}

/** SVGSwitchElement Attributes */
export type SwitchTagAttrs = GraphicsTagAttrs & {
}

/** SVGSwitchElement Tag */
export class SwitchTag extends SvgTagBase<SwitchTagAttrs,SVGSwitchElement> {}

/** SVGSymbolElement Attributes */
export type SymbolTagAttrs = DefaultTagAttrs & {
    preserveAspectRatio?: string
    viewBox?: IRect
}

/** SVGSymbolElement Tag */
export class SymbolTag extends SvgTagBase<SymbolTagAttrs,SVGSymbolElement> {}

/** SVGTSpanElement Attributes */
export type TSpanTagAttrs = TextPositioningTagAttrs & {
}

/** SVGTSpanElement Tag */
export class TSpanTag extends SvgTagBase<TSpanTagAttrs,SVGTSpanElement> {}

/** SVGTextContentElement Attributes */
export type TextContentTagAttrs = GraphicsTagAttrs & {
    lengthAdjust?: string|number
    textLength?: number
    LENGTHADJUST_SPACING?: number
    LENGTHADJUST_SPACINGANDGLYPHS?: number
    LENGTHADJUST_UNKNOWN?: number
}

/** SVGTextContentElement Tag */
export class TextContentTag extends SvgTagBase<TextContentTagAttrs,SVGTextContentElement> {}

/** SVGTextElement Attributes */
export type TextTagAttrs = TextPositioningTagAttrs & {
}

/** SVGTextElement Tag */
export class TextTag extends SvgTagBase<TextTagAttrs,SVGTextElement> {}

/** SVGTextPositioningElement Attributes */
export type TextPositioningTagAttrs = SvgBaseAttrs & {
    dx?: number
    dy?: number
    rotate?: Array<number>
    x?: number
    y?: number
}

/** SVGTextPositioningElement Tag */
export class TextPositioningTag extends SvgTagBase<TextPositioningTagAttrs,SVGTextPositioningElement> {}

/** SVGTitleElement Attributes */
export type TitleTagAttrs = DefaultTagAttrs & {
}

/** SVGTitleElement Tag */
export class TitleTag extends SvgTagBase<TitleTagAttrs,SVGTitleElement> {}

/** SVGUseElement Attributes */
export type UseTagAttrs = GraphicsTagAttrs & {
    height?: number
    width?: number
    x?: number
    y?: number
}

/** SVGUseElement Tag */
export class UseTag extends SvgTagBase<UseTagAttrs,SVGUseElement> {}

/** SVGViewElement Attributes */
export type ViewTagAttrs = DefaultTagAttrs & {
    preserveAspectRatio?: string
    viewBox?: IRect
}

/** SVGViewElement Tag */
export class ViewTag extends SvgTagBase<ViewTagAttrs,SVGViewElement> {}

//// End Tag Classes

//// Begin Tag Map

/** Map the names of SVG tags to their classes. */
export interface SvgTagMap {
    "a": ATag
    "circle": CircleTag
    "clipPath": ClipPathTag
    "defs": DefsTag
    "desc": DescTag
    "ellipse": EllipseTag
    "feBlend": FEBlendTag
    "feColorMatrix": FEColorMatrixTag
    "feComponentTransfer": FEComponentTransferTag
    "feComposite": FECompositeTag
    "feConvolveMatrix": FEConvolveMatrixTag
    "feDiffuseLighting": FEDiffuseLightingTag
    "feDisplacementMap": FEDisplacementMapTag
    "feDistantLight": FEDistantLightTag
    "feDropShadow": FEDropShadowTag
    "feFlood": FEFloodTag
    "feGaussianBlur": FEGaussianBlurTag
    "feImage": FEImageTag
    "feMerge": FEMergeTag
    "feMergeNode": FEMergeNodeTag
    "feMorphology": FEMorphologyTag
    "feOffset": FEOffsetTag
    "fePointLight": FEPointLightTag
    "feSpecularLighting": FESpecularLightingTag
    "feSpotLight": FESpotLightTag
    "feTile": FETileTag
    "feTurbulence": FETurbulenceTag
    "filter": FilterTag
    "foreignObject": ForeignObjectTag
    "g": GTag
    "image": ImageTag
    "line": LineTag
    "linearGradient": LinearGradientTag
    "marker": MarkerTag
    "mask": MaskTag
    "metadata": MetadataTag
    "mpath": MPathTag
    "path": PathTag
    "pattern": PatternTag
    "polygon": PolygonTag
    "polyline": PolylineTag
    "radialGradient": RadialGradientTag
    "rect": RectTag
    "script": ScriptTag
    "stop": StopTag
    "style": StyleTag
    "svg": SVGTag
    "switch": SwitchTag
    "symbol": SymbolTag
    "text": TextTag
    "title": TitleTag
    "tspan": TSpanTag
    "use": UseTag
    "view": ViewTag
}


export type SvgTagName = keyof SvgTagMap

export const svgTagMap: Record<SvgTagName, {new (tag: SvgTagName): SvgTagMap[typeof tag]}> = {
    a: ATag,
    circle: CircleTag,
    clipPath: ClipPathTag,
    defs: DefsTag,
    desc: DescTag,
    ellipse: EllipseTag,
    feBlend: FEBlendTag,
    feColorMatrix: FEColorMatrixTag,
    feComponentTransfer: FEComponentTransferTag,
    feComposite: FECompositeTag,
    feConvolveMatrix: FEConvolveMatrixTag,
    feDiffuseLighting: FEDiffuseLightingTag,
    feDisplacementMap: FEDisplacementMapTag,
    feDistantLight: FEDistantLightTag,
    feDropShadow: FEDropShadowTag,
    feFlood: FEFloodTag,
    feGaussianBlur: FEGaussianBlurTag,
    feImage: FEImageTag,
    feMerge: FEMergeTag,
    feMergeNode: FEMergeNodeTag,
    feMorphology: FEMorphologyTag,
    feOffset: FEOffsetTag,
    fePointLight: FEPointLightTag,
    feSpecularLighting: FESpecularLightingTag,
    feSpotLight: FESpotLightTag,
    feTile: FETileTag,
    feTurbulence: FETurbulenceTag,
    filter: FilterTag,
    foreignObject: ForeignObjectTag,
    g: GTag,
    image: ImageTag,
    line: LineTag,
    linearGradient: LinearGradientTag,
    marker: MarkerTag,
    mask: MaskTag,
    metadata: MetadataTag,
    mpath: MPathTag,
    path: PathTag,
    pattern: PatternTag,
    polygon: PolygonTag,
    polyline: PolylineTag,
    radialGradient: RadialGradientTag,
    rect: RectTag,
    script: ScriptTag,
    stop: StopTag,
    style: StyleTag,
    svg: SVGTag,
    switch: SwitchTag,
    symbol: SymbolTag,
    text: TextTag,
    title: TitleTag,
    tspan: TSpanTag,
    use: UseTag,
    view: ViewTag,
}

//// End Tag Map
