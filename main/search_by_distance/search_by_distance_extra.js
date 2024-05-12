'use strict';
//09/05/24

/* exported calculateSimilarArtistsFromPls, writeSimilarArtistsTags, addTracksRelation */

include('search_by_distance.js');
/* global sbd:readable, searchByDistance:readable, getNearestGenreStyles:readable */
/* global getHandleListTags:readable, getHandleListTagsV2:readable, globTags:readable, _p:readable, removeDuplicates:readable, globQuery:readable, clone:readable, _q:readable, queryCombinations:readable, queryJoin:readable, round:readable, folders:readable, WshShell:readable, popup:readable, _isFile:readable, _save:readable, _jsonParseFile:readable, utf8:readable, _deleteFile:readable, _b:readable, secondsToTime:readable, getHandleTags:readable */
include('..\\music_graph\\music_graph_descriptors_xxx_node.js');
// music_graph_descriptors.nodeList

// Similar artists
async function calculateSimilarArtists({ selHandle = fb.GetFocusItem(), properties = null, theme = null, recipe = 'int_simil_artists_calc_graph.json', dateRange = 10, size = 50, method = 'weighted' } = {}) {
	const test = sbd.panelProperties.bProfile[1] ? new FbProfiler('calculateSimilarArtists') : null;
	// Retrieve all tracks for the selected artist and compare them against the library (any other track not by the artist)
	const artist = getHandleListTags(new FbMetadbHandleList(selHandle), [globTags.artist], { bMerged: true }).flat().filter(Boolean);
	const libQuery = artist.map((tag) => { return _p(globTags.artist + ' IS ' + tag); }).join(' AND ');
	// Retrieve artist's tracks and remove duplicates
	let selArtistTracks = fb.GetQueryItems(fb.GetLibraryItems(), libQuery);
	selArtistTracks = removeDuplicates({ handleList: selArtistTracks, sortBias: globQuery.remDuplBias, bPreserveSort: false, bAdvTitle: true, bMultiple: true });
	// Use only X random tracks instead of all of them
	const report = new Map();
	const randomSelTracks = selArtistTracks.Convert().shuffle().slice(0, size);
	const newConfig = clone(properties);
	const tags = JSON.parse(newConfig.tags[1]);
	const genreStyleTag = Object.values(tags).filter((t) => t.type.includes('graph') && !t.type.includes('virtual')).map((t) => t.tf).flat(Infinity).filter(Boolean);
	const genreStyleTagQuery = genreStyleTag.map((tag) => { return tag.indexOf('$') === -1 ? tag : _q(tag); });
	// Find which genre/styles are nearest as pre-filter using the selected track
	let forcedQuery = '';
	if (method === 'reference') {
		const genreStyle = getHandleListTags(new FbMetadbHandleList(selHandle), genreStyleTag, { bMerged: true }).flat().filter(Boolean);
		const allowedGenres = getNearestGenreStyles(genreStyle, 50, sbd.allMusicGraph);
		const allowedGenresQuery = queryCombinations(allowedGenres, genreStyleTagQuery, 'OR', 'AND');
		forcedQuery = _p(artist.map((tag) => { return _p('NOT ' + globTags.artist + ' IS ' + tag); }).join(' AND ')) + (allowedGenresQuery.length ? ' AND ' + _p(allowedGenresQuery) : '');
	}
	// Weight with all artist's tracks
	const genreStyleWeight = new Map();
	let weight = 1;
	if (method === 'weighted') {
		const genreStyle = getHandleListTags(selArtistTracks, genreStyleTag, { bMerged: true }).flat(Infinity).filter(Boolean);
		const size = genreStyle.length;
		genreStyle.forEach((val) => {
			if (genreStyleWeight.has(val)) { genreStyleWeight.set(val, genreStyleWeight.get(val) + 1); }
			else { genreStyleWeight.set(val, 1); }
		});
		genreStyleWeight.forEach((val, key) => { genreStyleWeight.set(key, val / size); });
	}
	// Add all possible exclusions to make it faster (even if it less precise)
	// newConfig.genreStyleFilter[1] = [...(clone(music_graph_descriptors.map_distance_exclusions).union(new Set(newConfig.genreStyleFilter[1].split(/| */))))].join(',');
	if (sbd.panelProperties.bProfile[1]) { test.Print('Task #1: Retrieve artists\' track', false); }
	for await (const sel of randomSelTracks) {
		// Find which genre/styles are nearest as pre-filter with randomly chosen tracks
		if (method === 'variable' || method === 'weighted') {
			const genreStyle = getHandleListTags(new FbMetadbHandleList(sel), genreStyleTag, { bMerged: true }).flat().filter(Boolean);
			const allowedGenres = getNearestGenreStyles(genreStyle, 50, sbd.allMusicGraph);
			const allowedGenresQuery = queryJoin(queryCombinations(allowedGenres, genreStyleTagQuery, 'OR'), 'OR');
			forcedQuery = _p(artist.map((tag) => { return _p('NOT ' + globTags.artist + ' IS ' + tag); }).join(' AND ')) + (allowedGenresQuery.length ? ' AND ' + _p(allowedGenresQuery) : '');
			if (method === 'weighted') { // Weight will be <= 1 according to how representative of the artist's works is
				weight = [...new Set(genreStyle)].reduce((total, val) => { return total + (genreStyleWeight.has(val) ? genreStyleWeight.get(val) : 0); }, 0);
			}
		}
		// Further filter the tracks using a date range
		let dateQuery = '';
		if (Number.isFinite(dateRange)) {
			const dateTag = tags.date.tf[0];
			if (dateTag) {
				const dateQueryTag = dateTag.indexOf('$') !== -1 ? _q(dateTag) : dateTag;
				const date = getHandleListTagsV2(new FbMetadbHandleList(sel), [dateTag], { bMerged: true })
					.flat().filter(Boolean)[0];
				dateQuery = date && date.length ? _p(dateQueryTag + ' GREATER ' + (Number(date) - Math.floor(dateRange / 2)) + ' AND ' + dateQueryTag + ' LESS ' + (Number(date) + Math.floor(dateRange / 2))) : null;
			}
		}
		// Compare by genre/style and date using graph method. Exclude anti-influences (faster). All config found on the recipe file
		const data = await searchByDistance({
			properties: newConfig,
			panelProperties: sbd.panelProperties,
			sel, theme, recipe,
			// --->Pre-Scoring Filters
			forcedQuery: dateQuery ? forcedQuery + ' AND ' + dateQuery : forcedQuery
		});
		const [selectedHandlesArray, selectedHandlesData,] = data || [[], []];
		// Group tracks per artist and sum their score
		const similArtist = getHandleListTags(new FbMetadbHandleList(selectedHandlesArray), [globTags.artist], { bMerged: true });
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
				} else { similArtistData.set(artist, { artist, count: 1, score: selectedHandlesData[i].score }); }
				totalScore++;
			});
		});
		// Add artist's score to global list
		for (const [, value] of similArtistData) {
			const count = value.count / totalCount * weight;
			const score = value.score / totalScore * weight;
			const artist = value.artist.toString(); // To avoid weird things with different key objects
			if (report.has(artist)) {
				const data = report.get(artist);
				data.count += count;
				data.score += score;
				report.set(artist, data);
			} else { report.set(artist, { artist, count, score }); }
		}
	}
	if (sbd.panelProperties.bProfile[1]) { test.Print('Task #2: Retrieve scores', false); }
	// Get all matched artists and sort by score
	let total = [];
	for (const [, value] of report) {
		const count = round(value.count / size * 100, 1);
		if (count > 1) {
			const score = round(value.score / size, 2);
			const scoreW = round(value.score / value.count, 1);
			total.push({ artist: value.artist, score, count, scoreW });
		}
	}
	total.sort((a, b) => { return b.scoreW - a.scoreW; });
	return { artist: artist.join(', '), val: total };
}

async function calculateSimilarArtistsFromPls({ items = plman.GetPlaylistSelectedItems(plman.ActivePlaylist), file = folders.data + 'searchByDistance_artists.json', iNum = 10, tagName = 'SIMILAR ARTISTS SEARCHBYDISTANCE', properties } = {}) {
	const handleList = removeDuplicates({ handleList: items, sortOutput: globTags.artist, checkKeys: [globTags.artist] });
	const time = secondsToTime(Math.round(handleList.Count * 30 * fb.GetLibraryItems().Count / 70000));
	if (WshShell.Popup('Process [diferent] artists from currently selected items and calculate their most similar artists?\nResults are output to console and saved to JSON:\n' + file + '\n\nEstimated time: <= ' + time, 0, 'Search by Distance', popup.question + popup.yes_no) === popup.no) { return; }
	let profiler = new FbProfiler('Calculate similar artists');
	const newData = [];
	const handleArr = handleList.Convert();
	for await (const selHandle of handleArr) {
		const output = await calculateSimilarArtists({ properties, selHandle });
		if (output.val.length) { newData.push(output); }
	}
	if (!newData.length) { console.log('Nothing found.'); return []; }
	if (!_isFile(file)) {
		newData.forEach((obj) => { console.log(obj.artist + ' --> ' + JSON.stringify(obj.val.slice(0, iNum))); }); // DEBUG
		_save(file, JSON.stringify(newData, null, '\t'));
	} else {
		const data = _jsonParseFile(file, utf8);
		if (data) {
			const idxMap = new Map();
			data.forEach((obj, idx) => { idxMap.set(obj.artist, idx); });
			newData.forEach((obj) => {
				const idx = idxMap.get(obj.artist);
				if (idx >= 0) { data[idx] = obj; }
				else { data.push(obj); }
				console.log(obj.artist + ' --> ' + JSON.stringify(obj.val.slice(0, iNum))); // DEBUG
			});
		}
		_deleteFile(file);
		_save(file, JSON.stringify(data || newData, null, '\t'));
	}
	profiler.Print();
	const report = newData.map((obj) => // List of artists with tabbed similar artists + score
		obj.artist + ':\n\t' + (obj.val.map((sim) =>
			_b(sim.scoreW) + '\t' + sim.artist
		).join('\n\t') || '-NONE-')
	).join('\n\n');
	fb.ShowPopupMessage(report, 'Search by distance');
	if (WshShell.Popup('Write similar artist tags to all tracks by selected artists?\n(It will also rewrite previously added similar artist tags)\nOnly first ' + iNum + ' artists with highest score will be used.', 0, 'Similar artists', popup.question + popup.yes_no) === popup.no) { return; }
	else {
		newData.forEach((obj) => {
			const artist = obj.artist.split(', ');
			const similarArtists = obj.val.map((o) => { return o.artist; }).slice(0, iNum);
			if (!similarArtists.length) { return; }
			const artistTracks = fb.GetQueryItems(fb.GetLibraryItems(), artist.map((a) => { return globTags.artist + ' IS ' + a; }).join(' OR '));
			const count = artistTracks.Count;
			if (count) {
				let arr = [];
				for (let i = 0; i < count; ++i) {
					arr.push({
						[tagName]: similarArtists
					});
				}
				artistTracks.UpdateFileInfoFromJSON(JSON.stringify(arr));
				console.log('Updating tracks by ' + artist + ': ' + count + ' tracks.');
			}
		});
	}
	return newData;
}

function writeSimilarArtistsTags({ file = folders.data + 'searchByDistance_artists.json', iNum = 10, tagName = 'SIMILAR ARTISTS SEARCHBYDISTANCE' } = {}) {
	if (WshShell.Popup('Write similar artist tags from JSON database to files?\nOnly first ' + iNum + ' artists with highest score will be used.', 0, window.Name, popup.question + popup.yes_no) === popup.no) { return false; }
	if (!_isFile(file)) { return false; }
	else {
		const data = _jsonParseFile(file, utf8);
		if (data) {
			const bRewrite = WshShell.Popup('Rewrite previously added similar artist tags?', 0, window.Name, popup.question + popup.yes_no) === popup.yes;
			const queryNoRw = ' AND ' + tagName + ' MISSING';
			data.forEach((obj) => {
				const artist = obj.artist.split(', ');
				const similarArtists = obj.val.map((o) => { return o.artist; }).slice(0, iNum);
				if (!similarArtists.length) { return; }
				const queryArtists = artist.map((a) => { return globTags.artist + ' IS ' + a; }).join(' OR ');
				const artistTracks = fb.GetQueryItems(fb.GetLibraryItems(), (bRewrite ? queryArtists : _p(queryArtists) + queryNoRw));
				const count = artistTracks.Count;
				if (count) {
					let arr = [];
					for (let i = 0; i < count; ++i) {
						arr.push({
							[tagName]: similarArtists
						});
					}
					artistTracks.UpdateFileInfoFromJSON(JSON.stringify(arr));
					console.log('Updating tracks by ' + artist + ': ' + count + ' tracks.');
				}
			});
		}
	}
	return true;
}

function addTracksRelation({
	handleList = plman.ActivePlaylist !== -1
		? plman.GetPlaylistSelectedItems(plman.ActivePlaylist)
		: new FbMetadbHandleList(),
	mode = 'related',
	tagsKeys = { related: [globTags.related], unrelated: [globTags.unrelated] }
} = {}) {
	if (!handleList.Count) { return false; }
	if (!mode) { return false; }
	mode = mode.toLowerCase();
	// Use remapped tags but clean expressions
	tagsKeys = { related: [globTags.related], unrelated: [globTags.unrelated], ...tagsKeys };
	const tfRegExp = /\$\w*\(.*\)/i;
	Object.keys(tagsKeys).forEach((key) => {
		tagsKeys[key] = tagsKeys[key].filter(Boolean);
		tagsKeys[key] = tagsKeys[key].filter((tf) => !tfRegExp.test(tf));
	});
	if (Object.values(tagsKeys).some((tfArr) => !tfArr.length)) { return false; }
	if (!Object.hasOwn(tagsKeys, mode)) { return false; }
	const tags = [];
	handleList.Sort();
	const handleListArr = handleList.Convert();
	// Retrieve previous values
	handleListArr.forEach((handle) => {
		const prevIds = getHandleTags(handle, tagsKeys[mode]);
		tags.push(
			Object.fromEntries(tagsKeys[mode].map((tf, i) => { return [[tf], new Set(prevIds[i])]; }))
		);
	});
	// Add new ones
	handleListArr.forEach((handle, i) => {
		const newIds = getHandleTags(handle, ['MUSICBRAINZ_TRACKID', 'TITLE']);
		for (const idArr of newIds) {
			if (idArr.length) {
				idArr.forEach((id) => {
					tags.forEach((handleTags, j) => {
						if (i === j) { return; }
						tagsKeys[mode].forEach((tf) => handleTags[tf].add(id));
					});
				});
				break; // Prefer IDs by order
			}
		}
	});
	// Tag
	tags.forEach((handleTags) => {
		tagsKeys[mode].forEach((tf) => handleTags[tf] = [...handleTags[tf]]);
	});
	try { handleList.UpdateFileInfoFromJSON(JSON.stringify(tags)); }
	catch (e) {
		console.popup(e, window.Name);
		return false;
	}
	return true;
}