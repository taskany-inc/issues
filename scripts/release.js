/* eslint-disable import/no-dynamic-require */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const conventionalRecommendedBump = require('conventional-recommended-bump');
const conventionalChangelog = require('conventional-changelog');
const semver = require('semver');

const pkg = require(path.join(process.cwd(), 'package.json'));
const defaultPreset = require.resolve('conventional-changelog-conventionalcommits');
const startOfLastReleasePattern = /(^#+ \[?[0-9]+\.[0-9]+\.[0-9]+|<a name=)/m;
const changelogFile = path.join(process.cwd(), 'CHANGELOG.md');
const releaseBotDir = path.join(process.cwd(), '.release_bot');
const releaseNotesDir = path.join(process.cwd(), '.release_notes');
const preset = {
    name: defaultPreset,
};
const header =
    '# Changelog\n\nAll notable changes to this project will be documented in this file. See [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) for commit guidelines.\n\n';

async function bumpVersion(currentVersion, tagPrefix = 'v') {
    const release = await new Promise((resolve, reject) => {
        conventionalRecommendedBump(
            {
                preset,
            },
            (err, release) => (err ? reject(err) : resolve(release)),
        );
    });

    const newVersion = semver.valid(release.releaseType) || semver.inc(currentVersion, release.releaseType);

    return {
        summary: release.reason,
        type: release.releaseType,
        newVersion,
        newTag: `${tagPrefix}${newVersion}`,
    };
}

function createChangelogFileIfMissing() {
    try {
        fs.accessSync(changelogFile, fs.F_OK);
    } catch (err) {
        if (err.code === 'ENOENT') {
            fs.writeFileSync(changelogFile, '\n');
        }
    }
}

function createReleaseBotDirIfMissing() {
    try {
        fs.accessSync(releaseBotDir, fs.F_OK);
    } catch (err) {
        if (err.code === 'ENOENT') {
            fs.mkdirSync(releaseBotDir);
        }
    }
}

function createReleaseNotesDirIfMissing() {
    try {
        fs.accessSync(releaseNotesDir, fs.F_OK);
    } catch (err) {
        if (err.code === 'ENOENT') {
            fs.mkdirSync(releaseNotesDir);
        }
    }
}

function changelog(newVersion, tagPrefix = 'v') {
    createChangelogFileIfMissing();

    return new Promise((resolve, reject) => {
        let history = fs.readFileSync(changelogFile, 'utf-8');
        const historyStart = history.search(startOfLastReleasePattern);
        // find the position of the last release and remove header:
        if (historyStart !== -1) {
            history = history.substring(historyStart);
        }
        let release = '';
        const context = { version: newVersion };
        const changelogStream = conventionalChangelog(
            {
                preset: defaultPreset,
                tagPrefix,
            },
            context,
            { merges: null },
        ).on('error', (err) => reject(err));

        changelogStream.on('data', (buffer) => {
            release += buffer.toString();
        });

        changelogStream.on('end', () => resolve({ header, release, history }));
    });
}

(async () => {
    const release = await bumpVersion(pkg.version);
    const log = await changelog(release.newVersion);

    createReleaseBotDirIfMissing();
    createReleaseNotesDirIfMissing();
    fs.writeFileSync('version', release.newVersion);
    // add release.summary
    fs.writeFileSync(path.join(releaseBotDir, 'body'), log.release);
    fs.writeFileSync(path.join(releaseNotesDir, `${release.newVersion}.md`), log.release);
    fs.writeFileSync(changelogFile, (log.header + log.release + log.history).replace(/\n+$/, '\n'));

    // TODO: bump version in package.json package-lock.json
})();

// DO NEXT IN JOB
// node scripts/release.js
// git checkout -b release/$(cat .release_bot/version)
// git add .
// git commit -m "chore: release $(cat .release_bot/version)"
// git push origin release/$(cat .release_bot/version)
// gh pr create --title "${$(cat .release_bot/pr_title)}" --body "${$(cat .release_bot/pr_body)}"
