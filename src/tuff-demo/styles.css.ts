import { globalStyle, style } from '@vanilla-extract/css'

const colors = {
    fg: '#222',
    bg: '#f8f8f8',
    button: '#08a',
    output: '#def',
    border: '#ccc'
}

const sizes = {
    pad: 12,
    font: 16,
    fieldHeight: 32,
    borderRadius: 4,
    formWidth: 420
}

globalStyle('html, body', {
    fontFamily: 'Arial, Helvetica, sans-serif',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    color: colors.fg,
    backgroundColor: colors.bg,
    fontSize: sizes.font,
    boxSizing: 'border-box',
    margin: 0
})

globalStyle('*', {
    boxSizing: 'border-box'
})


export const button = style({
    display: 'block',
    backgroundColor: colors.button,
    color: '#fff',
    borderRadius: sizes.borderRadius,
    fontWeight: 'bold',
    cursor: 'pointer',
    padding: sizes.pad,
    textAlign: 'center',
    userSelect: 'none',
    textDecoration: 'none',
    ':hover': {
        transform: 'scale(1.04)'
    },
    ':active': {
        transform: 'scale(0.96)'
    }
})

export const padded = style({
    padding: sizes.pad
})

export const flexRow = style({
    display: 'flex',
    gap: sizes.pad
})

export const flexStretch = style({
    flex: '1 1 auto'
})

export const flexShrink = style({
    flex: '0 0 auto'
})

export const output = style({
    padding: sizes.pad,
    borderRadius: sizes.borderRadius,
    backgroundColor: colors.output
})

export const fixedBottom = style({
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0
})


// Forms

globalStyle('form', {
    padding: sizes.pad,
    display: 'flex',
    flexDirection: 'column',
    gap: sizes.pad,
    backgroundColor: '#fff',
    borderRadius: sizes.borderRadius,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    margin: '1em auto',
    width: sizes.formWidth,
    maxWidth: '90%'
})

globalStyle('input, textarea', {
    fontSize: sizes.font,
    height: sizes.fieldHeight,
    padding: '6px 8px',
    display: 'block',
    border: `1px solid ${colors.border}`,
    borderRadius: sizes.borderRadius-1,
    width: '100%'
})
globalStyle('textarea', {
    height: 'initial'
})

globalStyle('input[type=checkbox], input[type=radio]', {
    width: 'initial',
    display: 'inline-block',
    height: 'initial',
    padding: 0,
    transform: 'scale(1.25)'
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