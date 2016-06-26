#!/usr/bin/env node
process.on('unhandledRejection', (e) => console.error(e));

var assert = require('assert');
var denodeify = require('denodeify');
var readFile = denodeify(require('fs').readFile);
var writeFile = denodeify(require('fs').writeFile);
var getDom = denodeify(require('jsdom').env);
var loadDom = (fn) => readFile(fn).then((data) => getDom(data.toString()));

var parseDet = (win) => {
	var document = win.document;

	var cells1 = document.querySelectorAll('.col-sm-7 tr td');
	assert(cells1.length === 10);
	assert(cells1[0].textContent === 'Pavadinimas');
	assert(cells1[2].textContent === 'Adresas');
	assert(cells1[4].textContent === 'Įstaigos vadovas');
	assert(cells1[6].textContent === 'Telefonas');
	assert(cells1[8].textContent === 'Faksas');

	var cells2 = document.querySelectorAll('.col-sm-5 tr td');
	assert(cells2.length === 10);
	assert(cells2[0].textContent === 'Seniūnija');
	assert(cells2[2].textContent === 'Įstaigos tipas');
	assert(cells2[4].textContent === 'El. pašto adresas');
	assert(cells2[6].textContent === 'Svetainė');
	assert(cells2[8].textContent === 'Kodas');

	var cells3 = document.querySelectorAll('.darzeliai_table_modal tr td');
	assert(cells3.length === 6);
	assert(cells3[0].textContent === 'Amžiaus grupės');
	assert(cells3[2].textContent === 'Metodikos');
	assert(cells3[4].textContent === 'Specialistų paslaugos');

	return {
		pavadinimas: cells1[1].textContent,
		adresas: cells1[3].textContent,
		vadovas: cells1[5].textContent,
		telefonas: cells1[7].textContent,
		faksas: cells1[9].textContent,
		seniunija: cells2[1].textContent,
		tipas: cells2[3].textContent,
		elpastas: cells2[5].textContent,
		svetaine: cells2[7].textContent,
		kodas: cells2[9].textContent,
		amziai: Array.from(cells3[1].querySelectorAll('ul li')).map(li => li.textContent),
		metodikos: Array.from(cells3[3].querySelectorAll('ul li')).map(li => li.textContent),
		specialistai: Array.from(cells3[5].querySelectorAll('ul li')).map(li => li.textContent)
	};
};

var parseEil = (win) => {
	var document = win.document;

	assert(document.querySelectorAll('table').length === 1);
	assert(document.querySelectorAll('th').length === 11);

	var rows = Array.from(document.querySelectorAll('tr')).slice(1);
	return rows.map((row) => {

		var cells = row.querySelectorAll('td');
		return {
			reg: cells[2].textContent,
			prio: cells[3].textContent,
			gim: cells[6].textContent,
			mm: cells[7].textContent,
			start: cells[8].textContent,
			metodika: cells[9].textContent,
			statusas: cells[10].textContent
		}
	});
};

var parseGrp = () => {
	// todo
};

var loadItem = function (item) {
	return Promise.all([loadDom(`raw-data/${item}-det.html`), loadDom(`raw-data/${item}-eiles.html`), loadDom(`raw-data/${item}-grupes.html`)])
		.then(([ det, eil, grp ]) => ({ id: item, det, eil, grp }));
};

var parseAll = (item) => {
	return loadItem(item)
		.then(({ id, det, eil, grp }) => {
			return {
				id: item,
				det: parseDet(det),
				eil: parseEil(eil),
				grp: parseGrp(grp)
			}
		});
};

if (require.main === module) {
	readFile('raw-data/ist-id.txt')
		.then((data) => Promise.all(data.toString().trim().split('\n').map((i) => parseAll(i))))
		.then((parsed) => writeFile('out/data.json', JSON.stringify(parsed, null, '  ')));
}

module.exports = () => readFile('raw-data/ist-id.txt').then((data) => Promise.all(data.toString().trim().split('\n').map((i) => loadItem(i))));
