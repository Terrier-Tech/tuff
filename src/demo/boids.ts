import {Part, PartTag} from '../parts'
import * as messages from '../messages'
import * as styles from './styles.css'
import * as demo from './demo'
import * as logging from '../logging'
import { globalStyle, style } from '@vanilla-extract/css'
import {arrays} from "../main";

const log = new logging.Logger('Counter')

const colors = ['#0088aa', '#00aa88', '#6600dd']
const areaSize = 500 // how large of an area to cover with shapes
const num = 200 // the number of each shape to generate

function genPos(): number {
    return (2*Math.random()-1)*areaSize
}
function genRotation(): number {
    return (2*Math.random()-1)*10
}

// TODO
class Boid  {

    x = genPos()
    y = genPos()
    rotation = genRotation()
    color= arrays.sample(colors)

    constructor(
        readonly id = demo.newId()
    ) {}

    svgAttributes = () => ({
        id: this.id,
        stroke: this.color,
        strokeWidth:'2',
        fill:'none',
        transform: `rotate(${ this.rotation })`,
        d: `M${ this.x } ${ this.y }, h40, l-10 2, v-4 l10 2`
    })
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

                Object.entries(this.boids).forEach(([_, boid]) =>
                    svg.path(boid.svgAttributes())
                )
            })
        })
    }
}

const container = document.getElementById('boids')
if (container) {
    Part.mount(App, container, {})
}