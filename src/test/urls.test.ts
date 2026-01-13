import { expect, test } from 'vitest'
import * as urls from '../urls'



test("query param parsing", () => {
    const params = urls.parseQueryParams("?foo=hello%20world&bar=123&baz&bool=true")
    expect(params.get('foo')).eq('hello world')
    expect(params.get('bar')).eq('123')
    expect(params.getNumber('bar')).eq(123)
    expect(params.isPresent('baz')).eq(true)
    expect(params.getBoolean('bool')).eq(true)
    expect(params.isPresent('unknown')).eq(false)
})

test("query param serializing", () => {

    const queryIn = "foo=hello%20world&bar=123&baz="
    const params = urls.parseQueryParams(queryIn)
    const queryOut = params.serialize()
    expect(queryOut).eq(queryIn)
    expect(params.serialize('/path')).eq(`/path?${queryIn}`)
    expect(params.serialize('/path?baz=true')).eq(`/path?baz=true&${queryIn}`)
})