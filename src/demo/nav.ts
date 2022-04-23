import { stringParser } from 'typesafe-routes'
import {LoadContext, Part, PartTag, RenderContext} from '../parts'
import { Route, RouterPart } from '../routing'
import * as styles from './styles.css'


class StaticChildPart extends Part<{}> {
    message = 'Not Loaded'

    load(context: LoadContext) {
        this.message = `Static: ${context.path}`
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
        parent.class(styles.output).text(`Foo id: ${this.state.id}`)
    }
}


const routes = {
    root: new Route(StaticChildPart, "/", {}),
    hello: new Route(StaticChildPart, "/hello", {}),
    foo: new Route(IdChildPart, "/foo/:id", {
        id: stringParser
    })
}

export class NavApp extends RouterPart {
    
    get routes() {
        return routes
    }
    
    render(parent: PartTag, context: RenderContext) {
        parent.class(styles.flexRow)
        parent.div(styles.flexShrink, styles.flexColumn, styles.padded, col => {
            const urls = [
                routes.root.path({}),
                routes.foo.path({id: 'bar'}),
                routes.foo.path({id: 'baz'}),
                routes.hello.path({})
            ]
            for (let text of urls) {
                col.a(styles.button, {href: text}).text(text)
            }
        })
        parent.div(styles.flexStretch, styles.padded, col => {
            super.render(col, context)
        })
    }

}