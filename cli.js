#!/usr/bin/env node
'use strict';
const meow = require('meow');
const readPkgUp = require('read-pkg-up');
const opn = require('opn');

const cli = meow(`
	Usage
	  $ npm-home [name]
	  $ nh [name]

	Examples
	  $ npm-home
	  $ npm-home chalk
`);

function open(name) {
	opn(`https://www.npmjs.com/package/${name}`, {wait: false});
}

if (cli.input.length > 0) {
	open(cli.input[0]);
} else {
	readPkgUp().then(x => open(x.pkg.name));
}
