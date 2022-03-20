import { expect, test } from 'vitest'
import * as arrays from '../arrays'

test("min and max", () => {
    expect(arrays.min([2, 1, 3])).eq(1)
    expect(arrays.max([2, 4, 3])).eq(4)
})


test("unique", () => {
    expect(arrays.unique([1, 2, 1, 3])).toMatchObject([1, 2, 3])
    const objs = [
        {
            id: 1, value: 'foo'
        },
        {
            id: 2, value: 'bar'
        },
        {
            id: 1, value: 'baz'
        },
    ]
    expect(arrays.unique(objs, o => o.id)).toMatchObject([
        {
            id: 1, value: 'baz'
        },
        {
            id: 2, value: 'bar'
        }
    ])
})