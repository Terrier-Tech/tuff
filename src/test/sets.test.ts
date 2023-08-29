import { describe, expect, test } from "vitest"
import Sets from "../sets"

describe("union", () => {
    test("returns union of overlapping sets without mutating", () => {
        const a = new Set([1, 2, 3])
        const b = new Set([3, 4, 5])
        const res = Sets.union(a, b)

        // correct result
        expect(Array.from(res)).to.have.same.members([1, 2, 3, 4, 5])

        // no mutation
        expect(Array.from(a)).to.have.same.members([1, 2, 3])
        expect(Array.from(b)).to.have.same.members([3, 4, 5])
    })

    test("works with empty set", () => {
        const a = new Set([1, 2, 3])
        const b = new Set()
        const res = Sets.union(a, b)

        // correct result
        expect(Array.from(res)).to.have.same.members([1, 2, 3])
    })
})

describe("unionMut", () => {
    test("mutates a by adding all elemeents from b", () => {
        const a = new Set([1, 2, 3])
        const b = new Set([3, 4, 5])
        const res = Sets.unionMut(a, b)

        // correct result
        expect(res).to.equal(a)
        expect(Array.from(a)).to.have.same.members([1, 2, 3, 4, 5])
    })
})

describe("diff", () => {
    test("returns result of removing elements of b from a without mutating", () => {
        const a = new Set([1, 2, 3])
        const b = new Set([3, 4, 5])
        const res = Sets.diff(a, b)

        // correct result
        expect(Array.from(res)).to.have.same.members([1, 2])

        // no mutation
        expect(Array.from(a)).to.have.same.members([1, 2, 3])
        expect(Array.from(b)).to.have.same.members([3, 4, 5])
    })

    test("works with empty a set", () => {
        const a = new Set()
        const b = new Set([3, 4, 5])
        const res = Sets.diff(a, b)

        // correct result
        expect(Array.from(res)).to.have.same.members([])
    })

    test("works with empty b set", () => {
        const a = new Set([1, 2, 3])
        const b = new Set([])
        const res = Sets.diff(a, b)

        // correct result
        expect(Array.from(res)).to.have.same.members([1, 2, 3])
    })
})

describe("diffMut", () => {
    test("mutates a by removing elements of b", () => {
        const a = new Set([1, 2, 3])
        const b = new Set([3, 4, 5])
        const res = Sets.diffMut(a, b)

        // correct result
        expect(res).to.equal(a)
        expect(Array.from(a)).to.have.same.members([1, 2])
    })
})

describe("intersect", () => {
    test("returns elements contained in both a and b without mutating", () => {
        const a = new Set([1, 2, 3])
        const b = new Set([3, 4, 5])
        const res = Sets.intersect(a, b)

        // correct result
        expect(Array.from(res)).to.have.same.members([3])

        // no mutation
        expect(Array.from(a)).to.have.same.members([1, 2, 3])
        expect(Array.from(b)).to.have.same.members([3, 4, 5])
    })

    test("works with empty a set", () => {
        const a = new Set()
        const b = new Set([3, 4, 5])
        const res = Sets.intersect(a, b)

        // correct result
        expect(Array.from(res)).to.have.same.members([])
    })

    test("works with empty b set", () => {
        const a = new Set([1, 2, 3])
        const b = new Set([])
        const res = Sets.intersect(a, b)

        // correct result
        expect(Array.from(res)).to.have.same.members([])
    })
})

describe("intersect", () => {
    test("mutates a by removing elements that are not also in b", () => {
        const a = new Set([1, 2, 3])
        const b = new Set([3, 4, 5])
        const res = Sets.intersectMut(a, b)

        // correct result
        expect(res).to.equal(a)
        expect(Array.from(a)).to.have.same.members([3])
    })
})
