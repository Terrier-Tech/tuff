

/**
 * Returns a new set with the union of the two given sets
 * @param a
 * @param b
 */
export function union<T>(a: Iterable<T>, b: Iterable<T>): Set<T> {
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
export function unionMut<T>(a: Set<T>, b: Iterable<T>): Set<T> {
    for (const t of b) {
        a.add(t)
    }
    return a
}

export function diff<T>(a: Iterable<T>, b: Iterable<T>): Set<T> {
    const set = new Set<T>(a)
    for (const t of b) {
        set.delete(t)
    }
    return set
}

export function diffMut<T>(a: Set<T>, b: Iterable<T>): Set<T> {
    for (const t of b) {
        a.delete(t)
    }
    return a
}

export function intersect<T>(a: Iterable<T>, b: Iterable<T>): Set<T> {
    const set = new Set<T>()
    const bSet = b instanceof Set ? b as Set<T> : new Set<T>(b)
    for (const t of a) {
        if (bSet.has(t)) {
            set.add(t)
        }
    }
    return set
}

export function intersectMut<T>(a: Set<T>, b: Iterable<T>): Set<T> {
    const bSet = b instanceof Set ? b as Set<T> : new Set<T>(b)
    for (const t of a) {
        if (!bSet.has(t)) {
            a.delete(t)
        }
    }
    return a
}
