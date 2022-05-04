import { expect, test } from 'vitest'
import * as urls from '../urls'



test("query param parsing", () => {
    const params = urls.parseQueryParams("?foo=hello%20world&bar=123&baz")
    expect(params.get('foo')).eq('hello world')
    expect(params.get('bar')).eq('123')
    expect(params.getNumber('bar')).eq(123)
    expect(params.isPresent('baz')).eq(true)
    expect(params.isPresent('unknown')).eq(false)
})
