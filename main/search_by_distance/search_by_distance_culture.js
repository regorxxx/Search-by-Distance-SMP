'use strict';
//07/03/25

/* exported getArtistsSameZone, getZoneArtistFilter, getZoneGraphFilter */

/* global sbd:readable */
include('..\\music_graph\\music_graph_xxx.js');
/* global globTags:readable, _p:readable, queryJoin:readable, folders:readable, _isFile:readable, utf8:readable, music_graph_descriptors:readable, _jsonParseFileCheck:readable, _bt:readable, isString:readable, _qCond:readable, isInt:readable */
include('..\\music_graph\\music_graph_descriptors_xxx_countries.js');
/* global music_graph_descriptors_countries:readable */
include('..\\music_graph\\music_graph_descriptors_xxx_culture.js');
/* global music_graph_descriptors_culture:readable */
include('..\\world_map\\world_map_tables.js');
/* global getCountryISO:readable, isoMapRev:readable , nameReplacersRev:readable */

/* function getIsoFromHandle (handle, worldMapData = null) {
	let iso = '';
	const tagName = globTags.locale;
	const localeTag = fb.TitleFormat(_bt(tagName)).EvalWithMetadb(handle).split(', ').filter(Boolean).pop() || '';
	if (localeTag.length) {iso = getCountryISO(localeTag) || '';}
	else {
		const artist = fb.TitleFormat(globTags.artist).EvalWithMetadb(handle);
		{iso, worldMapData} = getLocaleFromId(artist, worldMapData);
	}
	return {iso, worldMapData};
} */

// Similar culture zone
function getLocaleFromId(id, worldMapData = null) {
	const dataId = 'artist';
	const path = '.\\profile\\' + folders.dataName + 'worldMap.json'; // TODO Expose paths at properties
	if (!worldMapData && _isFile(path)) {
		const data = _jsonParseFileCheck(path, 'Tags json', window.Name, utf8);
		if (data) { worldMapData = data; }
	}
	if (!id || !worldMapData) {
		if (!worldMapData) { console.log('getZoneArtistFilter: no world map data available'); }
		return Array.isArray(id)
			? id.map(() => { return { locale: [''], country: '', iso: '', worldMapData: null }; })
			: { locale: [''], country: '', iso: '', worldMapData: null };
	}
	// Retrieve current country
	if (Array.isArray(id)) { return id.map((subId) => getLocaleFromId(subId, worldMapData)); }
	else {
		const output = { locale: [''], country: '', iso: '', worldMapData: null };
		output.locale = (worldMapData.find((obj) => { return (obj[dataId] === id); }) || {}).val || [''];
		output.country = output.locale.length ? (output.locale.slice(-1)[0] || '') : '';
		output.iso = output.country.length ? (getCountryISO(output.country) || '') : '';
		output.worldMapData = worldMapData;
		return output;
	}
}

// Similar culture zone
function getArtistsSameZone({ selHandle = fb.GetFocusItem() } = {}) {
	const bProfile = typeof sbd !== 'undefined' && sbd.panelProperties.bProfile[1];
	const test = bProfile ? new FbProfiler('getArtistsSameZone') : null;
	// Retrieve artist
	const dataId = 'artist';
	const selId = fb.TitleFormat(_bt(dataId)).EvalWithMetadb(selHandle);
	if (bProfile) { test.Print('Task #1: Retrieve artists\' track', false); }
	// Retrieve world map data
	const { iso: selIso, worldMapData } = getLocaleFromId(selId);
	if (bProfile) { test.Print('Task #3: Retrieve current country', false); }
	const allowCountryName = new Set();
	if (selIso.length) {
		// Retrieve current region
		const selRegion = music_graph_descriptors_countries.getFirstNodeRegion(selIso);
		if (bProfile) { test.Print('Task #4: Retrieve current region', false); }
		// Set allowed countries from current region
		const allowCountryISO = music_graph_descriptors_countries.getNodesFromRegion(selRegion).flat(Infinity);
		allowCountryISO.forEach((iso) => {
			const name = isoMapRev.get(iso);
			if (name) { allowCountryName.add(name.toLowerCase()); }
		});
		allowCountryName.forEach((name) => { // Add alternate names
			if (nameReplacersRev.has(name)) { allowCountryName.add(nameReplacersRev.get(name)); }
		});
		if (bProfile) { test.Print('Task #5: Retrieve allowed countries from current region', false); }
	}
	// Compare and get list of allowed artists
	const artists = [];
	if (allowCountryName.size !== 0) {
		worldMapData.forEach((item) => {
			const country = item.val.length ? item.val.slice(-1)[0].toLowerCase() : null;
			if (country && allowCountryName.has(country)) { artists.push(item[dataId]); }
		});
	}
	if (bProfile) { test.Print('Task #6: Compare and get list of allowed artists', false); }
	return artists;
}

function getCountriesFromISO(iso, mode) {
	const keys = ['continent', 'region', 'country', 'no-continent', 'no-region', 'no-country'];
	mode = isInt(mode)
		? keys[mode] || ''
		: mode ? mode.toLowerCase() : '';
	// Retrieve current region
	const selRegion = music_graph_descriptors_countries.getFirstNodeRegion(iso);
	// Set allowed countries from current region
	let filterNodes = [];
	let oppositeNodes = [];
	switch (mode) {
		case 'continent':
		case 'no-continent': {
			const selMainRegion = music_graph_descriptors_countries.getMainRegion(selRegion);
			filterNodes = music_graph_descriptors_countries.getNodesFromRegion(selMainRegion).flat(Infinity);
			oppositeNodes = [...new Set(music_graph_descriptors_countries.getNodes()).difference(new Set(filterNodes))];
			break;
		}
		case 'region':
		case 'no-region': {
			filterNodes = music_graph_descriptors_countries.getNodesFromRegion(selRegion).flat(Infinity);
			oppositeNodes = [...new Set(music_graph_descriptors_countries.getNodes()).difference(new Set(filterNodes))];
			break;
		}
		case 'country':
		case 'no-country': {
			filterNodes = [iso];
			oppositeNodes = [...new Set(music_graph_descriptors_countries.getNodes()).difference(new Set(filterNodes))];
			break;
		}
		default: {
			filterNodes = music_graph_descriptors_countries.getNodes();
		}
	}
	return mode.startsWith('no-')
		? [oppositeNodes, filterNodes]
		: [filterNodes, oppositeNodes];
}

function getZoneArtistFilter(iso, mode = 'region', worldMapData = null, localeTag = globTags.locale) {
	// Retrieve artist
	const dataId = 'artist';
	// Retrieve world map data
	const path = '.\\profile\\' + folders.dataName + 'worldMap.json'; // TODO Expose paths at properties
	if (!worldMapData && _isFile(path)) {
		const data = _jsonParseFileCheck(path, 'Tags json', window.Name, utf8);
		if (data) { worldMapData = data; }
	}
	if (!worldMapData) { console.log('getZoneArtistFilter: no world map data available'); return; }
	// Set allowed countries from current region
	const [countryISO, noCountryISO] = getCountriesFromISO(iso, mode);
	const countryName = new Set(countryISO.map((iso) => { return isoMapRev.get(iso).toLowerCase(); }).filter(Boolean));
	countryName.forEach((name) => { if (nameReplacersRev.has(name)) { countryName.add(nameReplacersRev.get(name)); } }); // Add alternate names
	// Compare and get list of allowed artists
	const artists = [];
	worldMapData.forEach((item) => {
		const country = item.val.length ? item.val.slice(-1)[0].toLowerCase() : null;
		if (country && countryName.has(country)) { artists.push(item[dataId]); }
	});
	// Query
	let query = [];
	query.push(queryJoin(artists.map((artist) => globTags.artist + ' IS ' + artist), 'OR'));
	// Compare if negating countries is smaller than the opposite list, which should be faster for queries
	if (noCountryISO.length < countryISO.length) {
		const noCountryName = new Set(noCountryISO.map((iso) => isoMapRev.get(iso).toLowerCase()).filter(Boolean));
		noCountryName.forEach((name) => { if (nameReplacersRev.has(name)) { countryName.add(nameReplacersRev.get(name)); } });
		query.push(_qCond(localeTag) + ' PRESENT AND NOT ' + _p(queryJoin(Array.from(noCountryName, (country) => _qCond(localeTag) + ' IS ' + country), 'OR')));
	} else {
		query.push(queryJoin(Array.from(countryName, (country) => _qCond(localeTag) + ' IS ' + country), 'OR'));
	}
	query = queryJoin(query, 'OR');
	return { artists, countries: { iso: countryISO, name: countryName }, query };
}

// Similar culture zone
function getZoneGraphFilter(styleGenre, mode = 'region') {
	if (Array.isArray(styleGenre)) {
		return [...new Set(styleGenre.filter(Boolean).map((_) => getZoneGraphFilter(_, mode)).flat(Infinity))];
	}
	mode = isString(mode) ? mode.toLowerCase() : mode;
	// Retrieve current region
	const regions = music_graph_descriptors_culture.getStyleRegion(styleGenre); // multiple outputs!
	// Set allowed genres from current region
	let styleGenreRegion = new Set();
	if (regions) {
		switch (mode) {
			case 0:
			case 'continent':
			case 1:
			case 'region': break;
			default:
				music_graph_descriptors_culture.getNodes().forEach((sg) => sg && styleGenreRegion.add(sg));
		}
		Object.keys(regions).forEach((key) => {
			switch (mode) {
				case 0:
				case 'continent': {
					music_graph_descriptors_culture.getNodesFromRegion(key).flat(Infinity).forEach((sg) => sg && styleGenreRegion.add(sg));
					break;
				}
				case 1:
				case 'region': {
					regions[key].forEach((subKey) => {
						music_graph_descriptors_culture.getNodesFromRegion(subKey).flat(Infinity).forEach((sg) => sg && styleGenreRegion.add(sg));
					});
					break;
				}
				case 2: // This implies a track with a forbidden genre is still valid as long as it has an allowed genre too
				case 'no-continent': {
					music_graph_descriptors_culture.getNodesFromRegion(key).flat(Infinity).forEach((sg) => styleGenreRegion.delete(sg));
					break;
				}
				case 3:
				case 'no-region': {
					regions[key].forEach((subKey) => {
						music_graph_descriptors_culture.getNodesFromRegion(subKey).flat(Infinity).forEach((sg) => styleGenreRegion.delete(sg));
					});
					break;
				}
			}
		});
	}
	styleGenreRegion.forEach((sg) => styleGenreRegion.add(music_graph_descriptors.getSubstitution(sg))); // Add alternate names
	return [...styleGenreRegion].filter(Boolean);
}