import {describe, expect, test} from 'vitest'
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

describe("omitEmpty", () => {
    [
        { name: "omits undefined",           obj: { foo: 'bar', baz: undefined }, expected: { foo: 'bar' } },
        { name: "omits null",                obj: { foo: 'bar', baz: null },      expected: { foo: 'bar' } },
        { name: "omits empty string",        obj: { foo: 'bar', baz: '' },        expected: { foo: 'bar' } },
        { name: "omits empty array",         obj: { foo: 'bar', baz: [] },        expected: { foo: 'bar' } },
        { name: "does not omit 0",           obj: { foo: 'bar', baz: 0 },         expected: { foo: 'bar', baz: 0 } },
        { name: "does not non-empty string", obj: { foo: 'bar', baz: 'qux' },     expected: { foo: 'bar', baz: 'qux' } },
        { name: "does not non-empty array",  obj: { foo: 'bar', baz: ['qux'] },   expected: { foo: 'bar', baz: ['qux'] } },
    ].forEach(testCase => {
        test(testCase.name, () => {
            const actual = objects.omitEmpty(testCase.obj)
            expect(actual).toStrictEqual(testCase.expected)
        })
    })
})