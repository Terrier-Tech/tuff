import { Attrs, Tag, TagArgs } from './tags'

export abstract class SvgTagBase<AttrsType extends Attrs> extends Tag<AttrsType> {


    //// Begin Tag Methods

    a(...args: TagArgs<SVGATag,SVGATagAttrs>[]) : SVGATag {
        return this.child(SVGATag, "a", ...args)
    }

    clipPath(...args: TagArgs<SVGClipPathTag,SVGClipPathTagAttrs>[]) : SVGClipPathTag {
        return this.child(SVGClipPathTag, "clipPath", ...args)
    }

    defs(...args: TagArgs<SVGDefsTag,SVGDefsTagAttrs>[]) : SVGDefsTag {
        return this.child(SVGDefsTag, "defs", ...args)
    }

    desc(...args: TagArgs<SVGDescTag,SVGDescTagAttrs>[]) : SVGDescTag {
        return this.child(SVGDescTag, "desc", ...args)
    }

    feBlend(...args: TagArgs<SVGFEBlendTag,SVGFEBlendTagAttrs>[]) : SVGFEBlendTag {
        return this.child(SVGFEBlendTag, "feBlend", ...args)
    }

    feColorMatrix(...args: TagArgs<SVGFEColorMatrixTag,SVGFEColorMatrixTagAttrs>[]) : SVGFEColorMatrixTag {
        return this.child(SVGFEColorMatrixTag, "feColorMatrix", ...args)
    }

    feComponentTransfer(...args: TagArgs<SVGFEComponentTransferTag,SVGFEComponentTransferTagAttrs>[]) : SVGFEComponentTransferTag {
        return this.child(SVGFEComponentTransferTag, "feComponentTransfer", ...args)
    }

    feComposite(...args: TagArgs<SVGFECompositeTag,SVGFECompositeTagAttrs>[]) : SVGFECompositeTag {
        return this.child(SVGFECompositeTag, "feComposite", ...args)
    }

    feConvolveMatrix(...args: TagArgs<SVGFEConvolveMatrixTag,SVGFEConvolveMatrixTagAttrs>[]) : SVGFEConvolveMatrixTag {
        return this.child(SVGFEConvolveMatrixTag, "feConvolveMatrix", ...args)
    }

    feDiffuseLighting(...args: TagArgs<SVGFEDiffuseLightingTag,SVGFEDiffuseLightingTagAttrs>[]) : SVGFEDiffuseLightingTag {
        return this.child(SVGFEDiffuseLightingTag, "feDiffuseLighting", ...args)
    }

    feDisplacementMap(...args: TagArgs<SVGFEDisplacementMapTag,SVGFEDisplacementMapTagAttrs>[]) : SVGFEDisplacementMapTag {
        return this.child(SVGFEDisplacementMapTag, "feDisplacementMap", ...args)
    }

    feDistantLight(...args: TagArgs<SVGFEDistantLightTag,SVGFEDistantLightTagAttrs>[]) : SVGFEDistantLightTag {
        return this.child(SVGFEDistantLightTag, "feDistantLight", ...args)
    }

    feDropShadow(...args: TagArgs<SVGFEDropShadowTag,SVGFEDropShadowTagAttrs>[]) : SVGFEDropShadowTag {
        return this.child(SVGFEDropShadowTag, "feDropShadow", ...args)
    }

    feFlood(...args: TagArgs<SVGFEFloodTag,SVGFEFloodTagAttrs>[]) : SVGFEFloodTag {
        return this.child(SVGFEFloodTag, "feFlood", ...args)
    }

    feGaussianBlur(...args: TagArgs<SVGFEGaussianBlurTag,SVGFEGaussianBlurTagAttrs>[]) : SVGFEGaussianBlurTag {
        return this.child(SVGFEGaussianBlurTag, "feGaussianBlur", ...args)
    }

    feImage(...args: TagArgs<SVGFEImageTag,SVGFEImageTagAttrs>[]) : SVGFEImageTag {
        return this.child(SVGFEImageTag, "feImage", ...args)
    }

    feMerge(...args: TagArgs<SVGFEMergeTag,SVGFEMergeTagAttrs>[]) : SVGFEMergeTag {
        return this.child(SVGFEMergeTag, "feMerge", ...args)
    }

    feMergeNode(...args: TagArgs<SVGFEMergeNodeTag,SVGFEMergeNodeTagAttrs>[]) : SVGFEMergeNodeTag {
        return this.child(SVGFEMergeNodeTag, "feMergeNode", ...args)
    }

    feMorphology(...args: TagArgs<SVGFEMorphologyTag,SVGFEMorphologyTagAttrs>[]) : SVGFEMorphologyTag {
        return this.child(SVGFEMorphologyTag, "feMorphology", ...args)
    }

    feOffset(...args: TagArgs<SVGFEOffsetTag,SVGFEOffsetTagAttrs>[]) : SVGFEOffsetTag {
        return this.child(SVGFEOffsetTag, "feOffset", ...args)
    }

    fePointLight(...args: TagArgs<SVGFEPointLightTag,SVGFEPointLightTagAttrs>[]) : SVGFEPointLightTag {
        return this.child(SVGFEPointLightTag, "fePointLight", ...args)
    }

    feSpecularLighting(...args: TagArgs<SVGFESpecularLightingTag,SVGFESpecularLightingTagAttrs>[]) : SVGFESpecularLightingTag {
        return this.child(SVGFESpecularLightingTag, "feSpecularLighting", ...args)
    }

    feSpotLight(...args: TagArgs<SVGFESpotLightTag,SVGFESpotLightTagAttrs>[]) : SVGFESpotLightTag {
        return this.child(SVGFESpotLightTag, "feSpotLight", ...args)
    }

    feTile(...args: TagArgs<SVGFETileTag,SVGFETileTagAttrs>[]) : SVGFETileTag {
        return this.child(SVGFETileTag, "feTile", ...args)
    }

    feTurbulence(...args: TagArgs<SVGFETurbulenceTag,SVGFETurbulenceTagAttrs>[]) : SVGFETurbulenceTag {
        return this.child(SVGFETurbulenceTag, "feTurbulence", ...args)
    }

    filter(...args: TagArgs<SVGFilterTag,SVGFilterTagAttrs>[]) : SVGFilterTag {
        return this.child(SVGFilterTag, "filter", ...args)
    }

    foreignObject(...args: TagArgs<SVGForeignObjectTag,SVGForeignObjectTagAttrs>[]) : SVGForeignObjectTag {
        return this.child(SVGForeignObjectTag, "foreignObject", ...args)
    }

    g(...args: TagArgs<SVGGTag,SVGGTagAttrs>[]) : SVGGTag {
        return this.child(SVGGTag, "g", ...args)
    }

    image(...args: TagArgs<SVGImageTag,SVGImageTagAttrs>[]) : SVGImageTag {
        return this.child(SVGImageTag, "image", ...args)
    }

    marker(...args: TagArgs<SVGMarkerTag,SVGMarkerTagAttrs>[]) : SVGMarkerTag {
        return this.child(SVGMarkerTag, "marker", ...args)
    }

    mask(...args: TagArgs<SVGMaskTag,SVGMaskTagAttrs>[]) : SVGMaskTag {
        return this.child(SVGMaskTag, "mask", ...args)
    }

    metadata(...args: TagArgs<SVGMetadataTag,SVGMetadataTagAttrs>[]) : SVGMetadataTag {
        return this.child(SVGMetadataTag, "metadata", ...args)
    }

    mpath(...args: TagArgs<SVGMPathTag,SVGMPathTagAttrs>[]) : SVGMPathTag {
        return this.child(SVGMPathTag, "mpath", ...args)
    }

    pattern(...args: TagArgs<SVGPatternTag,SVGPatternTagAttrs>[]) : SVGPatternTag {
        return this.child(SVGPatternTag, "pattern", ...args)
    }

    script(...args: TagArgs<SVGScriptTag,SVGScriptTagAttrs>[]) : SVGScriptTag {
        return this.child(SVGScriptTag, "script", ...args)
    }

    stop(...args: TagArgs<SVGStopTag,SVGStopTagAttrs>[]) : SVGStopTag {
        return this.child(SVGStopTag, "stop", ...args)
    }

    style(...args: TagArgs<SVGStyleTag,SVGStyleTagAttrs>[]) : SVGStyleTag {
        return this.child(SVGStyleTag, "style", ...args)
    }

    svg(...args: TagArgs<SVGSVGTag,SVGSVGTagAttrs>[]) : SVGSVGTag {
        return this.child(SVGSVGTag, "svg", ...args)
    }

    switch(...args: TagArgs<SVGSwitchTag,SVGSwitchTagAttrs>[]) : SVGSwitchTag {
        return this.child(SVGSwitchTag, "switch", ...args)
    }

    symbol(...args: TagArgs<SVGSymbolTag,SVGSymbolTagAttrs>[]) : SVGSymbolTag {
        return this.child(SVGSymbolTag, "symbol", ...args)
    }

    title(...args: TagArgs<SVGTitleTag,SVGTitleTagAttrs>[]) : SVGTitleTag {
        return this.child(SVGTitleTag, "title", ...args)
    }

    use(...args: TagArgs<SVGUseTag,SVGUseTagAttrs>[]) : SVGUseTag {
        return this.child(SVGUseTag, "use", ...args)
    }

    view(...args: TagArgs<SVGViewTag,SVGViewTagAttrs>[]) : SVGViewTag {
        return this.child(SVGViewTag, "view", ...args)
    }

//// End Tag Methods

}


// DO NOT EDIT THE CODE BELOW!
//// Begin Tag Classes

export type SVGATagAttrs = SVGTagAttrs & {
    rel?: string
}

export class SVGATag extends SvgTagBase<SVGATagAttrs> {}

export type SVGAnimationTagAttrs = SVGTagAttrs & {
}

export class SVGAnimationTag extends SvgTagBase<SVGAnimationTagAttrs> {}

export type SVGClipPathTagAttrs = SVGTagAttrs & {
}

export class SVGClipPathTag extends SvgTagBase<SVGClipPathTagAttrs> {}

export type SVGComponentTransferFunctionTagAttrs = SVGTagAttrs & {
}

export class SVGComponentTransferFunctionTag extends SvgTagBase<SVGComponentTransferFunctionTagAttrs> {}

export type SVGDefsTagAttrs = SVGTagAttrs & {
}

export class SVGDefsTag extends SvgTagBase<SVGDefsTagAttrs> {}

export type SVGDescTagAttrs = SVGTagAttrs & {
}

export class SVGDescTag extends SvgTagBase<SVGDescTagAttrs> {}

export type SVGTagAttrs = Attrs & {
}

export class SVGTag extends SvgTagBase<SVGTagAttrs> {}

export type SVGFEBlendTagAttrs = SVGTagAttrs & {
}

export class SVGFEBlendTag extends SvgTagBase<SVGFEBlendTagAttrs> {}

export type SVGFEColorMatrixTagAttrs = SVGTagAttrs & {
}

export class SVGFEColorMatrixTag extends SvgTagBase<SVGFEColorMatrixTagAttrs> {}

export type SVGFEComponentTransferTagAttrs = SVGTagAttrs & {
}

export class SVGFEComponentTransferTag extends SvgTagBase<SVGFEComponentTransferTagAttrs> {}

export type SVGFECompositeTagAttrs = SVGTagAttrs & {
}

export class SVGFECompositeTag extends SvgTagBase<SVGFECompositeTagAttrs> {}

export type SVGFEConvolveMatrixTagAttrs = SVGTagAttrs & {
}

export class SVGFEConvolveMatrixTag extends SvgTagBase<SVGFEConvolveMatrixTagAttrs> {}

export type SVGFEDiffuseLightingTagAttrs = SVGTagAttrs & {
}

export class SVGFEDiffuseLightingTag extends SvgTagBase<SVGFEDiffuseLightingTagAttrs> {}

export type SVGFEDisplacementMapTagAttrs = SVGTagAttrs & {
}

export class SVGFEDisplacementMapTag extends SvgTagBase<SVGFEDisplacementMapTagAttrs> {}

export type SVGFEDistantLightTagAttrs = SVGTagAttrs & {
}

export class SVGFEDistantLightTag extends SvgTagBase<SVGFEDistantLightTagAttrs> {}

export type SVGFEDropShadowTagAttrs = SVGTagAttrs & {
}

export class SVGFEDropShadowTag extends SvgTagBase<SVGFEDropShadowTagAttrs> {}

export type SVGFEFloodTagAttrs = SVGTagAttrs & {
}

export class SVGFEFloodTag extends SvgTagBase<SVGFEFloodTagAttrs> {}

export type SVGFEGaussianBlurTagAttrs = SVGTagAttrs & {
}

export class SVGFEGaussianBlurTag extends SvgTagBase<SVGFEGaussianBlurTagAttrs> {}

export type SVGFEImageTagAttrs = SVGTagAttrs & {
}

export class SVGFEImageTag extends SvgTagBase<SVGFEImageTagAttrs> {}

export type SVGFEMergeTagAttrs = SVGTagAttrs & {
}

export class SVGFEMergeTag extends SvgTagBase<SVGFEMergeTagAttrs> {}

export type SVGFEMergeNodeTagAttrs = SVGTagAttrs & {
}

export class SVGFEMergeNodeTag extends SvgTagBase<SVGFEMergeNodeTagAttrs> {}

export type SVGFEMorphologyTagAttrs = SVGTagAttrs & {
}

export class SVGFEMorphologyTag extends SvgTagBase<SVGFEMorphologyTagAttrs> {}

export type SVGFEOffsetTagAttrs = SVGTagAttrs & {
}

export class SVGFEOffsetTag extends SvgTagBase<SVGFEOffsetTagAttrs> {}

export type SVGFEPointLightTagAttrs = SVGTagAttrs & {
}

export class SVGFEPointLightTag extends SvgTagBase<SVGFEPointLightTagAttrs> {}

export type SVGFESpecularLightingTagAttrs = SVGTagAttrs & {
}

export class SVGFESpecularLightingTag extends SvgTagBase<SVGFESpecularLightingTagAttrs> {}

export type SVGFESpotLightTagAttrs = SVGTagAttrs & {
}

export class SVGFESpotLightTag extends SvgTagBase<SVGFESpotLightTagAttrs> {}

export type SVGFETileTagAttrs = SVGTagAttrs & {
}

export class SVGFETileTag extends SvgTagBase<SVGFETileTagAttrs> {}

export type SVGFETurbulenceTagAttrs = SVGTagAttrs & {
}

export class SVGFETurbulenceTag extends SvgTagBase<SVGFETurbulenceTagAttrs> {}

export type SVGFilterTagAttrs = SVGTagAttrs & {
}

export class SVGFilterTag extends SvgTagBase<SVGFilterTagAttrs> {}

export type SVGForeignObjectTagAttrs = SVGTagAttrs & {
}

export class SVGForeignObjectTag extends SvgTagBase<SVGForeignObjectTagAttrs> {}

export type SVGGTagAttrs = SVGTagAttrs & {
}

export class SVGGTag extends SvgTagBase<SVGGTagAttrs> {}

export type SVGGeometryTagAttrs = SVGTagAttrs & {
}

export class SVGGeometryTag extends SvgTagBase<SVGGeometryTagAttrs> {}

export type SVGGradientTagAttrs = SVGTagAttrs & {
}

export class SVGGradientTag extends SvgTagBase<SVGGradientTagAttrs> {}

export type SVGGraphicsTagAttrs = SVGTagAttrs & {
}

export class SVGGraphicsTag extends SvgTagBase<SVGGraphicsTagAttrs> {}

export type SVGImageTagAttrs = SVGTagAttrs & {
}

export class SVGImageTag extends SvgTagBase<SVGImageTagAttrs> {}

export type SVGMPathTagAttrs = SVGTagAttrs & {
}

export class SVGMPathTag extends SvgTagBase<SVGMPathTagAttrs> {}

export type SVGMarkerTagAttrs = SVGTagAttrs & {
}

export class SVGMarkerTag extends SvgTagBase<SVGMarkerTagAttrs> {}

export type SVGMaskTagAttrs = SVGTagAttrs & {
}

export class SVGMaskTag extends SvgTagBase<SVGMaskTagAttrs> {}

export type SVGMetadataTagAttrs = SVGTagAttrs & {
}

export class SVGMetadataTag extends SvgTagBase<SVGMetadataTagAttrs> {}

export type SVGPatternTagAttrs = SVGTagAttrs & {
}

export class SVGPatternTag extends SvgTagBase<SVGPatternTagAttrs> {}

export type SVGSVGTagAttrs = SVGTagAttrs & {
    currentScale?: number
}

export class SVGSVGTag extends SvgTagBase<SVGSVGTagAttrs> {}

export type SVGScriptTagAttrs = SVGTagAttrs & {
    type?: string
}

export class SVGScriptTag extends SvgTagBase<SVGScriptTagAttrs> {}

export type SVGStopTagAttrs = SVGTagAttrs & {
}

export class SVGStopTag extends SvgTagBase<SVGStopTagAttrs> {}

export type SVGStyleTagAttrs = SVGTagAttrs & {
    disabled?: boolean
    media?: string
    title?: string
    type?: string
}

export class SVGStyleTag extends SvgTagBase<SVGStyleTagAttrs> {}

export type SVGSwitchTagAttrs = SVGTagAttrs & {
}

export class SVGSwitchTag extends SvgTagBase<SVGSwitchTagAttrs> {}

export type SVGSymbolTagAttrs = SVGTagAttrs & {
}

export class SVGSymbolTag extends SvgTagBase<SVGSymbolTagAttrs> {}

export type SVGTextContentTagAttrs = SVGTagAttrs & {
}

export class SVGTextContentTag extends SvgTagBase<SVGTextContentTagAttrs> {}

export type SVGTitleTagAttrs = SVGTagAttrs & {
}

export class SVGTitleTag extends SvgTagBase<SVGTitleTagAttrs> {}

export type SVGUseTagAttrs = SVGTagAttrs & {
}

export class SVGUseTag extends SvgTagBase<SVGUseTagAttrs> {}

export type SVGViewTagAttrs = SVGTagAttrs & {
}

export class SVGViewTag extends SvgTagBase<SVGViewTagAttrs> {}

//// End Tag Classes
