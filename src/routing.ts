import {Logger} from './logging'
import { route, stringParser, RouteNode, InferParamGroups, Parser, MergeParamGroups } from "typesafe-routes"
import {pathToRegexp} from 'path-to-regexp'
import {Part, MountPoint, PartConstructor} from './parts'

const log = new Logger('Routing')
Logger.level = "debug"


interface IRoute {
    match(path: string): boolean
    template: string
}

// const ParamTypes = ['static', 'string', 'number'] as const

// type ParamType = typeof ParamTypes[number]

// type RouteComp = {
//     type: ParamType
//     value: string
// }

// function matchComp(comp: RouteComp, s: string): boolean {
//     switch (comp.type) {
//         case 'static':
//             return s == comp.value
//         case 'number':
//             return !!s.match(/^\d+\.*\d*/)
//         default:
//             return true
//     }
// }


// /**
//  * Splits a path string by / with optional leading slashes, then downcases each component.
//  * @param path a path of pattern string
//  */
// function splitPath(path: string): string[] {
//     let p = path
//     if (p.indexOf('/')==0) {
//         p = p.slice(1)
//     }
//     return p.split('/').map(c => c.toLowerCase())
// }


// /**
//  * Maps a single path pattern to a {Part}.
//  */
// export class Route<PartType extends Part<StateType>, StateType> implements IRoute {

//     readonly comps = Array<RouteComp>()

//     constructor(readonly partType: PartConstructor<PartType,StateType>, readonly pattern: string) {
//         for (let raw of splitPath(pattern)) {
//             this.parseComp(raw)
//         }
//     }

//     private parseComp(raw: string) {
//         if (raw[0] == '{' && raw[raw.length-1] == '}') {
//             const elems = raw.slice(1, raw.length-1).split(':')
//             switch (elems.length) {
//                 case 1:
//                     this.comps.push({type: 'string', value: elems[0]})
//                     break
//                 case 2:
//                     if ((ParamTypes as readonly string[]).includes(elems[1])) {
//                         this.comps.push({type: elems[1] as ParamType, value: elems[0]})
//                     }
//                     else {
//                         throw `Invalid param type ${elems[1]}, must be ${ParamTypes.join('|')}`
//                     }
//                     break
//                 default:
//                     throw `A param component definition must contain 1 or 2 (colon-separated) elements, not ${elems.length}`
//             }
//         }
//         else {
//             this.comps.push({type: 'static', value: raw})
//         }
//     }

//     /**
//      * @param path a test path
//      * @returns true if `path` matches this route
//      */
//     match(path: string): boolean {
//         const comps = splitPath(path)
//         if (comps.length != this.comps.length) {
//             return false
//         }
//         for (let i = 0; i<comps.length; i++) {
//             if (!matchComp(this.comps[i], comps[i])) {
//                 return false
//             }
//         }
//         return true
//     }
// }

declare type ParserMap<K extends string> = Record<K, Parser<any>>;

export class Route<PartType extends Part<StateType>, StateType, T extends string, PM extends ParserMap<MergeParamGroups<InferParamGroups<T>>>> 
        implements IRoute {

    readonly routeNode!: RouteNode<string,any,{},false>
    readonly regExp!: RegExp
    readonly paramNames!: Array<string>

    constructor(readonly partType: PartConstructor<PartType,StateType>, template: T, parserMap: PM) {
        this.routeNode = route(template, parserMap, {})
        this.regExp = pathToRegexp(template)

        const namesMatch = template.matchAll(/\/\:([A-Za-z0-9_]+)/g)
        if (!namesMatch) {
            throw `No parameters found in "${template}"`
        }
        log.info(`Matches: `, namesMatch)
        this.paramNames = Array.from(namesMatch, m => m[1])
    }

    get template(): string {
        return this.routeNode.template
    }

    match(path: string): boolean {
        return !!this.regExp.exec(path)
    }

    parse(path: string): StateType | null {
        const res = this.regExp.exec(path)
        if (!res) {
            return null
        }
        if ((res.length-1) != this.paramNames.length) {
            throw `Parsed ${res.length-1} params, but only ${this.paramNames.length} param names parsed from the template!`
        }
        const raw: Record<string,any> = {}
        for (let n=0; n<res.length; n++) {
            raw[this.paramNames[n-1]] = res[n]
        }
        return this.routeNode.parseParams(raw as unknown)
    }
}

/**
 * Builder object returned by `build()` that constructs a router.
 */
// class RouteBuilder {

//     readonly routes = Array<IRoute>()

//     map<PartType extends Part<StateType>, StateType extends object>(
//         partType: PartConstructor<PartType,StateType>,
//         routeNode: RouteNode<string, StateType, {}, false>
//     ): RouteBuilder {
//         this.routes.push(new Route(partType, routeNode))
//         return this
//     }

//     mount(mountPoint: MountPoint) {
//         const router = new Router(this.routes)
//         router.mount(mountPoint)
//         return router
//     }

//     mock() {
//         return new Router(this.routes)
//     }

// }

// export function build(): RouteBuilder {
//     return new RouteBuilder()
// }

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
                log.debug(`Matched "${path}" to '${route.template}'`)
                return route
            }
        }
        return null
    }

}