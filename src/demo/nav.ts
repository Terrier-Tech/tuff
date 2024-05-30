import {stringParser} from 'typesafe-routes'
import {Logger} from '../logging'
import Nav from '../nav'
import {Part, PartTag} from '../parts'
import {optionalIntParser, optionalStringParser, partRoute, redirectRoute, RouterPart} from '../routing'
import * as styles from './styles.css'
import Messages from "../messages"

const log = new Logger('Nav')

class UnknownPathPart extends Part<{}> {

    render(parent: PartTag) {
        parent.div(styles.output).text(`Unknown path ${this.context.path}`)
    }

}

class StaticChildPart extends Part<{}> {
    message = 'Not Loaded'

    async init() {
        log.info("Before wait")
        await new Promise((resolve) => setTimeout(resolve, 100))
        log.info("After wait")
    }

    load() {
        log.info(`Loaded static part at ${this.context.path}`)
        this.message = `Static: ${this.context.path}`
    }
    
    render(parent: PartTag) {
        parent.div(styles.output).text(this.message)
    }

}

type IdState = {
    id: string
}

class IdChildPart extends Part<IdState> {
    render(parent: PartTag) {
        parent.div(styles.output).text(`Foo id: ${this.state.id}`)
    }

    load() {
        log.info(`Loaded ID part with id=${this.state.id} at ${this.context.path}`)
    }
}

class OptionalParamPart extends Part<{ bravo: number | undefined, delta: string | undefined }> {
    render(parent: PartTag) {
        parent.div(styles.output).text(`Bravo: ${this.state.bravo}, Delta: ${this.state.delta}`)
    }
}

const routes = {
    root: partRoute(StaticChildPart, "/", {}),
    hello: partRoute(StaticChildPart, "/hello", {}),
    foo: partRoute(IdChildPart, "/foo/:id", {
        id: stringParser
    }),
    hola: redirectRoute('/hola', '/hello'),
    withOptional: partRoute(OptionalParamPart, "/alpha/:bravo?/charlie&:delta?", { bravo: optionalIntParser, delta: optionalStringParser })
}

const navKey = Messages.typedKey<{path: string}>()

export class NavApp extends RouterPart {
    
    get routes() {
        return routes
    }

    get defaultPart() {
        return UnknownPathPart
    }

    async init() {
        this.onClick(navKey, m => {
            log.info(`Clicked on nav link`, m.data)
            Nav.visit(m.data.path)
        })
    }
    
    render(parent: PartTag) {
        parent.div(styles.flexRow, row => {  
            row.div(styles.flexShrink, styles.flexColumn, styles.padded, col => {
                const urls = [
                    routes.root.path({}),
                    routes.foo.path({id: 'bar'}),
                    routes.foo.path({id: 'baz'}),
                    routes.hello.path({}),
                    routes.hola.path({}),
                    routes.withOptional.path({ bravo: undefined, delta: undefined }),
                    routes.withOptional.path({ bravo: 42, delta: 'terrier' }),
                ]
                for (let text of urls) {
                    col.a(styles.button, {href: text}).div(styles.buttonTitle).text(text)
                }
                col.a(styles.button, styles.warnBg, {href: '/unknown'}).text("/unknown")
                const navPath = '/foo/bar'
                col.a(styles.button, styles.selectedBg).text(navPath).emitClick(navKey, {path: navPath})
                col.a(styles.button, styles.warnBg, {href: '/', target: '_blank'}).text("target=_blank")
            })
            row.div(styles.flexStretch, styles.padded, col => {
                super.render(col)
            })
        })
    }

}
