

/**
 * Wraps a URL's query parameters in an object with type conversion accessors.
 */
export class QueryParams {

    constructor(readonly raw: Record<string,string>) {

    }

    /**
     * Gets a string value by key, returning `undefined` if the key isn't present.
     * @param key the param key
     * @returns the param value
     */
    get(key: string): string|undefined {
        return this.raw[key]
    }

    /**
     * Gets a number value by key, returning `undefined` if the key isn't present.
     * @param key the param key
     * @returns the converted param value
     */
    getNumber(key: string): number|undefined {
        if (this.raw[key]?.length) {
            return parseFloat(this.raw[key])
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

}

/**
 * Parses a URL query parameter string.
 * @param search a query parameter string such as `window.location.search`
 * @returns a {QueryParams} object mapping the parameters
 */
export function parseQueryParams(search: string): QueryParams {
    const raw: Record<string,string> = {}
    search = search.replace(/^\?/, '')
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