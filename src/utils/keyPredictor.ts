const consonantsTransliterationMap: Record<string, string> = {
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    ж: 'zh',
    з: 'z',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    ф: 'f',
    х: 'h',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'sch',
    ь: '',
    ъ: '',
};

const vowelsTransliterationMap: Record<string, string> = {
    а: 'a',
    е: 'e',
    и: 'i',
    о: 'o',
    у: 'u',
    ы: 'y',
    э: 'e',
    ю: 'yu',
    я: 'ya',
};

const allowedSymbols = {
    consonantsAndNumbers: new Set('qwrtpsdfghjklzxcvbnm1234567890'),
    vowels: new Set('aeiouy'),
};

export const keyPredictor = (str: string, { allowVowels } = { allowVowels: false }) => {
    const allowedChars = new Set(allowedSymbols.consonantsAndNumbers);
    const allowedTransliterationChars = {
        ...consonantsTransliterationMap,
        ...(allowVowels ? vowelsTransliterationMap : undefined),
    };

    if (allowVowels) {
        allowedSymbols.vowels.forEach((ch) => allowedChars.add(ch));
    }

    const result = [];

    for (const ch of str.toLowerCase()) {
        if (allowedTransliterationChars[ch]) {
            result.push(...allowedTransliterationChars[ch].split(''));
        }

        if (allowedChars.has(ch)) {
            result.push(ch);
        }

        if (result.length >= 10) {
            break;
        }
    }

    return result.join('').toUpperCase();
};
