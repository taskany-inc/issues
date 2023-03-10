export const keyPredictor = (str: string) =>
    str
        .trim()
        // eslint-disable-next-line no-control-regex
        .replace(/[^\x00-\x7F]/g, '')
        // eslint-disable-next-line no-useless-escape
        .replace(/[aeiou `~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]|/gi, '')
        .toUpperCase()
        .slice(0, 10);
