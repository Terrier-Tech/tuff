import { expect, test } from 'vitest'
import * as strings from '../strings'

test("splitWords", () => {
    expect(strings.splitWords("hello world-fooBar")).toMatchObject(['hello', 'world', 'foo', 'Bar'])
})

test("capitalize", () => {
    expect(strings.capitalize("hello world")).toBe("Hello world")
})

test("titleize", () => {
    expect(strings.titleize("hello world")).toBe("Hello World")
    expect(strings.titleize("hello_world")).toBe("Hello World")
})

test("ropeCase", () => {
    expect(strings.ropeCase("foo bar")).toBe("foo-bar")
    expect(strings.ropeCase("FooBar")).toBe("foo-bar")
    expect(strings.ropeCase("foo_bar")).toBe("foo-bar")
    expect(strings.ropeCase("fooBAR")).toBe("foo-bar")
})

test("camelCase", () => {
    expect(strings.camelCase("foo bar")).toBe("fooBar")
    expect(strings.camelCase("Foo-Bar")).toBe("fooBar")
    expect(strings.camelCase("foo_bar")).toBe("fooBar")
})
