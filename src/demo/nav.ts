import { stringParser } from 'typesafe-routes'
import {Part, PartTag} from '../parts'
import { partRoute, RouterPart } from '../routing'
import * as styles from './styles.css'


class UnknownPathPart extends Part<{}> {

    render(parent: PartTag) {
        parent.class(styles.output).text(`Unknown path ${this.context.path}`)
    }

}

class StaticChildPart extends Part<{}> {
    message = 'Not Loaded'

    load() {
        this.message = `Static: ${this.context.path}`
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
    root: partRoute(StaticChildPart, "/", {}),
    hello: partRoute(StaticChildPart, "/hello", {}),
    foo: partRoute(IdChildPart, "/foo/:id", {
        id: stringParser
    })
}

export class NavApp extends RouterPart {
    
    get routes() {
        return routes
    }

    get defaultPart() {
        return UnknownPathPart
    }
    
    render(parent: PartTag) {
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
            col.a(styles.button, styles.warnBg, {href: '/unknown'}).text("/unknown")
        })
        parent.div(styles.flexStretch, styles.padded, col => {
            super.render(col)
        })
    }

}