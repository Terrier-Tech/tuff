import Vecs, {Vec} from './vecs'
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
const SideNames = ['left', 'right', 'top', 'bottom'] as const

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
function toSides(b: Box): Sides {
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
function fromSides(s: Sides): Box {
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
function empty(): Box {
    return {x: 0, y: 0, width: 0, height: 0}
}

/**
 * Construct a box from either individual dimensions or vectors that represent them.
 */
function make(x: number, y: number, width: number, height: number): Box
function make(origin: Vec, size: Vec): Box
function make(array: number[]): Box
function make(xorigin: number|Vec|number[], ysize?: number|Vec, width?: number, height?: number): Box {
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
function center(b: Box): Vec {
    return {
        x: b.x + b.width / 2,
        y: b.y + b.height / 2
    }
}


/**
 * @returns a new box that includes both the passed box and the vector.
 */
function expand(b: Box, v: Vec): Box {
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
function union(b1: Box, b2: Box): Box {
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
function unionAll(boxes: Array<Box>): Box {
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
function fromPoints(points: Vec[]): Box {
    const allSides = points.map(v => Vecs.toSides(v))
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


/**
 * Add a vector to a box.
 * @param r1
 * @param v
 */
function add(r1: Box, v: Vec): Box {
    return {
        x: r1.x + v.x,
        y: r1.y + v.y,
        width: r1.width,
        height: r1.height
    }
}

/**
 * Subtract a vector from a box.
 * @param r1
 * @param v
 */
function subtract(r1: Box, v: Vec): Box {
    return {
        x: r1.x - v.x,
        y: r1.y - v.y,
        width: r1.width,
        height: r1.height
    }
}

/**
 * Compute the distance between two boxes.
 * If they overlap, returns the negative ratio of the area of b1 that is overlapped by b2.
 * @param b1
 * @param b2
 */
function distance(b1: Box, b2: Box): number {
    // Calculate the intersection area between the boxes
    const overlapLeft = Math.max(b1.x, b2.x)
    const overlapRight = Math.min(b1.x + b1.width, b2.x + b2.width)
    const overlapTop = Math.max(b1.y, b2.y)
    const overlapBottom = Math.min(b1.y + b1.height, b2.y + b2.height)

    const overlapWidth = Math.max(0, overlapRight - overlapLeft)
    const overlapHeight = Math.max(0, overlapBottom - overlapTop)
    const overlapArea = overlapWidth * overlapHeight

    // Calculate the area of b1
    const r1Area = b1.width * b1.height

    // Calculate the fraction of b1's area covered by b2
    const fractionCovered = overlapArea / r1Area

    // If the boxes don't overlap, calculate the shortest distance
    if (fractionCovered === 0) {
        const r1CenterX = b1.x + b1.width / 2
        const r1CenterY = b1.y + b1.height / 2
        const r2CenterX = b2.x + b2.width / 2
        const r2CenterY = b2.y + b2.height / 2

        const deltaX = Math.abs(r1CenterX - r2CenterX) - (b1.width + b2.width) / 2
        const deltaY = Math.abs(r1CenterY - r2CenterY) - (b1.height + b2.height) / 2

        if (deltaX < 0) {
            // they overlap in x, return the y distance
            return Math.abs(deltaY)
        }
        else if (deltaY < 0) {
            // they overlap in y, return the x distance
            return Math.abs(deltaX)
        }

        // return the euclidean distance
        return Math.sqrt(deltaX ** 2 + deltaY ** 2)
    }

    // Otherwise, return the fraction
    return -fractionCovered
}


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Boxes = {
    add,
    center,
    distance,
    empty,
    expand,
    fromPoints,
    fromSides,
    make,
    subtract,
    union,
    unionAll
}

export default Boxes