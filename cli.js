#!/usr/bin/env node
'use strict';
const meow = require('meow');
const readPkgUp = require('read-pkg-up');
const opn = require('opn');
const packageJson = require('package-json');
const githubUrlFromGit = require('github-url-from-git');

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
				const url = pkg.repository.url.startsWith('git') ? githubUrlFromGit(pkg.repository.url) : `${pkg.repository.url}`;

				if (!url) {
					console.log('Invalid repository URL, opening homepage');
					return opn(pkg.homepage, {wait: false});
				}

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
	readPkgUp().then(x => open(x.pkg.name));
}
