
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
 * @param word - A string to titleize
 * @returns - The titleized word
 */
export function titleize(word: string) {
    if (!word) return word;
    return word.split(/\s+/g).map(s => {return capitalize(s)}).join(' ')
}

const wordRegex = /(?<=[a-z\d])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/g

/**
 * Converts a camelCase string to a rope-cased one.
 * @param s A string to rope-case
 * @returns The rope-cased string
 */
export function ropeCase(s: string) {
    return s.split(wordRegex).map(w => {
        return w.toLowerCase()
    }).join('-')
}