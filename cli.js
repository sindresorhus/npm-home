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
					url = pkg.repository.url;

					if (isUrl(url) && /^https?:\/\//.test(url)) {
						console.error(`The \`repository\` field in package.json should point to a Git repo and not a website. Please open an issue or pull request on \`${name}\`.`);
					} else {
						console.error(`The \`repository\` field in package.json is invalid. Please open an issue or pull request on \`${name}\`. Using the \`homepage\` field instead.`);

						url = pkg.homepage;
					}
				}

				return opn(url, {wait: false});
			}

			return openNpm(name);
		}).catch(err => {
			if (err.code === 'ENOTFOUND') {
				console.error('No network connected detected!');
			}

			process.exit(1);
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
