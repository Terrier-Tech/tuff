import { expect, test } from 'vitest'
import * as vec from '../vec'

const epsilon = 0.0000001

test("vector arithmatic", () => {
    const v1 = vec.make(1, 2)
    const v2 = vec.make([3, 4])
    expect(vec.add(v1, v2).x).eq(4)
    expect(vec.subtract(v2, v1).x).eq(2)
    expect(vec.len(v1)).eq(Math.sqrt(5))
    expect(vec.dot(v1, v2)).eq(11)
    expect(vec.len(vec.norm(v1))).approximately(1, epsilon)
})