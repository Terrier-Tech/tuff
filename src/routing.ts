import {Logger} from './logging'
import {
    route,
    ExtractParserReturnTypes,
    RouteNode,
    Parser,
    stringParser, floatParser, intParser, dateParser, booleanParser
} from "typesafe-routes"
import { AllParamNames, InferParamFromPath } from "typesafe-routes/build/route"
import {pathToRegexp} from 'path-to-regexp'
import {Part, PartConstructor, PartTag, StatelessPart} from './parts'
import {QueryParams} from "./urls";

const log = new Logger('Routing')

/** 
 * Basic interface that all routes must implement.
 */
export interface IRoute {
    match(path: string): boolean
    parse(path: string, queryParams: QueryParams): Record<string,string|number|Date|boolean|undefined>|null
    path(state: any): string
    template: string
    destination: PartConstructor<StatelessPart,any> | string
}

/**
 * This isn't exported from typesafe-routes for some reason.
 */
export declare type ParserMap<K extends string> = Record<K, Parser<any>>;

/**
 * Base class for routes, which parse and match against paths.
 */
export class Route<PartType extends Part<StateType>, 
        StateType extends ExtractParserReturnTypes<PM, keyof PM>, 
        T extends string,
        PM extends ParserMap<AllParamNames<InferParamFromPath<T>>> >
        implements IRoute {

    readonly routeNode!: RouteNode<string,PM,{},false>
    readonly regExp!: RegExp
    readonly paramNames!: Array<string>
    readonly requiredParamNames!: Array<string>

    constructor(readonly destination: PartConstructor<PartType,StateType>, template: T, parserMap: PM) {
        this.routeNode = route(template, parserMap, {})
        this.regExp = pathToRegexp(template.replace(/&.*/, ""))

        const namesMatch = template.matchAll(/\/\:([A-Za-z0-9_]+)/g)
        if (!namesMatch) {
            throw `No parameters found in "${template}"`
        }
        this.paramNames = template.match(/:([a-zA-Z0-9_]+)/g)?.map(s => s.slice(1)) ?? []
        this.requiredParamNames = template.match(/:([a-zA-Z0-9_]+)(?![a-zA-Z0-9_?])/g)?.map(s => s.slice(1)) ?? []
    }

    get template(): string {
        return this.routeNode.template
    }

    match(path: string): boolean {
        return !!this.regExp.exec(path)
    }

    parse(path: string, queryParams?: QueryParams): StateType | null {
        const res = this.regExp.exec(path)
        if (!res) {
            return null
        }

        const raw: Record<string,any> = { ...queryParams?.raw }
        for (let n=1; n<res.length; n++) {
            if (res[n]) raw[this.paramNames[n-1]] = res[n]
        }

        const missingParams: string[] = []
        for (const key of this.requiredParamNames) {
            if (key in raw) continue;
            missingParams.push(key)
        }

        if (missingParams.length) {
            throw `Missing ${missingParams.length} params in path '${window.location.href}': ${missingParams.map(s => `"${s}"`)}`
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
        PM extends ParserMap<AllParamNames<InferParamFromPath<T>>> >
        (partType: PartConstructor<PartType,StateType>, template: T, parserMap: PM): Route<PartType, StateType, T, PM> {
    return new Route(partType, template, parserMap)
}

/**
 * A route that simply redirects from one path to another.
 */
export class RedirectRoute implements IRoute {
    constructor(readonly template: string, readonly destination: string) {
        if (this.template.endsWith('/')) {
            this.template = this.template.slice(0, -1)
        }
        if (this.destination.endsWith('/')) {
            this.destination = this.destination.slice(0, -1)
        }
    }

    match(path: string): boolean {
        return path.toLowerCase().split('?')[0] == this.template.toLowerCase()
    }

    parse(_: string): Record<string, string> | null {
        throw new Error("What does it mean to parse a redirect?")
    }

    path(_: any): string {
        return this.template
    }

}

/**
 * Creates a `RedirectRoute` from one path to another.
 * @param fromPath redirect from this path
 * @param toPath redirect to this path
 * @returns the new `RedirectRoute`
 */
export function redirectRoute(fromPath: string, toPath: string): RedirectRoute {
    return new RedirectRoute(fromPath, toPath)
}

/**
 * Base class for parts that will route based on a list of routes. 
 */
export abstract class RouterPart extends Part<{}> {

    abstract routes: Record<string,IRoute>

    abstract defaultPart: PartConstructor<StatelessPart,{}>

    currentPart?: Part<any>

    load(): void {
        const path = this.context.path
        this.loadPath(path)
    }

    loadPath(path: string): void {
        if (this.currentPart) {
            this.removeChild(this.currentPart)
            this.currentPart = undefined
        }
        for (let route of Object.values(this.routes)) {
            if (route.match(path)) {
                if (typeof route.destination == 'string') {
                    // it's a redirect
                    log.debug(`Redirected ${path} to ${route.destination}`)
                    history.pushState(null, '', route.destination)
                    this._context = this.root._computeContext(this.context.frame+1)
                    return this.loadPath(route.destination)
                }
                else {
                    // it's a proper part route
                    const state = route.parse(path, this.context.queryParams)
                    this.currentPart = this.makePart(route.destination, state)
                    log.debug(`Routed ${path} to part: ${this.currentPart.name}`, this.currentPart)
                    this.dirty()
                    return
                }
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

/**
 * Creates an optional parser from a concrete one.
 * @param parser a concrete parser
 * @returns the optional equivalent
 */
function makeOptionalParser<T>(parser: Parser<T>): Parser<T | undefined> {
    return {
        parse: (s: string) => s.length ? parser.parse(s) : undefined,
        serialize: (x: T | undefined) => x ? parser.serialize(x) : '',
    }
}

export const optionalStringParser: Parser<string | undefined> = makeOptionalParser(stringParser)
export const optionalFloatParser: Parser<number | undefined> = makeOptionalParser(floatParser)
export const optionalIntParser: Parser<number | undefined> = makeOptionalParser(intParser)
export const optionalDateParser: Parser<Date | undefined> = makeOptionalParser(dateParser)
export const optionalBooleanParser: Parser<boolean | undefined> = makeOptionalParser(booleanParser)
