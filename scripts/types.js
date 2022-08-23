/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable guard-for-in */

const { readdirSync, writeFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');

const defaultLocale = 'en';
const sourcesDir = (locale = defaultLocale) => `${process.cwd()}/src/pages/help/source/${locale}`;
const typesDir = `${process.cwd()}/src/types/@generated`;

if (!existsSync(typesDir)) {
    mkdirSync(typesDir);
}

// generate types for available help pages
const slugs = readdirSync(sourcesDir()).map((fileName) => `'${fileName.replace('.md', '')}'`);
const helpTypesFile = `
export type AvailableHelpPages = ${slugs.join(' | ')};
`;

writeFileSync(join(typesDir, 'help.ts'), helpTypesFile);
