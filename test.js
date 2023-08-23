import test from 'ava';
import {execa} from 'execa';

const testCli = test.macro(async (t, args = []) => {
	await t.notThrowsAsync(execa('./cli.js', args));
});

test('main', testCli);

test('named package', testCli, ['chalk']);

for (const flag of ['--github', '-g']) {
	test(`github: ${flag}`, testCli, [flag]);
	test(`named package - github: ${flag}`, testCli, [flag, 'chalk']);
}

for (const flag of ['--yarn', '-y']) {
	test(`yarn: ${flag}`, testCli, [flag]);
	test(`named package - yarn: ${flag}`, testCli, [flag, 'chalk']);
}
