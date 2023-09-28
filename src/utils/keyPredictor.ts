const allowedSymbols = {
    consonantsAndNumbers: new Set('qwrtpsdfghjklzxcvbnm1234567890'),
    vowels: new Set('aeiouy'),
};

export const keyPredictor = (str: string, { allowVowels } = { allowVowels: false }) => {
    const allowedChars = new Set(allowedSymbols.consonantsAndNumbers);

    if (allowVowels) {
        allowedSymbols.vowels.forEach((ch) => allowedChars.add(ch));
    }

    const result = [];

    for (const ch of str.toLowerCase()) {
        if (allowedChars.has(ch)) {
            result.push(ch);
        }

        if (result.length >= 10) {
            break;
        }
    }

    return result.join('').toUpperCase();
};
