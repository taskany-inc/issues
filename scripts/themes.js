/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable guard-for-in */
const { paramCase, camelCase } = require('change-case');
const { join, dirname } = require('path');
const { writeFile, mkdir } = require('fs');
const { promisify } = require('util');

const writeFileAsync = promisify(writeFile);
const mkdirpAsync = promisify(mkdir);
const writeToShadowDir = (file, content) =>
    mkdirpAsync(dirname(file), { recursive: true }).then(() => writeFileAsync(file, content, 'utf-8'));
const themesFolder = join(process.cwd(), 'src', 'design', '@generated', 'themes');
const themes = {
    dark: require('../src/design/themes/dark'),
    light: require('../src/design/themes/light'),
};

const jsToken = (token, value, { noVar } = {}) =>
    `export const ${camelCase(token)} = '${noVar ? value : `var(--${paramCase(token)})`}';`;
const cssToken = (token, value, tabs = 8) => `${' '.repeat(tabs)}--${paramCase(token)}: ${value};\n`;

const jsTokensFile = (theme, file, { noVar } = {}) => {
    const fileContent = ['// AUTOGENERATED CONTENT\n'];

    for (const token in theme) {
        fileContent.push(jsToken(token, theme[token], { noVar }));
        fileContent.push('\n');
    }

    return writeToShadowDir(file, fileContent.join(''));
};

const cssTokensFile = (theme, file, tabs = 4) => {
    const fileContent = [
        '// AUTOGENERATED CONTENT\n',
        "import { createGlobalStyle } from 'styled-components';\n\n",
        'export default createGlobalStyle`\n',
        `${' '.repeat(tabs)}:root {\n`,
    ];

    for (const token in theme) {
        if (!theme[token].value) fileContent.push(cssToken(token, theme[token]));
    }

    fileContent.push(`${' '.repeat(tabs)}}\n`);
    fileContent.push('`;\r\n');

    return writeToShadowDir(file, fileContent.join(''));
};

(async (t) => {
    const writers = [];

    const themes = Object.keys(t);
    for (const theme in t) {
        for (const token in t[theme]) {
            themes.forEach((themeName) => {
                if (!t[themeName][token]) {
                    console.log('\n');
                    console.warn(`😞 Token: "${token}" doesn't exist in theme "${themeName}"!`);
                }
            });
        }
    }

    for (const theme in t) {
        writers.push(cssTokensFile(t[theme], join(themesFolder, `${theme}.ts`)));
        writers.push(jsTokensFile(t[theme], join(themesFolder, `${theme}.constants.ts`), { noVar: true }));
    }

    const tokensSchema = t[themes[0]];
    writers.push(jsTokensFile(tokensSchema, join(themesFolder, 'index.ts')));

    await Promise.all(writers);
})({
    dark: {
        ...themes.dark,
    },
    light: {
        ...themes.light,
    },
});
