/* eslint-disable @typescript-eslint/no-var-requires */
const ColorContrastChecker = require('color-contrast-checker');

const ccc = new ColorContrastChecker();

const generateHex = () => `#${Math.floor(Math.random() * 16777215).toString(16)}`;

export const randomHex = (bg: [string, string], ratio = 7) => {
    let generatedColor: string | null = null;

    const colorsMap = bg.reduce((acc, color) => {
        acc[color] = false;
        return acc;
    }, {} as Record<string, string | boolean>);

    while (!colorsMap[0] && !colorsMap[1]) {
        generatedColor = generateHex();

        try {
            colorsMap[0] = ccc.isLevelCustom(generatedColor, bg[0], ratio);
            colorsMap[1] = ccc.isLevelCustom(generatedColor, bg[1], ratio);
        } catch (e) {
            generatedColor = generateHex();
        }
    }

    return generatedColor;
};
