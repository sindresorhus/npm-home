import test from 'ava';
import execa from 'execa';

test('main', async t => {
	await t.notThrowsAsync(execa('./cli.js'));
});
