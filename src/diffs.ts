import deepDiff from "deep-diff"
import Objects from "./objects"
import { IndexPath, TypeAtPath } from "./types"

// Utilities to cooerce deep-diff style diffs to a format that works nicely with IndexPaths


export type DiffNewResultElement<T> = {
    kind: "N";
    path?: IndexPath<T> | undefined;
    rhs: any;
}

export type DiffDeletedResultElement<T> = {
    kind: "D";
    path?: IndexPath<T> | undefined;
    lhs: any;
}

export type DiffEditResultElement<T> = {
    kind: "E";
    path?: IndexPath<T> | undefined;
    lhs: any;
    rhs: any;
}

export type DiffArrayResultElement<T> = {
    kind: "A";
    path?: IndexPath<T> | undefined;
    index: number;
    item: DiffResultElement<any>;
}

export type DiffResultElement<T> =
    | DiffNewResultElement<T>
    | DiffDeletedResultElement<T>
    | DiffEditResultElement<T>
    | DiffArrayResultElement<T>
export type DiffResult<T> = DiffResultElement<T>[] | undefined

function diff<T>(lhs: T, rhs: T): DiffResult<T> {
    const deepDiffResult = deepDiff.diff(lhs, rhs)
    if (deepDiffResult == undefined) return deepDiffResult

    const tuffDiffResult = deepDiffResult as DiffResultElement<T>[]
    for (let i = 0; i < deepDiffResult.length; i++) {
        tuffDiffResult[i] = processDiffElement(deepDiffResult[i])
    }

    return tuffDiffResult
}

function processDiffElement<T>(diff: deepDiff.Diff<T>): DiffResultElement<T> {
    const result = Objects.shallowCopy(diff) as DiffResultElement<T>
    if (diff.path) {
        result.path = diff.path.join(".") as IndexPath<T>
    }
    if (diff.kind == 'A') {
        (result as DiffArrayResultElement<T>).item = processDiffElement(diff.item)
    }
    return result
}

function filterDiffByPath<
    T,
    TPath extends IndexPath<T>,
    TResult extends TypeAtPath<T, TPath> & object
>(diff: DiffResult<T>, path: TPath): DiffResult<TResult> {
    if (!diff) return diff

    let result: DiffResult<TResult> = undefined
    for (const elem of diff) {
        if (!elem.path?.startsWith(path)) continue
        const newElem = Objects.shallowCopy(elem) as DiffResultElement<TResult>
        newElem.path = newElem.path?.slice(path.length + 1) as IndexPath<TResult> | undefined
        result = []
        result.push(newElem)
    }
    return result
}

function anyInPathChanged<T, TPath extends IndexPath<T>>(diff: DiffResult<T>, path: TPath): boolean {
    if (!diff) return false

    for (const elem of diff) {
        if (elem.path?.startsWith(path)) return true
    }

    return false
}

const Diffs = {
    diff,
    filterDiffByPath,
    anyInPathChanged,
}
export default Diffs