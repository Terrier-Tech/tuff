import {Part, PartTag} from '../parts'
import * as styles from './styles.css'
import * as demo from './demo'
import * as logging from '../logging'
import {arrays} from "../main";

const log = new logging.Logger('Boids')

const colors= ['#0088aa', '#00aa88', '#6600dd']
const areaHeight= '500px' // Height of svg container
const numBoids= 10 // the number of each boid to generate
const boidVelocity=1; // in px per second

class Boid  {

    x: number
    y: number
    velocity=boidVelocity
    heading = Math.random()*360* Math.PI/180 // to radians
    color= arrays.sample(colors)
    containerEl: HTMLElement
    personalBubble= 10

    constructor(containerEl: HTMLElement, readonly id = demo.newId()) {
        this.containerEl=containerEl;
        this.x = containerEl.offsetWidth / 2;
        this.y =  containerEl.offsetHeight / 2;
    }

    turnToward = (centerX: number, centerY: number) => {
        // centerX=this.containerEl.offsetWidth / 2;
        // centerY=this.containerEl.offsetHeight / 2;
        const headingVectorX=Math.cos(this.heading)
        const headingVectorY=Math.sin(this.heading)
        const terminalVectorX=centerX - this.x
        const terminalVectorY=centerY - this.y
        const angleDifference= Math.atan2(
            headingVectorX*terminalVectorY-headingVectorY*terminalVectorX, // x1*y2-y1*x2
            headingVectorX*terminalVectorX+headingVectorY*terminalVectorY) // x1*x2+y1*y2
        const step= angleDifference / 100;
        this.heading += step
    }

    nextPos = () => {

        // Do step
        this.x = (this.x + Math.cos(this.heading) * this.velocity)
        this.y = (this.y + Math.sin(this.heading) * this.velocity)

        // Handle collisions
        // if (this.x > this.containerEl.offsetWidth) {
        //     this.x = this.containerEl.offsetWidth;
        //     this.heading = -1 * this.heading + 180;
        //
        // } else if (this.x <= 0) {
        //     this.x=0
        //     this.heading = -1 * this.heading + 180;
        // }
        //
        // if (this.y > this.containerEl.offsetHeight) {
        //     this.y = this.containerEl.offsetHeight;
        //     this.heading *= -1;
        // } else if (this.y <= 0) {
        //     this.y=0
        //     this.heading *= -1;
        // }
    }

    render = (svg: SVGElement) => {
        // to wrap boids around on collision with boundary

        svg.path({
            id: this.id,
            fill:this.color,
            stroke: this.color,
            strokeWidth: '2',
            d: `M${ this.x  } ${ this.y }, l-10 2, v-4 l10 2`,
            transform: `rotate(${ this.heading * (180/Math.PI) }, ${ this.x }, ${ this.y })`,
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
    centroidX= null
    centroidY= null
    frameNumber= 0
    intervalRef: Timer

    init() {
        this.boids= arrays.range(0, numBoids-1).map( () => new Boid(this.state.containerEl) )
        this.nextCentroidPos()
        this.intervalRef=setInterval(this.mainLoop, 10)
    }

    mainLoop = () => {
        this.nextCentroidPos()

        this.boids.forEach(b =>{
            b.turnToward(this.centroidX, this.centroidY)

            b.nextPos()})
        if (this.frameNumber < 3000)
            this.frameNumber+=1
        else
            clearInterval(this.intervalRef)

        this.dirty()
    }

    nextCentroidPos = () => {
        this.centroidX= this.boids.reduce((sum, b) => sum + b.x, 0) / this.boids.length
        this.centroidY= this.boids.reduce((sum, b) => sum + b.y, 0) / this.boids.length
    }

    svgAttrs = () => ({
        width: '100%',
        height: '100%',
        viewBox: {
            width: this.state.containerEl.offsetWidth,
            height: this.state.containerEl.offsetHeight }})

    renderCentroid = (svg) =>
        svg.circle({
            cx: this.centroidX, cy: this.centroidY,
            fill: 'magenta', r: 5 }).css({ opacity: '0.75' })

    renderOrigin = (svg) =>
        svg.circle({
            cx: this.state.containerEl.offsetWidth / 2,
            cy: this.state.containerEl.offsetHeight / 2,
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