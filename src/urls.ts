import Arrays from "./arrays"

/**
 * The possible types of a raw query param value.
 */
export type RawQueryParamValue = string | number | boolean | undefined

/**
 * A set of query params serialized as a raw record.
 */
export type RawQueryParams = Record<string, RawQueryParamValue>


const truthyStrings = ['true', '1', 'on']

/**
 * Wraps a URL's query parameters in an object with type conversion accessors.
 */
export class QueryParams {

    constructor(readonly raw: RawQueryParams) {

    }

    /**
     * Gets a string value by key, returning `undefined` if the key isn't present.
     * @param key the param key
     * @returns the param value
     */
    get(key: string): RawQueryParamValue {
        return this.raw[key]
    }

    /**
     * Gets a number value by key, returning `undefined` if the key isn't present.
     * @param key the param key
     * @returns the converted param value
     */
    getNumber(key: string): number | undefined {
        const val = this.raw[key]
        if (typeof val === 'number') {
            return val
        }
        if (typeof val === 'string') {
            return parseFloat(val)
        }
        return undefined
    }

    /**
     * Gets a boolean value by key, returning `undefined` if the key isn't present.
     * @param key the param key
     * @returns the converted param value
     */
    getBoolean(key: string): boolean | undefined {
        const val = this.raw[key]
        if (typeof val === 'boolean') {
            return val
        }
        if (typeof val === 'number') {
            return val > 0
        }
        if (typeof val === 'string') {
            return truthyStrings.includes(val.toLowerCase())
        }
        return undefined
    }

    /**
     * @param key the param key
     * @returns `true` if the key is present in the params 
     */
    isPresent(key: string): boolean {
        return this.raw[key] != undefined
    }

    /**
     * Serializes the params to a query string.
     * @param path the (optional) root path to prepend to the query string
     */
    serialize(path?: string): string {
        const vals = Arrays.compact(Object.entries(this.raw).map(kv => {
            if (kv[1] == undefined) return undefined
            return `${kv[0]}=${encodeURIComponent(kv[1])}`
        }))
        const query = vals.join('&')
        if (path) {
            if (!query.length) return path

            if (path.endsWith('/')) {
                path = path.substring(0, path.length-1)
            }

            if (path.includes('?')) {
                return `${path}&${query}`
            } else {
                return `${path}?${query}`
            }
        } else {
            return query
        }
    }

}

/**
 * Parses a URL query parameter string.
 * @param search a query parameter string such as `window.location.search`
 * @returns a {@link QueryParams} object mapping the parameters
 */
export function parseQueryParams(search: string): QueryParams {
    const raw: Record<string,string> = {}
    search = search.replace(/^\?/, '').trim()
    if (search.length == 0) {
        return new QueryParams(raw)
    }
    for (let kv of search.split('&')) {
        const comps = kv.split('=')
        switch (comps.length) {
            case 1:
                raw[comps[0]] = ''
                break
            case 2:
                raw[comps[0]] = decodeURIComponent(comps[1])
                break
            default:
                throw `Invalid query param component: ${kv}`
        }
    }
    return new QueryParams(raw)
}
