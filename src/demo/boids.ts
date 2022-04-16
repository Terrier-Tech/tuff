import {Part, PartTag} from '../parts'
import * as styles from './styles.css'
import * as demo from './demo'
import * as logging from '../logging'
import {arrays} from "../main";
import * as forms from "../forms";

const log = new logging.Logger('Boids')

class Vector extends Array {

    x=(): number=>this[0]
    y=(): number=>this[1]
    setX=(n:number): this=>{this[0]=n; return this}
    setY=(n:number): this=>{this[1]=n; return this}

    constructor(...nums: number[]) {
        super()
        for (let n of nums) this.push(n)
        return this
    }

    initRandUnitVector(dims: number){
        for (let _ of arrays.range(0, dims-1)) this.push(2*Math.random()-1)
        const mag= this.mag()
        for (let i of arrays.range(0, dims-1)) this[i]=this[i]/mag
        return this
    }

    initUnitRadians(deg: number) {
        this.push(Math.cos(deg))
        this.push(Math.sin(deg))
        return this
    }

    initUnitDegrees(deg: number) {
        return this.initUnitRadians(deg* (Math.PI/180))
    }

    add(v: Vector | number){
        if ( typeof(v) === 'number' ) {
            const multiplied: number[] = this.map((e) => e + v)
            return new Vector(...multiplied)
        } else if ( typeof v == 'object' ) {
            const multiplied : number[] = this.map((e,i) => e + v[i])
            return new Vector(...multiplied)
        } else {
            throw("Wat?")
        }
        return this
    }

    mul(v: Vector | number){
        if ( typeof(v) === 'number' ) {
            const multiplied: number[] = this.map((e) => e * v)
            return new Vector(...multiplied)
        } else if ( typeof v == 'object' ) {
            const multiplied : number[] = this.map((e,i) => e * v[i])
            return new Vector(...multiplied)
        } else {
            throw("Wat?")
        }
        return this
    }

    minus(v: Vector | number){
        if ( typeof(v) === 'number' ) {
            const multiplied: number[] = this.map((e) => e - v)
            return new Vector(...multiplied)
        } else if ( typeof v == 'object' ) {
            const multiplied : number[] = this.map((e,i) => e - v[i])
            return new Vector(...multiplied)
        } else {
            throw("Wat?")
        }
        return this
    }

    div(v: Vector | number){
        if ( typeof(v) === 'number' ) {
            const multiplied: number[] = this.map((e) => e / v)
            return new Vector(...multiplied)
        } else if ( typeof v == 'object' ) {
            const multiplied : number[] = this.map((e,i) => e / v[i])
            return new Vector(...multiplied)
        } else {
            throw("Wat?")
        }
        return this
    }

    dot(v: Vector){
        return this.map((n, i) => n * v[i]).reduce((a, b) => a + b, 0);
    }

    // in radians
    angleBetween(v2: Vector){
        const v1=this;
        return Math.atan2(
            v1.x()*v2.y() - v1.y()*v2.x(),
            v1.x()*v2.x() + v1.y()*v2.y(),
        ) * -1
    }

    // from basis
    radians(){
        return this.angleBetween(new Vector(1, 0));
    }

    // from basis, -180 to pos 180
    degrees(){
        return this.radians() * (180/Math.PI);
    }

    // magnitude
    mag(){
        return Math.sqrt(this.map(n => n**2).reduce((a, b) => a + b, 0))
    }
}

class Boid  {
    position!: Vector
    heading!: Vector
    color= arrays.sample(colors)
    ui: HTMLElement
    personalBubble= 10 // in pixels

    constructor(ui: HTMLElement, readonly id = demo.newId()) {
//        this.position= new Vector(Math.random()*ui.offsetWidth, Math.random()*ui.offsetHeight)
        this.position= new Vector(Math.random()*20, Math.random()*20)

        //this.position= new Vector(900, 100)
        this.heading= new Vector().initRandUnitVector(2)
        //this.heading=new Vector().initUnitDegrees(100)
        this.ui=ui;
    }

    isHealthyDistance = (b: Boid) =>
        Math.abs(Math.sqrt((this.position.x() - b.position.x() )**2 +
            (this.position.y() - b.position.y() )**2)) >= this.personalBubble

    // Boids try to fly towards the centre of mass of neighbouring boids.
    rule1 = (boids: Boid[]) => {
        let pc= new Vector(0, 0)
        for (let b of boids) {
            if (b.id==this.id) continue
            pc= pc.add(b.position)
        }
        return pc.div(boids.length - 1).minus(this.position).div(10000)
    }

    // Boids try to keep a small distance away from other objects (including other boids).
    rule2 = (boids: Boid[]) => {
        let c= new Vector(0, 0)
        for (let b of boids) {
            if (b.id==this.id || this.isHealthyDistance(b)) continue
            c=c.minus(b.position.minus(this.position).div(100))
        }
        return c
    }

    rule3 = (boids: Boid[]) => {
        let pv= new Vector(0, 0)
        for (let b of boids) {
            if (b.id==this.id) continue
            pv= pv.add(b.heading)
        }
        return pv.div(boids.length - 1).minus(this.heading).div(100)
    }

    // https://math.stackexchange.com/questions/13261/how-to-get-a-reflection-vector
    reflect(d: Vector, n: Vector){
        return d.minus( n.mul(d.dot(n)).mul(2) )
    }

    nextPos = () => {

        let nextPos= this.position.add(this.heading)

        // X COLLISIONS
        if (nextPos.x() < 0) {
            nextPos.setX(0)
            this.heading=this.reflect(this.heading, new Vector(1, 0))
        } else if (nextPos.x() > this.ui.offsetWidth) {
            nextPos.setX(this.ui.offsetWidth)
            this.heading=this.reflect(this.heading, new Vector(-1, 0))
        }

        // Y COLLISIONS
        if (nextPos.y() < 0) {
            nextPos.setY(0)
            this.heading=this.reflect(this.heading, new Vector(0, -1))
        } else if (nextPos.y() > this.ui.offsetHeight) {
            nextPos.setY(this.ui.offsetHeight)
            this.heading=this.reflect(this.heading, new Vector(0, 1))
        }

        this.position=nextPos
    }

    render = (svg: SVGElement) => {
        svg.path({
            id: this.id,
            fill:this.color,
            stroke: this.color,
            strokeWidth: '2',
            d: `M${ this.position.x()  } ${ this.position.y() }, l-10 2, v-4 l10 2`,
            transform: `rotate(${ this.heading.degrees() }, ${ this.position.x() }, ${ this.position.y() })`,
        })
    }
}

export class SVG extends Part<{ui: HTMLElement}> {

    init() {

    }

    mainLoop = () => {
        this.nextCentroidPos()

        this.boids.forEach(b =>{

            b.heading= b.heading
                .add(b.rule1(this.boids))
                .add(b.rule2(this.boids))
                .add(b.rule3(this.boids))

            b.nextPos()
        })

        if (this.frameNumber < 5000)
            this.frameNumber+=1
        else
            clearInterval(this.intervalRef)

        this.dirty()
    }

    nextCentroidPos = () => {
        const sumX= this.boids.map(b=>b.position.x()).reduce((a, b) => a + b, 0)
        const sumY= this.boids.map(b=>b.position.y()).reduce((a, b) => a + b, 0)
        this.centroid= new Vector(sumX / this.boids.length, sumY / this.boids.length, )
    }

    svgAttrs = () => ({
        width: '100%',
        height: '100%',
        viewBox: {
            width: this.state.ui.offsetWidth,
            height: this.state.ui.offsetHeight }})

    renderCentroid = (svg) =>
        svg.circle({
            cx: this.centroid.x(), cy: this.centroid.y(),
            fill: 'magenta', r: 5 }).css({ opacity: '0.75' })

    renderOrigin = (svg) =>
        svg.circle({
            cx: this.state.ui.offsetWidth / 2,
            cy: this.state.ui.offsetHeight / 2,
            r: 10, stroke: 'cyan', fill: 'cyan'})

    render(parent: PartTag) {
        parent.svg( svg => {
            svg.attrs(this.svgAttrs())
            this.boids.forEach(b => b.render(svg))
            this.renderCentroid(svg)
            this.renderOrigin(svg) })}
}

class BoidForm extends forms.FormPart<BoidState> {

    init() {

        this.onDataChanged(this.dataChangedKey, m => {
            log.info("Contact form data changed", m)
        })
    }

    render(parent: PartTag) {
        parent.h1().text("INPUTS")
    }
}

class BoidState {
    boids: Boid[] = []
    centroid: Vector = new Vector(0,0)
    colors= ['#0088aa', '#00aa88', '#6600dd']
    numBoids= 20 // the number of each boid to generate
    frameNumber= 0
    //intervalRef!: Timer

    constructor() {
        this.boids= arrays.range(0, numBoids-1).map( () => new Boid(this.state.ui) )
        this.centroid= new Vector()
        //this.intervalRef=setInterval(this.mainLoop, 1)
    }
}

export class App extends Part<{}> {

    areaHeight= '500px' // Height of svg container
    appState!: BoidState
    appForm!: BoidForm

    init() {
        this.appState= new BoidState()
        this.appForm= this.makePart(BoidForm, {})
    }

    render(parent: PartTag) {
        parent.div(styles.flexRow, styles.padded, d => {
            d.div('#input-container', styles.contentInset, styles.padded, d => {
                d.part(this.appForm) })
            d.div('#svg-container','.svg-container', styles.contentInset, styles.flexStretch)
                .css({ height: this.areaHeight })
        })
    }

    update(elem: HTMLElement) {
        const svgContainer= elem.getElementsByClassName("svg-container")[0]
        //Part.mount(SVG, svgContainer, {ui: svgContainer})
    }
}

const container = document.getElementById('boids')
if (container) { Part.mount(App, container, {}) }