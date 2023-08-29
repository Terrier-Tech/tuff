
/**
 * Splits a string into words (based on spaces, dashes, underscores, or capitalization)
 * @param s A string to split
 * @returns The string split into words
 */
function splitWords(s: string): Array<string> {
    const words = []

    let currentWord: string[] = []

    for (let i = 0; i < s.length; i++) {
        const char = s[i]

        if (isDiscardable(char)) {
            if (currentWord.length) {
                words.push(currentWord.join(''))
                currentWord = []
            }
            continue
        }

        const prevChar = i > 0 ? s[i - 1] : undefined
        const nextChar = i < s.length - 1 ? s[i + 1] : undefined

        const newUppercase = prevChar && !isUpperCase(prevChar) && isUpperCase(char)
        const endAcronym = nextChar && isUpperCase(char) && isWord(nextChar) && !isUpperCase(nextChar)

        if (newUppercase || endAcronym) {
            if (currentWord.length) {
                words.push(currentWord.join(''))
                currentWord = []
            }
        }

        currentWord.push(char)
    }

    if (currentWord.length)
    {
        words.push(currentWord.join(''))
    }

    return words
}

function isDiscardable(char: string) {
    return !!char.match(/[\s\-_]+/g)
}

function isWord(s: string) {
    return !!s.match(/^[a-zA-Z]$/)
}

function isUpperCase(s: string) {
    return s == s.toUpperCase() && s != s.toLowerCase()
}

/**
 * Capitalize only the first word of a string.
 * @param word - A string to capitalize
 * @returns The capitalized string
 */
function capitalize(word: string) {
    if (!word) return word;
    return word[0].toUpperCase() + word.substring(1).toLowerCase();
}

/**
 * Capitalize the first letter of every word in the string.
 * @param s - A string to titleize
 * @returns - The titleized string
 */
function titleize(s: string) {
    if (!s) return s;
    return splitWords(s).map(s => {return capitalize(s)}).join(' ')
}

/**
 * Converts a camelCase string to a rope-cased one.
 * @param s A string to rope-case
 * @returns The rope-cased string
 */
function ropeCase(s: string) {
    return splitWords(s).map(w => {
        return w.toLowerCase()
    }).join('-')
}

/**
 * Converts a rope, space, or underscore delimited string into camelCase.
 * @param s The string to convert
 * @returns The camelCase version of the string
 */
function camelCase(s: string) {
    return splitWords(s).map((w, i) => {
        return i == 0 ? w.toLocaleLowerCase() : capitalize(w)
    }).join('')
}

/**
 * Downcases and replaces all non-alphanumeric characters with dashes so the string is suitable to use as a slug.
 * @param s the string to slugify
 */
function slugify(s: string) {
    return s.toLowerCase().replace(/\W/g, '-')
}


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Strings = {
    camelCase,
    capitalize,
    isDiscardable,
    isUpperCase,
    isWord,
    ropeCase,
    slugify,
    splitWords,
    titleize
}

export default Strings