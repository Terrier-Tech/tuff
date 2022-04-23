import { globalStyle, style } from '@vanilla-extract/css'

const fontFamily = 'Arial, Helvetica, sans-serif'

const colors = {
    fg: '#222',
    bg: '#f8f8f8',
    button: '#08a',
    warn: '#ffa602',
    output: '#e8f0ff',
    border: '#ccc',
    preview: '#aaa',
    contact: '#f8f8f8',
    selected: '#ffa500'
}

const sizes = {
    pad: 12,
    font: 16,
    fieldHeight: 32,
    borderRadius: 4,
    formWidth: 420
}

globalStyle('html, body', {
    fontFamily: fontFamily,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    color: colors.fg,
    backgroundColor: colors.bg,
    fontSize: sizes.font,
    boxSizing: 'border-box',
    margin: 0
})

globalStyle('body', {
    paddingBottom: '4em'
})

globalStyle('*', {
    boxSizing: 'border-box'
})

export const padded = style({
    padding: sizes.pad
})

export const flexRow = style({
    display: 'flex',
    gap: sizes.pad
})

export const flexColumn = style({
    display: 'flex',
    flexDirection: 'column',
    gap: sizes.pad
})

export const flexStretch = style({
    flex: '1 1 auto'
})

export const flexShrink = style({
    flex: '0 0 auto'
})

const frameShadow = {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
}

const insetShadow = {
    boxShadow: 'inset 0 1px 6px rgba(0, 0, 0, 0.1)'
}

export const output = style({
    padding: sizes.pad,
    borderRadius: sizes.borderRadius,
    backgroundColor: colors.output,
    ...insetShadow
})

export const fixedBottom = style({
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0
})


// Links

globalStyle('a', {
    color: colors.button,
    cursor: 'pointer',
    userSelect: 'none',
    fontSize: sizes.font
})

const scalePush = {
    ':hover': {
        transform: 'scale(1.04)'
    },
    ':active': {
        transform: 'scale(0.96)'
    }
}

export const button = style({
    display: 'block',
    backgroundColor: colors.button,
    color: '#fff',
    borderRadius: sizes.borderRadius,
    fontWeight: 'bold',
    padding: `${sizes.pad}px ${sizes.pad*2}px`,
    textAlign: 'center',
    textDecoration: 'none',
    ...scalePush
})

export const warnBg = style({
    backgroundColor: colors.warn
})

export const characterLink = style({
    fontSize: '150%',
    display: 'inline-block',
    lineHeight: 0,
    ...scalePush
})


// Inputs

globalStyle('input, textarea', {
    fontSize: sizes.font,
    height: sizes.fieldHeight,
    padding: '8px',
    display: 'block',
    border: `1px solid ${colors.border}`,
    borderRadius: sizes.borderRadius-1,
    width: '100%'
})
globalStyle('textarea', {
    height: 'initial',
    fontFamily: fontFamily
})

globalStyle('input[type=checkbox], input[type=radio]', {
    width: 'initial',
    display: 'inline-block',
    height: 'initial',
    padding: 0,
    margin: 0,
    transform: 'scale(1.2)'
})


// Labels

globalStyle('label', {
    display: 'flex',
    cursor: 'pointer',
    gap: 8,
    fontSize: 14,
    alignItems: 'center'
})

globalStyle('label input', {
    flex: '0 0 auto',
    width: 'initial'
})


// Part List

export const partPreview = style({
    margin: `0 ${sizes.pad}px`,
    backgroundColor: '#fff',
    borderRadius: sizes.borderRadius,
    ...frameShadow
})

export const partPreviewTitle = style({
    margin: `${sizes.pad*2}px 0 ${sizes.pad}px 0`,
    color: colors.preview,
    fontSize: 18,
    textShadow: '0 1px 0 #fff'
})


// Contacts

export const contactsContainer = style({
    display: 'flex',
    flexWrap: 'wrap',
    gap: sizes.pad,
    padding: sizes.pad
})

export const contactForm = style({
    flex: `0 0 240px`,
    padding: sizes.pad,
    display: 'flex',
    flexDirection: 'column',
    gap: sizes.pad,
    borderRadius: sizes.borderRadius,
    backgroundColor: colors.contact,
    ...insetShadow
})

export const phoneForm = style({
    padding: sizes.pad,
    borderRadius: sizes.borderRadius,
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column',
    gap: sizes.pad,
    ...frameShadow
})


// Shapes

export const shapesScroller = style({
    width: '100%',
    height: 600,
    overflow: 'scroll'
})

export const shapesSvg = style({
    backgroundColor: '#ffffff',
    ...frameShadow
})

export const shape = style({
    cursor: 'move'
})

export const selectedShape = style({
    stroke: colors.selected,
    fill: `${colors.selected}44`,
    strokeWidth: 4
})


// Nav

export const navChild = style({
    padding: '2em',
    textAlign: 'center'
})