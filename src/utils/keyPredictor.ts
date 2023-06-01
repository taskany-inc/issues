export const keyPredictor = (str: string, { allowVowels } = { allowVowels: false }) => {
    // eslint-disable-next-line no-control-regex
    let key = str.trim().replace(/[^\x00-\x7F]/g, '');

    key = allowVowels
        ? // eslint-disable-next-line no-useless-escape
          key.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]|/gi, '')
        : // eslint-disable-next-line no-useless-escape
          key.replace(/[aeiouy `~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]|/gi, '');

    return key.toUpperCase().slice(0, 10);
};
