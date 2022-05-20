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
    capturePath = path

    // handle all click events and listen to those starting with `path`
    document.addEventListener("click", (evt) => {
        // find the href of the anchor tag in the event path
        let href: string | null = null
        for (let e of evt.composedPath()) {
            const elem = e as HTMLElement
            if (elem.tagName == 'A') {
                href = elem.getAttribute('href')
                log.debug("Clicked on anchor", elem)
                break
            }
        }

        // if there's an href, see if it's captured
        if (href && href.startsWith(path)) {
            evt.stopPropagation()
            evt.preventDefault()
            log.debug(`Captured navigation to ${href}`)
            history.pushState(null, '', href)
            part.loadAll()
        }
    })
}

/**
 * Navigates to a new page with the given path an query parameters.
 * @throws an exception unless `Nav.initCapture` has been called first.
 * If the path hasn't been captured, performs a tradition navigation with window.location.href.
 * @param path the destination path
 * @param params the (optional) query parameters to append to the path
 */
function visit(path: string, params?: QueryParams) {
    if (!capturePart) {
        throw "Trying to navigate with no captured part, call `Nav.initCapture` first!"
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

const Nav = {
    initCapture,
    visit
}

export default Nav