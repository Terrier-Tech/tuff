import { describe, expect, test } from 'vitest'
import * as strings from '../strings'

describe("splitWords", () => {
    test("splits by whitespace", () => {
        const res = strings.splitWords("alpha bravo  \t charlie\ndelta")
        expect(res).toMatchObject(['alpha', 'bravo', 'charlie', 'delta'])
    })

    test("splits by hyphen in rope-case", () => {
        const res = strings.splitWords("alpha-bravo-charlie-delta")
        expect(res).toMatchObject(['alpha', 'bravo', 'charlie', 'delta'])
    })

    test("splits by underscore in snake_case", () => {
        const res = strings.splitWords("alpha_bravo_charlie_delta")
        expect(res).toMatchObject(['alpha', 'bravo', 'charlie', 'delta'])
    })

    test("splits on uppercase in camelCase", () => {
        const res = strings.splitWords("alphaBravoCharlieDelta")
        expect(res).toMatchObject(['alpha', 'Bravo', 'Charlie', 'Delta'])
    })

    test("splits on acronym borders in camelCase", () => {
        const res = strings.splitWords("alphaBRAVOCharlieDelta")
        expect(res).toMatchObject(['alpha', 'BRAVO', 'Charlie', 'Delta'])
    })

    test("handles acronym in whitespace delimited string", () => {
        const res = strings.splitWords("alpha BRAVO charlie delta")
        expect(res).toMatchObject(['alpha', 'BRAVO', 'charlie', 'delta'])
    })

    test("splits on number borders in camelCase", () => {
        const res = strings.splitWords("alphaBravo1337CharlieDelta")
        expect(res).toMatchObject(['alpha', 'Bravo', '1337', 'Charlie', 'Delta'])
    })

    test("handles leading and trailing whitespace", () => {
        const res = strings.splitWords("  alpha bravo charlie delta  ")
        expect(res).toMatchObject(['alpha', 'bravo', 'charlie', 'delta'])
    })
})

describe("capitalize", () => {
    test("capitalizes first letter", () => {
        expect(strings.capitalize("hello world")).toBe("Hello world")
    })
})

describe("titleize", () => {
    test("capitalizes first letter of every word", () => {
        expect(strings.titleize("hello world")).toBe("Hello World")
    })
    test("splits on word delimiters", () => {
        expect(strings.titleize("hello_world")).toBe("Hello World")
    })
    test("lowercases subsequent letters of all caps words", () => {
        expect(strings.titleize("HELLO world")).toBe("Hello World")
    })
})

describe("ropeCase", () => {
    test("", () => {
        expect(strings.ropeCase("foo bar")).toBe("foo-bar")
    })
    test("", () => {
        expect(strings.ropeCase("FooBar")).toBe("foo-bar")
    })
    test("", () => {
        expect(strings.ropeCase("foo_bar")).toBe("foo-bar")
    })
    test("", () => {
        expect(strings.ropeCase("fooBAR")).toBe("foo-bar")
    })
})

describe("camelCase", () => {
    test("", () => {
        expect(strings.camelCase("foo bar")).toBe("fooBar")
    })
    test("", () => {
        expect(strings.camelCase("Foo-Bar")).toBe("fooBar")
    })
    test("", () => {
        expect(strings.camelCase("foo_bar")).toBe("fooBar")
    })
})
