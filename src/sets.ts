

/**
 * Returns a new set with the union of the two given sets
 * @param a
 * @param b
 */
function union<T>(a: Iterable<T>, b: Iterable<T>): Set<T> {
    const set = new Set<T>(a)
    for (const t of b) {
        set.add(t)
    }
    return set
}

/**
 * Mutates set `a` to contain all of the elements in `b`
 * @param a
 * @param b
 */
function unionMut<T>(a: Set<T>, b: Iterable<T>): Set<T> {
    for (const t of b) {
        a.add(t)
    }
    return a
}

function diff<T>(a: Iterable<T>, b: Iterable<T>): Set<T> {
    const set = new Set<T>(a)
    for (const t of b) {
        set.delete(t)
    }
    return set
}

function diffMut<T>(a: Set<T>, b: Iterable<T>): Set<T> {
    for (const t of b) {
        a.delete(t)
    }
    return a
}

function intersect<T>(a: Iterable<T>, b: Iterable<T>): Set<T> {
    const set = new Set<T>()
    const bSet = b instanceof Set ? b as Set<T> : new Set<T>(b)
    for (const t of a) {
        if (bSet.has(t)) {
            set.add(t)
        }
    }
    return set
}

function intersectMut<T>(a: Set<T>, b: Iterable<T>): Set<T> {
    const bSet = b instanceof Set ? b as Set<T> : new Set<T>(b)
    for (const t of a) {
        if (!bSet.has(t)) {
            a.delete(t)
        }
    }
    return a
}


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Sets = {
    diff,
    diffMut,
    intersect,
    intersectMut,
    union,
    unionMut
}

export default Sets