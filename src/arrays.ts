// Returns a Record with keys for each unique value of getKey
export function groupBy<T, K extends keyof any>(list: T[], getKey: (item: T) => K): Record<K, T[]> {
    return list.reduce((previous, currentItem) => {
        const group = getKey(currentItem)
        if (!previous[group]) previous[group] = []
        previous[group].push(currentItem)
        return previous
    }, {} as Record<K, T[]>)
}

// Iterates over the results of groupBy
export function eachGroupBy<T, K extends keyof any>(list: T[], getKey: (item: T) => K, fun: (key: K, values: T[]) => any) {
    for (let [k, v] of Object.entries(groupBy(list, getKey))) {
        fun(k as K, v as T[])
    }
}