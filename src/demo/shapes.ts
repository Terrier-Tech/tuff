import {Part, PartTag} from '../parts'
import * as messages from '../messages'
import * as styles from './styles.css'
import * as demo from './demo'

import {Logger} from '../logging'
import { arrays } from '../main'
import { SvgParentTag } from '../svg'
const log = new Logger('shapes')

const maxSize = 300 // the largest that any individual shape can be
const areaSize = 1500 // how large of an area to cover with shapes
const num = 200 // the number of each shape to generate

function genPos(): number {
    return (2*Math.random()-1)*areaSize
}

function genSize(): number {
    return (Math.random()*0.75 + 0.25)*maxSize
}

function genStyle(): string {
    return arrays.random(styles.shapes)
}

type ShapeType = 'rect' | 'ellipse'

class Shape {
    
    x = genPos()
    y = genPos()
    width = genSize()
    height = genSize()
    
    constructor(
        readonly type: ShapeType,
        readonly id = demo.newId()) {
    }

}

const clickKey = messages.typedKey<Shape>()

export class App extends Part<{}> {

    selected?: Shape
    shapes: {[id: string]: Shape} = {} 

    init() {
        this.onClick(clickKey, m => {
            log.info(`Clicked ${m.data.type} ${m.data.id}`)
            if (this.selected) {
                const elem = document.getElementById(this.selected.id)
                elem?.classList.remove(styles.selectedShape)
            }
            this.selected = m.data
            const elem = document.getElementById(this.selected.id)
            elem?.classList.add(styles.selectedShape)
        })

        // generate the shapes
        for (let i of arrays.range(0, num)) {
            const type = (i % 2) ? 'rect' : 'ellipse'
            const shape = new Shape(type)
            this.shapes[shape.id] = shape
        }
    }

    render(parent: PartTag) {
        parent.div(styles.padded).svg(styles.shapesSvg, svg => {

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
                }
                if (tag) {
                    tag.class(genStyle())
                        .emitClick(clickKey, shape)
                        .emitClick(demo.OutputKey, {output: `Clicked ${shape.type} ${shape.id}!`})
                }
            }

        })
    }

}

const container = document.getElementById('shapes')
if (container) {
    Part.mount(App, container, {})
}