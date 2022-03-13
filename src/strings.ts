

const wordRegex = /(?<=[a-z\d])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])|\s+|_+|-+/g

/**
 * Splits a string into words (based on spaces, dashes, underscores, or capitalization)
 * @param s A string to split
 * @returns The string split into words
 */
export function splitWords(s: string): Array<string> {
    return s.split(wordRegex)
}

/**
 * Capitalize only the first word of a string.
 * @param word - A string to capitalize
 * @returns The capitalized string
 */
export function capitalize(word: string) {
    if (!word) return word;
    return word[0].toUpperCase() + word.substring(1).toLowerCase();
}

/**
 * Capitalize the first letter of every word in the string.
 * @param s - A string to titleize
 * @returns - The titleized string
 */
export function titleize(s: string) {
    if (!s) return s;
    return splitWords(s).map(s => {return capitalize(s)}).join(' ')
}

/**
 * Converts a camelCase string to a rope-cased one.
 * @param s A string to rope-case
 * @returns The rope-cased string
 */
export function ropeCase(s: string) {
    return splitWords(s).map(w => {
        return w.toLowerCase()
    }).join('-')
}

/**
 * Converts a rope, space, or underscore delimited string into camelCase.
 * @param s The string to convert
 * @returns The camelCase version of the string
 */
export function camelCase(s: string) {
    return splitWords(s).map((w, i) => {
        return i == 0 ? w.toLocaleLowerCase() : capitalize(w)
    }).join('')
}