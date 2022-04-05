import { expect, test } from 'vitest'
import { Part, PartTag } from '../parts'
import * as routing from '../routing'

type FooState = {
    id: string
}

class FooPart extends Part<FooState> {
    render(_: PartTag) {
        throw new Error('Method not implemented.')
    }
}

type BarState = {
    num: number
}

class BarPart extends Part<BarState> {
    render(_: PartTag) {
        throw new Error('Method not implemented.')
    }
}

test("route parsing", () => {
    let route = new routing.Route(FooPart, "/foo/{id}")
    expect(route.comps.length).eq(2)

    route = new routing.Route(FooPart, "/foo/{id}/bar/{num:number}")
    expect(route.comps.length).eq(4)
    expect(route.comps[0]).toMatchObject({type: 'static', value: 'foo'})
    expect(route.comps[1]).toMatchObject({type: 'string', value: 'id'})
})

test("basic routing", () => {
    const router = routing.build()
        .map(FooPart, "/foo/{id}")
        .map(BarPart, "/foo/{id}/bar")
        .map(BarPart, "/foo/{id}/bar/{num:number}")
        .mock()

    expect(router.match("/foo/foo1")?.pattern, "/foo/{id}")
    expect(router.match("/foo/foo1/bar")?.pattern, "/foo/{id}/bar")
    expect(router.match("/foo1/foo1")).toBeNull()
})