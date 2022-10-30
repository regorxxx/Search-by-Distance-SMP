'use strict';
//30/10/22

include('search_bydistance.js');

async function calculateSimilarArtists({selHandle = fb.GetFocusItem(), properties = null, theme = null, recipe = 'int_simil_artists_calc_graph.json', dateRange = 10, size = 50, method = 'weighted'} = {}) {
	if (sbd.panelProperties.bProfile[1]) {var test = new FbProfiler('calculateSimilarArtists');}
	// Retrieve all tracks for the selected artist and compare them against the library (any other track not by the artist)
	const artist = getTagsValuesV3(new FbMetadbHandleList(selHandle), ['ARTIST'], true).flat().filter(Boolean);
	const libQuery = artist.map((tag) => {return _p('ARTIST IS ' + tag);}).join(' AND ');
	// Retrieve artist's tracks and remove duplicates
	const selArtistTracks = removeDuplicatesV2({handleList: fb.GetQueryItems(fb.GetLibraryItems(), libQuery), bAdvTitle: true});
	// Use only X random tracks instead of all of them
	const report = new Map();
	const randomSelTracks = selArtistTracks.Convert().shuffle().slice(0, size);
	const newConfig = clone(properties);
	const genreTag = newConfig.genreTag[1].split(',').filter(Boolean);
	const genreQueryTag = genreTag.map((tag) => {return ((tag.indexOf('$') === -1) ? tag : _q(tag));});
	const styleTag = newConfig.styleTag[1].split(',').filter(Boolean);
	const styleQueryTag = styleTag.map((tag) => {return ((tag.indexOf('$') === -1) ? tag : _q(tag));});
	const genreStyleTag = [...new Set(genreTag.concat(styleTag))];
	// Find which genre/styles are nearest as pre-filter using the selected track
	let forcedQuery = '';
	if (method === 'reference') {
		const genreStyle = getTagsValuesV3(new FbMetadbHandleList(selHandle), genreStyleTag, true).flat().filter(Boolean);
		const allowedGenres = getNearestGenreStyles(genreStyle, 50, sbd.allMusicGraph);
		// const allowedGenresQuery = allowedGenres.map((tag) => {return _p('GENRE IS ' + tag + ' OR STYLE IS ' + tag);}).join(' OR ');
		const allowedGenresQuery = allowedGenres.map((tag) => {return _p(genreQueryTag[0] + ' IS ' + tag + ' OR ' + styleQueryTag[0] + ' IS ' + tag);}).join(' OR ');
		forcedQuery = _p(artist.map((tag) => {return _p('NOT ARTIST IS ' + tag);}).join(' AND ')) + (allowedGenresQuery.length ? ' AND ' + _p(allowedGenresQuery) : '');
	}
	// Weight with all artist's tracks
	const genreStyleWeight = new Map();
	let weight = 1;
	if (method === 'weighted') {
		const genreStyle = getTagsValuesV3(selArtistTracks, genreStyleTag, true).flat(Infinity).filter(Boolean);
		const size = genreStyle.length;
		genreStyle.forEach((val) => {
			if (genreStyleWeight.has(val)) {genreStyleWeight.set(val, genreStyleWeight.get(val) + 1);} 
			else {genreStyleWeight.set(val, 1);}
		});
		genreStyleWeight.forEach((val, key) => {genreStyleWeight.set(key, val / size);});
	}
	// Add all possible exclusions to make it faster (even if it less precise)
	// newConfig.genreStyleFilter[1] = [...(clone(music_graph_descriptors.map_distance_exclusions).union(new Set(newConfig.genreStyleFilter[1].split(','))))].join(',');
	if (sbd.panelProperties.bProfile[1]) {test.Print('Task #1: Retrieve artists\' track', false);}
	for await (const sel of randomSelTracks) {
		// Find which genre/styles are nearest as pre-filter with randomly chosen tracks
		if (method === 'variable' || method === 'weighted') {
			const genreStyle = getTagsValuesV3(new FbMetadbHandleList(sel), genreStyleTag, true).flat().filter(Boolean);
			const allowedGenres = getNearestGenreStyles(genreStyle, 50, sbd.allMusicGraph);
			const allowedGenresQuery = allowedGenres.map((tag) => {return _p(genreQueryTag[0] + ' IS ' + tag + ' OR ' + styleQueryTag[0] + ' IS ' + tag);}).join(' OR ');
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
		const data = await do_searchby_distance({
			properties: newConfig,
			panelProperties: sbd.panelProperties,
			sel, theme, recipe,
			// --->Pre-Scoring Filters
			forcedQuery: dateQuery ? forcedQuery + ' AND ' + dateQuery : forcedQuery
		});
		const [selectedHandlesArray, selectedHandlesData, ] = data ? data : [[], []];
		// Group tracks per artist and sum their score
		const similArtist = getTagsValuesV3(new FbMetadbHandleList(selectedHandlesArray), ['ARTIST'], true);
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
			const artist = value.artist.toString(); // To avoid weird things with different key objects
			if (report.has(artist)) {
				const data = report.get(artist);
				data.count += count;
				data.score += score;
				report.set(artist, data);
			} else {report.set(artist, {artist, count, score});}
		}
	}
	if (sbd.panelProperties.bProfile[1]) {test.Print('Task #2: Retrieve scores', false);}
	// Get all matched artists and sort by score
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

function getNearestNodes(fromNode, maxDistance, graph = musicGraph()) {
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

function getNearestGenreStyles(fromGenreStyles, maxDistance, graph = musicGraph()) {
	let genreStyles = [...fromGenreStyles]; // Include theirselves
	fromGenreStyles.forEach((node) => {getNearestNodes(node, maxDistance, graph).forEach((obj) => {genreStyles.push(obj.toId);});});
	genreStyles = music_graph_descriptors.replaceWithSubstitutionsReverse([...new Set(genreStyles)]);
	genreStyles = [...(new Set(genreStyles.filter((node) => {return !node.match(/_supercluster$|_cluster$|_supergenre$| XL$/gi);})))];
	return genreStyles;
}

function getArtistsSameZone({selHandle = fb.GetFocusItem(), properties = null} = {}) {
	include('..\\helpers\\music_graph_descriptors_xxx_countries.js');
	include('..\\helpers\\music_graph_descriptors_xxx_culture.js');
	include('..\\helpers\\world_map_tables.js');
	if (sbd.panelProperties.bProfile[1]) {var test = new FbProfiler('getArtistsSameZone');}
	// Retrieve artist
	const dataId = 'artist';
	const selId = fb.TitleFormat(_bt(dataId)).EvalWithMetadb(selHandle);
	if (sbd.panelProperties.bProfile[1]) {test.Print('Task #1: Retrieve artists\' track', false);}
	// Retrieve world map data
	const path = (_isFile(fb.FoobarPath + 'portable_mode_enabled') ? '.\\profile\\' + folders.dataName : folders.data) + 'worldMap.json';
	const worldMapData = [];
	if (_isFile(path)) {
		const data = _jsonParseFileCheck(path, 'Tags json', window.Name, utf8);
		if (data) {data.forEach((item) => {worldMapData.push(item);});}
	}
	if (sbd.panelProperties.bProfile[1]) {test.Print('Task #2: Retrieve world map data', false);}
	// Retrieve current country
	const selLocale = (worldMapData.find((obj) => {return (obj[dataId] === selId);}) || {}).val || [''];
	const selCountry = selLocale.slice(-1)[0];
	if (sbd.panelProperties.bProfile[1]) {test.Print('Task #3: Retrieve current country', false);}
	console.log(selCountry);
	// Retrieve current region
	const selRegion = music_graph_descriptors_countries.getFirstNodeRegion(isoMap.get(selCountry.toLowerCase()));
	console.log(selRegion);
	const selMainRegion = music_graph_descriptors_countries.getMainRegion(selRegion);
	console.log(selMainRegion);
	if (sbd.panelProperties.bProfile[1]) {test.Print('Task #4: Retrieve current region', false);}
	// Set allowed countries from current region
	const allowCountryISO = music_graph_descriptors_countries.getNodesFromRegion(selRegion);
	const allowCountryName = new Set(allowCountryISO.map((iso) => {return isoMapRev.get(iso);}));
	allowCountryName.forEach((name) => {if (nameReplacersRev.has(name)) {allowCountryName.add(nameReplacersRev.get(name));}}); // Add alternate names
	if (sbd.panelProperties.bProfile[1]) {test.Print('Task #5: Retrieve allowed countries from current region', false);}
	// Compare and get list of allowed artists
	const jsonQuery = [];
	worldMapData.forEach((item) => {
		const country = item.val.length ? item.val.slice(-1)[0].toLowerCase() : null;
		if (country && allowCountryName.has(country)) {jsonQuery.push(item[dataId]);}
	});
	console.log(jsonQuery);
	if (sbd.panelProperties.bProfile[1]) {test.Print('Task #6: Compare and get list of allowed artists', false);}
	return jsonQuery ;
}

function findStyleGenresMissingGraph({genreStyleFilter = [], genreTag = 'GENRE', styleTag = 'STYLE', bAscii = true, bPopup = true} = {}) {
	// Skipped values at pre-filter
	const tagValuesExcluded = new Set(genreStyleFilter); // Filter holes and remove duplicates
	// Get all tags and their frequency
	const tagsToCheck = [...new Set(genreTag.concat(',', styleTag).split(',').filter(Boolean))]; // Merge and filter
	if (!tagsToCheck.length && bPopup) {
		fb.ShowPopupMessage('There are no tags to check set.', 'Search by distance');
		return null;
	}
	// Get tags
	let tags = new Set(getTagsValuesV4(fb.GetLibraryItems(), tagsToCheck, false, true).flat(Infinity));
	if (bAscii) {	tags =  new Set([...tags].map((tag) => {return _asciify(tag);}));}
	// Get node list (+ weak substitutions + substitutions + style cluster)
	const nodeList = new Set(music_graph_descriptors.style_supergenre.flat(Infinity)).union(new Set(music_graph_descriptors.style_weak_substitutions.flat(Infinity))).union(new Set(music_graph_descriptors.style_substitutions.flat(Infinity))).union(new Set(music_graph_descriptors.style_cluster.flat(Infinity)));
	// Compare (- user exclusions - graph exclusions)
	const missing = [...tags.difference(nodeList).difference(tagValuesExcluded).difference(music_graph_descriptors.map_distance_exclusions)].sort();
	// Report
	const userFile = folders.userHelpers + 'music_graph_descriptors_xxx_user.js';
	const userFileFound = _isFile(userFile) ? '' : ' (not found)';
	const userFileEmpty = !userFileFound.length && Object.keys(music_graph_descriptors_user).length ? '' : ' (empty)';
	const report = 'Graph descriptors:\n' +
					'(scripts folder) .\\helpers\\music_graph_descriptors_xxx.js\n' +
					'(profile folder) .\\js_data\\helpers\\music_graph_descriptors_xxx_user.js' + userFileFound + userFileEmpty + '\n\n' +
					'List of tags not present on the graph descriptors:\n' +
					missing.joinEvery(', ', 6);
	if (bPopup) {fb.ShowPopupMessage(report, 'Search by distance');}
	return missing;
}