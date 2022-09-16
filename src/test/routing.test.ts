import { expect, test } from 'vitest'
import { Part, PartTag } from '../parts'
import {optionalIntParser} from "../routing";
import * as routing from '../routing'
import * as state from '../state'
import {QueryParams} from "../urls";

const FooStateMap = {
    id: state.string
}

type FooState = state.MapParser<typeof FooStateMap>

class FooPart extends Part<FooState> {
    render(_: PartTag) {
        throw new Error('Method not implemented.')
    }
}

const BarStateMap = {
    id: state.string,
    num: state.int
}

type BarState = state.MapParser<typeof BarStateMap>

class BarPart extends Part<BarState> {
    render(_: PartTag) {
        throw new Error('Method not implemented.')
    }
}

test("route parsing", () => {
    const fooRoute = new routing.Route(FooPart, "/foo/:id",FooStateMap)
    expect(fooRoute.template).eq("/foo/:id")
    expect(fooRoute.match("/foo/hello")).eq(true)
    expect(fooRoute.match("/foo")).eq(false)
    expect(fooRoute.match("/bar/hello")).eq(false)
    expect(fooRoute.paramNames).toMatchObject(['id'])

    const fooState = fooRoute.parse("/foo/hello")
    expect(fooState?.id).eq("hello")

    const barRoute = new routing.Route(BarPart, "/bar/:id/:num", BarStateMap)
    expect(barRoute.match("/bar/hello")).eq(false)
    expect(barRoute.match("/bar/hello/123")).eq(true)
    expect(barRoute.paramNames).toMatchObject(['id', 'num'])
    const barState = barRoute.parse("/bar/hello/123")
    expect(barState?.id).eq("hello")
    expect(barState?.num).eq(123)
})

class OptionalPart extends Part<{ my_num: number | undefined }> {
    render(_: PartTag) {
        throw new Error('Method not implemented.')
    }
}

test("optional param route parsing", () => {
    const optionalRoute = new routing.Route(OptionalPart, "/opt/:my_num?/rest", { my_num: optionalIntParser })
    expect(optionalRoute.match("/opt/rest")).eq(true)
    expect(optionalRoute.match("/opt/42/rest")).eq(true)
    expect(optionalRoute.match("/opt/42/hi/rest")).eq(false)

    expect(optionalRoute.parse("/opt/42/rest")?.my_num).eq(42)
})

test("query string route parsing", () => {
    const queryRoute = new routing.Route(OptionalPart, "/opt&:my_num?", { my_num: optionalIntParser })
    expect(queryRoute.match("/opt")).eq(true)

    expect(queryRoute.parse("/opt", new QueryParams({ my_num: '42' }))?.my_num).eq(42)
})
