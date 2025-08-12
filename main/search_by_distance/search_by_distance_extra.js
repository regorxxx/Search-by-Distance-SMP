'use strict';
//11/08/25

/* exported calculateSimilarArtistsFromPls, addTracksRelation, calculateTrackSimilarity */

include('search_by_distance.js');
/* global sbd:readable, searchByDistance:readable, getNearestGenreStyles:readable */
/* global getHandleListTags:readable, getHandleListTagsV2:readable, globTags:readable, _p:readable, removeDuplicates:readable, globQuery:readable, clone:readable, _q:readable, queryCombinations:readable, queryJoin:readable, round:readable, folders:readable, WshShell:readable, popup:readable, _b:readable, secondsToTime:readable, getHandleTags:readable */
include('..\\music_graph\\music_graph_descriptors_xxx_node.js');
// music_graph_descriptors.nodeList
include('..\\..\\helpers\\helpers_xxx_tags_extra.js');
/* global updateTrackSimilarTags:readable, updateSimilarDataFile:readable, updateSimilarDataFile:readable */

/**
 * Output similar artists to the one from input FbMetadbHandle using (@see {@link searchByDistance})
 *
 * @async
 * @function
 * @name calculateSimilarArtists
 * @kind function
 * @param {Object} [o] - arguments
 * @param {FbMetadbHandle?} o.selHandle - [=fb.GetFocusItem()] Input FbMetadbHandle
 * @param {Object?} o.properties - [=null] searchByDistance properties object
 * @param {(Object|string)?} o.theme - [=null] searchByDistance theme object or path
 * @param {(Object|string)?} o.recipe - [='int_simil_artists_calc_graph.json'] searchByDistance recipe object or path
 * @param {number} o.dateRange - [=10] Filters the compared track within a date range (from reference)
 * @param {number} o.size - [=50] Number of (random) tracks to use as reference from input artist
 * @param {('reference'|'weighted'|'variable')?} o.method - [='weighted'] Algorithm used to aggregate artist similarity scores.
 *
 * 		'reference' uses only the input handle as reference to filter the genre/style comparison. It creates a bias towards the input, thus can be used to force categorization into a specific genre/style corpus.
 *
 *		'weighted' will use every random track (from input artist) independently and aggregate their score based on how many times that genre/style appears in the input artist's tracks. Bias is reduced to a minimum, only depending on the user library (i.e. if a library mostly contains Rock tracks for a New Age artist, it will be in fact match with other Rock artists).
 *
 *		'variable' will use every random track (from input artist) independently and aggregate their score calculating the mean. It may introduce a bias if the random tracks chosen are not representative of the artist's work.
 * @returns {Promise.<{ artist: string; val: { artist: string; count: number; score: number; }[]; }>}
 */
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
	const genreStyleTagQuery = genreStyleTag.map((tag) => tag.includes('$') ? _q(tag) : tag);
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
		genreStyle.forEach((g) => {
			if (genreStyleWeight.has(g)) { genreStyleWeight.set(g, genreStyleWeight.get(g) + 1); }
			else { genreStyleWeight.set(g, 1); }
		});
		genreStyleWeight.forEach((g, key) => { genreStyleWeight.set(key, g / size); });
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
				const dateQueryTag = dateTag.includes('$') ? _q(dateTag) : dateTag;
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
		const count = round(value.count / size * 100, 2);
		if (count > 1) {
			const score = round(value.score / value.count, 1);
			total.push({ artist: value.artist, count, score });
		}
	}
	total.sort((a, b) => { return b.score - a.score; });
	return { artist: artist.join(', '), val: total };
}

async function calculateSimilarArtistsFromPls({ items = plman.GetPlaylistSelectedItems(plman.ActivePlaylist), file = folders.data + 'searchByDistance_artists.json', iNum = 10, tagName = 'SIMILAR ARTISTS SEARCHBYDISTANCE', properties } = {}) {
	const handleList = removeDuplicates({ handleList: items, sortOutput: globTags.artist, checkKeys: [globTags.artist] });
	const time = secondsToTime(Math.round(handleList.Count * 5 * fb.GetLibraryItems().Count / 70000));
	if (WshShell.Popup('Process [different] artists from currently selected items and calculate their most similar artists?\nResults are output to console and saved to JSON:\n' + file + '\n\nEstimated time: <= ' + time, 0, sbd.name, popup.question + popup.yes_no) === popup.no) { return; }
	let profiler = new FbProfiler('Calculate similar artists');
	const newData = [];
	const handleArr = handleList.Convert();
	for await (const selHandle of handleArr) {
		const output = await calculateSimilarArtists({ properties, selHandle });
		if (output.val.length) { newData.push(output); }
	}
	if (!newData.length) { console.log('Nothing found.'); return []; }
	updateSimilarDataFile(file, newData, iNum);
	profiler.Print();
	const report = newData.map((obj) => // List of artists with tabbed similar artists + score
		obj.artist + ':\n\t' + (obj.val.map((sim) =>
			_b(sim.score + '%') + '\t' + sim.artist
		).join('\n\t') || '-NONE-')
	).join('\n\n');
	fb.ShowPopupMessage(report, sbd.name);
	if (WshShell.Popup('Write similar artist tags to all tracks by selected artists?\n(It will also rewrite previously added similar artist tags)\nOnly first ' + iNum + ' artists with highest score will be used.', 0, 'Similar artists', popup.question + popup.yes_no) === popup.yes) {
		updateTrackSimilarTags({ data: newData, iNum, tagName, windowName: sbd.name, bPopup: false });
	}
	return newData;
}

function addTracksRelation({
	handleList = plman.ActivePlaylist !== -1
		? plman.GetPlaylistSelectedItems(plman.ActivePlaylist)
		: new FbMetadbHandleList(),
	mode = 'related',
	tagsKeys = { related: [globTags.related], unrelated: [globTags.unrelated] },
	idTags = ['MUSICBRAINZ_TRACKID', 'TITLE']
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
	const newIds = getHandleListTags(handleList, idTags);
	handleListArr.forEach((handle, i) => {
		const handleIds = newIds[i];
		for (const idArr of handleIds) {
			if (idArr.length) {
				idArr.forEach((id) => {
					tags.forEach((handleTags, j) => {
						if (i === j || newIds[j].flat(Infinity).includes(id)) { return; }
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
	console.log(sbd.name + ': relating ' + handleList.Count + ' tracks...');
	try { handleList.UpdateFileInfoFromJSON(JSON.stringify(tags)); }
	catch (e) {
		console.popup(e, window.Name);
		return false;
	}
	return true;
}

async function calculateTrackSimilarity({ sel = null, items = plman.GetPlaylistSelectedItems(plman.ActivePlaylist), properties } = {}) {
	const titles = getHandleListTags(items, [globTags.titleRaw], { bMerged: true });
	let profiler = new FbProfiler('Calculate track similarity');
	const newData = [];
	const itemCount = items.Count;
	for (let i = 0, handleList; i < itemCount; i++) {
		if (!sel) {
			handleList = items.Clone();
			handleList.RemoveById(i);
		} else {
			const idx = items.Find(sel);
			handleList = idx !== -1 ? items.Clone() : items;
			if (idx !== -1) { items.RemoveById(sel); }
		}
		const output = await searchByDistance({
			sel: sel || items[i],
			trackSource: { sourceType: 'handleList', sourceArg: handleList },
			properties, theme: null, recipe: properties.recipe[1], bCreatePlaylist: false, scoreFilter: 0, graphDistance: Infinity, bBasicLogging: false, bSearchDebug: false, bShowFinalSelection: false, bProfile: false, bShowQuery: false, bProgressiveListOrder: true, bSortRandom: false, bInverseListOrder: false, bSmartShuffle: false, bInKeyMixingPlaylist: false
		});
		if (output) {
			newData.push(titles[i] + ':');
			newData.push('\t' + output[1].map((score) => score.name + ' - ' + score.score).join('\n\t'));
			newData.push('\n');
		}
		if (sel) { break; }
	};
	if (!newData.length) { console.log('Nothing found.'); return []; }
	profiler.Print();
	const report = newData.join('\n');
	fb.ShowPopupMessage(report, sbd.name);
	return newData;
}