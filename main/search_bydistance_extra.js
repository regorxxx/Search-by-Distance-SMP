﻿'use strict';
//11/08/22

include('search_bydistance.js');

function calculateSimilarArtists({selHandle = fb.GetFocusItem(), properties = null, theme = null, recipe = 'int_simil_artists_calc_graph.json', dateRange = 10, size = 50, method = 'weighted'} = {}) {
	const panelProperties = (typeof buttonsBar === 'undefined') ? properties : getPropertiesPairs(SearchByDistance_panelProperties, sbd_prefix);
	if (panelProperties.bProfile[1]) {var test = new FbProfiler('calculateSimilarArtists');}
	// Retrieve all tracks for the selected artist and compare them against the library (any other track not by the artist)
	const artist = getTagsValuesV3(new FbMetadbHandleList(selHandle), ['artist'], true).flat().filter(Boolean);
	const libQuery = artist.map((tag) => {return _p('ARTIST IS ' + tag);}).join(' AND ');
	// Retrieve artist's tracks and remove duplicates
	const selArtistTracks = removeDuplicatesV2({handleList: fb.GetQueryItems(fb.GetLibraryItems(), libQuery), checkKeys: ['title', 'artist', 'date']});
	// Use only X random tracks instead of all of them
	const report = new Map();
	const randomSelTracks = selArtistTracks.Convert().shuffle().slice(0, size);
	const newConfig = clone(properties);
	// Find which genre/styles are nearest as pre-filter using the selected track
	let forcedQuery = '';
	if (method === 'reference') {
		const genreStyle = getTagsValuesV3(new FbMetadbHandleList(selHandle), ['genre', 'style'], true).flat().filter(Boolean);
		const allowedGenres = getNearestGenreStyles(genreStyle, 50, all_music_graph);
		const allowedGenresQuery = allowedGenres.map((tag) => {return _p('GENRE IS ' + tag + ' OR STYLE IS ' + tag);}).join(' OR ');
		forcedQuery = _p(artist.map((tag) => {return _p('NOT ARTIST IS ' + tag);}).join(' AND ')) + (allowedGenresQuery.length ? ' AND ' + _p(allowedGenresQuery) : '');
	}
	// Weight with all artist's tracks
	const genreStyleWeight = new Map();
	let weight = 1;
	if (method === 'weighted') {
		const genreStyle = getTagsValuesV3(selArtistTracks, ['genre', 'style'], true).flat(Infinity).filter(Boolean);
		const size = genreStyle.length;
		genreStyle.forEach((val) => {
			if (genreStyleWeight.has(val)) {genreStyleWeight.set(val, genreStyleWeight.get(val) + 1);} 
			else {genreStyleWeight.set(val, 1);}
		});
		genreStyleWeight.forEach((val, key) => {genreStyleWeight.set(key, val / size);});
	}
	// Add all possible exclusions to make it faster (even if it less precise)
	// newConfig.genreStyleFilter[1] = [...(clone(music_graph_descriptors.map_distance_exclusions).union(new Set(newConfig.genreStyleFilter[1].split(','))))].join(',');
	if (panelProperties.bProfile[1]) {test.Print('Task #1: Retrieve artists\' track', false);}
	randomSelTracks.forEach((sel) => {
		// Find which genre/styles are nearest as pre-filter with randomly chosen tracks
		if (method === 'variable' || method === 'weighted') {
			const genreStyle = getTagsValuesV3(new FbMetadbHandleList(sel), ['genre', 'style'], true).flat().filter(Boolean);
			const allowedGenres = getNearestGenreStyles(genreStyle, 50, all_music_graph);
			const allowedGenresQuery = allowedGenres.map((tag) => {return _p('GENRE IS ' + tag + ' OR STYLE IS ' + tag);}).join(' OR ');
			forcedQuery = _p(artist.map((tag) => {return _p('NOT ARTIST IS ' + tag);}).join(' AND ')) + (allowedGenresQuery.length ? ' AND ' + _p(allowedGenresQuery) : '');
			if (method === 'weighted') { // Weight will be <= 1 according to how representative of the artist's works is
				weight = [...new Set(genreStyle)].reduce((total, val) => {return total + (genreStyleWeight.has(val) ? genreStyleWeight.get(val) : 0);}, 0);
			}
		}
		// Further filter the tracks using a date range
		const dateTag = newConfig.dateTag[1], dateQueryTag = dateTag.indexOf('$') !== -1 ? _q(dateTag) : dateTag;
		const date = getTagsValuesV4(new FbMetadbHandleList(sel), [dateTag], true).flat().filter(Boolean)[0];
		const dateQuery = date && date.length ? _p(dateQueryTag + ' GREATER ' + (Number(date)- Math.floor(dateRange / 2)) + ' AND ' + dateQueryTag + ' LESS ' + (Number(date) + Math.floor(dateRange / 2))) : null;
		// Compare by genre/style and date using graph method. Exclude anti-influences (faster). All config found on the recipe file
		const data = do_searchby_distance({
			properties: newConfig,
			panelProperties,
			sel, theme, recipe,
			// --->Pre-Scoring Filters
			forcedQuery: dateQuery ? forcedQuery + ' AND ' + dateQuery : forcedQuery
		});
		const [selectedHandlesArray, selectedHandlesData, ] = data ? data : [[], []];
		// Group tracks per artist and sum their score
		const similArtist = getTagsValuesV3(new FbMetadbHandleList(selectedHandlesArray), ['artist'], true);
		const similArtistData = new Map();
		let totalScore = 0;
		const totalCount = selectedHandlesArray.length;
		similArtist.forEach((handleArtist, i) => {
			handleArtist.filter(Boolean).forEach((artist) => {
				if (similArtistData.has(artist)) {
					const data = similArtistData.get(artist);
					data.count++;
					data.score += selectedHandlesData[i].score;
					similArtistData.set(artist, data);
				} else {similArtistData.set(artist, {artist, count: 1, score: selectedHandlesData[i].score});}
				totalScore++;
			});
		});
		// Add artist's score to global list
		for (const [key, value] of similArtistData) {
			const count = value.count / totalCount * weight;
			const score = value.score / totalScore * weight;
			if (report.has(value.artist)) {
				const data = report.get(value.artist);
				data.count += count;
				data.score += score;
				report.set(artist, data);
			} else {report.set(value.artist, {artist: value.artist, count, score});}
		}
	});
	if (panelProperties.bProfile[1]) {test.Print('Task #2: Retrieve scores', false);}
	// Get all matched artists and sort by score, use only first X items
	let total = [];
	for (const [key, value] of report) {
		const count = round(value.count / size * 100, 1);
		if (count > 1) {
			const score = round(value.score / size, 2);
			const scoreW = round(value.score / value.count, 1);
			total.push({artist: value.artist, score, count, scoreW});
		}
	}
	total.sort((a, b) => {return b.scoreW - a.scoreW;});
	return {artist: artist.join(', '), val: total};
}

function getNearestNodes(fromNode, maxDistance, graph = music_graph()) {
	const nodeList = [];
	const nodeListSet = new Set([fromNode]);
	let	remaining = graph.getLinks(fromNode);
	if (remaining) {
		while (remaining.length) {
			let distance = Infinity;
			let toAdd = [];
			remaining.forEach((link) => {
				const toId = nodeListSet.has(link.fromId) ? (nodeListSet.has(link.toId) ? null : link.toId) : link.fromId;
				if (toId) {
					distance = calcMeanDistanceV2(graph, [fromNode], [toId]);
					if (distance <= maxDistance) {
						nodeList.push({toId, distance});
						nodeListSet.add(toId);
						toAdd = toAdd.concat(graph.getLinks(toId));
					}
				}
			});
			remaining = toAdd;
		}
	}
	return nodeList;
}

function getNearestGenreStyles(fromGenreStyles, maxDistance, graph = music_graph()) {
	let genreStyles = [];
	fromGenreStyles.forEach((node) => {getNearestNodes(node, maxDistance, graph).forEach((obj) => {genreStyles.push(obj.toId);});});
	music_graph_descriptors.style_substitutions.forEach((pair) => { //TODO Substitutons method
		const idx = genreStyles.indexOf(pair[0]);
		if (idx !== -1) {genreStyles.splice(idx, 0, ...pair[1]);}
	});
	genreStyles = [...(new Set(genreStyles.filter((node) => {return !node.match(/_supercluster$|_cluster$|_supergenre$| XL$/gi);})))];
	return genreStyles;
}

function getArtistsSameZone({selHandle = fb.GetFocusItem(), properties = null} = {}) {
	const panelProperties = (typeof buttonsBar === 'undefined') ? properties : getPropertiesPairs(SearchByDistance_panelProperties, sbd_prefix);
	include('..\\helpers\\music_graph_descriptors_xxx_countries.js');
	include('..\\helpers\\music_graph_descriptors_xxx_culture.js');
	include('..\\helpers\\world_map_tables.js');
	if (panelProperties.bProfile[1]) {var test = new FbProfiler('getArtistsSameZone');}
	// Retrieve artist
	const dataId = 'artist';
	const selId = fb.TitleFormat(_bt(dataId)).EvalWithMetadb(selHandle);
	if (panelProperties.bProfile[1]) {test.Print('Task #1: Retrieve artists\' track', false);}
	// Retrieve world map data
	const path = (_isFile(fb.FoobarPath + 'portable_mode_enabled') ? '.\\profile\\' + folders.dataName : folders.data) + 'worldMap.json';
	const worldMapData = [];
	if (_isFile(path)) {
		const data = _jsonParseFileCheck(path, 'Tags json', window.Name, utf8);
		if (data) {data.forEach((item) => {worldMapData.push(item);});}
	}
	if (panelProperties.bProfile[1]) {test.Print('Task #2: Retrieve world map data', false);}
	// Retrieve current country
	const selLocale = (worldMapData.find((obj) => {return (obj[dataId] === selId);}) || {}).val || [''];
	const selCountry = selLocale.slice(-1)[0];
	if (panelProperties.bProfile[1]) {test.Print('Task #3: Retrieve current country', false);}
	console.log(selCountry);
	// Retrieve current region
	const selRegion = music_graph_descriptors_countries.getFirstNodeRegion(isoMap.get(selCountry.toLowerCase()));
	console.log(selRegion);
	const selMainRegion = music_graph_descriptors_countries.getMainRegion(selRegion);
	console.log(selMainRegion);
	if (panelProperties.bProfile[1]) {test.Print('Task #4: Retrieve current region', false);}
	// Set allowed countries from current region
	const allowCountryISO = music_graph_descriptors_countries.getNodesFromRegion(selRegion);
	const allowCountryName = new Set(allowCountryISO.map((iso) => {return isoMapRev.get(iso);}));
	allowCountryName.forEach((name) => {if (nameReplacersRev.has(name)) {allowCountryName.add(nameReplacersRev.get(name));}}); // Add alternate names
	if (panelProperties.bProfile[1]) {test.Print('Task #5: Retrieve allowed countries from current region', false);}
	// Compare and get list of allowed artists
	const jsonQuery = [];
	worldMapData.forEach((item) => {
		const country = item.val.length ? item.val.slice(-1)[0].toLowerCase() : null;
		if (country && allowCountryName.has(country)) {jsonQuery.push(item[dataId]);}
	});
	console.log(jsonQuery);
	if (panelProperties.bProfile[1]) {test.Print('Task #6: Compare and get list of allowed artists', false);}
	return jsonQuery ;
}
