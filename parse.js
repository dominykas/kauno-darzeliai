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

var parseGrp = (win, mm) => {
	var document = win.document;

	assert(document.querySelectorAll('th').length === 5);

	var rows = Array.from(document.querySelectorAll('.darzeliai_table > tbody > tr'));
	return rows.filter((r, i) => i % 2 === 0).map((row, i) => {

		var cells1 = row.querySelectorAll('td');
		assert(cells1.length === 5);

		var cells2 = rows[i*2+1].querySelectorAll('.col-sm-6 td');
		assert(cells2.length === 16);

		assert(cells2[0].textContent === 'Pavadinimas');
		assert(cells2[1].textContent === cells1[1].textContent);
		assert(cells2[2].textContent === 'Auklėtojos');
		assert(cells2[4].textContent === 'Metodika');
		assert(cells2[6].textContent === 'Vietų sk. / Lankantys / Laukiantys');
		var [vietos, lankantys, laukiantys] = cells2[7].textContent.split(" / ");
		assert(vietos === cells1[2].textContent);
		assert(vietos - lankantys <= +cells1[3].textContent);
		assert(cells2[8].textContent === 'Amžiaus grupė');
		assert(cells2[9].textContent === cells1[4].textContent);
		assert(cells2[10].textContent === 'Paslaugų paskirtis');
		assert(cells2[12].textContent === 'Darbo trukmė');
		assert(cells2[14].textContent === 'Mokslo metai');
		assert(cells2[15].textContent === mm);

		var svcRows = rows[i*2+1].querySelectorAll('.col-sm-12 tr');
		assert(svcRows.length === 1 || svcRows.length === 0);

		return {
			pavadinimas: cells1[1].textContent,
			amzius: cells1[4].textContent,
			aukletojos: cells2[3].textContent,
			metodika: cells2[5].textContent,
			paskirtis: cells2[11].textContent,
			darbas: cells2[13].textContent,
			vietos: +cells1[2].textContent,
			laisvos: +cells1[3].textContent,
			lankantys: +lankantys,
			laukiantys: +laukiantys
		}
	});
};

var loadItem = function (item) {
	var jsdomPromises = [
		loadDom(`raw-data/${item}-det.html`),
		loadDom(`raw-data/${item}-eiles.html`),
		loadDom(`raw-data/${item}-grupes-15.html`),
		loadDom(`raw-data/${item}-grupes-16.html`)
	];
	return Promise.all(jsdomPromises).then(([ det, eil, grp15, grp16 ]) => ({ id: item, det, eil, grp15, grp16 }));
};

var parseAll = (item) => {
	return loadItem(item)
		.then(({ id, det, eil, grp15, grp16 }) => {
			return {
				id: item,
				det: parseDet(det),
				eil: parseEil(eil),
				grp: {
					2015: parseGrp(grp15, "2015-2016"),
					2016: parseGrp(grp16, "2016-2017")
				}
			}
		})
		.catch((err) => {
			console.error(item);
			throw err;
		});
};

if (require.main === module) {
	readFile('raw-data/ist-id.txt')
		.then((data) => Promise.all(data.toString().trim().split('\n').map((i) => parseAll(i))))
		.then((parsed) => writeFile('out/data.json', JSON.stringify(parsed, null, '  ')));
}

module.exports = () => readFile('raw-data/ist-id.txt').then((data) => Promise.all(data.toString().trim().split('\n').map((i) => loadItem(i))));
