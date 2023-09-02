import { Sides } from "./boxes"

/**
 * Immutable 2D vector, the only kind.
 */
export type Vec = {
    readonly x: number
    readonly y: number
}

/**
 * Makes a new vector from raw x/y values.
 */
function make(x: number, y: number): Vec
function make(xy: Array<number>): Vec
function make(xxy: number | Array<number>, y?: number): Vec {
    if (Array.isArray(xxy)) {
        if (xxy.length == 2) {
            return {x: xxy[0], y: xxy[1]}
        }
        throw(`Raw vector arrays must have exactly 2 elements, not ${xxy.length}: ${xxy}`)
    }
    return {x: xxy, y: y!}
}

/** 
 * Creates a new vector from the `index` and `index+1` elements of an array.
 */
function slice(array: Array<number>, index: number): Vec {
    if (array.length < index+1) {
        throw `Trying to slice a vector out of a ${array.length}-element array at index ${index}`
    }
    return {x: array[index], y: array[index+1]}
}

/**
 * @returns a new identity vector.
 */
const identity = (): Vec => {
    return {x: 0, y: 0}
}

/**
 * @returns a duplicate of `v`
 */
const dup = (v: Vec): Vec => {
    return {... v}
}

/**
 * @returns a new origin vector
 */
const origin = (): Vec => {
    return {x: 0, y: 0}
}

/**
 * @param v the vector to print
 * @param precision the number of significant digits for each component - 0 means all
 * @returns the coordinates joined by `delimeter`.
 */
const print = (v: Vec, precision=0): string => {
    if (precision) {
        return [v.x.toPrecision(precision), v.y.toPrecision(precision)].join(',')
    }
    return [v.x, v.y].join(',')
}

/**
 * @returns `v1` + `v2`
 */
const add = (v1: Vec, v2: Vec): Vec => {
    return {x: v1.x + v2.x, y: v1.y + v2.y}
}

/**
 * @returns `v1` - `v2`
 */
const subtract = (v1: Vec, v2: Vec): Vec => {
    return {x: v1.x - v2.x, y: v1.y - v2.y}
}

/**
 * @returns the dot product of `v1` and `v2`
 */
const dot = (v1: Vec, v2: Vec): number => {
    return v1.x*v2.x + v1.y*v2.y
}

/**
 * @returns the length of a vector.
 */
const len = (v: Vec): number => {
    return Math.sqrt(dot(v, v))
}

/**
 * @returns a normalized (length=1) version of the vector.
 */
const norm = (v: Vec): Vec => {
    const l = len(v)
    return {x: v.x/l, y: v.y/l}
}

/**
 * @returns the mirror of `v` about the origin.
 */
const mirror = (v: Vec): Vec => {
    return {x: -v.x, y: -v.y}
}

/**
 * Coordinates within this ratio of each other are considered the same (or mirrored).
 */
 const EpsilonRatio = 0.0001

 /**
  * @returns `true` if `v1` and `v2` are the opposite of each other (within `EpsilonRatio`).
  */
 const isMirror = (v1: Vec, v2: Vec): boolean => {
     const len1 = len(v1)
     const len2 = len(v2)
     const maxLen = Math.max(len1, len2)
     return maxLen > 0 && 
        Math.abs(len1-len2)/maxLen < EpsilonRatio && 
        Math.abs(v1.x+v2.x)/maxLen < EpsilonRatio
 }

/**
 * @returns a `Sides` containing the vector.
 */
const toSides = (v: Vec): Sides => {
    return {
        left: v.x,
        right: v.x,
        top: v.y,
        bottom: v.y
    }
}


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Vecs = {
    add,
    dot,
    dup,
    identity,
    isMirror,
    len,
    make,
    mirror,
    norm,
    origin,
    print,
    toSides,
    slice,
    subtract
}

export default Vecs