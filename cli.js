#!/usr/bin/env node
'use strict';
const meow = require('meow');
const readPkgUp = require('read-pkg-up');
const opn = require('opn');

meow(`
	Usage
	  $ npm-home
	  $ nh
`);

readPkgUp().then(result => {
	opn(`https://www.npmjs.com/package/${result.pkg.name}`, {wait: false});
});
