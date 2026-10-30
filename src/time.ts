/**
 * Synchronously wait for the given amount of time.
 * @param ms the number of milliseconds to wait
 */
function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Wait for the next frame (i.e. until any pending DOM changes have been rendered)
 */
function nextFrame() {
    return new Promise((resolve) => requestAnimationFrame(resolve))
}

/**
 * Returns a version of the given inner function debounced by waitMs milliseconds.
 * Whenever the debounced function is called, the given inner function will be called after waitMs,
 * if no other calls to the debounced function occur within waitMs of the original call.
 *
 * This is typically used to prevent an expensive operation from being called before the user is done making inputs.
 *
 * @example
 * // In practice, rather than logging, this might update a UI element, send a request to a server, etc.
 * const logUserInput = (str: string) => console.log("user input", str)
 *
 * // not debounced - logs to the console with every keypress in the text field
 * this.onInput(inputKey, m => {
 *     logUserInput(m.event.target.value)
 * })
 *
 * // debounced - logs to the console when the user stops typing for 500ms.
 * // As long as the user keeps typing without pausing, it won't log.
 * const debouncedLogUserInput = debounce(logUserInput, 500)
 * this.onInput(inputKey, m => {
 *     debouncedLogUserInput(m.event.target.value)
 * })
 *
 * @param func
 * @param waitMs
 */
export function debounce<Args extends unknown[]>(func: (...args: Args) => void, waitMs: number): (...args: Args) => void {
    let timeout: number | undefined
    return (...args: Args) => {
        window.clearTimeout(timeout)
        timeout = window.setTimeout(() => func(...args), waitMs)
    }
}

const Time = {
    wait,
    nextFrame,
    debounce,
}

export default Time