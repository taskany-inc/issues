import mdit from 'markdown-it';

export function hslToHex(h: number, s: number, l: number): string {
    const len = l / 100;
    const sat = (s * Math.min(len, 1 - len)) / 100;

    const calc = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = len - sat * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color)
            .toString(16)
            .padStart(2, '0'); // convert to Hex and prefix "0" if needed
    };
    return `#${calc(0)}${calc(8)}${calc(4)}`;
}

export function getHslValues(hslString?: string): [number, number, number] {
    const result: [number, number, number] = [0, 0, 0];

    if (hslString == null) {
        return result;
    }
    const re = /\d+/g;
    const match = hslString.matchAll(re);
    let cursor = 0;

    while (cursor < result.length) {
        const current = match.next();

        if (!current.done) {
            result[cursor] = Number(current.value);
            cursor++;
        }
    }

    return result;
}

export const md = mdit('default', {
    typographer: true,
});
