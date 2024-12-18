import { StatelessPart } from "./parts"
import { Logger } from './logging'
import { QueryParams } from "./urls"

const log = new Logger('Nav')

let capturePart: StatelessPart | null = null
let capturePath: string = '/'

/**
 * Initializes navigation capture for the given part.
 * All navigation events (like anchor clicks) will be captured and stopped if they match `path`.
 * @param part the part capturing the navigation events
 * @param path a root path for the capture
 */
function initCapture(part: StatelessPart, path: string = '/') {
    if (capturePart) {
        throw `Already capturing navigation with a part (${capturePart}), it was probably a mistake to try to initialize another capture!`
    }
    capturePart = part
    capturePath = path.toLowerCase()

    // handle all click events and listen to those starting with `path`
    document.addEventListener("click", (evt) => {
        // find the href of the anchor tag in the event path
        let href: string | null = null
        for (let e of evt.composedPath()) {
            const elem = e as HTMLElement
            if (elem.tagName == 'A') {
                href = elem.getAttribute('href')
                log.debug("Clicked on anchor", elem)
                const anchor = elem as HTMLAnchorElement
                if (anchor.target == '_blank') {
                    log.info(`Skippping routing because the anchor has target=_blank`)
                    return
                }
                break
            }
        }

        // if there's an href, see if it's captured
        if (href && href.toLowerCase().startsWith(capturePath)) {
            log.debug(`Captured navigation to ${href}`, evt)
            if (evt.metaKey || evt.ctrlKey) {
                // don't stop the event, let the native ctrl+click behavior happen
            }
            else {
                // stop the event, update the URL, and notify the part that it's changed
                evt.stopPropagation()
                evt.preventDefault()
                history.pushState(null, '', href)
                part.loadAll()
            }
        }
    })

    // handle popstate events so that the back button works
    window.addEventListener("popstate", _ => {
        const href = location.pathname
        if (href.toLowerCase().startsWith(capturePath)) {
            log.debug(`Popped to captured path ${href}, reloading captured part`)
            part.loadAll()
        }
        else {
            log.debug(`Popped to non-captured path ${href}, doing nothing`)
        }
    })
}

/**
 * Returns true if the given path is currently captured.
 * @param path
 */
export function isPathCaptured(path: string): boolean {
    return !!capturePart && path.toLocaleLowerCase().startsWith(capturePath)
}

/**
 * Navigates to a new page with the given path an query parameters.
 * @throws Error unless `Nav.initCapture` has been called first.
 * If the path hasn't been captured, performs a tradition navigation with window.location.href.
 * @param path the destination path
 * @param params the (optional) query parameters to append to the path
 */
export function visit(path: string, params?: QueryParams) {
    if (!capturePart) {
        throw new Error("Trying to navigate with no captured part, call `Nav.initCapture` first!")
    }
    let href = path
    if (params) {
        href = params.serialize(path)
    }
    if (path.toLocaleLowerCase().startsWith(capturePath)) {
        log.debug(`Captured nav to ${href}, reloading capture part`, capturePart)
        history.pushState(null, '', href)
        capturePart.loadAll()
    }
    else { // path hasn't been captured, perform a traditional navigation
        log.debug(`Path ${path} is not captured, performing a traditional navigation`)
        window.location.href = href
    }
}

/**
 * Navigates to a new page with the given path and query parameters, if the given path is captured.
 * If the given path is not captured, does nothing.
 * @param path the destination path
 * @param params the (optional) query parameters to append to the path
 * @return true if the navigation was successful or false if no navigation was performed
 */
export function tryVisit(path: string, params?: QueryParams) {
    if (!isPathCaptured(path)) return false
    visit(path, params)
    return true
}

const Nav = {
    initCapture,
    isPathCaptured,
    visit,
    tryVisit,
}

export default Nav