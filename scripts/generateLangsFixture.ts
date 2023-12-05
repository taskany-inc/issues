/* eslint-disable no-console */
import child from 'child_process';
import crypto from 'crypto';
import { tmpdir } from 'os';
import path from 'path/posix';
import fs from 'fs/promises';

type NamespaceContent = Record<string, Record<'en' | 'ru', string>>;

interface LangsContent {
    [key: string]: NamespaceContent;
}

const ac = new AbortController();
const { signal } = ac;
setTimeout(() => ac.abort(), 10000);

const tempFile = path.join(tmpdir(), `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.json`);

const run = () => {
    return new Promise((resolve, reject) => {
        const proc = child.spawn('npm', ['run', 'extract-i18n', '--', `--out=${tempFile}`], {
            env: process.env,
            stdio: 'inherit',
            detached: false,
            signal,
        });

        proc.on('close', () => {
            process.nextTick(async () => {
                try {
                    const data = await fs.readFile(path.resolve(tempFile), { encoding: 'utf8' });

                    if (!data) {
                        reject(new Error('No content'));
                    }
                    const { entries } = JSON.parse(data);

                    const content = Object.keys(entries).reduce<LangsContent>((acc, key) => {
                        const fileName = key.split('/').at(-1);

                        const keys = Object.keys(entries[key]);

                        if (fileName) {
                            acc[fileName] = keys.reduce<NamespaceContent>((tr, k) => {
                                tr[k] = entries[key][k].translations;
                                return tr;
                            }, {});
                        }

                        return acc;
                    }, {});

                    await fs.writeFile(
                        path.join(process.cwd(), 'cypress/fixtures/langs.json'),
                        JSON.stringify(content, null, 4),
                        {
                            encoding: 'utf-8',
                        },
                    );

                    await fs.rm(path.resolve(tempFile));

                    resolve(0);
                } catch (error) {
                    reject(error);
                }
            });
        });

        proc.on('error', (error) => {
            console.error(error);
            reject(error);
        });
    });
};

run()
    .then(() => {
        console.log('\x1b[32mLang fixture created successfully!\x1b[0m');
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(error?.code ?? 1);
    });
