import {Part, PartTag} from '../parts'
import * as styles from './styles.css'
import * as demo from './demo'
import * as logging from '../logging'
import {arrays} from "../main";

const log = new logging.Logger('Boids')

const colors= ['#0088aa', '#00aa88', '#6600dd']
const areaHeight= 500 // Height of svg container
const numBoids= 1 // the number of each boid to generate
const fps= 10;

function genPos(): number {
    return 0
}

function genRotation(): number {
    return 0// Math.random()*360
}

// TODO
class Boid  {

    x = genPos()
    y = genPos()
    velocity=3
    rotation = genRotation()
    color= arrays.sample(colors)

    constructor(
        readonly id = demo.newId()
    ) {}

    rotationRadians = () => {
        return (this.rotation * Math.PI) / 180.0;
    }

    nextPos = () => {
        this.x = (this.x + Math.cos(this.rotationRadians()) * this.velocity)
        this.y = (this.y + Math.sin(this.rotationRadians()) * this.velocity)
    }

    render = (svg) => {
        const parentEl= document.getElementById('svg-container')
        if (!parentEl) { return svg.path({})}

        // to wrap boids around on collision with boundary
        const modX= parentEl.offsetWidth / 2; // divide by 2 because svg origin is centered
        const modY= parentEl.offsetHeight / 2; // divide by 2 because svg origin is centered

        console.log(`${this.x}, ${this.y}`)
        console.log(`${modX}, ${modY}`)
        console.log(``)

        svg.path({
            id: this.id,
            fill:this.color,
            stroke: this.color,
            strokeWidth: '2',
            transform: `rotate(${ this.rotation }, ${ this.x }, ${ this.y })`,
            d: `M${ this.x } ${ this.y }, l-10 2, v-4 l10 2`
        })
    }

}

export class Inputs extends Part<{}> {

    render(parent: PartTag) {
        parent.h1().text("INPUTS")
    }
}

export class SVG extends Part<{}> {

    boids: Boid[] = arrays.range(0, numBoids-1).map( () => new Boid() )

    init() {
        setInterval(this.mainLoop, 1000 / fps)
    }

    mainLoop = () => {
        for (let boid of this.boids) boid.nextPos()
        this.dirty()
    }

    svgAttrs = () => {
        const parentEl= document.getElementById('svg-container')
        if (!parentEl) { return { height: areaHeight} }

        let width = parentEl.offsetWidth;
        let height = parentEl.offsetHeight;

        return {
            width: '100%',
            height: areaHeight,
            viewBox: {
                width: width,
                height: height,
                // center svg origin
                x: -1 * width / 2,
                y: -1 * height / 2,
            }
        }
    }

    renderCentroid = (svg) => {
        const x= this.boids.reduce((sum, b) => sum + b.x, 0) / this.boids.length
        const y= this.boids.reduce((sum, b) => sum + b.y, 0) / this.boids.length
        return svg.circle({cx: x, cy: y, r: 5, fill: 'magenta'}).css({opacity: '0.75'})
    }

    renderOrigin = (svg) =>
        svg.circle({cx: 0, cy: 0, r: 10, stroke: 'cyan', fill: 'cyan'})

    render(parent: PartTag) {
        parent.svg( svg => {
            // svg.css({backgroundColor: 'blue'})
            svg.attrs(this.svgAttrs())
            this.boids.forEach(b => b.render(svg))
            this.renderCentroid(svg)
            this.renderOrigin(svg)
        })
    }
}

export class App extends Part<{}> {

    svg!: SVG
    inputs!: Inputs

    init() {
        this.svg= this.makePart(SVG, {})
        this.inputs= this.makePart(Inputs, {})
    }

    render(parent: PartTag) {
        parent.div(styles.flexRow, styles.padded, d => {
            d.div('#input-container', styles.contentInset, styles.padded, d => {
                d.part(this.inputs) })
            d.div('#svg-container',styles.contentInset, styles.flexStretch, d => {
                d.part(this.svg) })
        })
    }
}

const container = document.getElementById('boids')
if (container) { Part.mount(App, container, {}) }