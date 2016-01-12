import test from 'ava';
import execa from 'execa';

test(async t => {
	t.doesNotThrow(execa('./cli.js'));
});
