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


test("groupBy and groupByFunction", () => {
    const array = [
        {id: "one", foo: "bar"},
        {id: "one", foo: "hello"},
        {id: "two", foo: "baz"},
        {id: "two", foo: "world"},
    ]
    const grouped = arrays.groupBy(array, "id")
    expect(Object.keys(grouped).length).eq(2)
    expect(grouped["one"]).toMatchObject([{id: "one", foo: "bar"}, {id: "one", foo: "hello"}])
    expect(grouped["two"]).toMatchObject([{id: "two", foo: "baz"}, {id: "two", foo: "world"}])

    const funGrouped = arrays.groupByFunction(array, a => a['id'])
    expect(Object.keys(funGrouped).length).eq(2)
    expect(funGrouped["one"]).toMatchObject([{id: "one", foo: "bar"}, {id: "one", foo: "hello"}])
    expect(funGrouped["two"]).toMatchObject([{id: "two", foo: "baz"}, {id: "two", foo: "world"}])
})

test("indexBy", () => {
    const array = [
        {id: "one", foo: "bar"},
        {id: "two", foo: "baz"},
        {id: "two", foo: "bat"} // test duplicate entries
    ]
    const indexed = arrays.indexBy(array, "id")
    expect(Object.keys(indexed).length).eq(2)
    expect(indexed["one"].foo).eq("bar")
    expect(indexed["two"].foo).eq("bat") // it will take the last duplicate
})

test("sample", () => {
    const array = ['one', 'two', 'three']
    for (const _ in arrays.range(0, 100)) {
        const sample = arrays.sample(array)
        const index = array.indexOf(sample)
        expect(index).toBeGreaterThan(-1)
        expect(index).toBeLessThan(array.length)
    }
})