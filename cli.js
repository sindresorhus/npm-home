#!/usr/bin/env node
import process from 'node:process';
import meow from 'meow';
import {readPackageUp} from 'read-package-up';
import open from 'open';
import packageJson, {PackageNotFoundError} from 'package-json';
import repoUrlFromPackage from 'repo-url-from-package';
import logSymbols from 'log-symbols';
import pMap from 'p-map';

const cli = meow(`
	Usage
	  $ npm-home [name] […]
	  $ nh [name] […]

	Options
	  --github  -g  Open the GitHub repo of the package
	  --yarn    -y  Open the Yarn homepage of the package

	Examples
	  $ npm-home
	  $ npm-home chalk -g
	  $ npm-home execa ava -y
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

		const {url = packageData.homepage, warnings} = repoUrlFromPackage(packageData);

		for (const warning of warnings) {
			console.error(`${logSymbols.error} ${warning}`);
		}

		if (!url) {
			console.error(`${logSymbols.error} No \`homepage\` field found in package.json.`);
			return;
		}

		await open(url);
	} catch (error) {
		if (error.code === 'ENOTFOUND') {
			console.error(`${logSymbols.error} No network connection detected!`);
			process.exitCode = 1;
			return;
		}

		if (error instanceof PackageNotFoundError) {
			console.error(`${logSymbols.error} ${name} - package not found!`);
			process.exitCode = 1;
			return;
		}

		throw error;
	}
};

const openPackages = async names => pMap(names, async name => {
	if (cli.flags.github) {
		await openGitHub(name);
		return;
	}

	await openNpmOrYarn(name);
}, {concurrency: 5});

if (cli.input.length > 0) {
	await openPackages(cli.input);
} else {
	const result = await readPackageUp();

	if (!result) {
		console.error('You\'re not in an npm package');
		process.exit(1);
	}

	await openPackages([result.packageJson.name]);
}
