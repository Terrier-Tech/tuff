import {Part, PartTag} from '../parts'
import * as styles from './styles.css'
import * as demo from './demo'
import * as logging from '../logging'
import {arrays} from "../main";

const log = new logging.Logger('Boids')

const colors= ['#0088aa', '#00aa88', '#6600dd']
const areaHeight= '500px' // Height of svg container
const numBoids= 1 // the number of each boid to generate
const boidVelocity=20; // in px per second

// TODO
class Boid  {

    x: number
    y: number
    velocity=boidVelocity
    rotation = Math.random()*360
    color= arrays.sample(colors)
    containerEl: HTMLElement

    rotationRadians = () => this.rotation * Math.PI / 180.0

    constructor(containerEl: HTMLElement, readonly id = demo.newId()) {
        this.containerEl=containerEl;
        this.x = this.containerEl.offsetWidth / 2;
        this.y = this.containerEl.offsetHeight / 2;
    }

    nextPos = () => {
        this.x = (this.x + Math.cos(this.rotationRadians()) * this.velocity)
        this.y = (this.y + Math.sin(this.rotationRadians()) * this.velocity)
        if (this.x < 0) this.x += this.containerEl.offsetWidth;
        if (this.y < 0) this.y += this.containerEl.offsetWidth;
    }

    render = (svg: SVGElement) => {
        // to wrap boids around on collision with boundary
        const renderX= Math.floor(this.x % this.containerEl.offsetWidth );
        const renderY= Math.floor(this.y % this.containerEl.offsetHeight );
        svg.path({
            id: this.id,
            fill:this.color,
            stroke: this.color,
            strokeWidth: '2',
            d: `M${ renderX  } ${ renderY }, l-10 2, v-4 l10 2`,
            transform: `rotate(${ this.rotation }, ${ renderX }, ${ renderY })`,
        })
    }
}

export class Inputs extends Part<{}> {
    render(parent: PartTag) {
        parent.h1().text("INPUTS")
    }
}

export class SVG extends Part<{containerEl: HTMLElement}> {

    boids: Boid[] = []

    init() {
        this.boids= arrays.range(0, numBoids-1).map( () => new Boid(this.state.containerEl) )
        setInterval(this.mainLoop, 1000 / boidVelocity)
    }

    mainLoop = () => {
        this.boids.forEach(b => b.nextPos())
        this.dirty()
    }

    containerWidth = () => this.state.containerEl.offsetWidth
    containerHeight = () => this.state.containerEl.offsetHeight

    svgAttrs = () => ({
        width: '100%',
        height: '100%',
        viewBox: {
            width: this.containerWidth(),
            height: this.containerHeight() }})

    renderCentroid = (svg) =>
        svg.circle({
            cx: this.boids.reduce((sum, b) => sum + b.x, 0) / this.boids.length,
            cy: this.boids.reduce((sum, b) => sum + b.y, 0) / this.boids.length,
            fill: 'magenta', r: 5 }).css({opacity: '0.75'})

    renderOrigin = (svg) =>
        svg.circle({
            cx: this.containerWidth() / 2,
            cy: this.containerHeight() / 2,
            r: 10, stroke: 'cyan', fill: 'cyan'})

    render(parent: PartTag) {
        parent.svg( svg => {
            svg.attrs(this.svgAttrs())
            this.boids.forEach(b => b.render(svg))
            this.renderCentroid(svg)
            this.renderOrigin(svg) })}
}

export class App extends Part<{}> {

    inputs!: Inputs

    init() {
        this.inputs= this.makePart(Inputs, {})
    }

    render(parent: PartTag) {
        parent.div(styles.flexRow, styles.padded, d => {
            d.div('#input-container', styles.contentInset, styles.padded, d => { d.part(this.inputs) })
            d.div('#svg-container','.svg-container', styles.contentInset, styles.flexStretch)
                .css({ height: areaHeight })
        })
    }

    update(elem: HTMLElement) {
        const svgContainer= elem.getElementsByClassName("svg-container")[0]
        Part.mount(SVG, svgContainer, {containerEl: svgContainer})
    }
}

const container = document.getElementById('boids')
if (container) { Part.mount(App, container, {}) }