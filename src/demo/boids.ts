import {Part, PartTag} from '../parts'
import * as messages from '../messages'
import * as styles from './styles.css'
import * as demo from './demo'
import * as logging from '../logging'
import { globalStyle, style } from '@vanilla-extract/css'
import {arrays} from "../main";

const log = new logging.Logger('Counter')

const areaSize = 500 // how large of an area to cover with shapes
const num = 200 // the number of each shape to generate

function genPos(): number {
    return (2*Math.random()-1)*areaSize
}

// TODO
class Boid  {

    r=5; // radius
    x = genPos()
    y = genPos()

    constructor(
        readonly id = demo.newId()
    ) {}
}

export class App extends Part<{}> {

    boids: {[id: string]: Boid} = {}

    // TODO INITIALIZE BOIDS HERE
    init() {

        // generate the boids
        for (let i of arrays.range(0, num)) {
            const boid = new Boid()
            this.boids[boid.id] = boid
        }
    }

    render(parent: PartTag) {
        // MAIN ROW
        parent.div(styles.flexRow, styles.padded, d => {
            // CONTENT CONTAINER INPUTS
            d.div(styles.contentInset, styles.padded, d => {
                d.h1().text("INPUTS")
            })

            // CONTENT CONTAINER BOIDS (OUTPUTS)
            d.svg(styles.flexStretch, styles.contentInset, svg => {
                svg.attrs({width: areaSize, height: areaSize, viewBox: {x: 0, y: 0, width: areaSize, height: areaSize}})

                for (let [_, boid] of Object.entries(this.boids)) {
                    svg.circle({id: boid.id, cx: boid.x, cy: boid.y, r: boid.r})
                }
            })
        })
    }
}

const container = document.getElementById('boids')
if (container) {
    Part.mount(App, container, {})
}