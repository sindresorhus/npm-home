import test from 'ava';
import {execa} from 'execa';

// Tests only checks that opening doesn't return an error, not that the correct page was opened.
// These have to be manually verified.

const testCli = test.macro(async (t, args = []) => {
	await t.notThrowsAsync(execa('./cli.js', args));
});

test('main', testCli);
test('named package', testCli, ['chalk']);
test('multiple packages', testCli, ['execa', 'ava']);

for (const flag of ['--github', '-g']) {
	test(`github: ${flag}`, testCli, [flag]);
	test(`named package - github: ${flag}`, testCli, [flag, 'chalk']);
	test(`multiple packages - github: ${flag}`, testCli, [flag, 'execa', 'ava']);

	test(`github - does not error on missing package: ${flag}`, async t => {
		// https://github.com/npm/validate-npm-package-name#naming-rules
		const {stderr} = await t.throwsAsync(execa('./cli.js', [flag, '~invalid~']));
		t.is(stderr, '✖ ~invalid~ - package not found!');
	});
}

for (const flag of ['--yarn', '-y']) {
	test(`yarn: ${flag}`, testCli, [flag]);
	test(`named package - yarn: ${flag}`, testCli, [flag, 'chalk']);
	test(`multiple packages - yarn: ${flag}`, testCli, [flag, 'execa', 'ava']);
}
