import {Logger} from './logging'
import {Part, MountPoint, PartConstructor} from './parts'

const log = new Logger('Routing')
Logger.level = "debug"


interface IRoute {
    readonly pattern: string
    match(path: string): boolean
}

const ParamTypes = ['static', 'string', 'number'] as const

type ParamType = typeof ParamTypes[number]

type RouteComp = {
    type: ParamType
    value: string
}

function matchComp(comp: RouteComp, s: string): boolean {
    switch (comp.type) {
        case 'static':
            return s == comp.value
        case 'number':
            return !!s.match(/^\d+\.*\d*/)
        default:
            return true
    }
}


/**
 * Splits a path string by / with optional leading slashes, then downcases each component.
 * @param path a path of pattern string
 */
function splitPath(path: string): string[] {
    let p = path
    if (p.indexOf('/')==0) {
        p = p.slice(1)
    }
    return p.split('/').map(c => c.toLowerCase())
}


/**
 * Maps a single path pattern to a {Part}.
 */
export class Route<PartType extends Part<StateType>, StateType> implements IRoute {

    readonly comps = Array<RouteComp>()

    constructor(readonly partType: PartConstructor<PartType,StateType>, readonly pattern: string) {
        for (let raw of splitPath(pattern)) {
            this.parseComp(raw)
        }
    }

    private parseComp(raw: string) {
        if (raw[0] == '{' && raw[raw.length-1] == '}') {
            const elems = raw.slice(1, raw.length-1).split(':')
            switch (elems.length) {
                case 1:
                    this.comps.push({type: 'string', value: elems[0]})
                    break
                case 2:
                    if ((ParamTypes as readonly string[]).includes(elems[1])) {
                        this.comps.push({type: elems[1] as ParamType, value: elems[0]})
                    }
                    else {
                        throw `Invalid param type ${elems[1]}, must be ${ParamTypes.join('|')}`
                    }
                    break
                default:
                    throw `A param component definition must contain 1 or 2 (colon-separated) elements, not ${elems.length}`
            }
        }
        else {
            this.comps.push({type: 'static', value: raw})
        }
    }

    /**
     * @param path a test path
     * @returns true if `path` matches this route
     */
    match(path: string): boolean {
        const comps = splitPath(path)
        if (comps.length != this.comps.length) {
            return false
        }
        for (let i = 0; i<comps.length; i++) {
            if (!matchComp(this.comps[i], comps[i])) {
                return false
            }
        }
        return true
    }
}

/**
 * Builder object returned by `build()` that constructs a router.
 */
class RouteBuilder {

    readonly routes = Array<IRoute>()

    map<PartType extends Part<StateType>, StateType>(
        partType: PartConstructor<PartType,StateType>,
        pattern: string
    ): RouteBuilder {
        this.routes.push(new Route(partType, pattern))
        return this
    }

    mount(mountPoint: MountPoint) {
        const router = new Router(this.routes)
        router.mount(mountPoint)
        return router
    }

    mock() {
        return new Router(this.routes)
    }

}

export function build(): RouteBuilder {
    return new RouteBuilder()
}

/**
 * Mounts to a point in the DOM and matches a set of routes to it.
 */
class Router {

    constructor(readonly routes: Array<IRoute>) {

    }

    mount(mountPoint: MountPoint) {

    }

    /**
     * @param path a raw URL path
     * @returns the matching route, if any
     */
    match(path: string): IRoute | null {
        for (let route of this.routes) {
            if (route.match(path)) {
                log.debug(`Matched "${path}" to '${route.pattern}'`)
                return route
            }
        }
        return null
    }

}