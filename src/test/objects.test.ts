import { expect, test } from 'vitest'
import * as objects from '../objects'


test("slice", () => {
    const obj = {foo: 'one', bar: 'two'}
    const sliced = objects.slice(obj, 'foo')
    expect(sliced.foo).toBe('one')
})

test("omit", () => {
    const obj = {foo: 'one', bar: 'two'}
    const sliced = objects.omit(obj, 'foo')
    expect(sliced.bar).toBe('two')
})