import {Part, PartTag} from '../parts'
import * as styles from './styles.css'
import * as demo from './demo'
import * as logging from '../logging'
import {arrays} from "../main";
import * as forms from "../forms";
import {SVGTag, SVGTagAttrs} from "../svg";
import * as messages from "../messages";
import * as v from '../vec';

const log = new logging.Logger('Boids')
const boidColors= ['#0088aa', '#00aa88', '#6600dd']
const boidRadius= 30
const numBoids= 20;

type BoidAppStateType = {
    boids: Boid[],
    centroid: v.Vec,
    frameNumber: number,
    boidRadius: number,
    intervalRef: Timer | null,
    coherenceWeight: number,
    separationWeight: number,
    alignmentWeight: number,
    tPrev: number,
}

const handleNumBoidsChange = (appState: BoidAppStateType) => {
}

// ui: HTMLElement
class Boid  {

    position!: v.Vec
    heading!: v.Vec
    color!: string

    constructor(readonly id = demo.newId()) {
        this.color= arrays.sample(boidColors)
        this.position= v.make(50+Math.random()*20, 50+Math.random()*20) // initialize boids in upper left hand corner
        this.heading= v.norm(v.make(2*Math.random()-1, 2*Math.random()-1)) // random unit vector
    }

    // Boids try to fly towards the centre of mass of neighbouring boids.
    rule1 = (boids: Boid[]) => {
        let pc= v.origin()
        for (let b of boids) {
            if (b.id==this.id) continue
            pc= v.add(pc, b.position)
        }

        if ( v.sum(pc) != 0) {
            return v.subtract(v.divide(pc, v.fill(boids.length - 1)), this.position)
        } else {
            return pc
        }
    }

    // Boids try to keep a small distance away from other objects (including other boids).
    rule2 = (boids: Boid[]) => {
        let c= v.origin()
        for (let b of boids) {
            if (b.id==this.id || v.distance(this.position, b.position) >= appState.boidRadius) continue
            c= v.subtract(c, v.subtract(b.position, this.position))
        }
        return c;
    }

    rule3 = (boids: Boid[]) => {
        let pv= v.origin()
        for (let b of boids) {
            if (b.id==this.id) continue
            pv= v.add(pv, b.heading)
        }
        if (v.sum(pv) != 0) {
            return  v.subtract(v.divide(pv, v.fill(boids.length - 1)), this.heading);
        } else {
            return pv;
        }
    }

    // https://math.stackexchange.com/questions/13261/how-to-get-a-reflection-vector
    reflect(d: v.Vec, n: v.Vec){
        return v.subtract(d, v.multiply( v.fill(2), n, v.fill(v.dot(d, n))))
    }

    nextPos = (ui: HTMLElement) => {

        let nextPos= v.add(this.position, this.heading)

        // X COLLISIONS
        if (nextPos.x < 0) {
            nextPos=v.make(0, nextPos.y)
            this.heading=this.reflect(this.heading, v.make(1, 0))
        } else if (nextPos.x > ui.offsetWidth) {
            nextPos=v.make(ui.offsetWidth, nextPos.y)
            this.heading=this.reflect(this.heading, v.make(-1, 0))
        }

        // Y COLLISIONS
        if (nextPos.y < 0) {
            nextPos=v.make(nextPos.x, 0)
            this.heading=this.reflect(this.heading, v.make(0, -1))
        } else if (nextPos.y  > ui.offsetHeight) {
            nextPos=v.make(nextPos.x, ui.offsetHeight)
            this.heading=this.reflect(this.heading, v.make(0, 1))
        }

        return nextPos
    }
}

export class DisplaySVG extends Part<{ui: HTMLElement}> {

    init() {
        appState.intervalRef= setInterval(this.mainLoop, 1);
    }

    mainLoop = () => {

        const sumX= appState.boids.map(b=>b.position.x).reduce((a, b) => a + b, 0)
        const sumY= appState.boids.map(b=>b.position.y).reduce((a, b) => a + b, 0)
        appState.centroid= v.make(sumX / appState.boids.length, sumY / appState.boids.length )

        //console.log(appState.boids[0].heading)

        let b= appState.boids[0]
        //console.log(appState.boids[0].heading)

        // console.log(v.print(
        //     v.multiply(v.make(2, 2), v.fill(3))
        // ))

        appState.boids.forEach(b =>{

            b.heading= v.add(
                b.heading,
                v.multiply(b.rule1(appState.boids), v.fill(.0001 * (appState.coherenceWeight / 100))),
                v.multiply(b.rule2(appState.boids), v.fill(.001 * (appState.separationWeight / 100))),
                v.multiply(b.rule3(appState.boids), v.fill(.01 * (appState.alignmentWeight / 100)))
            )

            b.position= b.nextPos(this.state.ui)
        })
        //console.log(appState.boids[0].heading)
        //clearInterval(appState.intervalRef)
        //
        // if (appState.frameNumber < 10000) appState.frameNumber+=1
        // else clearInterval(appState.intervalRef)
        this.renderFPS()
        this.dirty()
    }

    renderFPS=()=>{
        let t = Date.now();
        let innerText=`FPS: ${ Math.floor(1000 / (t - appState.tPrev)) }` // 1000 / ms since last frame
        document.getElementById('fps-text').innerText =innerText
        appState.tPrev=t
    }

    svgAttrs : ()=> SVGTagAttrs = () => ({
        width: '100%',
        height: '100%',
        viewBox: {
            width: this.state.ui.offsetWidth,
            height: this.state.ui.offsetHeight }})

    renderCentroid = (svg: SVGTag) =>
        svg.circle({
            cx: appState.centroid.x, cy: appState.centroid.y,
            fill: 'magenta', r: 5 }).css({ opacity: '0.75' })

    renderOrigin = (svg: SVGTag) =>
        svg.circle({
            cx: this.state.ui.offsetWidth / 2,
            cy: this.state.ui.offsetHeight / 2,
            r: 10, stroke: 'cyan', fill: 'cyan'})

    renderBoid = (b: Boid, svg: SVGTag) =>
        svg.path({
            id: b.id,
            fill: b.color,
            stroke: b.color,
            strokeWidth: 2,
            d: `M${ b.position.x  } ${ b.position.y }, l-10 2, v-4 l10 2`,
            transform: `rotate(${ v.angleDegrees(b.heading, v.make(1, 0)) }, ${ b.position.x }, ${ b.position.y })`,
        })

    render(parent: PartTag) {
        parent.svg( '#boids-svg',svg => {
            svg.attrs(this.svgAttrs())
            appState.boids.forEach(b => this.renderBoid(b, svg))
            this.renderCentroid(svg)
            this.renderOrigin(svg)
        })
    }
}

const numBoidsKey = messages.untypedKey()
const radiusKey = messages.untypedKey()
const coherenceKey = messages.untypedKey()
const separationKey = messages.untypedKey()
const alignmentKey = messages.untypedKey()

class BoidForm extends forms.FormPart<BoidAppStateType> {

    init() {
        this.onChange(numBoidsKey, (m)=> {
            const diff= m.event.target.value - appState.boids.length
            const isMoreBoids= Math.sign(diff) == 1 ? true : false;
            const numChanged= Math.abs(diff);
            for (let _ of arrays.range(0, numChanged))
                if (isMoreBoids) appState.boids.push(new Boid()); else appState.boids.pop()
            this.dirty()
        })
        this.onChange(radiusKey, (m)=> {
            appState.boidRadius= m.event.target.value;
            this.dirty()
        })
        this.onChange(coherenceKey, (m)=> {
            appState.coherenceWeight= m.event.target.value;
            this.dirty()
        })
        this.onChange(separationKey, (m)=> {
            appState.separationWeight= m.event.target.value;;
            this.dirty()
        })
        this.onChange(alignmentKey, (m)=> {
            appState.alignmentWeight= m.event.target.value;;
            this.dirty()
        })
    }

    render(parent: PartTag) {
        parent.div(styles.flexRow, row => {
            row.div(styles.flexStretch, (column)=>{
                column.p().text(`Boid Count: ${ appState.boids.length }`)
                column.input({ id: 'input-radius', type: 'range', min: '1', max: '50', step: '1', value: appState.boids.length })
                    .emitChange(numBoidsKey)
            })
            row.div(styles.flexStretch, (column)=>{
                column.p().text(`Radius: ${ appState.boidRadius }px`)
                column.input({ id: 'input-radius', type: 'range', min: '5', max: '100', step: '5', value: appState.boidRadius })
                    .emitChange(radiusKey)
            })
            row.div(styles.flexStretch, (column)=>{
                column.p().text(`Coherence: ${ appState.coherenceWeight }%`)
                column.input({ id: 'input-coherence', name: 'radius', type: 'range', min: '0', max: '100', value: appState.coherenceWeight })
                    .emitChange(coherenceKey)
            })
            row.div(styles.flexStretch, (column)=>{
                column.p().text(`Separation: ${ appState.separationWeight }%`)
                column.input({ id: 'input-separation', name: 'radius', type: 'range', min: '0', max: '100', value: appState.separationWeight })
                    .emitChange(separationKey)
            })
            row.div(styles.flexStretch, (column)=>{
                column.p().text(`Alignment: ${ appState.alignmentWeight }%`)
                column.input({ id: 'input-alignment', name: 'radius', type: 'range', min: '0', max: '100', value: appState.alignmentWeight })
                    .emitChange(alignmentKey)
            })
            row.div(styles.flexShrink, (column)=>{
                column.p({id: 'fps-text'}).css({width: '100px'})
            })
        })
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
            d.css({flexDirection: 'column'})
            d.div('#display-ui','.display-ui', styles.contentInset, styles.flexStretch ).css({ height: this.areaHeight })
            d.div('#input-ui', styles.contentInset, styles.padded, d => { d.part(this.appForm) })
        })
    }

    update(elem: HTMLElement) {
        const ui= elem.getElementsByClassName("display-ui")[0]
        Part.mount(DisplaySVG, ui, {ui: ui})
    }
}

let appState = {
    intervalRef: null,
    frameNumber: 0,
    tPrev: Date.now(),
    boidRadius: boidRadius,
    centroid:  v.origin(),
    coherenceWeight: 50,
    separationWeight: 50,
    alignmentWeight: 50,
    boids: arrays.range(0, numBoids-1).map(() => new Boid()),
}

const container = document.getElementById('boids')
if (container) { Part.mount(App, container, {}) }