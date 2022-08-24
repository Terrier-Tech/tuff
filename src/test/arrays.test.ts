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


test("groupBy", () => {
    type ID = "one" | "two"
    const array = [
        {id: "one" as ID, foo: "bar"},
        {id: "one" as ID, foo: "hello"},
        {id: "two" as ID, foo: "baz"},
        {id: "two" as ID, foo: "world"},
    ]
    const grouped = arrays.groupBy(array, "id")
    expect(Object.keys(grouped).length).eq(2)
    expect(grouped["one"]).toMatchObject([{id: "one", foo: "bar"}, {id: "one", foo: "hello"}])
    expect(grouped["two"]).toMatchObject([{id: "two", foo: "baz"}, {id: "two", foo: "world"}])
})

test("groupByFunction", () => {
    type ID = "one" | "two"
    const array = [
        {id: "one" as ID, foo: "bar"},
        {id: "one" as ID, foo: "hello"},
        {id: "two" as ID, foo: "baz"},
        {id: "two" as ID, foo: "world"},
    ]
    const grouped = arrays.groupByFunction(array, a => a['id'])
    expect(Object.keys(grouped).length).eq(2)
    expect(grouped["one"]).toMatchObject([{id: "one", foo: "bar"}, {id: "one", foo: "hello"}])
    expect(grouped["two"]).toMatchObject([{id: "two", foo: "baz"}, {id: "two", foo: "world"}])
})

test("groupByFunction with non-object-key group key", () => {
    type ID = "one" | "two"
    const array = [
        {id: "one" as ID, foo: "bar"},
        {id: "one" as ID, foo: "hello"},
        {id: "two" as ID, foo: "baz"},
        {id: "two" as ID, foo: "world"},
    ]
    const grouped = arrays.groupByFunction(array, a => a['id'] + "_key")
    expect(Object.keys(grouped).length).eq(2)
    expect(grouped["one_key"]).toMatchObject([{id: "one", foo: "bar"}, {id: "one", foo: "hello"}])
    expect(grouped["two_key"]).toMatchObject([{id: "two", foo: "baz"}, {id: "two", foo: "world"}])
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

test("sortBy", () => {
    const array = [
        {name: "barry"},
        {name: "aaron"},
        {name: "larry"}
    ]

    // ascending
    const ascending = arrays.sortBy(array, "name")
    expect(ascending.length).eq(array.length)
    expect(ascending[0].name).eq("aaron")
    expect(ascending[1].name).eq("barry")
    expect(ascending[2].name).eq("larry")

    // descending
    const descending = arrays.sortBy(array, "name", "desc")
    expect(descending.length).eq(array.length)
    expect(descending[0].name).eq("larry")
    expect(descending[1].name).eq("barry")
    expect(descending[2].name).eq("aaron")

    // make sure the original array wasn't altered
    expect(array[0].name).eq("barry")
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
