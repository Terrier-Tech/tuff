import {expect, test} from 'vitest'
import Boxes, {Box, Sides} from '../boxes'
import {Vec} from "../vecs"


test("expand() should expand a box", () => {
    const b = Boxes.make(0, 0, 1, 1)
    const b1 = Boxes.expand(b, {x: -1, y: 2})
    expect(b1).toMatchObject({
        x: -1, y: 0,
        width: 2, height: 2
    })
    const b2 = Boxes.expand(b, {x: 2, y: -1})
    expect(b2).toMatchObject({
        x: 0, y: -1,
        width: 2, height: 2
    })
})

test('empty() function should return an empty box', () => {
    expect(Boxes.empty()).toEqual({x: 0, y: 0, width: 0, height: 0})
})


test('make() function should create a box from individual dimensions', () => {
    expect(Boxes.make(1, 2, 3, 4)).toEqual({x: 1, y: 2, width: 3, height: 4})
})


test('make() function should create a box from Vec objects', () => {
    const origin: Vec = {x: 1, y: 2}
    const size: Vec = {x: 3, y: 4}
    expect(Boxes.make(origin, size)).toEqual({x: 1, y: 2, width: 3, height: 4})
})


test('make() function should create a box from an array of numbers', () => {
    expect(Boxes.make([1, 2, 3, 4])).toEqual({x: 1, y: 2, width: 3, height: 4})
})


test('center() function should return the center of the box', () => {
    const input: Box = {x: 1, y: 2, width: 4, height: 6}
    expect(Boxes.center(input)).toEqual({x: 3, y: 5})
})


test('distance() function should calculate the distance between two boxes', () => {
    const box1: Box = {x: 1, y: 2, width: 4, height: 6}
    const box2: Box = {x: 5, y: 4, width: 3, height: 2}
    expect(Boxes.distance(box1, box2)).toBe(4)
})


test('fromPoints() function should create a box that encapsulates an array of points', () => {
    // Define an array of points
    const points: Vec[] = [
        {x: 1, y: 2},
        {x: 3, y: 4},
        {x: 5, y: 6},
    ]

    // Calculate the expected result based on the points
    const expectedBox: Box = {
        x: 1,
        y: 2,
        width: 4, // (5 - 1)
        height: 4, // (6 - 2)
    }

    // Use the fromPoints() function to create a box from the points
    const result = Boxes.fromPoints(points)

    // Expect that the result matches the expectedBox
    expect(result).toEqual(expectedBox)
})


test('fromSides() function should create a Box from a Sides object', () => {
    // Define a Sides object
    const sides: Sides = {
        left: 1,
        top: 2,
        right: 5,
        bottom: 6,
    }

    // Calculate the expected result based on the Sides object
    const expectedBox: Box = {
        x: 1,
        y: 2,
        width: 4, // (5 - 1)
        height: 4, // (6 - 2)
    }

    // Use the fromSides() function to create a Box from the Sides object
    const result = Boxes.fromSides(sides)

    // Expect that the result matches the expectedBox
    expect(result).toEqual(expectedBox)
})


test('subtract() function should subtract a vector from a box', () => {
    // Define the input box and the vector to subtract
    const inputBox: Box = {x: 1, y: 2, width: 4, height: 6}
    const vectorToSubtract: Vec = {x: 2, y: 3}

    // Calculate the expected result by subtracting the vector from the box
    const expectedBox: Box = {
        x: inputBox.x - vectorToSubtract.x,
        y: inputBox.y - vectorToSubtract.y,
        width: inputBox.width,
        height: inputBox.height
    }

    // Use the subtract() function to subtract the vector from the box
    const result = Boxes.subtract(inputBox, vectorToSubtract)

    // Expect that the result matches the expectedBox
    expect(result).toEqual(expectedBox)
})


test('unionAll() function should return a box containing all passed boxes', () => {
    // Define an array of boxes to union
    const boxesToUnion: Box[] = [
        {x: 1, y: 2, width: 4, height: 6},
        {x: 5, y: 4, width: 3, height: 2},
        {x: 7, y: 8, width: 2, height: 3}
    ]

    // Calculate the expected result by finding the union of all boxes
    const expectedBox: Box = {
        x: 1,
        y: 2,
        width: 8,
        height: 9
    }

    // Use the unionAll() function to find the union of all boxes
    const result = Boxes.unionAll(boxesToUnion)

    // Expect that the result matches the expectedBox
    expect(result).toEqual(expectedBox)
})