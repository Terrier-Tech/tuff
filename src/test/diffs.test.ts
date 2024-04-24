import { describe, expect, test } from "vitest"
import Diffs from "../diffs"

describe('diff', () => {

    test('should return correct diff path', () => {
        const lhs = { foo: { bar: 'old' } }
        const rhs = { foo: { bar: 'new' } }
        const actual = Diffs.diff(lhs, rhs)
        expect(actual).toStrictEqual([{ kind: 'E', path: 'foo.bar', lhs: 'old', rhs: 'new' }])
    })

    test('should return correct diff path for changed value in array element', () => {
        const lhs = { foo: [{ bar: 'old' }] }
        const rhs = { foo: [{ bar: 'new' }] }
        const actual = Diffs.diff(lhs, rhs)
        expect(actual).toStrictEqual([{ kind: 'E', path: 'foo.0.bar', lhs: 'old', rhs: 'new' }])
    })

    test('should return correct diff for added array element', () => {
        const lhs = { foo: [{ bar: 'old' }] }
        const rhs = { foo: [{ bar: 'old' }, { bar: 'new' }] }
        const actual = Diffs.diff(lhs, rhs)
        expect(actual).toStrictEqual([{ kind: 'A', path: 'foo', index: 1, item: { kind: 'N', rhs: { bar: 'new' } } }])
    })
})

describe('filterDiffByPath', () => {
    test('should filter to just diffs within the given index path', () => {
        type TestType = { foo: { bar: string }, baz: { qux: string } }
        const lhs: TestType = { foo: { bar: 'old' }, baz: { qux: 'old' } }
        const rhs: TestType = { foo: { bar: 'new' }, baz: { qux: 'new' } }
        const diff = Diffs.diff(lhs, rhs)
        const actual = Diffs.filterDiffByPath(diff, 'foo')
        expect(actual).toStrictEqual([{ kind: 'E', path: 'bar', lhs: 'old', rhs: 'new' }])
    })
})