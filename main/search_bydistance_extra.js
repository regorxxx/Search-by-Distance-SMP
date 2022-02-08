'use strict';
//08/02/22

include('search_bydistance.js');

function calculateSimilarArtists({selHandle = fb.GetFocusItem(), properties = null, theme = null, recipe = null, dateRange = 10} = {}) {
	const panelProperties = (typeof buttons === 'undefined') ? properties : getPropertiesPairs(SearchByDistance_panelProperties, sbd_prefix);
	if (panelProperties.bProfile[1]) {var test = new FbProfiler('calculateSimilarArtists');}
	// Find which genre/styles are nearest as pre-filter
	const genreStyle = getTagsValuesV3(new FbMetadbHandleList(selHandle), ['genre', 'style'], true).flat().filter(Boolean);
	const allowedGenres = getNearestGenreStyles(genreStyle, 50, all_music_graph)
	const allowedGenresQuery = allowedGenres.map((tag) => {return '(GENRE IS ' + tag + ' OR STYLE IS ' + tag + ')'}).join(' OR ');
	// Retrieve all tracks for the selected artist and compare them against the library (any other track not by the artist)
	const artist = getTagsValuesV3(new FbMetadbHandleList(selHandle), ['artist'], true).flat().filter(Boolean);
	const forcedQuery = '(' + artist.map((tag) => {return '(NOT ARTIST IS ' + tag + ')'}).join(' AND ') + (allowedGenresQuery.length ? ') AND (' + allowedGenresQuery + ')' : ')');
	const libQuery = artist.map((tag) => {return '(ARTIST IS ' + tag + ')'}).join(' AND ');
	const selArtistTracks = fb.GetQueryItems(fb.GetLibraryItems(), libQuery);
	// Use only X random tracks instead of all of them
	const report = new Map();
	const size = 50;
	const randomSelTracks = selArtistTracks.Convert().shuffle().slice(0, size);
	const newConfig = clone(properties);
	// Add all possible exclusions to make it faster (even if it less precise)
	// newConfig.genreStyleFilter[1] = [...(clone(music_graph_descriptors.map_distance_exclusions).union(new Set(newConfig.genreStyleFilter[1].split(','))))].join(',');
	if (panelProperties.bProfile[1]) {test.Print('Task #1: Retrieve artists\' track', false);}
	randomSelTracks.forEach((sel) => {
		// Further filter the tracks using a date range
		const dateTag = newConfig.dateTag[1], dateQueryTag = dateTag.indexOf('$') !== -1 ? _q(dateTag) : dateTag;
		const date = getTagsValuesV4(new FbMetadbHandleList(sel), [dateTag], true).flat().filter(Boolean)[0];
		const dateQuery = date && date.length ? '(' + dateQueryTag + ' GREATER ' + (Number(date)- Math.floor(dateRange / 2)) + ' AND ' + dateQueryTag + ' LESS ' + (Number(date) + Math.floor(dateRange / 2)) + ')' : null;
		// Compare by genre/style and date using graph method. Exclude anti-influences (faster)
		const [selectedHandlesArray, selectedHandlesData, ] = do_searchby_distance({
			properties: newConfig,
			panelProperties,
			sel, theme, recipe,
			// --->Weights
			genreWeight: 30, styleWeight: 30, dyngenreWeight: 0, moodWeight: 10, keyWeight: 5, dateWeight: 25, bpmWeight: 0, composerWeight: 0, customStrWeight: 0, customNumWeight: 0,
			dyngenreRange: 0, keyRange: 1, dateRange: dateRange * 2, bpmRange: 0, customNumRange: 0, bNegativeWeighting: true,
			// --->Pre-Scoring Filters
			forcedQuery: dateQuery ? forcedQuery + ' AND ' + dateQuery : forcedQuery,
			bUseAntiInfluencesFilter: true, bUseInfluencesFilter: false, bSimilArtistsFilter: false, bSameArtistFilter: false,
			// --->Scoring Method
			method: 'GRAPH', scoreFilter: 75, sbd_max_graph_distance: "music_graph_descriptors.intra_supergenre / 2",
			// --->Post-Scoring Filters
			poolFilteringTag: [], poolFilteringN: -1, bPoolFiltering: false,
			// --->Playlist selection
			bRandomPick: false, probPick: 100, playlistLength: 200, 
			// --->Playlist sorting
			bSortRandom	: false, bProgressiveListOrder: false, bScatterInstrumentals: false,
			// --->Special Playlists
			bInKeyMixingPlaylist: false, bProgressiveListCreation: false, progressiveListCreationN: 1,
			// --->Console logging
			bProfile: false,
			bShowQuery: false, bShowFinalSelection: false, bBasicLogging: false, bSearchDebug: false,
			// --->Output
			bCreatePlaylist: false // output handle list
		});
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
			if (report.has(value.artist)) {
				const data = report.get(value.artist);
				data.count += (value.count / totalCount);
				data.score += (value.score / totalScore);
				report.set(artist, data);
			} else {report.set(value.artist, {artist: value.artist, count: value.count / totalCount, score: value.score / totalScore});}
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
	const panelProperties = (typeof buttons === 'undefined') ? properties : getPropertiesPairs(SearchByDistance_panelProperties, sbd_prefix);
	include('..\\helpers\\music_graph_descriptors_xxx_countries.js');
	include('..\\helpers\\music_graph_descriptors_xxx_culture.js');
	include('..\\helpers\\world_map_tables.js');
	if (panelProperties.bProfile[1]) {var test = new FbProfiler('getArtistsSameZone');}
	// Retrieve artist
	const dataId = 'artist';
	const selId = fb.TitleFormat('[%' + dataId+ '%]').EvalWithMetadb(selHandle);
	if (panelProperties.bProfile[1]) {test.Print('Task #1: Retrieve artists\' track', false);}
	// Retrieve world map data
	const path = (_isFile(fb.FoobarPath + 'portable_mode_enabled') ? '.\\profile\\' + folders.dataName : folders.data) + 'worldMap.json';
	const worldMapData = [];
	if (_isFile(path)) {
		const data = _jsonParseFileCheck(path, 'Tags json', window.Name, convertCharsetToCodepage('UTF-8'));
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
