import { stringParser } from 'typesafe-routes'
import {LoadContext, Part, PartTag, RenderContext} from '../parts'
import { RouterPart } from '../routing'
import * as styles from './styles.css'


class StaticChildPart extends Part<{}> {
    message = 'Not Loaded'

    load(context: LoadContext) {
        this.message = context.path
    }
    
    render(parent: PartTag) {
        parent.class(styles.output).text(this.message)
    }

}

type IdState = {
    id: string
}

class IdChildPart extends Part<IdState> {
    render(parent: PartTag) {
        parent.class(styles.output).text(`id: ${this.state.id}`)
    }
}

export class NavApp extends RouterPart {

    init() {
        this.routePart(StaticChildPart, "/", {})
        this.routePart(StaticChildPart, "/hello", {})
        this.routePart(IdChildPart, "/foo/:id", {
            id: stringParser
        })
    }
    
    render(parent: PartTag, context: RenderContext) {
        parent.class(styles.flexRow)
        parent.div(styles.flexShrink, styles.flexColumn, styles.padded, col => {
            for (let text of ["/foo/bar", "/foo/baz", "/hello"]) {
                col.a(styles.button, {href: text}).text(text)
            }
        })
        parent.div(styles.flexStretch, styles.padded, col => {
            super.render(col, context)
        })
    }

}