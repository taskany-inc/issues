/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable prefer-destructuring */
const colorLayer = require('color-layer');

// 0 - light, 1 - dark
const themes = [
    {
        textColor: 'hsl(0, 0%, 5%)',
    },
    {
        textColor: 'hsl(0, 0%, 90%)',
    },
];

// gray levels
// @ts-ignore
[...Array(10).keys()].forEach((i) => {
    const palette = colorLayer.default(1, i + 1, 0);
    themes[0][`gray${i + 1}`] = palette[0];
    themes[1][`gray${i + 1}`] = palette[1];
});

const [light, dark] = themes;

module.exports = { light, dark };
