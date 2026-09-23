/**
 * Synchronously wait for the given amount of time.
 * @param ms the number of milliseconds to wait
 */
function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function nextFrame() {
    return new Promise((resolve) => requestAnimationFrame(resolve))
}

const Time = {
    wait,
    nextFrame,
}

export default Time