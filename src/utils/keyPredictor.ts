import slugify from 'slugify';

export const keyPredictor = (str: string) =>
    // eslint-disable-next-line no-control-regex
    slugify(str.trim().replace(/[^\x00-\x7F]/g, ''), {
        // eslint-disable-next-line no-useless-escape
        remove: /[aeiou `~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]|/gi,
    })
        .toUpperCase()
        // For the key to consist of 10 characters
        .slice(0, 10);
