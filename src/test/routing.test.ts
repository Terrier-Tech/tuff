import { expect, test } from 'vitest'
import { Part, PartTag } from '../parts'
import * as routing from '../routing'
import { intParser, stringParser} from "typesafe-routes"

type FooState = {
    id: string
}

// const fooRoute = route("/foo/:id", {
//     id: stringParser
// }, {})

class FooPart extends Part<FooState> {
    render(_: PartTag) {
        throw new Error('Method not implemented.')
    }
}

type BarState = {
    id: string
    num: number
}

class BarPart extends Part<BarState> {
    render(_: PartTag) {
        throw new Error('Method not implemented.')
    }
}

test("route parsing", () => {
    const fooRoute = new routing.Route(FooPart, "/foo/:id", {
        id: stringParser
    })
    expect(fooRoute.template).eq("/foo/:id")
    expect(fooRoute.match("/foo/hello")).eq(true)
    expect(fooRoute.match("/foo")).eq(false)
    expect(fooRoute.match("/bar/hello")).eq(false)
    expect(fooRoute.paramNames).toMatchObject(['id'])

    const fooState = fooRoute.parse("/foo/hello")
    expect(fooState?.id).eq("hello")

    const barRoute = new routing.Route(BarPart, "/bar/:id/:num", {
        id: stringParser,
        num: intParser
    })
    expect(barRoute.match("/bar/hello")).eq(false)
    expect(barRoute.match("/bar/hello/123")).eq(true)
    expect(barRoute.paramNames).toMatchObject(['id', 'num'])
    const barState = barRoute.parse("/bar/hello/123")!
    expect(barState.id).eq("hello")
    expect(barState.num).eq(123)
})

// test("basic routing", () => {
//     const router = routing.build()
//         .map(FooPart, "/foo/{id}")
//         .map(BarPart, "/foo/{id}/bar")
//         .map(BarPart, "/foo/{id}/bar/{num:number}")
//         .mock()

//     expect(router.match("/foo/foo1")?.pattern, "/foo/{id}")
//     expect(router.match("/foo/foo1/bar")?.pattern, "/foo/{id}/bar")
//     expect(router.match("/foo1/foo1")).toBeNull()
// })