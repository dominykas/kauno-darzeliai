#!/usr/bin/env node

var _ = require('lodash');
var data = require('./out/data.json');

var eilFilter = (e) => {
	return e.statusas !== 'Nepavyko susisiekti prašyme nurodytais kontaktais'
		&& e.statusas !== 'Lanko (-ys) kitoje įstaigoje'
		&& (e.mm === '2015-2016' || e.mm === '2016-2017' || e.mm === '2017-2018');
};

require('fs').writeFileSync('./out/vietos.csv',
	_(data).map((x) => [
		x.det.pavadinimas,
		x.det.seniunija,
		x.det.adresas.trim(),
		_(x.grp['2015']).filter(g => g.amzius === 'priešmokyklinė').sumBy('vietos'),
		_(x.grp['2016']).filter(g => g.amzius === 'priešmokyklinė').sumBy('vietos'),
		_.filter(x.eil, eilFilter).length
	].join('\t')).value().join('\n'));
