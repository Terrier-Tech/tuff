import { pathToRegexp } from 'path-to-regexp'
import {
    booleanParser, dateParser, floatParser, intParser, Parser, route, RouteNode, stringParser
} from "typesafe-routes"
import { AllParamNames, InferParamFromPath } from "typesafe-routes/build/route"
import { HtmlParentTag } from "./html"
import { Logger } from './logging'
import { Part, PartConstructor, PartTag, StatelessPart, TuffError } from './parts'
import { QueryParams } from "./urls"

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
 * Given a record, produces the type of a parser map to parse each field in the record
 */
type RecordToParserMap<T extends Record<string, any>> = {
    [K in keyof T]: Parser<T[K]>
}

/**
 * Base class for routes, which parse and match against paths.
 */
export class Route<
    PartType extends Part<StateType>,
    StateType extends Record<string, any>,
    Template extends string,
    PM extends RecordToParserMap<StateType> & ParserMap<AllParamNames<InferParamFromPath<Template>>>
> implements IRoute {

    readonly routeNode!: RouteNode<string,PM,{},false>
    readonly regExp!: RegExp
    readonly paramNames!: Array<string>
    readonly requiredParamNames!: Array<string>

    constructor(readonly destination: PartConstructor<PartType,StateType>, template: Template, parserMap: PM) {
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
            throw new MissingParamsError(path, missingParams)
        }

        return this.routeNode.parseParams(raw as Record<Template, string>) as StateType
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
export function partRoute<
    PartType extends Part<StateType>,
    StateType extends Record<string, any>,
    Template extends string,
    PM extends RecordToParserMap<StateType> & ParserMap<AllParamNames<InferParamFromPath<Template>>>
>(
    partType: PartConstructor<PartType, StateType>,
    template: Template,
    parserMap: PM
): Route<PartType, StateType, Template, PM> {
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

    get defaultErrorPart(): PartConstructor<RouteErrorPart, { error: any }> {
        return RouteErrorPart
    }

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
                    let state: Record<string, string | number | boolean | Date | undefined> | null

                    try {
                        state = route.parse(path, this.context.queryParams)
                    } catch (ex) {
                        log.error(`Error parsing path:`, ex)
                        if (ex instanceof RouteParseError) {
                            this.currentPart = this.makePart(this.defaultErrorPart, { error: ex })
                            this.dirty()
                            return
                        }
                        throw ex
                    }
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

export class RouteParseError extends TuffError {
    constructor(message: string, public path: string) {
        super(message)
        this.name = "RouteParseError"
    }
}

export class MissingParamsError extends RouteParseError {
    constructor(path: string, public missingParams: string[]) {
        super(`Route '${path}' has missing parameters: '${missingParams.join("', '")}'`, path)
        this.name = "MissingParamsError"
    }

    render(parent: HtmlParentTag) {
        parent.p(p => {
            p.span().text("Please include the following required parameters:")
            p.ul(ul => {
                for (const missingParam of this.missingParams) {
                    ul.li().text(missingParam)
                }
            })
        })
    }
}

export class RouteErrorPart extends Part<{ error: any }> {

    render(parent: PartTag) {
        this.renderError(parent, this.state.error)
    }
}

/**
 * Creates an optional parser from a concrete one.
 * @param parser a concrete parser
 * @returns the optional equivalent
 */
export function makeOptionalParser<T>(parser: Parser<T>): Parser<T | undefined> {
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

/**
 * Creates a parser that parses a specific subset of values from a string
 * @param enumVals
 */
export function enumParser<T extends string>(enumVals: readonly T[]): Parser<T> {
    return {
        parse: (s: string) => {
            if (enumVals.includes(s as T)) {
                return s as T
            }
            throw new Error(`Unknown enum value: ${s}`)
        },
        serialize: (x: T) => x,
    }
}
