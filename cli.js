#!/usr/bin/env node
'use strict';
const meow = require('meow');
const readPkgUp = require('read-pkg-up');
const open = require('open');
const packageJson = require('package-json');
const githubUrlFromGit = require('github-url-from-git');
const isUrl = require('is-url-superb');

const cli = meow(`
	Usage
	  $ npm-home [name]
	  $ nh [name]

	Options
	  --github -g  Open the GitHub repo of the package
	  --yarn -y    Open the Yarn homepage of the package

	Examples
	  $ npm-home
	  $ npm-home chalk -g
`, {
	flags: {
		github: {
			type: 'boolean',
			alias: 'g'
		},
		yarn: {
			type: 'boolean',
			alias: 'y'
		}
	}
});

const openNpm = async name => open(`https://www.npmjs.com/package/${name}`);
const openYarn = async name => open(`https://yarn.pm/${name}`);

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

(async () => {
	if (cli.input.length > 0) {
		await openPackage(cli.input[0]);
	} else {
		const result = readPkgUp.sync();

		if (!result) {
			console.error('You\'re not in an npm package');
			process.exit(1);
		}

		await openPackage(result.package.name);
	}
})();
