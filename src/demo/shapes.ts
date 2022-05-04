import {Part, PartTag} from '../parts'
import * as messages from '../messages'
import * as styles from './styles.css'
import * as demo from './demo'

import {Logger} from '../logging'
import { arrays } from '../main'
import { SvgParentTag } from '../svg'
const log = new Logger('Shapes')

const maxSize = 300 // the largest that any individual shape can be
const areaSize = 1500 // how large of an area to cover with shapes
const num = 200 // the number of each shape to generate

const colors = ['#0088aa', '#00aa88', '#6600dd']

function genPos(): number {
    return (2*Math.random()-1)*areaSize
}

function genSize(): number {
    return (Math.random()*0.75 + 0.25)*maxSize
}

function genColor(): string {
    return arrays.sample(colors)
}

function genStrokeWidth(): number {
    return Math.ceil(Math.random()*2 + 1)
}

const ShapeTypes = ['rect', 'ellipse', 'diamond']
type ShapeType = typeof ShapeTypes[number]

class Shape {
    
    x = genPos()
    y = genPos()
    width = genSize()
    height = genSize()
    color = genColor()
    strokeWidth = genStrokeWidth()

    get fill(): string {
        return this.color + '44'
    }
    
    constructor(
        readonly type: ShapeType,
        readonly id = demo.newId()) {
    }

}

const shapeKey = messages.typedKey<{id: string}>()
const mouseKey = messages.untypedKey()

export class ShapesApp extends Part<{}> {

    selected?: Shape
    shapes: {[id: string]: Shape} = {} 
    dragOffset = {x: 0, y: 0}
    scrollKey = messages.untypedKey()

    init() {
        this.onMouseDown(shapeKey, m => {
            log.info(`Mouse Down ${m.data}`)
            if (this.selected) {
                const elem = document.getElementById(this.selected.id)
                elem?.classList.remove(styles.selectedShape)
            }
            this.selected = this.shapes[m.data.id]
            const elem = document.getElementById(this.selected.id)
            elem?.classList.add(styles.selectedShape)
            this.dragOffset = {x: 0, y: 0}
        })

        this.onMouseMove(mouseKey, m => {
            if (!this.selected) {
                return
            }
            log.info(`Mouse Move`, m)
            const pixelRatio = 1 // don't know why we don't need this anymore: window.devicePixelRatio || 1
            this.dragOffset.x += m.event.movementX/pixelRatio
            this.dragOffset.y += m.event.movementY/pixelRatio
            const elem = document.getElementById(this.selected.id)!
            elem.style.transform = `translate(${this.dragOffset.x}px, ${this.dragOffset.y}px)`
        })

        this.onMouseUp(mouseKey, m => {
            if (!this.selected) {
                return
            }
            log.info(`Mouse Up`, m)
            this.selected.x += this.dragOffset.x
            this.selected.y += this.dragOffset.y
            this.dragOffset = {x: 0, y: 0}
            this.selected = undefined
            this.dirty()
        })

        this.onScroll(this.scrollKey, m => {
            log.info("onScroll", m)
        })

        // generate the shapes
        for (let i of arrays.range(0, num)) {
            const type = ShapeTypes[i % 3]
            const shape = new Shape(type)
            this.shapes[shape.id] = shape
        }
    }

    render(parent: PartTag) {
        parent.div(styles.shapesScroller, scroller => {
            scroller.svg(styles.shapesSvg, svg => {
                scroller.emitScroll(this.scrollKey)
                svg.attrs({width: areaSize, height: areaSize, viewBox: {x: 0, y: 0, width: areaSize, height: areaSize}})
                svg.emitMouseMove(mouseKey)
                svg.emitMouseUp(mouseKey)

                // render the shapes
                for (let [_, shape] of Object.entries(this.shapes)) {
                    let tag: SvgParentTag | null = null
                    switch (shape.type) {
                        case 'rect': 
                            tag = svg.rect({id: shape.id, x: shape.x, y: shape.y, height: shape.height, width: shape.width})
                            break
                        case 'ellipse':
                            tag = svg.ellipse({id: shape.id, cx: shape.x, cy: shape.y, rx: shape.width/2, ry: shape.height/2})
                            break
                        case 'diamond':
                            const d = `M ${shape.x},${shape.y+shape.height/2} L ${shape.x+shape.width/2},${shape.y} L ${shape.x+shape.width},${shape.y+shape.height/2} L ${shape.x+shape.width/2},${shape.y+shape.height} Z`
                            tag = svg.path({id: shape.id, d: d})
                            break
                    }
                    if (tag) {
                        tag.class(styles.shape)
                            .attrs({fill: shape.fill, stroke: shape.color, strokeWidth: shape.strokeWidth})
                            .emitMouseDown(shapeKey, shape)
                            .emitClick(demo.OutputKey, {output: `Clicked ${shape.type} ${shape.id}!`})
                    }
                }

            })
        })
    }

}

const container = document.getElementById('shapes')
if (container) {
    Part.mount(ShapesApp, container, {})
}