import test from 'ava';
import execa from 'execa';

test(async t => {
	t.notThrows(execa('./cli.js'));
});
