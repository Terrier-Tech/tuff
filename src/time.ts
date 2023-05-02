/**
 * Synchronously wait for the given amount of time.
 * @param ms the number of milliseconds to wait
 */
function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

const Time = {
    wait
}

export default Time