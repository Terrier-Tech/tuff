import {Part, PartTag} from '../parts'
import * as messages from '../messages'
import * as styles from './styles.css'
import * as demo from './demo'

import {Logger} from '../logging'
import { arrays } from '../main'
const log = new Logger('shapes')

type ShapeDef = {
    type: 'rect' | 'ellipse'
    id: string
}

const clickKey = messages.typedKey<ShapeDef>()
const maxSize = 300 // the largest that any individual shape can be
const areaSize = 2000 // how large of an area to cover with shapes
const num = 100 // the number of each shape to generate

export class App extends Part<{}> {

    init() {
        this.onClick(clickKey, m => {
            log.info(`Clicked ${m.data.type} ${m.data.id}`)
        })
    }

    render(parent: PartTag) {
        parent.div(styles.padded).svg(styles.shapesSvg, svg => {

            // rectangles
            for (let _ of arrays.range(0, num)) {
                const def = {type: 'rect', id: demo.newId()}

                const x = (2*Math.random()-1)*areaSize
                const y = (2*Math.random()-1)*areaSize
                const width = (Math.random()/2 + 0.5)*maxSize
                const height = (Math.random()/2 + 0.5)*maxSize
                svg.rect(styles.shape, styles.rect, {id: def.id, x: x, y: y, height: height, width: width})
                    .emitClick(clickKey, def)
                    .emitClick(demo.OutputKey, {output: `Clicked rectangle ${def.id}!`})
            }

            // ellipses
            for (let _ of arrays.range(0, num)) {
                const def = {type: 'ellipse', id: demo.newId()}

                const x = (2*Math.random()-1)*areaSize
                const y = (2*Math.random()-1)*areaSize
                const width = (Math.random()/2 + 0.5)*maxSize
                const height = (Math.random()/2 + 0.5)*maxSize
                svg.ellipse(styles.shape, styles.ellipse, {id: def.id, cx: x, cy: y, rx: width/2, ry: height/2})
                    .emitClick(clickKey, def)
                    .emitClick(demo.OutputKey, {output: `Clicked ellipse ${def.id}!`})
            }
        })
    }

}

const container = document.getElementById('shapes')
if (container) {
    Part.mount(App, container, {})
}