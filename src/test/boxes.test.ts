import {expect, test} from 'vitest'
import Boxes from '../boxes'


test("box expansion", () => {
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