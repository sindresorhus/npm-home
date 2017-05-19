import test from 'ava';
import execa from 'execa';

test(async t => {
	await t.notThrows(execa('./cli.js'));
});
