import { expect, test } from 'vitest'
import Vecs from "../vecs"

const epsilon = 0.0000001

test("vector arithmetic", () => {
    const v1 = Vecs.make(1, 2)
    const v2 = Vecs.make([3, 4])
    expect(Vecs.add(v1, v2).x).eq(4)
    expect(Vecs.subtract(v2, v1).x).eq(2)
    expect(Vecs.len(v1)).eq(Math.sqrt(5))
    expect(Vecs.dot(v1, v2)).eq(11)
    expect(Vecs.len(Vecs.norm(v1))).approximately(1, epsilon)
})