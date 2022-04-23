import {Logger} from './logging'
import { route, ExtractParserReturnTypes, RouteNode, InferParamGroups, Parser, MergeParamGroups } from "typesafe-routes"
import {pathToRegexp} from 'path-to-regexp'
import {Part, PartConstructor, PartTag, StatelessPart} from './parts'

const log = new Logger('Routing')
Logger.level = "debug"


interface IRoute {
    match(path: string): boolean
    parse(path: string): Record<string,string>|null
    path(state: any): string
    template: string
    partType: PartConstructor<StatelessPart,any>
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
        return this.routeNode.parseParams(raw as Record<T, string>) as StateType
    }

    path(state: StateType): string {
        const path = this.routeNode(state).$
        if (path.length) {
            return path
        }
        return '/' // assume blank paths are the root
    }
}

/**
 * Generates a route for a part.
 * @param partType a `Part` subclass
 * @param template the path template
 * @param parserMap a map of state fields to parsers
 * @returns 
 */
export function partRoute<PartType extends Part<StateType>, 
        StateType extends ExtractParserReturnTypes<PM, keyof PM>, 
        T extends string, 
        PM extends ParserMap<MergeParamGroups<InferParamGroups<T>>> >
        (partType: PartConstructor<PartType,StateType>, template: T, parserMap: PM): Route<PartType, StateType, T, PM> {
    return new Route(partType, template, parserMap)
}


export abstract class RouterPart extends Part<{}> {

    abstract routes: Record<string,IRoute>

    abstract defaultPart: PartConstructor<StatelessPart,{}>

    currentPart?: Part<any>

    load() {
        if (this.currentPart) {
            this.removeChild(this.currentPart)
        }
        const path = this.context.path
        for (let route of Object.values(this.routes)) {
            if (route.match(path)) {
                const state = route.parse(path)
                this.currentPart = this.makePart(route.partType, state)
                log.debug(`Routed ${path} to part`, this.currentPart)
                this.dirty()
                return
            }
        }
        log.warn(`No matching route for ${path}, making a default part`, this.defaultPart)
        this.currentPart = this.makePart(this.defaultPart, {})
        this.dirty()
    }

    render(parent: PartTag) {
        if (this.currentPart) {
            parent.part(this.currentPart)
        }
    }

}
