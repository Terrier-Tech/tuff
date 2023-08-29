import * as vec from './vec'
import * as trig from './trig'
import Boxes, {Box} from "./boxes"

/**
 * An immutable 2D matrix type.
 */
export type Mat = {
    a: number
    b: number
    c: number
    d: number
    tx: number
    ty: number
}

/**
 * Make a matrix.
 * @param a position(0,0)   sx*cos(alpha)
 * @param b position (0,1)  sx*sin(alpha)
 * @param c position (1,0)  -sy*sin(alpha)
 * @param d position (1,1)  sy*cos(alpha)
 * @param tx position (2,0) translation by x
 * @param ty position (2,1) translation by y
 * @returns a new `Matrix` from the given components.
 */
function make(a: number, b: number, c: number, d: number, tx: number, ty: number): Mat {
    return {a, b, c, d, tx, ty}
}

/**
 * @returns a new identity matrix.
 */
const identity = (): Mat => {
    return make(1, 0, 0, 1, 0, 0)
}

/**
 * @returns an exact copy of `m`
 */
const dup = (m: Mat): Mat => {
    return {...m}
}

/**
 * @returns the multiplication of `m1` by `m2`.
 */
const multiply = (m1: Mat, m2: Mat): Mat => {
    return make(
        m1.a * m2.a + m1.c * m2.b,
        m1.b * m2.a + m1.d * m2.b,
        m1.a * m2.c + m1.c * m2.d,
        m1.b * m2.c + m1.d * m2.d,
        m1.a * m2.tx + m1.c * m2.ty + m1.tx,
        m1.b * m2.tx + m1.d * m2.ty + m1.ty
    )
}

/**
 * @returns matrix `m` translated by `v`.
 */
function translate(m: Mat, v: vec.Vec): Mat
function translate(m: Mat, x: number, y: number): Mat
function translate(m: Mat, vx: vec.Vec|number, y?: number): Mat {
    if (typeof vx == 'number') {
        return multiply(m, make(1, 0, 0, 1, vx, y || 0))
    }
    else {
        return multiply(m, make(1, 0, 0, 1, vx.x, vx.y))
    }
}

/**
 * Inverts the given transformation matrix.
 * @param m a matrix to invert
 * @returns the inverted marix
 */
const invert = (m: Mat): Mat => {
    const determinant = m.a * m.d - m.b * m.c

    if (determinant === 0) {
        throw new Error("Cannot invert matrix with determinant 0")
    }

    return {
        a: m.d / determinant,
        b: -m.b / determinant,
        c: -m.c / determinant,
        d: m.a / determinant,
        tx: (m.c * m.ty - m.d * m.tx) / determinant,
        ty: (m.b * m.tx - m.a * m.ty) / determinant,
    }
}


/**
 * @returns matrix `m` rotated by `angle` degrees.
 */
const rotate = (m: Mat, angle: number): Mat => {
    const cos = trig.cos(angle)
    const sin = trig.sin(angle)
    return multiply(m, make(cos, sin, -sin, cos, 0, 0))
}

/**
 * @returns matrix `m` scaled by `sx` and `sy`.
 */
const scale = (m: Mat, sx: number, sy?: number): Mat =>  {
    return multiply(m, make(sx, 0, 0, sy||sx, 0, 0))
}

/**
 * @returns matrix `m` skewed by `a` degrees along the x axis.
 */
const skewX = (m: Mat, a: number): Mat => {
    return multiply(m, make(1,0,Math.tan(a),1,0,0))
}

/**
 * @returns matrix `m` skewed by `a` degrees along the y axis.
 */
const skewY = (m: Mat, a: number): Mat => {
    return multiply(m, make(1,Math.tan(a),0,1,0,0))
}


/**
 * @returns `v` transformed by `m`.
 */
const transform = (m: Mat, v: vec.Vec): vec.Vec => {
    return {
        x: v.x * m.a + v.y * m.c + m.tx,
        y: v.x * m.b + v.y * m.d + m.ty
    }
}

/**
 * @returns a copy of `b` that's been transformed by `m`.
 */
const transformBox = (m: Mat, b: Box): Box => {
    let upperLeft = vec.make(b.x, b.y)
    let lowerRight = vec.make(b.x+b.width, b.y+b.height)
    upperLeft = transform(m, upperLeft)
    lowerRight = transform(m, lowerRight)
    return Boxes.make(upperLeft.x, upperLeft.y, lowerRight.x-upperLeft.x, lowerRight.y-upperLeft.y)
}


/**
 * A builder that composes transformations to generate matrices (and their inverses).
 */
class Builder {
    private steps: Array<(mat: Mat) => Mat> = []
    private inverseSteps: Array<(mat: Mat) => Mat> = []

    /**
     * Translate the transformation by the given amount.
     */
    translate(x: number|vec.Vec, y?: number) {
        if (typeof x == 'object') {
            this.steps.push(m => translate(m, x))
            this.inverseSteps.unshift(m => translate(m, -x.x, -x.y))
        }
        else {
            this.steps.push(m => translate(m, x, y||0))
            this.inverseSteps.unshift(m => translate(m, -x, -(y||0)))
        }
        return this
    }

    /**
     * Rotates the transformation by the given amount.
     */
    rotate(deg: number) {
        this.steps.push(m => rotate(m, deg))
        this.inverseSteps.unshift(m => rotate(m, -deg))
        return this
    }

    /**
     * Scales the transformation by the given amount.
     */
    scale(factor: number) {
        this.steps.push(m => scale(m, factor))
        this.inverseSteps.unshift(m => scale(m, 1/factor))
        return this
    }

    /**
     * Builds the matrix.
     */
    build(): Mat {
        let m = identity()
        for (let step of this.steps) {
            m = step(m)
        }
        return m
    }

    /**
     * Builds the inverse of the given steps.
     * @returns the inverse transformation matrix
     */
    buildInverse(): Mat {
        let m = identity()
        for (let step of this.inverseSteps) {
            m = step(m)
        }
        return m
    }

}



/**
 * Creates a builder that composes transformations to generate matrices (and their inverses).
 */
function builder(): Builder {
    return new Builder()
}


function fromBoxes(from: Box, to: Box): Mat {
    const scaleX = to.width / from.width
    const scaleY = to.height / from.height
    const translateX = to.x - from.x * scaleX
    const translateY = to.y - from.y * scaleY
    return { a: scaleX, b: 0, c: 0, d: scaleY, tx: translateX, ty: translateY }
}


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Mats = {
    builder,
    dup,
    fromBoxes,
    identity,
    invert,
    make,
    multiply,
    rotate,
    scale,
    skewX,
    skewY,
    transform,
    transformBox,
    translate
}

export default Mats