import { describe, expect, test, it } from 'vitest'
import * as vec from '../vec'
import * as mat from '../mat'

const epsilon = 0.0000001

test("matrix translation", () => {
    const delta = vec.make(1, 2)
    const m = mat.translate(mat.identity(), delta)
    const v = vec.identity()
    const v1 = mat.transform(m, v)
    expect(v1.x).eq(delta.x)
    expect(v1.y).eq(delta.y)
})

test("matrix rotation", () => {
    const m = mat.rotate(mat.identity(), 90)
    const v = vec.make(1, 0)
    const v1 = mat.transform(m, v)
    expect(v1.x).approximately(0, epsilon)
    expect(v1.y).approximately(1, epsilon)
})

test("matrix scaling", () => {
    const m = mat.scale(mat.identity(), 2, 3)
    const v = vec.make(1, 1)
    const v1 = mat.transform(m, v)
    expect(v1.x).approximately(2, epsilon)
    expect(v1.y).approximately(3, epsilon)
})

function expectMatEquaility(actual: mat.Mat, expected: mat.Mat) {
    for (const [k,vActual] of Object.entries(actual)) {
        const vExpected = expected[k as keyof mat.Mat]
        expect(vActual).approximately(vExpected, epsilon, `Expected element ${k} to be ${vExpected}, but it was ${vActual}`)
    }
}

test("matrix multiplcation", () => {
    // combine a scaling matrix with a translation matrix
    const mat1 = mat.make(2, 0, 0, 2, 0, 0)
    const mat2 = mat.make(1, 0, 0, 1, 10, 20)
    const result1 = mat.multiply(mat1, mat2)
    expectMatEquaility(result1, { a: 2, b: 0, c: 0, d: 2, tx: 20, ty: 40 })

    // combine a rotation matrix with a translation matrix
    const mat3 = mat.make(Math.cos(Math.PI / 2), Math.sin(Math.PI / 2), -Math.sin(Math.PI / 2), Math.cos(Math.PI / 2), 0, 0 )
    const mat4 = mat.make(1, 0, 0, 1, 10, 20)
    const result2 = mat.multiply(mat3, mat4)
    expectMatEquaility(result2, { a: 0, b: 1, c: -1, d: 0, tx: -20, ty: 10 })

})

test("matrix inversion", () => {
    const m1 = mat.make(1, 0, 0, 1, 0, 0 )
    const m1Inverted = mat.invert(m1)
    expectMatEquaility(m1, m1Inverted)

    const m2 = mat.make(1, 0, 0, 2, 3, 4 )
    const m2Inverted = mat.invert(m2)
    expectMatEquaility(m2, mat.invert(m2Inverted))
})

test("matrix builder", () => {
    const builder = mat.builder()
        .translate(1, 2)
        .rotate(30)
        .scale(0.9)
        .translate(-0.5, 1.5)
    const v = vec.make(3, -4)
    const v1 = mat.transform(
        builder.buildInverse(),
        mat.transform(builder.build(), v)
    )
    expect(v1).toMatchObject(v)
})

describe("matrix from boxes", () => {
    it('should return the correct matrix for identity transform', () => {
        const from = { x: 0, y: 0, width: 1, height: 1 }
        const to = { x: 0, y: 0, width: 1, height: 1 }
        const expected = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 }
        expectMatEquaility(mat.fromBoxes(from, to), expected)
    })

    it('should return the correct matrix for scaling', () => {
        const from = { x: 0, y: 0, width: 1, height: 1 }
        const to = { x: 0, y: 0, width: 2, height: 3 }
        const expected = { a: 2, b: 0, c: 0, d: 3, tx: 0, ty: 0 }
        expectMatEquaility(mat.fromBoxes(from, to), expected)
    })

    it('should return the correct matrix for translation', () => {
        const from = { x: 0, y: 0, width: 1, height: 1 }
        const to = { x: 1, y: 2, width: 1, height: 1 }
        const expected = { a: 1, b: 0, c: 0, d: 1, tx: 1, ty: 2 }
        expectMatEquaility(mat.fromBoxes(from, to), expected)
    })

    it('should return the correct matrix for scaling and translation', () => {
        const from = { x: 0, y: 0, width: 1, height: 1 }
        const to = { x: 1, y: 2, width: 2, height: 3 }
        const expected = { a: 2, b: 0, c: 0, d: 3, tx: 1, ty: 2 }
        expectMatEquaility(mat.fromBoxes(from, to), expected)
    })
})