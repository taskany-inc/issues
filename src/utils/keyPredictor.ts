import slugify from 'slugify';

export const keyPredictor = (str: string) =>
    slugify(str.replace(/[0-9]/g, ''), {
        // eslint-disable-next-line no-useless-escape
        remove: /[aeiou `~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]|/gi,
    })
        .toUpperCase()
        // For the key to consist of 10 characters
        .slice(0, 10);
