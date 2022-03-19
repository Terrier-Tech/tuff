import { expect, test } from 'vitest'
import * as arrays from '../arrays'

test("min and max", () => {
    expect(arrays.min([2, 1, 3])).eq(1)
    expect(arrays.max([2, 4, 3])).eq(4)
})