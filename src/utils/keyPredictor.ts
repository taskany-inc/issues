export const keyPredictor = (str: string) =>
    // eslint-disable-next-line no-useless-escape
    str.replace(/[aeiou `~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '').toUpperCase();
