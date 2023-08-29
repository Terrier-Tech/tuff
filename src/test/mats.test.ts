import { describe, expect, test, it } from 'vitest'
import * as vec from '../vec'
import Mats, {Mat} from "../mats"

const epsilon = 0.0000001

test("matrix translation", () => {
    const delta = vec.make(1, 2)
    const m = Mats.translate(Mats.identity(), delta)
    const v = vec.identity()
    const v1 = Mats.transform(m, v)
    expect(v1.x).eq(delta.x)
    expect(v1.y).eq(delta.y)
})

test("matrix rotation", () => {
    const m = Mats.rotate(Mats.identity(), 90)
    const v = vec.make(1, 0)
    const v1 = Mats.transform(m, v)
    expect(v1.x).approximately(0, epsilon)
    expect(v1.y).approximately(1, epsilon)
})

test("matrix scaling", () => {
    const m = Mats.scale(Mats.identity(), 2, 3)
    const v = vec.make(1, 1)
    const v1 = Mats.transform(m, v)
    expect(v1.x).approximately(2, epsilon)
    expect(v1.y).approximately(3, epsilon)
})

function expectMatEquaility(actual: Mat, expected: Mat) {
    for (const [k,vActual] of Object.entries(actual)) {
        const vExpected = expected[k as keyof Mat]
        expect(vActual).approximately(vExpected, epsilon, `Expected element ${k} to be ${vExpected}, but it was ${vActual}`)
    }
}

test("matrix multiplcation", () => {
    // combine a scaling matrix with a translation matrix
    const mat1 = Mats.make(2, 0, 0, 2, 0, 0)
    const mat2 = Mats.make(1, 0, 0, 1, 10, 20)
    const result1 = Mats.multiply(mat1, mat2)
    expectMatEquaility(result1, { a: 2, b: 0, c: 0, d: 2, tx: 20, ty: 40 })

    // combine a rotation matrix with a translation matrix
    const mat3 = Mats.make(Math.cos(Math.PI / 2), Math.sin(Math.PI / 2), -Math.sin(Math.PI / 2), Math.cos(Math.PI / 2), 0, 0 )
    const mat4 = Mats.make(1, 0, 0, 1, 10, 20)
    const result2 = Mats.multiply(mat3, mat4)
    expectMatEquaility(result2, { a: 0, b: 1, c: -1, d: 0, tx: -20, ty: 10 })

})

test("matrix inversion", () => {
    const m1 = Mats.make(1, 0, 0, 1, 0, 0 )
    const m1Inverted = Mats.invert(m1)
    expectMatEquaility(m1, m1Inverted)

    const m2 = Mats.make(1, 0, 0, 2, 3, 4 )
    const m2Inverted = Mats.invert(m2)
    expectMatEquaility(m2, Mats.invert(m2Inverted))
})

test("matrix builder", () => {
    const builder = Mats.builder()
        .translate(1, 2)
        .rotate(30)
        .scale(0.9)
        .translate(-0.5, 1.5)
    const v = vec.make(3, -4)
    const v1 = Mats.transform(
        builder.buildInverse(),
        Mats.transform(builder.build(), v)
    )
    expect(v1).toMatchObject(v)
})

describe("matrix from boxes", () => {
    it('should return the correct matrix for identity transform', () => {
        const from = { x: 0, y: 0, width: 1, height: 1 }
        const to = { x: 0, y: 0, width: 1, height: 1 }
        const expected = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 }
        expectMatEquaility(Mats.fromBoxes(from, to), expected)
    })

    it('should return the correct matrix for scaling', () => {
        const from = { x: 0, y: 0, width: 1, height: 1 }
        const to = { x: 0, y: 0, width: 2, height: 3 }
        const expected = { a: 2, b: 0, c: 0, d: 3, tx: 0, ty: 0 }
        expectMatEquaility(Mats.fromBoxes(from, to), expected)
    })

    it('should return the correct matrix for translation', () => {
        const from = { x: 0, y: 0, width: 1, height: 1 }
        const to = { x: 1, y: 2, width: 1, height: 1 }
        const expected = { a: 1, b: 0, c: 0, d: 1, tx: 1, ty: 2 }
        expectMatEquaility(Mats.fromBoxes(from, to), expected)
    })

    it('should return the correct matrix for scaling and translation', () => {
        const from = { x: 0, y: 0, width: 1, height: 1 }
        const to = { x: 1, y: 2, width: 2, height: 3 }
        const expected = { a: 2, b: 0, c: 0, d: 3, tx: 1, ty: 2 }
        expectMatEquaility(Mats.fromBoxes(from, to), expected)
    })
})