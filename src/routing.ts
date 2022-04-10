import {Logger} from './logging'
import { route, ExtractParserReturnTypes, RouteNode, InferParamGroups, Parser, MergeParamGroups } from "typesafe-routes"
import {pathToRegexp} from 'path-to-regexp'
import {Part, MountPoint, PartConstructor} from './parts'

const log = new Logger('Routing')
Logger.level = "debug"


interface IRoute {
    match(path: string): boolean
    template: string
}

/**
 * This isn't exported from typesafe-routes for some reason.
 */
declare type ParserMap<K extends string> = Record<K, Parser<any>>;

export class Route<PartType extends Part<StateType>, 
        StateType extends ExtractParserReturnTypes<PM, keyof PM>, 
        T extends string, 
        PM extends ParserMap<MergeParamGroups<InferParamGroups<T>>> > 
        implements IRoute {

    readonly routeNode!: RouteNode<string,PM,{},false>
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
        return this.routeNode.parseParams(raw as unknown as Record<T, string>) as StateType
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