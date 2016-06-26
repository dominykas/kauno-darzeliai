#!/usr/bin/env bash

while read id; do
	curl 'http://www.kaunas.lt/wp-content/themes/kaunaslt/ajax.php' --data "action=darzeliai_get_istaiga_det&ist_id=${id}" > raw-data/${id}-det.html
	curl 'http://www.kaunas.lt/wp-content/themes/kaunaslt/ajax.php' --data "action=darzeliai_get_istaigos_eiles&ist_id=${id}" > raw-data/${id}-eiles.html
	curl 'http://www.kaunas.lt/wp-content/themes/kaunaslt/ajax.php' --data "action=darzeliai_get_istaigos_grupes&ist_id=${id}&mokslo_metai=15" > raw-data/${id}-grupes-15.html
	curl 'http://www.kaunas.lt/wp-content/themes/kaunaslt/ajax.php' --data "action=darzeliai_get_istaigos_grupes&ist_id=${id}&mokslo_metai=16" > raw-data/${id}-grupes-16.html
done <raw-data/ist-id.txt
