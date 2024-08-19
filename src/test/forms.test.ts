import {expect, test, describe} from "vitest"
import Forms, {SelectOptions} from "../forms"

describe("toSelectOptions", () => {
    test("converts ungrouped array", () => {
        const array: [string, string][] = [
            ["Title 1", "value 1"],
            ["Title 2", "value 2"],
        ]

        const selectOpts = Forms.toSelectOptions(array)

        const expected: SelectOptions = [
            {title: "Title 1", value: "value 1"},
            {title: "Title 2", value: "value 2"},
        ]
        expect(selectOpts).toEqual(expected)
    })

    test("converts grouped array", () => {
        const array: [string, [string, string][]][] = [
            ["Group 1", [
                ["Title 1", "value 1"],
                ["Title 2", "value 2"],
            ]],
            ["Group 2", [
                ["Title 3", "value 3"],
                ["Title 4", "value 4"],
            ]],

        ]

        const selectOpts = Forms.toSelectOptions(array)

        const expected: SelectOptions = [
            {
                group: "Group 1", options: [
                    {title: "Title 1", value: "value 1"},
                    {title: "Title 2", value: "value 2"},
                ]
            },
            {
                group: "Group 2", options: [
                    {title: "Title 3", value: "value 3"},
                    {title: "Title 4", value: "value 4"},
                ]
            },
        ]

        expect(selectOpts).toEqual(expected)
    })

})
