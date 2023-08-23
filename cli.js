#!/usr/bin/env node
import process from 'node:process';
import meow from 'meow';
import {readPackageUp} from 'read-pkg-up';
import open from 'open';
import packageJson from 'package-json';
import githubUrlFromGit from 'github-url-from-git';
import isUrl from 'is-url-superb';

const cli = meow(`
	Usage
	  $ npm-home [name]
	  $ nh [name]

	Options
	  --github  -g  Open the GitHub repo of the package
	  --yarn    -y  Open the Yarn homepage of the package

	Examples
	  $ npm-home
	  $ npm-home chalk -g
`, {
	importMeta: import.meta,
	flags: {
		github: {
			type: 'boolean',
			shortFlag: 'g',
		},
		yarn: {
			type: 'boolean',
			shortFlag: 'y',
		},
	},
});

const openNpm = async name => open(`https://www.npmjs.com/package/${name}`);
const openYarn = async name => open(`https://yarnpkg.com/package/?name=${name}`);

const openNpmOrYarn = cli.flags.yarn ? openYarn : openNpm;

const openGitHub = async name => {
	try {
		const packageData = await packageJson(name, {fullMetadata: true});
		const {repository} = packageData;

		if (!repository) {
			await openNpmOrYarn(name);
			return;
		}

		let url = githubUrlFromGit(repository.url);

		if (!url) {
			url = repository.url;

			if (isUrl(url) && /^https?:\/\//.test(url)) {
				console.error(`The \`repository\` field in package.json should point to a Git repo and not a website. Please open an issue or pull request on \`${name}\`.`);
			} else {
				console.error(`The \`repository\` field in package.json is invalid. Please open an issue or pull request on \`${name}\`. Using the \`homepage\` field instead.`);

				url = packageData.homepage;
			}
		}

		await open(url);
	} catch (error) {
		if (error.code === 'ENOTFOUND') {
			console.error('No network connection detected!');
			process.exit(1);
		}

		throw error;
	}
};

const openPackage = async name => {
	if (cli.flags.github) {
		await openGitHub(name);
		return;
	}

	await openNpmOrYarn(name);
};

if (cli.input.length > 0) {
	await openPackage(cli.input[0]);
} else {
	const result = await readPackageUp();

	if (!result) {
		console.error('You\'re not in an npm package');
		process.exit(1);
	}

	await openPackage(result.packageJson.name);
}
