#!/usr/bin/env bash

while read id; do
	curl 'http://www.kaunas.lt/wp-content/themes/kaunaslt/ajax.php' --data "action=darzeliai_get_istaiga_det&ist_id=${id}" > raw-data/${id}-det.html
	curl 'http://www.kaunas.lt/wp-content/themes/kaunaslt/ajax.php' --data "action=darzeliai_get_istaigos_eiles&ist_id=${id}" > raw-data/${id}-eiles.html
	curl 'http://www.kaunas.lt/wp-content/themes/kaunaslt/ajax.php' --data "action=darzeliai_get_istaigos_grupes&ist_id=${id}" > raw-data/${id}-grupes.html
done <raw-data/ist-id.txt
