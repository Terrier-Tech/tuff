import { Parser } from "typesafe-routes"


import { intParser, stringParser} from "typesafe-routes"

export const int = intParser
export const string = stringParser

export type StateParser = Record<string, Parser<any>>

/**
 * Maps the type of a state parser into the type of the corresponding state, e.g.:
 * const stateParser = {id: stringParser, num: intParser}
 * state.MapParser<typeof stateParser>
 * // => {id: string, num: number}
 */
export type MapParser<SP extends StateParser> = {
    [K in keyof SP]: ReturnType<SP[K]["parse"]>
}


