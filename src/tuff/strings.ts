
// Capitalize only the first word
export function capitalize(word: string) {
    if (!word) return word;
    return word[0].toUpperCase() + word.substring(1).toLowerCase();
}

// Capitalize the first letter of every word
export function titleize(word: string) {
    if (!word) return word;
    return word.split(/\s+/g).map(s => {return capitalize(s)}).join(' ')
}