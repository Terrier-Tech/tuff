import {Part, PartTag} from '../parts'
import * as styles from './styles.css'
import * as demo from './demo'
import * as logging from '../logging'
import {arrays} from "../main";
import * as forms from "../forms";
import Vector  from './vector'
import {SVGTag, SVGTagAttrs} from "../svg";
import * as messages from "../messages";
import {DivTag} from "../html";

const log = new logging.Logger('Boids')
const numBoids= 20
const boidColors= ['#0088aa', '#00aa88', '#6600dd']
const boidRadius= 30

type BoidAppStateType = {
    boids: Boid[],
    centroid: Vector,
    frameNumber: number,
    boidRadius: number,
    intervalRef: Timer | null
}

// ui: HTMLElement
class Boid  {

    position!: Vector
    heading!: Vector
    color!: string

    constructor(color: string, readonly id = demo.newId()) {
        this.color= color
        //this.position= new Vector(Math.random()*ui.offsetWidth, Math.random()*ui.offsetHeight)
        this.position= new Vector(50+Math.random()*20, 50+Math.random()*20)
        //this.position= new Vector(900, 100)
        this.heading= new Vector().initRandUnitVector(2)
        //this.heading=new Vector().initUnitDegrees(100)
        //this.ui=ui;
    }

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
            if (b.id==this.id || this.position.distanceTo(b.position) >= appState.boidRadius) continue
            c=c.minus(b.position.minus(this.position).div(1000))
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

    nextPos = (ui: HTMLElement) => {

        let nextPos= this.position.add(this.heading)

        // X COLLISIONS
        if (nextPos.x() < 0) {
            nextPos.setX(0)
            this.heading=this.reflect(this.heading, new Vector(1, 0))
        } else if (nextPos.x() > ui.offsetWidth) {
            nextPos.setX(ui.offsetWidth)
            this.heading=this.reflect(this.heading, new Vector(-1, 0))
        }

        // Y COLLISIONS
        if (nextPos.y() < 0) {
            nextPos.setY(0)
            this.heading=this.reflect(this.heading, new Vector(0, -1))
        } else if (nextPos.y() > ui.offsetHeight) {
            nextPos.setY(ui.offsetHeight)
            this.heading=this.reflect(this.heading, new Vector(0, 1))
        }

        return nextPos
    }

}

export class DisplaySVG extends Part<{ui: HTMLElement}> {

    init() {
        appState.intervalRef= setInterval(this.mainLoop, 1);
    }

    mainLoop = () => {

        const sumX= appState.boids.map(b=>b.position.x()).reduce((a, b) => a + b, 0)
        const sumY= appState.boids.map(b=>b.position.y()).reduce((a, b) => a + b, 0)
        appState.centroid= new Vector(sumX / appState.boids.length, sumY / appState.boids.length )

        appState.boids.forEach(b =>{
            b.heading=b.heading
                .add(b.rule1(appState.boids))
                .add(b.rule2(appState.boids))
                .add(b.rule3(appState.boids))

            b.position=b.nextPos(this.state.ui)
        })

        if (appState.frameNumber < 10000)
            appState.frameNumber+=1
        else
            clearInterval(appState.intervalRef)

        this.dirty()
    }

    svgAttrs : ()=> SVGTagAttrs = () => ({
        width: '100%',
        height: '100%',
        viewBox: {
            width: this.state.ui.offsetWidth,
            height: this.state.ui.offsetHeight }})

    renderCentroid = (svg: SVGTag) =>
        svg.circle({
            cx: appState.centroid.x(), cy: appState.centroid.y(),
            fill: 'magenta', r: 5 }).css({ opacity: '0.75' })

    renderOrigin = (svg: SVGTag) =>
        svg.circle({
            cx: this.state.ui.offsetWidth / 2,
            cy: this.state.ui.offsetHeight / 2,
            r: 10, stroke: 'cyan', fill: 'cyan'})

    renderBoid = (b: Boid, svg: SVGTag) => {
        svg.path({
            id: b.id,
            fill:b.color,
            stroke: b.color,
            strokeWidth: '2',
            d: `M${ b.position.x()  } ${ b.position.y() }, l-10 2, v-4 l10 2`,
            transform: `rotate(${ b.heading.degrees() }, ${ b.position.x() }, ${ b.position.y() })`,
        })
    }

    render(parent: PartTag) {
        parent.svg( '#boids-svg',svg => {
            svg.attrs(this.svgAttrs())
            appState.boids.forEach(b => this.renderBoid(b, svg))
            this.renderCentroid(svg)
            this.renderOrigin(svg)
        })}
}

const alterRadiusKey = messages.typedKey<{delta: number}>()

class BoidForm extends forms.FormPart<BoidAppStateType> {
    init() {
        this.onClick(alterRadiusKey, m => {
            console.log(m.data.delta)
            appState.boidRadius+=m.data.delta
            this.dirty()
        })

    }

    renderInputRow(parent: DivTag, inputLabel: string, eventLabel: string,
                   delta: number, key: messages.TypedKey<{delta: number}>) {
        parent.div(styles.flexRow, row => {
            row.div(styles.flexStretch, col => {
            col.a(styles.characterLink, {text: "-"})
                .emitClick(key, {delta: -1*delta})
                .emitClick(demo.OutputKey, {output: eventLabel})
            })
            row.div(styles.flexStretch, col => {
                col.label({text: inputLabel})
            })
            row.div(styles.flexShrink, col => {
                col.a(styles.characterLink, {text: "+"})
                    .emitClick(key, {delta: delta})
                    .emitClick(demo.OutputKey, {output: eventLabel})
            })
        })
    }

    render(parent: PartTag) {
        parent.h1().text("INPUTS")

            this.renderInputRow(parent,
                `Boid Radius: ${ appState.boidRadius }px`,
                "Boid Radius Altered",5, alterRadiusKey)

            parent.br()

            this.renderInputRow(parent,
                `Boid Radius: ${ appState.boidRadius }px`,
                "Boid Radius Altered",5, alterRadiusKey)

    }
}

export class App extends Part<{}> {

    areaHeight= '500px' // Height of svg container
    appForm!: BoidForm

    init() {
        this.appForm= this.makePart(BoidForm, appState)
    }

    render(parent: PartTag) {
        parent.div(styles.flexRow, styles.padded, d => {
            d.div('#input-ui', styles.contentInset, styles.padded, d => {
                d.part(this.appForm) })
            d.div('#display-ui','.display-ui', styles.contentInset, styles.flexStretch).css({ height: this.areaHeight })
        })
    }

    update(elem: HTMLElement) {
        const ui= elem.getElementsByClassName("display-ui")[0]
        Part.mount(DisplaySVG, ui, {ui: ui})
    }
}

let appState: BoidAppStateType = {
    intervalRef: null,
    frameNumber: 0,
    boidRadius: boidRadius,
    centroid: new Vector(0,0),
    boids: arrays.range(0, numBoids-1).map(() => new Boid(
        arrays.sample(boidColors)
    ) ),
}

const container = document.getElementById('boids')
if (container) { Part.mount(App, container, {}) }