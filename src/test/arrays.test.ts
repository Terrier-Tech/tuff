import { expect, test } from 'vitest'
import * as arrays from '../arrays'

test("min, max, and sum", () => {
    expect(arrays.min([2, 1, 3])).eq(1)
    expect(arrays.max([2, 4, 3])).eq(4)
    expect(arrays.sum([2, 4, 3])).eq(9)
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

test("sortByFunction", () => {
    const array = [
        {first_name: "barry", last_name: "wilson"},
        {first_name: "barry", last_name: "bonds"},
        {first_name: "larry", last_name: "evans"}
    ]

    // ascending
    const ascending = arrays.sortByFunction(array, e => `${e.first_name} ${e.last_name}`)
    expect(ascending.length).eq(array.length)
    expect(ascending[0].last_name).eq("bonds")
    expect(ascending[1].last_name).eq("wilson")
    expect(ascending[2].last_name).eq("evans")

    // make sure the original array wasn't altered
    expect(array[0].last_name).eq("wilson")
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

test("range with step", () => {
    const array = arrays.range(0, 1, 0.1)
    expect(array).toStrictEqual([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1])
})

test("range with step that isn't a divisor", () => {
    const array = arrays.range(0, 1, 0.15)
    expect(array).toStrictEqual([0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9])
})

test("compact", () => {
    const array = ['one', null, 'three', undefined]
    const compactArray = arrays.compact(array)
    expect(compactArray.length).toBe(2)
    for (const val of compactArray) {
        expect(val).toBeDefined()
    }
})

test("compactBy", () => {
    const array: ({a?: string, b?:string} | null)[] = [{ a: "alpha", b: "bravo" }, null, { a: "alpha" }]
    const compactArray = arrays.compactBy(array, 'b')

    expect(compactArray.length).toBe(1)
    for (const val of compactArray) {
        expect(val).toBeDefined()
        const bVal: string = val.b
        expect(bVal).toBeDefined()
    }
})


test("without", () => {
    const a = ['one', 'two', 'three']
    const b = arrays.without(a, 'two')
    expect(b.length).toBe(2)
    expect(b[1]).toBe('three')
})


test("streams", () => {
    const input = [
        {id: "one", foo: "bar"},
        {id: "two", foo: "baz"},
        null,
        {id: "three", foo: "bat"}
    ]
    const output = arrays.stream(input)
        .compact()
        .sortBy('id')
        .filter(a => a.id[0] != 'o')
        .map(a => a.foo)
        .toArray()
    expect(output[0]).toBe('bat')
    expect(output[1]).toBe('baz')
})

test("find", () => {
    const input = [1, 2, 3, 4, 5];
    const expected = 3;
    const callback = (element: number) => element === 3;
    expect(arrays.find(input, callback)).toEqual(expected);

    const input2 = [1, 3, 5];
    const expected2 = null;
    const callback2 = (element: number) => element === 2;
    expect(arrays.find(input2, callback2)).toEqual(expected2);
})

test("pluck", () => {
    const input = [{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}, {id: 3, name: 'Charlie'}];
    const expected = [1, 2, 3];
    expect(arrays.pluck(input, 'id')).toMatchObject(expected);
})

test("ilike", () => {
    const input = [{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}, {id: 3, name: 'Charlie'}, {id: 4, name: 'Molly'}];
    const expected = [{id: 2, name: 'Bob'}, {id: 4, name: 'Molly'}];
    expect(arrays.ilike(input, 'name', 'o')).toMatchObject(expected);
})

test("findIndex", () => {
    const input = [1, 2, 3, 4, 5];
    const expected = 2;
    const callback = (element: number) => element === 3;
    expect(arrays.findIndex(input, callback)).toEqual(expected);
})