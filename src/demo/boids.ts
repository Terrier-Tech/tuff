import {Part, PartTag} from '../parts'
import * as styles from './styles.css'
import * as demo from './demo'
import * as logging from '../logging'
import {arrays} from "../main";

const log = new logging.Logger('Boids')

const colors = ['#0088aa', '#00aa88', '#6600dd']
const areaSize = 500 // how large of an area to cover with shapes
const num = 5 // the number of each shape to generate

function genPos(): number {
    return (2*Math.random()-1)*areaSize
}
function genRotation(): number {
    return (2*Math.random()-1)*50
}

// TODO
class Boid  {

    x = genPos()
    y = genPos()
    step=10
    rotation = genRotation()
    color= arrays.sample(colors)

    constructor(
        readonly id = demo.newId()
    ) {}

    rotationRadians = () => {
        return (this.rotation * Math.PI) / 180.0;
    }

    nextPos = () => {
        this.x += Math.cos(this.rotationRadians()) * this.step
        this.y += Math.sin(this.rotationRadians()) * this.step
    }

    svgAttributes = () => ({
        id: this.id,
        stroke: this.color,
        strokeWidth:'2',
        fill:this.color,
        transform: `rotate(${ this.rotation }, ${ this.x }, ${ this.y })`,
        d: `M${ this.x } ${ this.y }, l-10 2, v-4 l10 2`
    })
}

export class App extends Part<{}> {

    boids: Boid[] = []
    meanX: number=-1000
    meanY: number=-1000

    // TODO INITIALIZE BOIDS HERE
    init() {

        // generate the boids
        for (let i of arrays.range(0, num - 1)) {
            const boid = new Boid()
            boid.x=20
            boid.y=200
            this.boids.push(boid)
        }

        setInterval(this.mainLoop, 100)
    }

    mainLoop = ()=>{

        for (let boid of this.boids) {
            boid.nextPos()
        }

        this.meanX = this.boids.reduce((sum, b) => sum + b.x, 0) / this.boids.length
        this.meanY = this.boids.reduce((sum, b) => sum + b.y, 0) / this.boids.length
        log.info(`MeanX ${ this.meanX }, MeanY ${ this.meanY }`)

        document.getElementById('svg-container')

        this.dirty()
    }

    render(parent: PartTag) {
        // MAIN ROW
        parent.div(styles.flexRow, styles.padded, d => {
            // CONTENT CONTAINER INPUTS
            d.div(styles.contentInset, styles.padded, d => {
                d.h1().text("INPUTS")
            })
            // CONTENT CONTAINER BOIDS (OUTPUTS)
            d.svg('#svg-container',styles.flexStretch, styles.contentInset, svg => {
                svg.attrs({width: areaSize, height: areaSize, viewBox: {x: 0, y: 0, width: areaSize, height: areaSize}})
                Object.entries(this.boids).forEach(([_, boid]) =>
                    svg.path(boid.svgAttributes())
                )
                svg.circle({cx: 0, cy: 0, r: 10})
                svg.circle({cx: this.meanX, cy: this.meanY, r: 5}).css({opacity: 0.75, backgroundColor: 'red'})
            })
        })
    }
}

const container = document.getElementById('boids')
if (container) {
    Part.mount(App, container, {})
}