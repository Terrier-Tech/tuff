import * as vec from './vec'
import Arrays from "./arrays"

/**
 * The size of a box.
 */
export type Size = {
    readonly width: number
    readonly height: number
}

/**
 * Immutable box type.
 */
 export type Box = {
    readonly x: number
    readonly y: number
    readonly width: number
    readonly height: number
}

/**
 * Mutable box type, only use this when necessary.
 */
export type MutableBox = Partial<Box>

/**
 * Literal side names.
 */
export const SideNames = ['left', 'right', 'top', 'bottom'] as const

/**
 * A key for one of the sides.
 */
 export type Side = typeof SideNames[number]

/**
 * Contains the same information as a Box, but using the the four sides instead of width and height.
 */
export type Sides = {
    readonly [side in Side]: number
}

/**
 * @returns the +Sides+ of the box.
 */
export const toSides = (b: Box): Sides => {
    return {
        left: b.x,
        top: b.y,
        right: b.x + b.width,
        bottom: b.y + b.height
    }
}

/**
 * @returns the +Box+ represented by the sides.
 */
export const fromSides = (s: Sides): Box => {
    return {
        x: s.left,
        y: s.top,
        width: s.right - s.left,
        height: s.bottom - s.top
    }
}

/**
 * @returns an empty box.
 */
export const empty = (): Box => {
    return {x: 0, y: 0, width: 0, height: 0}
}

/**
 * Construct a box from either individual dimensions or vectors that represent them.
 */
export function make(x: number, y: number, width: number, height: number): Box
export function make(origin: vec.Vec, size: vec.Vec): Box
export function make(array: number[]): Box
export function make(xorigin: number|vec.Vec|number[], ysize?: number|vec.Vec, width?: number, height?: number): Box {
    if (Array.isArray(xorigin)) {
        if (xorigin.length == 4) {
            return {x: xorigin[0], y: xorigin[1], width: xorigin[2], height: xorigin[3]}
        }
        throw `You must pass exactly 4 numbers into box.make, not ${xorigin.length}`
    }
    else if (typeof xorigin == 'number') {
        if (typeof ysize == 'number') {
            return {x: xorigin, y: ysize, width: width||0, height: height||0}
        }
        throw `If the first argument is a number, the second one should be as well`
    }
    else {
        if (typeof ysize == 'object') {
            return {x: xorigin.x, y: xorigin.y, width: ysize.x, height: ysize.y}
        }
        throw `If the first argument is an object, the second one should be as well`
    }
}

/**
 * @returns the center of the box.
 */
export const center = (b: Box): vec.Vec => {
    return {
        x: b.x + b.width/2,
        y: b.y + b.height/2
    }
}

/**
 * @returns a new box that includes both the passed box and the vector.
 */
export const expand = (b: Box, v: vec.Vec): Box => {
    const s = {
        left: Math.min(b.x, v.x),
        top: Math.min(b.y, v.y),
        right: Math.max(b.x + b.width, v.x),
        bottom: Math.max(b.y + b.height, v.y)
    }
    return fromSides(s)
}

/**
 * @returns a +Box+ that contains both passed boxes.
 */
export const union = (b1: Box, b2: Box): Box => {
    const s1 = toSides(b1)
    const s2 = toSides(b2)
    const s = {
        left: Math.min(s1.left, s2.left),
        right: Math.max(s1.right, s2.right),
        top: Math.min(s1.top, s2.top),
        bottom: Math.max(s1.bottom, s2.bottom)
    }
    return fromSides(s)
}

/**
 * @returns a single box containing all boxes.
 */
export const unionAll = (boxes: Array<Box>): Box => {
    if (boxes.length == 1) {
        return boxes[0]
    }
    const allSides = boxes.map(b => toSides(b))
    const sidesUnion = {
        left: Arrays.min(allSides.map(s => s.left)),
        right: Arrays.max(allSides.map(s => s.right)),
        top: Arrays.min(allSides.map(s => s.top)),
        bottom: Arrays.max(allSides.map(s => s.bottom))
    }
    return fromSides(sidesUnion)
}


/**
 * @returns a box that encapsulates an array of points
 */
export const fromPoints = (points: vec.Vec[]): Box => {
    const allSides = points.map(v => vec.toSides(v))
    if (allSides.length == 1) {
        return fromSides(allSides[0])
    }
    const sidesUnion = {
        left: Arrays.min(allSides.map(s => s.left)),
        right: Arrays.max(allSides.map(s => s.right)),
        top: Arrays.min(allSides.map(s => s.top)),
        bottom: Arrays.max(allSides.map(s => s.bottom))
    }
    return fromSides(sidesUnion)
}