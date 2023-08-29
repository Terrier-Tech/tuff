import {describe, expect, test} from 'vitest'
import Strings from '../strings'

describe("splitWords", () => {
    test("splits by whitespace", () => {
        const res = Strings.splitWords("alpha bravo  \t charlie\ndelta")
        expect(res).toMatchObject(['alpha', 'bravo', 'charlie', 'delta'])
    })

    test("splits by hyphen in rope-case", () => {
        const res = Strings.splitWords("alpha-bravo-charlie-delta")
        expect(res).toMatchObject(['alpha', 'bravo', 'charlie', 'delta'])
    })

    test("splits by underscore in snake_case", () => {
        const res = Strings.splitWords("alpha_bravo_charlie_delta")
        expect(res).toMatchObject(['alpha', 'bravo', 'charlie', 'delta'])
    })

    test("splits on uppercase in camelCase", () => {
        const res = Strings.splitWords("alphaBravoCharlieDelta")
        expect(res).toMatchObject(['alpha', 'Bravo', 'Charlie', 'Delta'])
    })

    test("splits on acronym borders in camelCase", () => {
        const res = Strings.splitWords("alphaBRAVOCharlieDelta")
        expect(res).toMatchObject(['alpha', 'BRAVO', 'Charlie', 'Delta'])
    })

    test("handles acronym in whitespace delimited string", () => {
        const res = Strings.splitWords("alpha BRAVO charlie delta")
        expect(res).toMatchObject(['alpha', 'BRAVO', 'charlie', 'delta'])
    })

    test("does not split on number borders in camelCase", () => {
        const res = Strings.splitWords("alphaBravo1337CharlieDelta")
        expect(res).toMatchObject(['alpha', 'Bravo1337', 'Charlie', 'Delta'])
    })

    test("does not split on number borders in camelCase followed by a lowercase", () => {
        const res = Strings.splitWords("alphaBravo1337charlieDelta")
        expect(res).toMatchObject(['alpha', 'Bravo1337charlie', 'Delta'])
    })

    test("handles leading and trailing whitespace", () => {
        const res = Strings.splitWords("  alpha bravo charlie delta  ")
        expect(res).toMatchObject(['alpha', 'bravo', 'charlie', 'delta'])
    })
})

describe("capitalize", () => {
    test("capitalizes first letter", () => {
        expect(Strings.capitalize("hello world")).toBe("Hello world")
    })
})

describe("titleize", () => {
    test("capitalizes first letter of every word", () => {
        expect(Strings.titleize("hello world")).toBe("Hello World")
    })
    test("splits on word delimiters", () => {
        expect(Strings.titleize("hello_world")).toBe("Hello World")
    })
    test("lowercases subsequent letters of all caps words", () => {
        expect(Strings.titleize("HELLO world")).toBe("Hello World")
    })
})

describe("ropeCase", () => {
    test("", () => {
        expect(Strings.ropeCase("foo bar")).toBe("foo-bar")
    })
    test("", () => {
        expect(Strings.ropeCase("FooBar")).toBe("foo-bar")
    })
    test("", () => {
        expect(Strings.ropeCase("foo_bar")).toBe("foo-bar")
    })
    test("", () => {
        expect(Strings.ropeCase("fooBAR")).toBe("foo-bar")
    })
})

describe("camelCase", () => {
    test("", () => {
        expect(Strings.camelCase("foo bar")).toBe("fooBar")
    })
    test("", () => {
        expect(Strings.camelCase("Foo-Bar")).toBe("fooBar")
    })
    test("", () => {
        expect(Strings.camelCase("foo_bar")).toBe("fooBar")
    })
})
