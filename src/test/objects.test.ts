import { describe, expect, test, } from 'vitest'
import Objects from "../objects"


test("slice", () => {
    const obj = {foo: 'one', bar: 'two'}
    const sliced = Objects.slice(obj, 'foo')
    expect(sliced.foo).toBe('one')
})

describe("dig", () => {
    type Foo = {
        bar: number,
        baz: { qux: string },
        quz: { garply: boolean }[],
    }

    const obj: Foo = {
        bar: 4,
        baz: { qux: "xyzzy" },
        quz: [{ garply: true }, { garply: false }]
    }

    const testCases = [
        ['bar', 4],
        ['baz', { qux: "xyzzy" }],
        ['quz', [{ garply: true }, { garply: false }]],
        ['baz.qux', "xyzzy"],
        ['quz.0', { garply: true }],
        ['quz.1', { garply: false }],
        ['quz.2', undefined],
        ['quz.0.garply', true],
        ['quz.1.garply', false],
    ] as const

    for (const [key, value] of testCases) {
        test(`case ${key}`, () => {
            const actual = Objects.dig(obj, key)
            expect(actual).toStrictEqual(value)
        })
    }
})

describe("bury", () => {
    [
        { path: 'alpha', expected: { alpha: 'value' } },
        { path: 'alpha.bravo', expected: { alpha: { bravo: 'value' } } },
        { path: 'alpha.0', expected: { alpha: ['value'] } },
        { path: 'alpha.2', expected: { alpha: [, , 'value'] } },
    ].forEach(testCase => {
        test(`bury ${testCase.path} into empty object`, () => {
            const actual = Objects.bury({}, testCase.path, 'value')
            expect(actual).toStrictEqual(testCase.expected)
        })
    })

    test('overwrites existing value', () => {
        const actual = Objects.bury({ alpha: { bravo: 'existing' } }, 'alpha.bravo', 'new value')
        expect(actual).toStrictEqual({ alpha: { bravo: 'new value' } })
    })

    test("throws when burying value into non-object", () => {
        expect(() => Objects.bury({ alpha: 'non-object' }, 'alpha.bravo', 'new value'))
            .toThrow(/can't bury/)
    })
})

describe("deepMerge", () => {
    test('returns b for primitive values', () => expect(Objects.deepMerge(1, 2)).toBe(2))
    test('returns b for string values', () => expect(Objects.deepMerge('a', 'b')).toBe('b'))

    test('returns object with properties from a and b', () => {
        type TestType = { foo: string, bar: string }
        const a = { foo: 'foo' }
        const b = { bar: 'bar' }
        const actual = Objects.deepMerge<TestType>(a, b)
        expect(actual).toStrictEqual({ foo: 'foo', bar: 'bar' })
    })

    test('returns object with properties from a and b, overwriting properties from a with b', () => {
        type TestType = { foo: string, bar: string }
        const a = { foo: 'foo' }
        const b = { foo: 'different', bar: 'bar' }
        const actual = Objects.deepMerge<TestType>(a, b)
        expect(actual).toStrictEqual({ foo: 'different', bar: 'bar' })
    })

    test('does not modify either a or b', () => {
        type TestType = { foo: string, bar: string }
        const obj1 = { foo: 'foo' }
        const obj2 = { bar: 'bar' }
        Objects.deepMerge<TestType>(obj1, obj2)
        expect(obj1).toStrictEqual({ foo: 'foo' })
        expect(obj2).toStrictEqual({ bar: 'bar' })
    })

    test('returns object with deeply nested properties from a and b', () => {
        type NestedTestType = { foo: { bar: string, baz: string }, qux: string }
        const a = { foo: { bar: 'a' }, qux: 'a' }
        const b = { foo: { bar: 'b', baz: 'b' } }
        const actual = Objects.deepMerge<NestedTestType>(a, b)
        expect(actual).toStrictEqual({ foo: { bar: 'b', baz: 'b' }, qux: 'a' })
    })

    test('returns object with null property from a overwritten by property from b', () => {
        type TestType = { foo: string | null }
        const a = { foo: null }
        const b = { foo: 'b' }
        const actual = Objects.deepMerge<TestType>(a, b)
        expect(actual).toStrictEqual({ foo: 'b' })
    })

    test('returns object with property from a overwritten by null property from b', () => {
        type TestType = { foo: string | null }
        const a = { foo: 'a' }
        const b = { foo: null }
        const actual = Objects.deepMerge<TestType>(a, b)
        expect(actual).toStrictEqual({ foo: null })
    })

    test('returns object with undefined property from b not overwriting property from a', () => {
        type TestType = { foo: string | null | undefined }
        const a = { foo: 'a' }
        const b = { foo: undefined }
        const actual = Objects.deepMerge<TestType>(a, b)
        expect(actual).toStrictEqual({ foo: 'a' })
    })

    test('returns object with undefined property from b not overwriting null property from a', () => {
        type TestType = { foo: string | null | undefined }
        const a = { foo: null }
        const b = { foo: undefined }
        const actual = Objects.deepMerge<TestType>(a, b)
        expect(actual).toStrictEqual({ foo: null })
    })

    test('returns array with elements overwritten element by element', () => {
        const a = [10, 11, 12]
        const b = [20, 21, 22]
        const actual = Objects.deepMerge(a, b)
        expect(actual).toStrictEqual([20, 21, 22])
    })

    test('returns array with length of a when a is longer', () => {
        const a = [10, 11, 12, 13]
        const b = [20, 21, 22]
        const actual = Objects.deepMerge(a, b)
        expect(actual).toStrictEqual([20, 21, 22, 13])
    })

    test('returns array with length of b when b is longer', () => {
        const a = [10, 11, 12]
        const b = [20, 21, 22, 23]
        const actual = Objects.deepMerge(a, b)
        expect(actual).toStrictEqual([20, 21, 22, 23])
    })

    test('returns array with merged object elements', () => {
        type TestType = { foo: string, bar: string }
        const a = [{ foo: 'a', bar: 'a' }, { foo: 'a' }]
        const b = [{ bar: 'b' }, { bar: 'b' }, { foo: 'b' }]
        const actual = Objects.deepMerge<TestType[]>(a, b)
        expect(actual).toStrictEqual([{ foo: 'a', bar: 'b' }, { foo: 'a', bar: 'b' }, { foo: 'b' }])
    })
})

test("omit", () => {
    const obj = {foo: 'one', bar: 'two'}
    const sliced = Objects.omit(obj, 'foo')
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
            const actual = Objects.omitEmpty(testCase.obj)
            expect(actual).toStrictEqual(testCase.expected)
        })
    })
})

describe("Copying", () => {
    test('modifying nested property of shallow copy affects original', () => {
        const original = {
            foo: 'bar',
            child: {
                name: 'original'
            }
        }

        const shallowCopy = Objects.shallowCopy(original)

        shallowCopy.child.name = 'shallow'
        expect(original.child.name).toBe('shallow')
    })

    test('modifying nested property of deep copy affects original', () => {
        const original = {
            foo: 'bar',
            child: {
                name: 'original'
            }
        }

        const deepCopy = Objects.deepCopy(original)

        deepCopy.child.name = 'deep'
        expect(original.child.name).toBe('original')
    })
})