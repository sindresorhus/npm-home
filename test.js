import test from 'ava';
import {execa} from 'execa';
import * as tq from 'test-quadruple';

test('main - opens npm-home', async t => {
	t.log('This test only checks that opening doesn\'t return an error, not that the correct page was opened.');
	t.log('That has to be manually verified.');

	await t.notThrowsAsync(execa('./cli.js'));
});

test('errors if not in a package', async t => {
	const error = await t.throwsAsync(execa(new URL('cli.js', import.meta.url), {cwd: '/'}));

	t.like(error, {
		stderr: 'You\'re not in an npm package',
		exitCode: 1,
	});
});

const testCli = test.macro(async (t, {arguments_ = [], packageJson, urls: expectedUrls, warnings = []}) => {
	const openSpy = tq.spy();
	const logger = tq.spy();

	await tq.replace({
		modulePath: new URL('cli.js', import.meta.url),
		importMeta: import.meta,
		localMocks: {
			open: openSpy,
			import: {console: {error: logger}},
			...packageJson && {
				'package-json': tq.resolves(packageJson),
			},
		},
		globalMocks: {
			process: {
				argv: [,, ...arguments_], // eslint-disable-line no-sparse-arrays,
				env: {NO_COLOR: '1'},
			},
		},
	});

	const {flatCalls: urls} = tq.explain(openSpy);
	t.deepEqual(urls.sort(), expectedUrls.sort());

	const {flatCalls: logs} = tq.explain(logger);
	t.deepEqual(logs, warnings);
});

test('named package', testCli, {
	arguments_: ['chalk'],
	urls: ['https://www.npmjs.com/package/chalk'],
});

test('multiple packages', testCli, {
	arguments_: ['execa', 'ava'],
	urls: [
		'https://www.npmjs.com/package/execa',
		'https://www.npmjs.com/package/ava',
	],
});

for (const flag of ['--github', '-g']) {
	test(`github: ${flag}`, testCli, {
		arguments_: [flag],
		urls: ['https://github.com/sindresorhus/npm-home'],
	});

	test(`named package - github: ${flag}`, testCli, {
		arguments_: [flag, 'chalk'],
		urls: ['https://github.com/chalk/chalk'],
	});

	test(`multiple packages - github: ${flag}`, testCli, {
		arguments_: [flag, 'execa', 'ava'],
		urls: [
			'https://github.com/sindresorhus/execa',
			'https://github.com/avajs/ava',
		],
	});

	test(`github - does not error on missing package: ${flag}`, async t => {
		// https://github.com/npm/validate-npm-package-name#naming-rules
		const {stderr} = await t.throwsAsync(execa('./cli.js', [flag, '~invalid~']));
		t.is(stderr, '✖ ~invalid~ - package not found!');
	});

	test(`github - warns on non-git repository: ${flag}`, testCli, {
		arguments_: [flag, 'foo'],
		packageJson: {
			name: 'foo',
			repository: {url: 'https://example.com'},
		},
		urls: ['https://example.com'],
		warnings: ['✖ The `repository` field in package.json should point to a Git repo and not a website. Please open an issue or pull request on `foo`.'],
	});

	test(`github - falls back to homepage and warns on invalid repository URL: ${flag}`, testCli, {
		arguments_: [flag, 'foo'],
		packageJson: {
			name: 'foo',
			repository: {url: 'foo'},
			homepage: 'https://example.com',
		},
		urls: ['https://example.com'],
		warnings: ['✖ The `repository` field in package.json is invalid. Please open an issue or pull request on `foo`. Using the `homepage` field instead.'],
	});
}

for (const flag of ['--yarn', '-y']) {
	test(`yarn: ${flag}`, testCli, {
		arguments_: [flag],
		urls: ['https://yarnpkg.com/package/?name=npm-home'],
	});

	test(`named package - yarn: ${flag}`, testCli, {
		arguments_: [flag, 'chalk'],
		urls: ['https://yarnpkg.com/package/?name=chalk'],
	});

	test(`multiple packages - yarn: ${flag}`, testCli, {
		arguments_: [flag, 'execa', 'ava'],
		urls: [
			'https://yarnpkg.com/package/?name=execa',
			'https://yarnpkg.com/package/?name=ava',
		],
	});
}
