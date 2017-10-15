#!/usr/bin/env node
'use strict';
const meow = require('meow');
const readPkgUp = require('read-pkg-up');
const opn = require('opn');
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
	boolean: [
		'github',
		'yarn'
	],
	alias: {
		g: 'github',
		y: 'yarn'
	}
});

function openNpm(name) {
	return opn(`https://www.npmjs.com/package/${name}`, {wait: false});
}

function openYarn(name) {
	return opn(`https://yarn.pm/${name}`, {wait: false});
}

function open(name) {
	if (cli.flags.github) {
		return packageJson(name, {fullMetadata: true}).then(pkg => {
			if (pkg.repository) {
				let url = githubUrlFromGit(pkg.repository.url);

				if (!url) {
					console.error('The repository URL in package.json is invalid. Open an issue on the project or create a PR with a fix. Opening homepage instead.');
				}

				url = isUrl(pkg.repository.url) ? pkg.repository.url : pkg.homepage;

				return opn(url, {wait: false});
			}

			return openNpm(name);
		});
	}

	if (cli.flags.yarn) {
		return openYarn(name);
	}

	return openNpm(name);
}

if (cli.input.length > 0) {
	open(cli.input[0]);
} else {
	const pkg = readPkgUp.sync().pkg;

	if (!pkg) {
		console.error('You\'re not in an npm package');
		process.exit(1);
	}

	open(pkg.name);
}
