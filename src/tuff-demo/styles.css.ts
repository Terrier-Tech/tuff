import { globalStyle, style } from '@vanilla-extract/css'

const colors = {
    fg: '#222',
    bg: '#f8f8f8',
    button: '#08a',
    output: '#def'
}

globalStyle('html, body', {
    fontFamily: 'Arial, Helvetica, sans-serif',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    color: colors.fg,
    backgroundColor: colors.bg,
    margin: 0
})


export const button = style({
    display: 'block',
    backgroundColor: colors.button,
    color: '#fff',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
    padding: '0.5em 1em',
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

export const flexRow = style({
    display: 'flex',
    padding: '0.5em',
    gap: '0.5em'
})

export const flexStretch = style({
    flex: '1 1 auto'
})

export const flexShrink = style({
    flex: '0 0 auto'
})

export const output = style({
    padding: '0.5em',
    backgroundColor: colors.output
})