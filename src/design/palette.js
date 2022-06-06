/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable prefer-destructuring */
const colorLayer = require('color-layer');

// 0 - light,
// 1 - dark
const themes = [
    {
        textColor: 'hsl(0, 0%, 5%)',
    },
    {
        textColor: 'hsl(0, 0%, 90%)',
    },
];

// from 0 to 10
const levelsNumber = [...Array(11).keys()];
// [name, [hue, saturation]]
const colorsOptions = [
    ['gray', [1, 0]],
    ['accent', [156]],
    ['warn', [37]],
    ['danger', [360]],
];

colorsOptions.forEach(([name, [h, s]]) => {
    levelsNumber.forEach((i) => {
        const [light, dark] = colorLayer.default(h, i, s);
        themes[0][`${name}${i}`] = light;
        themes[1][`${name}${i}`] = dark;
    });
});

const [light, dark] = themes;

module.exports = { light, dark };
