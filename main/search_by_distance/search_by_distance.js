'use strict';
//05/08/24
var version = '7.4.0'; // NOSONAR [shared on files]

/* exported  searchByDistance, checkScoringDistribution */

/*
	Search by Distance
	-----------------------------------
	Creates a playlist with similar tracks to the currently selected one according
	to genre, style, key, etc. Every library track is given a score using its tags
	and/or a graph distance with their genre/style.

	When their score is over 'scoreFilter', then they are included in the final pool.
	After all tracks have been evaluated and the final pool is complete, some of
	them are chosen to populate the playlist. You can choose whether this final
	selection is done according to score, randomly chosen, etc. All settings are
	configurable on the properties panel (or set in the files when called using
	buttons, etc.)

	There are 3 methods to calc similarity: WEIGHT, GRAPH and DYNGENRE.

	Any weight equal to zero or tag not set will be skipped for calcs. Therefore it's
	recommended to only use those really relevant, for speed improvements. There are 3
	exceptions to this rule:
		- dyngenreWeight > 0 & method = DYNGENRE:
			genre and style tags will always be retrieved, even if their weight is set
			to 0. They will not be considered for scoring... but are needed to calculate
			dynGenre virtual tags.
		- method = GRAPH:
			genre and style tags will always be retrieved, even if their weight is set
			to 0. They will not be considered for scoring... but are needed to calculate
			the distance in the graph between different tracks.
		- bInKeyMixingPlaylist = true:
			key tags will always be retrieved, even if keyWeight is set to 0. This is
			done to create the special playlist even if keys are totally ignored for
			similarity scoring.
*/

/* global buttonsBar:readable */

include('..\\..\\helpers-external\\ngraph\\a-star.js');
include('..\\..\\helpers-external\\ngraph\\a-greedy-star.js');
include('..\\..\\helpers-external\\ngraph\\NBA.js');
include('ngraph_helpers_xxx.js');
/* global calcGraphDistance:readable, calcMeanDistance:readable, cacheLink:writable, calcCacheLinkSGV2:readable */
// This tells the helper to load tags descriptors extra files
// eslint-disable-next-line no-unused-vars
var bLoadTags = true; // NOSONAR [shared on files]
include('..\\..\\helpers\\helpers_xxx.js');
/* global isFoobarV2:readable, checkCompatible:readable, globTags:readable, folders:readable, globQuery:readable, iDelayLibrary:readable */
/* global debounce:readable, doOnce:readable, clone:readable , memoize:readable */
/* global _isFile:readable, _deleteFile:readable, utf8:readable, _open:readable, _save:readable, _jsonParseFileCheck:readable, WshShell:readable, popup:readable */
include('..\\..\\helpers\\helpers_xxx_crc.js');
/* global crc32:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global isInt:readable, isJSON:readable, isBoolean:readable, regExBool:readable, isString:readable, isStringWeak:readable, _t:readable, _asciify:readable, _p:readable, isArrayStrings:readable, round:readable, _q:readable, _b:readable, _bt:readable, _qCond:readable */
include('..\\..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable, overwriteProperties:readable */
include('..\\..\\helpers\\helpers_xxx_tags.js');
/* global checkQuery:readable, getHandleListTagsV2:readable, queryJoin:readable, getHandleListTags:readable, queryCombinations:readable, sanitizeQueryVal:readable, queryReplaceWithCurrent:readable */
include('..\\..\\helpers\\helpers_xxx_tags_extra.js');
/* global getSimilarDataFromFile:readable */
if (isFoobarV2) { include('..\\..\\helpers\\helpers_xxx_tags_cache.js'); }
/* global tagsCache:readable */
include('..\\..\\helpers\\helpers_xxx_math.js');
/* global k_combinations:readable */
include('..\\..\\helpers\\helpers_xxx_statistics.js');
/* global zScoreToCDF:readable */
include('..\\..\\helpers\\camelot_wheel_xxx.js');
/* global camelotWheel:readable */
include('..\\..\\helpers\\dyngenre_map_xxx.js');
/* global dyngenreMap:readable, cyclicTagsDescriptor:readable */
include('..\\music_graph\\music_graph_xxx.js');
/* global musicGraph:readable, music_graph_descriptors:readable, graphDebug:readable */
include('..\\music_graph\\music_graph_test_xxx.js');
/* global testGraphNodes:readable, testGraphNodeSets:readable */
include('..\\filter_and_query\\remove_duplicates.js');
/* global removeDuplicates:readable, removeDuplicatesAsync:readable, filterDuplicates:readable, */
include('..\\sort\\scatter_by_tags.js');
/* global shuffleByTags:readable */
include('..\\..\\helpers\\callbacks_xxx.js');
include('search_by_distance_genres.js');
/* global findStyleGenresMissingGraph:readable, getNearestGenreStyles:readable */
include('search_by_distance_culture.js');
/* global getCountryISO:readable, getLocaleFromId:readable, getZoneArtistFilter:readable, getZoneGraphFilter:readable, music_graph_descriptors_countries:readable, music_graph_descriptors_culture:readable */
include('search_by_distance_extra.js');

checkCompatible('1.6.1', 'smp');

/*
	Properties
*/
const SearchByDistance_properties = {
	tags: ['Tags used for scoring', JSON.stringify({
		genre: { weight: 15, tf: [globTags.genre], baseScore: 0, scoringDistribution: 'LINEAR', type: ['string', 'multiple', 'graph'] },
		style: { weight: 15, tf: [globTags.style], baseScore: 0, scoringDistribution: 'LINEAR', type: ['string', 'multiple', 'graph'] },
		dynGenre: { weight: 15, tf: [], baseScore: 0, scoringDistribution: 'LINEAR', type: ['number', 'single', 'virtual', 'absRange'], range: 1 },
		mood: { weight: 10, tf: [globTags.mood], baseScore: 0, scoringDistribution: 'LINEAR', type: ['string', 'multiple', 'combinations'], combs: 6 }, // Used for query filtering, combinations of K moods for queries. Greater values will pre-filter better the library...
		key: { weight: 5, tf: [globTags.key], baseScore: 0, scoringDistribution: 'LOGARITHMIC', type: ['string', 'single', 'keyMix', 'keyRange'], range: 3 },
		bpm: { weight: 5, tf: [globTags.bpm], baseScore: 0, scoringDistribution: 'NORMAL', type: ['number', 'single', 'percentRange'], range: 50 },
		date: { weight: 10, tf: [globTags.date], baseScore: 0, scoringDistribution: 'NORMAL', type: ['number', 'single', 'absRange'], range: 30 },
		composer: { weight: 0, tf: [globTags.composer], baseScore: 0, scoringDistribution: 'LINEAR', type: ['string', 'multiple'] },
		artistRegion: { weight: 5, tf: [globTags.locale], baseScore: 0, scoringDistribution: 'LOGISTIC', type: ['string', 'single', 'virtual', 'absRange', 'tfRemap'], range: 5 },
		genreStyleRegion: { weight: 7, tf: [], baseScore: 0, scoringDistribution: 'LOGISTIC', type: ['string', 'single', 'virtual', 'absRange'], range: 5 },
		related: { weight: 25, tf: [globTags.related], baseScore: 0, scoringDistribution: 'LINEAR', type: ['string', 'multiple', 'virtual', 'tfRemap', 'bNegative'] },
		unrelated: { weight: -25, tf: [globTags.unrelated], baseScore: 0, scoringDistribution: 'LINEAR', type: ['string', 'multiple', 'virtual', 'tfRemap', 'bNegative'] },
	})],
	scoreFilter: ['Exclude any track with similarity lower than (in %)', 70, { range: [[0, 100]], func: isInt }, 70],
	minScoreFilter: ['Minimum in case there are not enough tracks (in %)', 65, { range: [[0, 100]], func: isInt }, 65],
	graphDistance: ['Exclude any track with graph distance greater than (only GRAPH method):', 'music_graph_descriptors.intra_supergenre',
		{ func: (x) => { return (isString(x) && Object.hasOwn(music_graph_descriptors, x.split('.').pop())) || isInt(x) || x === Infinity; } }, 'music_graph_descriptors.intra_supergenre'],
	method: ['Method to use (\'GRAPH\', \'DYNGENRE\' or \'WEIGHT\')', 'GRAPH', { func: checkMethod }, 'GRAPH'],
	bNegativeWeighting: ['Negative score for tags out of range', true],
	bFilterWithGraph: ['Filter values not present on the graph', true],
	forcedQuery: ['Forced query to pre-filter database (added to any other internal query)', globQuery.filter],
	bSameArtistFilter: ['Exclude tracks by same artist', false],
	bUseAntiInfluencesFilter: ['Exclude anti-influences by query', false],
	bConditionAntiInfluences: ['Conditional anti-influences filter', false],
	bUseInfluencesFilter: ['Allow only influences by query', false],
	bSimilArtistsFilter: ['Allow only similar artists', false],
	genreStyleFilterTag: ['Filter for genre/style', JSON.stringify(['Children\'s Music', '?'])],
	poolFilteringTag: ['Filter pool by tag', JSON.stringify([globTags.artist])],
	poolFilteringN: ['Allows only N + 1 tracks on the pool (-1 = disabled)', -1, { greaterEq: -1, func: isInt }, -1],
	bRandomPick: ['Random picking (not sorted by score)', true],
	bInversePick: ['Picking by inverted score', false],
	probPick: ['Probability of track picking for final mix', 100, { range: [[1, 100]], func: isInt }, 100],
	playlistLength: ['Max Playlist Mix length', 50],
	bSortRandom: ['Sort final playlist randomly', false],
	bProgressiveListOrder: ['Sort final playlist by score', false],
	bInverseListOrder: ['Invert final sorting', false],
	bScatterInstrumentals: ['Intercalate instrumental tracks', false],
	bInKeyMixingPlaylist: ['DJ-like playlist creation, following harmonic mixing rules', false],
	bHarmonicMixDoublePass: ['Harmonic mixing double pass to match more tracks', true],
	bProgressiveListCreation: ['Recursive playlist creation, uses output as new references', false],
	progressiveListCreationN: ['Steps when using recursive playlist creation (>1 and <=100)', 4, { range: [[2, 100]], func: isInt }, 4],
	playlistName: ['Playlist name (TF allowed)', 'Search...', { func: isString }, 'Search...'],
	bAscii: ['Asciify string values internally', true],
	checkDuplicatesByTag: ['Remove duplicates by', JSON.stringify(globTags.remDupl)],
	sortBias: ['Duplicates track selection bias', globQuery.remDuplBias, { func: isStringWeak }, globQuery.remDuplBias],
	bAdvTitle: ['Duplicates advanced RegExp title matching', true],
	bMultiple: ['Partial Multi-value tag matching', true],
	bSmartShuffle: ['Smart Shuffle by Artist', true],
	smartShuffleTag: ['Smart Shuffle tag', JSON.stringify([globTags.artist])],
	bSmartShuffleAdvc: ['Smart Shuffle extra conditions', true],
	smartShuffleSortBias: ['Smart Shuffle sorting bias', 'random', { func: isStringWeak }, 'random'],
	artistRegionFilter: ['Artist region filter: none (-1), continent (0), region (1), country (2)', -1, { range: [[-1, 5]], func: isInt }, -1],
	genreStyleRegionFilter: ['Genre region filter: none (-1), continent (0), region (1)', -1, { range: [[-1, 3]], func: isInt }, -1],
	dynQueries: ['Dynamic query filtering', JSON.stringify([]), { func: isJSON }, JSON.stringify([])],
	nearGenresFilter: ['Near genres filter: none (-1), auto (0) or any distance value', 0, { range: [[-1, Infinity]], func: isInt }, 0]
};
// Checks
Object.keys(SearchByDistance_properties).forEach((key) => { // Checks
	const k = key.toLowerCase();
	if (k.endsWith('length')) {
		SearchByDistance_properties[key].push({ greaterEq: 0, func: Number.isSafeInteger }, SearchByDistance_properties[key][1]);
	} else if (k.endsWith('query')) {
		SearchByDistance_properties[key].push({ func: (query) => { return checkQuery(query, true); } }, SearchByDistance_properties[key][1]);
	} else if (k.endsWith('tag') || k.endsWith('tags')) {
		SearchByDistance_properties[key].push({ func: isJSON }, SearchByDistance_properties[key][1]);
	} else if (regExBool.test(key)) {
		SearchByDistance_properties[key].push({ func: isBoolean }, SearchByDistance_properties[key][1]);
	}
});

const SearchByDistance_panelProperties = {
	bCacheOnStartup: ['Calculate link cache on script startup (instead of on demand)', true],
	bGraphDebug: ['Warnings about links/nodes set wrong', false],
	bSearchDebug: ['Enable debugging console logs', false],
	bProfile: ['Enable profiling console logs', false],
	bShowQuery: ['Enable query console logs', false],
	bBasicLogging: ['Enable basic console logs', true],
	bShowFinalSelection: ['Enable selection\'s final scoring console logs', true],
	firstPopup: ['Search by distance: Fired once', false],
	descriptorCRC: ['Graph Descriptors CRC', -1], // Calculated later on first time
	bAllMusicDescriptors: ['Load AllMusic descriptors', false],
	bLastfmDescriptors: ['Load Last.fm descriptors', false],
	bStartLogging: ['Startup logging', false],
	bTagsCache: ['Read tags from cache instead of files', false]
};
// Checks
Object.keys(SearchByDistance_panelProperties).forEach((key) => { // Checks
	if (regExBool.test(key)) {
		SearchByDistance_panelProperties[key].push({ func: isBoolean }, SearchByDistance_panelProperties[key][1]);
	}
});

var sbd_prefix = 'sbd_'; // NOSONAR [shared on files]
if (typeof buttonsBar === 'undefined' && typeof bNotProperties === 'undefined') { // Merge all properties when not loaded along buttons
	// With const var creating new properties is needed, instead of reassigning using A = {...A,...B}
	Object.entries(SearchByDistance_panelProperties).forEach(([key, value]) => { SearchByDistance_properties[key] = value; });
	setProperties(SearchByDistance_properties, sbd_prefix);
} else { // With buttons, set these properties only once per panel
	setProperties(SearchByDistance_panelProperties, sbd_prefix);
}

/*
	Initialize maps/graphs at start. Global variables
*/

const sbd = {
	allMusicGraph: musicGraph(),
	influenceMethod: 'adjacentNodes', // direct, zeroNodes, adjacentNodes, fullPath
	genreMap: [],
	styleMap: [],
	genreStyleMap: [],
	isCalculatingCache: false,
	panelProperties: (typeof buttonsBar === 'undefined' && typeof bNotProperties === 'undefined')
		? getPropertiesPairs(SearchByDistance_properties, sbd_prefix)
		: getPropertiesPairs(SearchByDistance_panelProperties, sbd_prefix),
	version,
	get tagSchema() { return { weight: 0, tf: [], baseScore: 0, scoringDistribution: 'LINEAR', type: [] /*, range, combs */ }; },
	get tagTypeSchema() {
		return [
			{ type: 'Variable type', val: ['string', 'number'] },
			{ type: 'Multi-value tag', val: ['single', 'multiple'] },
			{ type: 'Range comparison', val: ['keyRange', 'absRange', 'percentRange'] }, // Requires range property (see above)
			// Virtual: tag is handled internally (for ex. from other scripts, calculated, etc.)
			// keyMix: used for harmonic mixing,
			// graph: considered a genre/style for DYNGENRE and GRAPH methods
			// tfRemap: allows tag remapping even if tag is handled internally (virtual)
			{ type: 'Special', val: ['virtual', 'keyMix', 'graph', 'tfRemap'] },
			{ type: 'Query filtering', val: ['combinations'] },  // Requires combs property (see above)
			{ type: '', val: [] }
		];
	},
	lastSearch: {
		/** @type {FbMetadbHandle|null} */
		handle: null, // For critical usage, check if file exist first on library changes!
		options: {},
	}
};
[sbd.genreMap, sbd.styleMap, sbd.genreStyleMap] = dyngenreMap();

// Info Popup
if (!sbd.panelProperties.firstPopup[1]) {
	// firstPopup is set true on script unloading the first time it successfully closed, so it can be reused somewhere if needed
	overwriteProperties(sbd.panelProperties); // Updates panel
	const readmeKeys = [{ name: 'search_by_distance', title: 'Search by Distance' }, { name: 'tags_structure', title: 'Tagging requisites' }]; // Must read files on first execution
	readmeKeys.forEach((objRead) => {
		const readmePath = folders.xxx + 'helpers\\readme\\' + objRead.name + '.txt';
		const readme = _open(readmePath, utf8);
		if (readme.length) { fb.ShowPopupMessage(readme, objRead.title); }
	});
	// Make the user check their tags before use...
	if (typeof buttonsBar === 'undefined' && typeof bNotProperties === 'undefined') {
		doOnce('findStyleGenresMissingGraphCheck', debounce(findStyleGenresMissingGraphCheck, 500))(sbd.panelProperties);
	}
	// SMP Bug: https://github.com/TheQwertiest/foo_spider_monkey_panel/issues/205
	// Force setting it to true at 10 secs after startup
	setTimeout(() => {
		if (!sbd.panelProperties.firstPopup[1]) {
			sbd.panelProperties.firstPopup[1] = true;
			overwriteProperties(sbd.panelProperties);
		}
	}, 10000);
}

/*
	Load additional descriptors: AllMusic, Last.fm, ...
*/
[
	{ name: 'AllMusic', file: 'music_graph\\music_graph_descriptors_xxx_allmusic.js', prop: 'bAllMusicDescriptors' },
	{ name: 'Last.fm', file: 'music_graph\\music_graph_descriptors_xxx_lastfm.js', prop: 'bLastfmDescriptors' }
].forEach((descr) => {
	if (sbd.panelProperties[descr.prop][1]) {
		if (_isFile(folders.xxx + 'main\\' + descr.file)) {
			if (sbd.panelProperties.bStartLogging[1]) { console.log(descr.name + '\'s music_graph_descriptors - File loaded: ' + folders.xxx + descr.file); }
			include('..\\' + descr.file);
		}
	}
});

/*
	Tags cache V2
*/
if (sbd.panelProperties.bTagsCache[1]) {
	if (typeof tagsCache === 'undefined') {
		include('..\\..\\helpers\\helpers_xxx_tags_cache.js');
	}
	doOnce('Load tags cache', debounce(() => {
		tagsCache.load(); // eslint-disable-line no-undef
	}, 5000))();
}

/*
	Reuse cache on the same session, from other panels and from json file
*/
// Only use file cache related to current descriptors, otherwise delete it
const profiler = sbd.panelProperties.bProfile[1] ? new FbProfiler('descriptorCRC') : null;
const descriptorCRC = crc32(JSON.stringify(music_graph_descriptors) + musicGraph.toString() + calcGraphDistance.toString() + calcMeanDistance.toString() + sbd.influenceMethod + 'v1.1.0');
const bMismatchCRC = sbd.panelProperties.descriptorCRC[1] !== descriptorCRC;
if (bMismatchCRC) {
	if (sbd.panelProperties.descriptorCRC[1] !== -1) { // There may be multiple panels, don't nuke it on first init on a new panel
		console.log('Search by Distance: CRC mismatch. Deleting old json cache.');
		_deleteFile(folders.data + 'searchByDistance_cacheLink.json');
		_deleteFile(folders.data + 'searchByDistance_cacheLinkSet.json');
	}
	sbd.panelProperties.descriptorCRC[1] = descriptorCRC;
	overwriteProperties(sbd.panelProperties); // Updates panel
}
if (sbd.panelProperties.bProfile[1]) { profiler.Print(); }
// Start cache
var cacheLinkSet; // NOSONAR [shared on files]
if (_isFile(folders.data + 'searchByDistance_cacheLink.json')) {
	const data = loadCache(folders.data + 'searchByDistance_cacheLink.json');
	if (data.size) { cacheLink = data; if (sbd.panelProperties.bStartLogging[1]) { console.log('Search by Distance: Used Cache - cacheLink from file.'); } } // NOSONAR [shared on files]
}
if (_isFile(folders.data + 'searchByDistance_cacheLinkSet.json')) {
	const data = loadCache(folders.data + 'searchByDistance_cacheLinkSet.json');
	if (data.size) { cacheLinkSet = data; if (sbd.panelProperties.bStartLogging[1]) { console.log('Search by Distance: Used Cache - cacheLinkSet from file.'); } }
}
// Delays cache update after startup (must be called by the button file if it's not done here)
if (typeof buttonsBar === 'undefined' && typeof bNotProperties === 'undefined') { debounce(updateCache, 3000)({ properties: sbd.panelProperties }); }
// Ask others instances to share cache on startup
if (typeof cacheLink === 'undefined') {
	setTimeout(() => { window.NotifyOthers('Search by Distance: requires cacheLink map', true); }, 1000);
}
if (typeof cacheLinkSet === 'undefined') {
	setTimeout(() => { window.NotifyOthers('Search by Distance: requires cacheLinkSet map', true); }, 1000);
}
async function updateCache({ newCacheLink, newCacheLinkSet, bForce = false, properties = null } = {}) {
	if (typeof cacheLink === 'undefined' && !newCacheLink) { // only required if on_notify_data did not fire before
		const profiler = sbd.panelProperties.bProfile[1] ? new FbProfiler('updateCache') : null;
		if (sbd.panelProperties.bCacheOnStartup[1] || bForce) {
			if (sbd.isCalculatingCache) { return; }
			sbd.isCalculatingCache = true;
			const bBar = typeof buttonsBar !== 'undefined';
			const sbdButtons = bBar
				? buttonsBar.listKeys.flat(Infinity).filter((key) => { return key.match(/(?:^Search by Distance.*)|(?:^Playlist Tools$)/i); })
				: [];
			if (bBar) {
				sbdButtons.forEach((key) => {
					buttonsBar.buttons[key].switchAnimation('Link cache (tags)', true, () => !sbd.isCalculatingCache);
				});
			}
			const tags = properties && Object.hasOwn(properties, 'tags') ? JSON.parse(properties.tags[1]) : null;
			const genreStyleTags = tags
				? Object.values(tags).filter((t) => t.type.includes('graph') && !t.type.includes('virtual')).map((t) => t.tf).flat(Infinity)
					.map((tag) => { return tag.indexOf('$') === -1 ? _t(tag) : tag; }).join('|')
				: _t(globTags.genre) + '|' + _t(globTags.style);
			console.log('Search by Distance: tags used for cache - ' + genreStyleTags);
			const tfo = fb.TitleFormat(genreStyleTags);
			const styleGenres = await new Promise((resolve) => {
				const libItems = fb.GetLibraryItems().Convert();
				const num = libItems.length;
				let tagValues = [];
				const promises = [];
				let step = 0;
				let prevProgress = -1;
				// All styles/genres from library without duplicates
				for (let i = 0; step < num; i++) { // NOSONAR [iterate over step]
					promises.push(new Promise((resolve) => {
						step += 300;
						const items = new FbMetadbHandleList(libItems.slice(i, step));
						setTimeout((step) => {
							tagValues.push(...new Set(tfo.EvalWithMetadbs(items).join('|').split(/\| *|, */g)));
							const progress = Math.floor(step / num * 4) * 25;
							if (progress > prevProgress) {
								console.log('Calculating tags ' + (progress <= 100 ? progress : 100) + '%.');
								if (bBar) {
									sbdButtons.forEach((key) => {
										buttonsBar.buttons[key].switchAnimation('Link cache (tags)', false);
										buttonsBar.buttons[key].switchAnimation('Link cache (tags) ' + prevProgress + '%', false);
										buttonsBar.buttons[key].cleanAnimation();
										buttonsBar.buttons[key].switchAnimation('Link cache (tags) ' + progress + '%', true, () => !sbd.isCalculatingCache);
									});
								}
								prevProgress = progress;
							}
							resolve('done');
						}, iDelayLibrary * 6 * i, step);
					}));
				}
				Promise.all(promises).then(() => {
					if (bBar) {
						sbdButtons.forEach((key) => {
							buttonsBar.buttons[key].switchAnimation('Link cache (tags) 100%', false);
							buttonsBar.buttons[key].cleanAnimation();
							buttonsBar.buttons[key].switchAnimation('Link cache (links)', true, () => !sbd.isCalculatingCache);
						});
					}
					if (properties && Object.hasOwn(properties, 'bAscii') && properties.bAscii[1]) {
						setTimeout(() => { resolve(new Set([...new Set(tagValues)].map((tag) => { return _asciify(tag); }))); }, 500);
					} else {
						setTimeout(() => { resolve(new Set(tagValues)); }, 500);
					}
				});
			});
			const statusCallback = (progress, prevProgress) => {
				if (bBar) {
					sbdButtons.forEach((key) => {
						buttonsBar.buttons[key].switchAnimation('Link cache (links)', false);
						buttonsBar.buttons[key].switchAnimation('Link cache (links) ' + prevProgress + '%', false);
						buttonsBar.buttons[key].cleanAnimation();
						buttonsBar.buttons[key].switchAnimation('Link cache (links) ' + progress + '%', true, () => !sbd.isCalculatingCache);
					});
				}
			};
			cacheLink = await calcCacheLinkSGV2(sbd.allMusicGraph, styleGenres, void (0), sbd.influenceMethod, statusCallback);
			sbd.isCalculatingCache = false;
		} else {
			cacheLink = new Map();
		}
		saveCache(cacheLink, folders.data + 'searchByDistance_cacheLink.json');
		if (sbd.panelProperties.bProfile[1]) { profiler.Print(); }
		console.log('Search by Distance: New Cache - cacheLink');
		window.NotifyOthers('Search by Distance: cacheLink map', cacheLink);
	} else if (newCacheLink) {
		cacheLink = newCacheLink;
	}
	if (typeof cacheLinkSet === 'undefined' && !newCacheLinkSet) { // only required if on_notify_data did not fire before
		cacheLinkSet = new Map();
		console.log('Search by Distance: New Cache - cacheLinkSet');
		window.NotifyOthers('Search by Distance: cacheLinkSet map', cacheLinkSet);
	} else if (newCacheLinkSet) {
		cacheLinkSet = newCacheLinkSet;
	}
	// Multiple Graph testing and logging of results using the existing cache
	if (sbd.panelProperties.bSearchDebug[1] && sbd.panelProperties.bStartLogging[1]) {
		[testGraphNodes, testGraphNodeSets, music_graph_descriptors_culture.distanceDebug].forEach((f, i) => {
			console.log('-'.repeat(60) + '-> Test ' + _p(i + 1));
			doOnce('Test i', f)(sbd.allMusicGraph);
		});
	}
}

addEventListener('on_notify_data', (name, info) => {
	if (name === 'bio_imgChange' || name === 'biographyTags' || name === 'bio_chkTrackRev' || name === 'xxx-scripts: panel name reply') { return; }
	if (!name.startsWith('Search by Distance')) { return; }
	switch (name) {
		case 'Search by Distance: requires cacheLink map': { // When asked to share cache, delay 1 sec. to allow script loading
			if (typeof cacheLink !== 'undefined' && cacheLink.size) {
				debounce(() => { if (typeof cacheLink !== 'undefined') { window.NotifyOthers('Search by Distance: cacheLink map', cacheLink); } }, 1000)();
				console.log('Search by Distance: Requested Cache - cacheLink.');
			}
			break;
		}
		case 'Search by Distance: requires cacheLinkSet map': { // When asked to share cache, delay 1 sec. to allow script loading
			if (typeof cacheLinkSet !== 'undefined' && cacheLinkSet.size) {
				debounce(() => { if (typeof cacheLinkSet !== 'undefined') { window.NotifyOthers('Search by Distance: cacheLinkSet map', cacheLinkSet); } }, 1000)();
				console.log('Search by Distance: Requested Cache - cacheLinkSet.');
			}
			break;
		}
		case 'Search by Distance: cacheLink map': {
			if (info) {
				console.log('Search by Distance: Used Cache - cacheLink from other panel.');
				let data = JSON.parse(JSON.stringify([...info])); // Deep copy
				data.forEach((pair) => { if (pair[1].distance === null) { pair[1].distance = Infinity; } }); // stringify converts Infinity to null, this reverts the change
				updateCache({ newCacheLink: new Map(data) });
			}
			break;
		}
		case 'Search by Distance: cacheLinkSet map': {
			if (info) {
				console.log('Search by Distance: Used Cache - cacheLinkSet from other panel.');
				let data = JSON.parse(JSON.stringify([...info])); // Deep copy
				data.forEach((pair) => { if (pair[1] === null) { pair[1] = Infinity; } }); // stringify converts Infinity to null, this reverts the change
				updateCache({ newCacheLinkSet: new Map(data) });
			}
			break;
		}
	}
});

addEventListener('on_script_unload', () => {
	if (sbd.panelProperties.bStartLogging[1]) { console.log('Search by Distance: Saving Cache.'); }
	if (cacheLink) { saveCache(cacheLink, folders.data + 'searchByDistance_cacheLink.json'); }
	if (cacheLinkSet) { saveCache(cacheLinkSet, folders.data + 'searchByDistance_cacheLinkSet.json'); }
	// SMP Bug: https://github.com/TheQwertiest/foo_spider_monkey_panel/issues/205
	/*
	if (!sbd.panelProperties.firstPopup[1]) {
		sbd.panelProperties.firstPopup[1] = true;
		overwriteProperties(sbd.panelProperties); // Updates panel
	}
	*/
	console.flush();
});

/*
	Warnings about links/nodes set wrong
*/
if (sbd.panelProperties.bGraphDebug[1]) {
	const profiler = sbd.panelProperties.bProfile[1] ? new FbProfiler('graphDebug') : null;
	graphDebug(sbd.allMusicGraph);
	if (sbd.panelProperties.bProfile[1]) { profiler.Print(); }
}

/*
	Variables allowed at recipe files and automatic documentation update
*/
const recipeAllowedKeys = new Set(['name', 'properties', 'theme', 'recipe', 'tags', 'bNegativeWeighting', 'bFilterWithGraph', 'forcedQuery', 'bSameArtistFilter', 'bConditionAntiInfluences', 'bUseAntiInfluencesFilter', 'bUseInfluencesFilter', 'bSimilArtistsFilter', 'artistRegionFilter', 'genreStyleRegionFilter', 'nearGenresFilter', 'method', 'scoreFilter', 'minScoreFilter', 'graphDistance', 'poolFilteringN', 'bPoolFiltering', 'bRandomPick', 'bInversePick', 'probPick', 'playlistLength', 'bSortRandom', 'bProgressiveListOrder', 'bInverseListOrder', 'bScatterInstrumentals', 'bSmartShuffle', 'bSmartShuffleAdvc', 'smartShuffleSortBias', 'bInKeyMixingPlaylist', 'bProgressiveListCreation', 'progressiveListCreationN', 'playlistName', 'bProfile', 'bShowQuery', 'bShowFinalSelection', 'bBasicLogging', 'bSearchDebug', 'bCreatePlaylist', 'bAscii', 'sortBias', 'bAdvTitle', 'bMultiple']);
const recipePropertiesAllowedKeys = new Set(['smartShuffleTag', 'poolFilteringTag']);
const themePath = folders.xxx + 'presets\\Search by\\themes\\';
const recipePath = folders.xxx + 'presets\\Search by\\recipes\\';
if (!_isFile(folders.xxx + 'presets\\Search by\\recipes\\allowedKeys.txt') || bMismatchCRC) {
	const data = [...recipeAllowedKeys].map((key) => {
		const propDescr = SearchByDistance_properties[key] || SearchByDistance_panelProperties[key];
		let descr = propDescr ? propDescr[0] : '';
		if (!descr.length) {
			if (key.toLowerCase().indexOf('properties') !== -1) {
				descr = {
					'Object properties to pass other arguments':
						Object.fromEntries([...recipePropertiesAllowedKeys].map((key) => { return [key, (SearchByDistance_properties[key] || SearchByDistance_panelProperties[key])[0]]; }))
				};
			}
			if (key === 'name') { descr = 'Preset name (instead of filename)'; }
			if (key === 'theme') { descr = 'Load additional theme by file name or path'; }
			if (key === 'recipe') { descr = 'Load additional recipe(s) by file name or path. Nesting and multiple values (array) allowed'; }
			if (key === 'bPoolFiltering') { descr = 'Global enable/disable switch. Equivalent to setting poolFilteringN to >0 or -1'; }
			if (key === 'bCreatePlaylist') { descr = 'Output results to a playlist or only for internal use'; }
		}
		return [key, descr];
	});
	if (sbd.panelProperties.bStartLogging[1]) { console.log('Updating recipes documentation at: ' + folders.xxx + 'presets\\Search by\\recipes\\allowedKeys.txt'); }
	_save(folders.xxx + 'presets\\Search by\\recipes\\allowedKeys.txt', JSON.stringify(Object.fromEntries(data), null, '\t'));
}

function testRecipe({ path = null, json = null, baseTags = null } = {}) {
	const result = { valid: true, report: [] };
	let recipe;
	if (!path && !json) { result.valid = false; result.report.push('No recipe provided.'); return result; }
	if (!baseTags) { result.valid = false; result.report.push('No tags provided.'); return result; }
	else if (path) {
		if (_isFile(path)) {
			recipe = _jsonParseFileCheck(path, 'Recipe json', 'Search by Distance', utf8);
		} else { result.valid = false; result.report.push('Recipe file not found.'); return result; }
	} else { recipe = clone(json); }
	if (Object.keys(recipe).length === 0) { result.valid = false; result.report.push('Recipe is empty.'); return result; }
	// Process nested recipes
	if (Object.hasOwn(recipe, 'recipe')) {
		const toAdd = processRecipe(recipe.recipe);
		delete toAdd.recipe;
		Object.keys(toAdd).forEach((key) => {
			if (!Object.hasOwn(recipe, key)) {
				recipe[key] = toAdd[key];
			} else if (key === 'tags') {
				for (let key in toAdd.tags) {
					if (!Object.hasOwn(recipe.tags, key)) {
						recipe.tags[key] = toAdd.tags[key];
					} else {
						for (let subKey in toAdd.tags[key]) {
							if (!Object.hasOwn(recipe.tags[key], subKey)) {
								recipe.tags[key][subKey] = toAdd.tags[key][subKey];
							}
						}
					}
				}
			}
		});
	}
	const tags = Object.hasOwn(recipe, 'tags') ? recipe.tags : null;
	// Process placeholders for tags
	if (tags) {
		if (Object.hasOwn(recipe.tags, '*')) {
			for (let key in tags) {
				for (let prop in tags['*']) { // Recipe's tags missing some property
					if (!Object.hasOwn(tags[key], prop)) { tags[key][prop] = tags['*'][prop]; }
				}
			}
			for (let key in baseTags) { // Base tags not on recipe
				if (!Object.hasOwn(tags, key)) { tags[key] = tags['*']; }
			}
		}
	}
	// Test
	for (let key in recipe) {
		if (!recipeAllowedKeys.has(key)) {
			result.valid = false;
			result.report.push('Recipe contains non valid key: ' + key);
		}
	}
	const validVarTypes = ['string', 'number'];
	const validValTypes = ['multiple', 'single'];
	const checkKeys = ['weight', 'tf', 'baseScore', 'scoringDistribution'];
	const validTagKeys = ['range', 'type', 'combs', ...checkKeys];
	for (let key in tags) {
		if (key === '*') { continue; }
		const tag = Object.hasOwn(baseTags, key) ? { ...clone(baseTags[key]), ...tags[key] } : tags[key];
		// Type
		if (!Object.hasOwn(tag, 'type') || tag.type.length === 0) {
			result.valid = false;
			result.report.push('Tag missing type declaration: ' + key);
		} else {
			if (!validVarTypes.some((t) => tag.type.includes(t))) {
				result.valid = false;
				result.report.push('Tag missing variable type ' + _p(validVarTypes.join(', ')) + ': ' + key);
			}
			if (!validValTypes.some((t) => tag.type.includes(t))) {
				result.valid = false;
				result.report.push('Tag missing multi-value type ' + _p(validValTypes.join(', ')) + ': ' + key);
			}
			// Range
			const rangeRegEx = /-*range/i;
			if (Object.hasOwn(tag, 'range') && !tag.type.some((t) => rangeRegEx.test(t))) {
				result.valid = false;
				result.report.push('Tag missing range type: ' + key);
			} else if (tag.type.some((t) => rangeRegEx.test(t)) && !Object.hasOwn(tag, 'range')) {
				result.valid = false;
				result.report.push('Tag missing range property: ' + key);
			}
		}
		// General keys
		for (let check of checkKeys) {
			if (!Object.hasOwn(tag, check)) {
				result.valid = false;
				result.report.push('Tag missing property ' + _p(check) + ': ' + key);
			}
		}
		for (let check in tag) {
			if (!validTagKeys.includes(check)) {
				result.valid = false;
				result.report.push('Tag contains non valid property ' + _p(check) + ': ' + key);
			}
		}
	}
	if (!result.valid) { result.report.splice(0, 0, 'Recipe non valid: ' + recipe.name + (path ? '\n' + path : '') + '\n'); }
	return result;
}

function testBaseTags(baseTags) {
	const result = testRecipe({ json: { tags: { '*': {} } }, baseTags });
	if (!result.valid) {
		result.report[0] = 'Error on tags settings.\nTo fix it, restore defaults on affected tags (customizable button) or globally (non-customizable buttons). These options are usually found by Shift + L. Clicking on the button. Then reload the panel.\nIf the error continues, report it as a bug.\n------------------------------------------------------------------------';
		console.popup(result.report.join('\n'), 'Search by distance');
	}
	return result.valid;
}

// Test default tags
testBaseTags(JSON.parse(SearchByDistance_properties.tags[3]));

// 1900 ms 24K tracks GRAPH all default on i7 920 from 2008
// 3144 ms 46K tracks DYNGENRE all default on i7 920 from 2008
async function searchByDistance({
	// --->Default args (aka properties from the panel and input)
	properties = getPropertiesPairs(SearchByDistance_properties, sbd_prefix),
	panelProperties = (typeof buttonsBar === 'undefined') ? properties : getPropertiesPairs(SearchByDistance_panelProperties, sbd_prefix),
	sel = fb.GetFocusItem(), // Reference track, first item of act. pls. if can't get focus item
	theme = {}, // May be a file path or object with Arr of tags {name, tags: [{genre, style, mood, key, date, bpm, composer, customStr, customNum}]}
	recipe = {}, // May be a file path or object with Arr of arguments {genreWeight, styleWeight, ...}
	// --->Args modifiers
	bAscii = Object.hasOwn(properties, 'bAscii') ? properties.bAscii[1] : true, // Sanitize all tag values with ASCII equivalent chars
	bTagsCache = Object.hasOwn(panelProperties, 'bTagsCache') ? panelProperties.bTagsCache[1] : false, // Read from cache
	bAdvTitle = Object.hasOwn(properties, 'bAdvTitle') ? properties.bAdvTitle[1] : true, // RegExp duplicate matching,
	bMultiple = Object.hasOwn(properties, 'bMultiple') ? properties.bMultiple[1] : true, // Single Multi-value tag matching,
	checkDuplicatesByTag = Object.hasOwn(properties, 'checkDuplicatesByTag') ? JSON.parse(properties.checkDuplicatesByTag[1]) : globTags.remDupl,
	sortBias = Object.hasOwn(properties, 'sortBias') ? properties.sortBias[1] : globQuery.remDuplBias, // Track selection bias,
	// --->Weights
	tags = Object.hasOwn(properties, 'tags') ? JSON.parse(properties.tags[1]) : null,
	bNegativeWeighting = Object.hasOwn(properties, 'bNegativeWeighting') ? properties.bNegativeWeighting[1] : true, // Assigns negative score for num. tags when they fall outside range
	bFilterWithGraph = Object.hasOwn(properties, 'bFilterWithGraph') ? properties.bFilterWithGraph[1] : false, // Filter graph search with valid values (slow)
	// --->Pre-Scoring Filters
	// Query to filter library
	forcedQuery = Object.hasOwn(properties, 'forcedQuery') ? properties.forcedQuery[1] : '',
	dynQueries = Object.hasOwn(properties, 'dynQueries') ? JSON.parse(properties.dynQueries[1]) : [],
	// Exclude same artist
	bSameArtistFilter = Object.hasOwn(properties, 'bSameArtistFilter') ? properties.bSameArtistFilter[1] : false,
	// Similar artists
	bSimilArtistsFilter = Object.hasOwn(properties, 'bSimilArtistsFilter') ? properties.bSimilArtistsFilter[1] : false,
	// Filter anti-influences by query, before any scoring/distance calc.
	bConditionAntiInfluences = Object.hasOwn(properties, 'bConditionAntiInfluences') ? properties.bConditionAntiInfluences[1] : false, // Only for specific style/genres (for ex. Jazz)
	bUseAntiInfluencesFilter = !bConditionAntiInfluences && Object.hasOwn(properties, 'bUseAntiInfluencesFilter') ? properties.bUseAntiInfluencesFilter[1] : false,
	// Allows only influences by query, before any scoring/distance calc.
	bUseInfluencesFilter = Object.hasOwn(properties, 'bUseInfluencesFilter') ? properties.bUseInfluencesFilter[1] : false,
	artistRegionFilter = Object.hasOwn(properties, 'artistRegionFilter') ? Number(properties.artistRegionFilter[1]) : -1,
	genreStyleRegionFilter = Object.hasOwn(properties, 'genreStyleRegionFilter') ? Number(properties.genreStyleRegionFilter[1]) : -1,
	nearGenresFilter = Object.hasOwn(properties, 'nearGenresFilter') ? Number(properties.nearGenresFilter[1]) : 0,
	// --->Scoring Method
	method = Object.hasOwn(properties, 'method') ? properties.method[1] : 'GRAPH',
	// --->Scoring filters
	scoreFilter = Object.hasOwn(properties, 'scoreFilter') ? Number(properties.scoreFilter[1]) : 75,
	minScoreFilter = Object.hasOwn(properties, 'minScoreFilter') ? Number(properties.minScoreFilter[1]) : scoreFilter - 10,
	graphDistance = Object.hasOwn(properties, 'graphDistance') ? (isString(properties.graphDistance[1]) ? properties.graphDistance[1] : Number(properties.graphDistance[1])) : Infinity,
	// --->Post-Scoring Filters
	// Allows only N +1 tracks per tag set... like only 2 tracks per artist, etc.
	poolFilteringTag = Object.hasOwn(properties, 'poolFilteringTag') ? JSON.parse(properties.poolFilteringTag[1]).filter(Boolean) : [],
	poolFilteringN = Object.hasOwn(properties, 'poolFilteringN') ? Number(properties.poolFilteringN[1]) : -1,
	bPoolFiltering = poolFilteringN >= 0 && poolFilteringN < Infinity,
	// --->Playlist selection
	// How tracks are chosen from pool
	bRandomPick = Object.hasOwn(properties, 'bRandomPick') ? properties.bRandomPick[1] : false, // Get randomly
	bInversePick = Object.hasOwn(properties, 'bInversePick') ? properties.bInversePick[1] : false, // Get randomly
	probPick = Object.hasOwn(properties, 'probPick') ? Number(properties.probPick[1]) : 100, // Get by scoring order but with x probability of being chosen
	playlistLength = Object.hasOwn(properties, 'playlistLength') ? Number(properties.playlistLength[1]) : 50, // Max playlist size
	// --->Playlist sorting
	// How playlist is sorted (independently of playlist selection)
	bSortRandom = Object.hasOwn(properties, 'bSortRandom') ? properties.bSortRandom[1] : false, // Random sorting
	bProgressiveListOrder = Object.hasOwn(properties, 'bProgressiveListOrder') ? properties.bProgressiveListOrder[1] : false, // Sorting following progressive changes on tags (score)
	bInverseListOrder = Object.hasOwn(properties, 'bInverseListOrder') ? properties.bInverseListOrder[1] : false, // Invert any selected sorting
	bScatterInstrumentals = Object.hasOwn(properties, 'bScatterInstrumentals') ? properties.bScatterInstrumentals[1] : false, // Intercalate instrumental tracks breaking clusters if possible
	bSmartShuffle = Object.hasOwn(properties, 'bSmartShuffle') ? properties.bSmartShuffle[1] : false, // Spotify's smart shuffle by artist
	bSmartShuffleAdvc = Object.hasOwn(properties, 'bSmartShuffleAdvc') ? properties.bSmartShuffleAdvc[1] : false, // Spotify's smart shuffle by artist
	smartShuffleSortBias = Object.hasOwn(properties, 'smartShuffleSortBias') ? properties.smartShuffleSortBias[1] : 'random', // Spotify's smart shuffle bias
	// --->Special Playlists
	// Use previous playlist selection, but override playlist sorting, since they use their own logic
	bInKeyMixingPlaylist = Object.hasOwn(properties, 'bInKeyMixingPlaylist') ? properties.bInKeyMixingPlaylist[1] : false, // Key changes following harmonic mixing rules like a DJ
	bHarmonicMixDoublePass = Object.hasOwn(properties, 'bHarmonicMixDoublePass') ? properties.bHarmonicMixDoublePass[1] : false, // Usually outputs more tracks in harmonic mixing
	bProgressiveListCreation = Object.hasOwn(properties, 'bProgressiveListCreation') ? properties.bProgressiveListCreation[1] : false, // Uses output tracks as new references, and so on...
	progressiveListCreationN = bProgressiveListCreation ? Number(properties.progressiveListCreationN[1]) : 1, // > 1 and < 100
	// --->Console logging
	// Uses panelProperties instead of properties, so it always points to the right properties... used along buttons or not.
	// They are the same for all instances within the same panel
	bProfile = Object.hasOwn(panelProperties, 'bProfile') ? panelProperties.bProfile[1] : false,
	bShowQuery = Object.hasOwn(panelProperties, 'bShowQuery') ? panelProperties.bShowQuery[1] : true,
	bShowFinalSelection = Object.hasOwn(panelProperties, 'bShowFinalSelection') ? panelProperties.bShowFinalSelection[1] : true,
	bBasicLogging = Object.hasOwn(panelProperties, 'bBasicLogging') ? panelProperties.bBasicLogging[1] : false,
	bSearchDebug = Object.hasOwn(panelProperties, 'bSearchDebug') ? panelProperties.bSearchDebug[1] : false,
	// --->Output
	playlistName = Object.hasOwn(properties, 'playlistName') ? properties.playlistName[1] : 'Search...',
	bCreatePlaylist = true, // false: only outputs handle list. To be used along other scripts and/or recursive calls
	// --->Misc
	parent = null
} = {}) {
	const descr = music_graph_descriptors;
	const oldCacheLinkSize = cacheLink ? cacheLink.size : 0;
	const oldCacheLinkSetSize = cacheLinkSet ? cacheLinkSet.size : 0;
	// Tags check
	if (!tags || Object.keys(tags).length === 0) { console.popup('No tags provided: ' + tags + '\nRestore defaults to fix it.', 'Search by distance'); return; }
	// Test tags
	if (!testBaseTags(tags)) { return; }
	// Recipe check
	const bUseRecipe = !!(recipe && (typeof recipe === 'string' && recipe.length || Object.keys(recipe).length));
	const recipeProperties = {};
	if (bUseRecipe) {
		let path;
		if (isString(recipe)) { // File path
			path = !_isFile(recipe) && _isFile(recipePath + recipe) ? recipePath + recipe : recipe; // NOSONAR [is always a string]
			recipe = _jsonParseFileCheck(path, 'Recipe json', 'Search by Distance', utf8);
			if (!recipe) { console.popup('Recipe not found: ' + path, 'Search by distance'); return; } // NOSONAR [is always a string]
		}
		// Check recipe but don't crash
		const result = testRecipe({ json: recipe, baseTags: tags });
		if (!result.valid) { console.popup(result.report.join('\n\t- '), 'Recipe error'); }
		// Rewrite args or use destruct when passing args
		// Sel is omitted since it's a function or a handle
		// Note a theme may be set within a recipe too, overwriting any other theme set
		// Changes null to infinity and not found theme filenames into full paths
		let bOverwriteTheme = false;
		if (Object.hasOwn(recipe, 'recipe')) { // Process nested recipes
			let toAdd = processRecipe(recipe.recipe);
			delete toAdd.recipe;
			Object.keys(toAdd).forEach((key) => {
				if (!Object.hasOwn(recipe, key)) {
					recipe[key] = toAdd[key];
				} else if (key === 'tags') {
					for (let key in toAdd.tags) {
						if (!Object.hasOwn(recipe.tags, key)) {
							recipe.tags[key] = toAdd.tags[key];
						} else {
							for (let subKey in toAdd.tags[key]) {
								if (!Object.hasOwn(recipe.tags[key], subKey)) {
									recipe.tags[key][subKey] = toAdd.tags[key][subKey];
								}
							}
						}
					}
				}
			});
		}
		if (bSearchDebug) { console.log(recipe); }
		const globalArgs = new Set(['poolFilteringTag']);
		Object.keys(recipe).forEach((key) => { // Process current recipe
			const value = recipe[key] !== null ? recipe[key] : Infinity;
			if (recipeAllowedKeys.has(key)) {
				if (key === 'name') {
					return;
				} else if (key === 'recipe') {
					return; // Skip, already processed
				} else if (key === 'properties') { // Overrule current ones (but don't touch original object!)
					const newProperties = recipe[key];
					if (newProperties) {
						Object.keys(newProperties).forEach((rKey) => {
							if (!Object.hasOwn(properties, rKey)) { console.log('Recipe has a not recognized property key: ' + rKey); return; }
							let newValue = newProperties[rKey] !== null ? newProperties[rKey] : Infinity;
							recipeProperties[rKey] = newValue;
							if (globalArgs.has(rKey)) {
								if (newValue !== Infinity) {
									newValue = JSON.stringify(recipeProperties[rKey]);
								}
								eval(rKey + ' = ' + newValue);
							}
						});
					}
				} else if (key === 'tags') { // Overrule current ones (but don't touch original object!)
					recipeProperties.tags = recipe.tags;
				} else {
					const newValue = value !== Infinity
						? JSON.stringify(value)
						: value;
					eval(key + ' = ' + newValue);
					if (key === 'theme') { bOverwriteTheme = true; }
					if (bSearchDebug) { console.log(key, value, eval(key)); }
				}
			} else { console.log('Recipe has a not recognized variable: ' + key); }
		});
		// Process placeholders for tags
		if (Object.hasOwn(recipe, 'tags') && Object.hasOwn(recipe.tags, '*')) {
			for (let key in recipe.tags) { // Recipe's tags missing some property
				for (let prop in recipe.tags['*']) {
					if (!Object.hasOwn(recipe.tags[key], prop)) { recipe.tags[key][prop] = recipe.tags['*'][prop]; }
				}
			}
			for (let key in tags) { // Base tags not on recipe
				if (!Object.hasOwn(recipe.tags, key)) { recipe.tags[key] = recipe.tags['*']; }
			}
		}
		if (bBasicLogging) {
			const name = Object.hasOwn(recipe, 'name') ? recipe.name : (path ? utils.SplitFilePath(path)[1] : '-no name-');
			console.log('Using recipe as config: ' + name + (path ? ' (' + path + ')' : '')); // NOSONAR [is always a string]
			if (bOverwriteTheme) { console.log('Recipe forces its own theme.'); }
		}
	}
	const bUseRecipeTags = !!(bUseRecipe && Object.hasOwn(recipeProperties, 'tags'));
	// Parse args
	if (method === 'GRAPH') {
		graphDistance = parseGraphDistance(graphDistance, descr, bBasicLogging);
		if (graphDistance === null) { return; }
	}
	// Theme check
	const bUseTheme = !!(theme && (typeof recipe === 'string' && theme.length || Object.keys(theme).length));
	if (bUseTheme) {
		let path;
		if (isString(theme)) { // File path: try to use plain path or themes folder + filename
			path = !_isFile(theme) && _isFile(themePath + theme) ? themePath + theme : theme; // NOSONAR [is always a string]
			theme = _jsonParseFileCheck(path, 'Theme json', 'Search by Distance', utf8);
			if (!theme) { return; }
		}
		// Array of objects
		const tagsToCheck = Object.keys(tags).filter((k) => !tags[k].type.includes('virtual'));
		// Theme tags must contain at least all the user tags
		const tagCheck = Object.hasOwn(theme, 'tags')
			? theme.tags.findIndex((tagArr) => { return !new Set(Object.keys(tagArr)).isSuperset(new Set(tagsToCheck)); })
			: 0;
		const bCheck = Object.hasOwn(theme, 'name') && tagCheck === -1;
		if (!bCheck) {
			console.log('Using theme as reference: ' + theme.name + (path ? ' (' + path + ')' : '')); // NOSONAR [is always a string]
			console.log(
				'Theme is missing some keys: ' +
				(Object.hasOwn(theme, 'tags') && tagCheck !== -1
					? [...new Set(tagsToCheck).difference(new Set(Object.keys(theme.tags[tagCheck])))]
					: 'name')
			);
			return;
		}
		if (bBasicLogging) {
			console.log('Using theme as reference: ' + theme.name + (path ? ' (' + path + ')' : '')); // NOSONAR [is always a string]
			console.log(theme); // DEBUG
		}
	}
	// Sel check
	if (!bUseTheme) {
		if (!sel) {
			console.log('No track\\theme selected for mix.');
			return;
		}
		if (bBasicLogging) {
			console.log('Using selection as reference: ' + fb.TitleFormat('[%TRACK% - ]%TITLE%').EvalWithMetadb(sel) + ' (' + sel.RawPath + ')');
		}
	}
	// Method check
	if (!checkMethod(method)) { console.popup('Method not recognized: ' + method + '\nOnly allowed GRAPH, DYNGENRE or WEIGHT.', 'Search by distance'); return; }
	// Start calcs
	const test = bProfile ? new FbProfiler('Search by Distance') : null;
	// Copy recipe tags
	if (bUseRecipeTags) {
		for (let key in recipeProperties.tags) {
			if (!Object.hasOwn(tags, key) && key !== '*') {
				tags[key] = recipeProperties.tags[key];
			}
		}
	}
	// May be more than one tag so we use split(). Use filter() to remove '' values. For ex:
	// styleTag: 'tagName,, ,tagName2' => ['tagName','Tagname2']
	// We check if weights are zero first
	const calcTags = { genreStyle: { ...sbd.tagSchema, ...{ type: ['virtual'] } } };
	for (let key in tags) {
		const tag = tags[key];
		// Set base values
		const calcTag = { weight: tag.weight || 0, tf: [], scoringDistribution: tag.scoringDistribution || 'LINEAR', baseScore: tag.baseScore || 0, type: [...tag.type], range: tag.range || 0, combs: tag.combs || 0 };
		// Overwrite with properties
		if (bUseRecipeTags && Object.hasOwn(recipeProperties.tags, key)) {
			Object.keys(recipeProperties.tags[key]).filter((k) => k !== 'tf').forEach((k) => {
				calcTag[k] = recipeProperties.tags[key][k];
			});
		}
		// Get proper TF
		const type = tag.type;
		if (tag.weight !== 0 || (type.includes('graph') && (method === 'DYNGENRE' || method === 'GRAPH')) || (type.includes('keyMix') && bInKeyMixingPlaylist)) {
			calcTag.tf = (bUseRecipeTags && Object.hasOwn(recipeProperties.tags, key) ? (recipeProperties.tags[key].tf || tag.tf) : tag.tf).filter(Boolean);
			if (type.includes('graph')) { calcTags.genreStyle.tf.push(...calcTag.tf); }
		}
		calcTags[key] = calcTag;
		// Safety Check. Warn users if they try wrong settings
		if (type.includes('single') && calcTag.tf.length > 1) {
			console.popup('Check \'tags\' value (' + calcTag.tf + '), for tag ' + key + '. Must be only one tag name!.', 'Search by distance');
			return;
		}
	}
	if (calcTags.genreStyle.tf.length) { calcTags.genreStyle.tf = [...new Set(calcTags.genreStyle.tf)]; }
	// Check default virtual tags are present or add them
	const defaultTags = JSON.parse(SearchByDistance_properties.tags[3]);
	Object.keys(defaultTags).forEach((key) => {
		const tag = defaultTags[key];
		if (tag.type.includes('virtual') && !Object.hasOwn(calcTags, key)) {
			calcTags[key] = tag;
			calcTags[key].weight = 0;
		}
	});
	if (bSearchDebug) { console.log(JSON.stringify(calcTags, void (0), '\t')); }
	const smartShuffleTag = (recipeProperties.smartShuffleTag || JSON.parse(properties.smartShuffleTag[1])).filter(Boolean);
	const genreStyleTag = [...new Set(calcTags.genreStyle.tf)].map((tag) => { return (tag.indexOf('$') === -1 ? _t(tag) : tag); });
	const genreStyleTagQuery = [...new Set(calcTags.genreStyle.tf)].map((tag) => { return (tag.indexOf('$') === -1 ? tag : _q(tag)); });

	// Check input
	playlistLength = (playlistLength >= 0) ? playlistLength : 0;
	probPick = (probPick <= 100 && probPick > 0) ? probPick : 100;
	scoreFilter = (scoreFilter <= 100 && scoreFilter >= 0) ? scoreFilter : 100;
	minScoreFilter = (minScoreFilter <= scoreFilter && minScoreFilter >= 0) ? minScoreFilter : scoreFilter;
	bPoolFiltering = bPoolFiltering && (poolFilteringN >= 0 && poolFilteringN < Infinity);
	if (bPoolFiltering && (!poolFilteringTag || !poolFilteringTag.length || !isArrayStrings(poolFilteringTag))) {
		console.popup('Warning: Tags for pool filtering are not set or have an invalid value:\n' + poolFilteringTag, 'Search by distance');
		return;
	}
	if (bSmartShuffle && !smartShuffleTag || !smartShuffleTag.length) {
		console.popup('Warning: Smart Shuffle Tag is not set or has an invalid value:\n' + smartShuffleTag, 'Search by distance');
		return;
	}
	if (bProgressiveListCreation && !checkDuplicatesByTag || !checkDuplicatesByTag.length) {
		console.popup('Warning: Recursive playlist creation is enabled, but no tags for duplicates removal are provided.', 'Search by distance');
		return;
	}
	// Can not use those methods without genre/style tags at all
	if (genreStyleTag.length === 0 && (method === 'GRAPH' || method === 'DYNGENRE')) {
		if (bBasicLogging) {
			console.log('Check \'genre\' and \'style\' tags. Both can not be empty when using GRAPH or DYNGENRE methods.');
		}
		return;
	}

	// Zero weights if there are no tag names to look for
	for (let key in calcTags) {
		const tag = calcTags[key];
		if (tag.type.includes('virtual') && !['related', 'unrelated'].includes(key)) { continue; }
		if (tag.tf.length === 0) {
			tag.weight = 0;
			if (tag.type.includes('keyMix')) { bInKeyMixingPlaylist = false; }
		}
	}

	if (method === 'DYNGENRE') { // Warn users if they try wrong settings
		if (calcTags.dynGenre.weight === 0) {
			if (bBasicLogging) { console.log('Check \'dynGenre\' weight value (' + calcTags.dynGenre.weight + '). Must be greater than zero if you want to use DYNGENRE method!.'); }
			return;
		} else { method = 'WEIGHT'; } // For calcs they are the same!
	} else { calcTags.dynGenre.weight = 0; }

	if (!playlistLength) {
		if (bBasicLogging) { console.log('Check \'Playlist Mix length\' value (' + playlistLength + '). Must be greater than zero.'); }
		return;
	}
	if (method === 'WEIGHT' && Object.keys(calcTags).every((key) => calcTags[key].weight === 0)) {
		if (bBasicLogging) {
			if (calcTags.dynGenre.weight !== 0) { console.log('Check weight values, all are set to zero and \'dynGenre\' weight is not used for WEIGHT method.'); }
			else { console.log('Check weight values, all are set to zero.'); }
		}
		return;
	}

	try { fb.GetQueryItems(new FbMetadbHandleList(), forcedQuery); } // Sanity check
	catch (e) { fb.ShowPopupMessage('Query not valid, check forced query:\n' + forcedQuery); return; }
	// Query
	let query = [];
	let preQueryLength = 0;

	// These should be music characteristics not genre/styles. Like 'electric blues' o 'acoustic', which could apply to any blues style... those things are not connected by graph, but considered only for weight scoring instead.
	const graphExclusions = descr.map_distance_exclusions; // Set

	// Tag filtering: applied globally. Matched values omitted on both calcs, graph and scoring..
	// Add '' value to set so we also apply a ~boolean filter when evaluating. Since we are using the filter on string tags, it's good enough.
	// It's faster than applying array.filter(Boolean).filter(genreStyleFilterTag)
	const genreStyleFilter = new Set(JSON.parse(properties['genreStyleFilterTag'][1]).concat(''));
	const bTagFilter = !genreStyleFilter.isEqual(new Set([''])); // Only use filter when required

	// Simplify access to tag types
	for (let key in calcTags) {
		const tag = calcTags[key];
		tag.bVirtual = tag.type.includes('virtual');
		tag.bMultiple = tag.type.includes('multiple');
		tag.bSingle = tag.type.includes('single');
		tag.bString = tag.type.includes('string');
		tag.bNumber = tag.type.includes('number');
		tag.bGraph = tag.type.includes('graph');
		tag.bGraphDyn = tag.bGraph && (calcTags.dynGenre.weight !== 0 || method === 'GRAPH' || calcTags.genreStyleRegion.weight !== 0);
		tag.bKeyMix = tag.type.includes('keyMix') && bInKeyMixingPlaylist;
		tag.bKeyRange = tag.type.includes('keyRange');
		tag.bPercentRange = tag.bNumber && tag.type.includes('percentRange');
		tag.bAbsRange = tag.bNumber && tag.type.includes('absRange');
	}

	// Get the tag value. Skip those with weight 0 and get num of values per tag right (they may be arrays, single values, etc.)
	// We use flat since it's only 1 track: genre[0][i] === genre.flat()[i]
	// Also filter using boolean to remove '' values within an array, so [''] becomes [] with 0 length.
	// Using only boolean filter it's 3x faster than filtering by set
	const selHandleList = bUseTheme ? null : new FbMetadbHandleList(sel);
	for (let key in calcTags) {
		const tag = calcTags[key];
		tag.reference = [];
		if (tag.bVirtual && !['related', 'unrelated'].includes(key)) { continue; }
		if (tag.weight !== 0 || (tag.tf.length && (tag.bGraphDyn || tag.bKeyMix))) {
			tag.reference = (bUseTheme
				? theme.tags[0][key]
				: getHandleListTags(selHandleList, tag.tf, { bMerged: true }).flat()
			).filter(bTagFilter ? (tag) => !genreStyleFilter.has(tag) : Boolean);
		}
		if (tag.bSingle) {
			if (tag.bString) {
				tag.reference = tag.reference[0] || '';
			} else if (tag.bNumber) {
				tag.reference = Number(tag.reference[0]) || null;
			}
		}
		if (tag.bString) {
			if (tag.bMultiple) {
				if (tag.reference.length && bAscii) { tag.reference.forEach((val, i) => { tag.reference[i] = _asciify(val); }); }
				tag.referenceSet = new Set(tag.reference);
				tag.referenceNumber = tag.referenceSet.size;
			} else if (tag.reference.length && bAscii) { tag.reference = _asciify(tag.reference); }
		}
	}
	// Sets for later comparison
	if (method === 'GRAPH' || calcTags.dynGenre.weight !== 0 || calcTags.genreStyleRegion.weight !== 0 || nearGenresFilter !== -1 || genreStyleRegionFilter !== -1) {
		calcTags.genreStyle.referenceSet = Object.keys(calcTags).reduce((acc, key) => {
			const tag = calcTags[key];
			return tag.bGraphDyn && calcTags[key].reference.length > 0
				? acc.union(new Set(calcTags[key].reference))
				: acc;
		}, new Set()).difference(graphExclusions); // Remove exclusions
		// Replace with substitutions which could introduce duplicates
		calcTags.genreStyle.referenceSet = new Set(descr.replaceWithSubstitutions([...calcTags.genreStyle.referenceSet], true));
		if (bFilterWithGraph) {
			calcTags.genreStyle.referenceSet = calcTags.genreStyle.referenceSet.intersection(descr.getNodeSet());
		}
		calcTags.genreStyle.referenceNumber = calcTags.genreStyle.referenceSet.size;
		if (calcTags.genreStyle.referenceNumber === 0 && method === 'GRAPH') {
			console.log('Warning: method was \'GRAPH\' but selected track had no genre tags. Changed to \'WEIGHT\'\n\tAll tracks will be considered to have a graph distance of zero and only compared by score.');
		}
	}
	for (let key in calcTags) {
		const tag = calcTags[key];
		const type = tag.type;
		if (tag.weight === 0) { continue; }
		if (type.includes('virtual')) { continue; }
		const bHasMultiple = type.includes('multiple') && tag.referenceNumber !== 0;
		const bHasSingle = type.includes('single');
		const bHasString = bHasSingle && type.includes('string') && tag.reference.length;
		const bHasNumber = bHasSingle && type.includes('number') && tag.reference !== null;
		if (!bHasMultiple && !bHasString && !bHasNumber) {
			if (bBasicLogging) { console.log('Weight was not zero but selected track had no ' + key + ' tags for: ' + _b(tag.tf)); }
			tag.weight = 0;
		}
	}
	// Related and unrelated tags are not considered here, but just added to the total score before any calculation is done, to break asap. Tracks witch such tags are accounted with extra queries
	const totalWeight = Object.keys(calcTags).filter((key) => !['related', 'unrelated'].includes(key))
		.reduce((total, key) => { return total + calcTags[key].weight; }, 0); //100%
	const countWeights = Object.keys(calcTags).filter((key) => !['related', 'unrelated'].includes(key))
		.reduce((total, key) => { return (total + (calcTags[key].weight !== 0 ? 1 : 0)); }, 0);
	if (bSearchDebug) { console.log('Init Weights:', totalWeight, countWeights); }
	let originalWeightValue = 0;
	// Queries and ranges
	const queryDebug = bSearchDebug ? [] : null;
	const sortedByCombs = Object.keys(calcTags)
		.sort((a, b) => (calcTags[a].type.includes('combinations') ? 1 : 0) - (calcTags[b].type.includes('combinations') ? 1 : 0));
	for (let key of sortedByCombs) {
		const tag = calcTags[key];
		const type = tag.type;
		if (bSearchDebug) { queryDebug.push({ tag: key, query: '' }); }
		if (tag.weight === 0 || tag.tf.length === 0) { continue; }
		if (type.includes('virtual')) { continue; }
		if ((type.includes('multiple') && tag.referenceNumber !== 0) || (type.includes('single') && (type.includes('string') && tag.reference.length || type.includes('number') && tag.reference !== null))) {
			if (bSearchDebug) { console.log(key + ': ' + originalWeightValue + ' + ' + tag.weight); }
			originalWeightValue += tag.weight;
			if (tag.weight / totalWeight >= totalWeight / countWeights / 100) {
				preQueryLength = query.length;
				const tagNameTF = type.includes('multiple') // May be a tag or a function...
					? tag.tf.map((t) => { return ((t.indexOf('$') === -1) ? t : _q(t)); })
					: ((tag.tf[0].indexOf('$') === -1) ? tag.tf[0] : _q(tag.tf[0]));
				if (type.includes('keyRange')) {
					const camelotKey = camelotWheel.getKeyNotationObjectCamelot(tag.reference);
					if (camelotKey) {
						let keyComb = [];
						const keysInRange = camelotWheel.createRange(camelotKey, tag.range, { name: ['flat', 'sharp', 'open', 'camelot'], bFlat: false });
						keysInRange.forEach((keyArr) => {
							let subKeyComb = [];
							keyArr.forEach((keyVal) => {
								subKeyComb.push(tagNameTF + ' IS ' + keyVal);
							});
							keyComb.push(queryJoin(subKeyComb, 'OR'));
						});
						// And combine queries
						if (keyComb.length !== 0) { query[preQueryLength] = queryJoin(keyComb, 'OR'); }
					} else { query[preQueryLength] = tagNameTF + ' IS ' + tag.reference; } // For non-standard notations just use simple matching
				} else if (type.includes('percentRange')) {
					const rangeUpper = round(tag.reference * (100 + tag.range) / 100, 0);
					const rangeLower = round(tag.reference * (100 - tag.range) / 100, 0);
					if (rangeUpper !== rangeLower) { query[preQueryLength] = tagNameTF + ' GREATER ' + rangeLower + ' AND ' + tagNameTF + ' LESS ' + rangeUpper; }
					else { query[preQueryLength] += tagNameTF + ' EQUAL ' + tag.reference; }
				} else if (type.includes('absRange')) {
					const rangeUpper = tag.reference + tag.range;
					const rangeLower = tag.reference - tag.range;
					if (rangeUpper !== rangeLower) { query[preQueryLength] = tagNameTF + ' GREATER ' + rangeLower + ' AND ' + tagNameTF + ' LESS ' + rangeUpper; }
					else { query[preQueryLength] += tagNameTF + ' EQUAL ' + tag.reference; }
				} else if (type.includes('combinations')) {
					const k = tag.referenceNumber >= tag.combs ? tag.combs : tag.referenceNumber; //on combinations of k
					const tagComb = k_combinations(tag.reference, k);
					const match = tagNameTF.some((tag) => { return tag.indexOf('$') !== -1; }) ? 'HAS' : 'IS'; // Allow partial matches when using funcs
					// Group as small as possible for query purposes
					const tagCombSet = tagComb.map((a) => new Set(a));
					let groups = [];
					if (tagCombSet.length > 1) {
						tagCombSet.forEach((s) => {
							let bDone = false;
							groups.forEach((sg) => {
								const intersection = sg.base.intersection(s);
								if (sg.base.size === s.size && intersection.size === sg.base.size - 1 || sg.base.size === s.size - 1 && intersection.size === sg.base.size) {
									if (sg.base.size === s.size) {
										sg.or = sg.or.union(sg.base.difference(intersection));
										sg.base = intersection;
									}
									sg.or = sg.or.union(s.difference(intersection));
									bDone = true;
								}
							});
							if (!bDone) { groups.push({ base: s, or: new Set() }); }
						});
						groups = groups.map((o) => { return { base: [...o.base], or: [...o.or] }; });
						groups = groups.map((o) => {
							return (o.or.length
								? queryJoin(
									queryCombinations(o.base, tagNameTF, 'AND', void (0), match)
										.concat(queryCombinations(o.or, tagNameTF, 'OR', void (0), match))
								)
								: void (0)
							);
						}).filter(Boolean);
					} else { // For a single group just match all
						groups.push([...tagCombSet[0]].map((val) => tagNameTF + ' ' + match + ' ' + val).join(' AND '));
					}
					query[preQueryLength] = queryJoin(groups, 'OR');
				} else {
					if (Array.isArray(tagNameTF)) { // NOSONAR
						const match = tagNameTF.some((tag) => { return tag.indexOf('$') !== -1; }) ? 'HAS' : 'IS'; // Allow partial matches when using funcs
						query[preQueryLength] = queryJoin(queryCombinations(tag.reference, tagNameTF, 'OR', void (0), match), 'OR');
					} else {
						const match = tagNameTF.indexOf('$') !== -1 ? 'HAS' : 'IS';
						query[preQueryLength] = queryCombinations([tag.reference], tagNameTF, 'OR', void (0), match);
					}
				}
				if (bSearchDebug) { queryDebug[queryDebug.length - 1].query = query[preQueryLength]; }
			} else if (bNegativeWeighting && tag.weight * 2 / totalWeight >= totalWeight / countWeights / 100) {
				preQueryLength = query.length;
				const tagNameTF = type.includes('multiple') // May be a tag or a function...
					? tag.tf.map((t) => { return ((t.indexOf('$') === -1) ? t : _q(t)); })
					: ((tag.tf[0].indexOf('$') === -1) ? tag.tf[0] : _q(tag.tf[0]));
				if (type.includes('keyRange')) {
					const camelotKey = camelotWheel.getKeyNotationObjectCamelot(tag.reference);
					if (camelotKey) {
						let keyComb = [];
						const keysInRange = camelotWheel.createRange(camelotKey, tag.range * 2, { name: ['flat', 'sharp', 'open', 'camelot'], bFlat: false });
						keysInRange.forEach((keyArr) => {
							let subKeyComb = [];
							keyArr.forEach((keyVal) => {
								subKeyComb.push(tagNameTF + ' IS ' + keyVal);
							});
							keyComb.push(queryJoin(subKeyComb, 'OR'));
						});
						// And combine queries
						if (keyComb.length !== 0) { query[preQueryLength] = queryJoin(keyComb, 'OR'); }
					} else { query[preQueryLength] = tagNameTF + ' IS ' + tag.reference; } // For non-standard notations just use simple matching
				} else if (type.includes('percentRange')) {
					const rangeUpper = round(tag.reference * (100 + tag.range * 2) / 100, 0);
					const rangeLower = round(tag.reference * (100 - tag.range * 2) / 100, 0);
					if (rangeUpper !== rangeLower) { query[preQueryLength] = tagNameTF + ' GREATER ' + rangeLower + ' AND ' + tagNameTF + ' LESS ' + rangeUpper; }
					else { query[preQueryLength] += tagNameTF + ' EQUAL ' + tag.reference; }
				} else if (type.includes('absRange')) {
					const rangeUpper = Math.ceil(tag.reference + tag.range * 2);
					const rangeLower = Math.floor(tag.reference - tag.range * 2);
					if (rangeUpper !== rangeLower) { query[preQueryLength] = tagNameTF + ' GREATER ' + rangeLower + ' AND ' + tagNameTF + ' LESS ' + rangeUpper; }
					else { query[preQueryLength] += tagNameTF + ' EQUAL ' + tag.reference; }
				}
				if (bSearchDebug) { queryDebug[queryDebug.length - 1].query = query[preQueryLength]; }
			}
		}
	}
	// Dyngenre virtual tag is calculated with previous values
	if (calcTags.genreStyle.referenceNumber !== 0 && calcTags.dynGenre.weight !== 0) {
		for (const genreStyle in calcTags.genreStyle.referenceSet) {
			const dynGenre = sbd.genreStyleMap.get(genreStyle);
			if (dynGenre) { calcTags.dynGenre.reference.push(...dynGenre); }
		}
		calcTags.dynGenre.referenceNumber = calcTags.dynGenre.reference.length;
		if (calcTags.dynGenre.referenceNumber !== 0) {
			if (bSearchDebug) { console.log('dynGenre: ' + originalWeightValue + ' + ' + calcTags.dynGenre.weight); }
			originalWeightValue += calcTags.dynGenre.weight;
		}
	} else if (calcTags.dynGenre.weight !== 0) {
		if (bBasicLogging) { console.log('\'dynGenre\' weight was not zero but selected track had no style nor genre tags'); }
		calcTags.dynGenre.weight = 0;
	}
	// Artist Cultural tag requires world map data
	let worldMapData;
	if (calcTags.artistRegion.weight !== 0 || artistRegionFilter !== -1) {
		let iso;
		if (bUseTheme) { iso = (Object.hasOwn(theme.tags[0], 'iso') ? theme.tags[0].iso[0] : '') || ''; }
		else {
			const bSep = calcTags.artistRegion.tf.indexOf('$') === -1 && calcTags.artistRegion.tf.indexOf('%') === -1;
			const tagName = bSep
				? '[$meta_sep(' + calcTags.artistRegion.tf + ',|‎ |)'
				: _bt(calcTags.artistRegion.tf);
			// Exotic separators are preferred to ', ' since this tag may contain such char...
			const localeTag = fb.TitleFormat(tagName).EvalWithMetadb(sel)
				.split(bSep ? '|‎ |' : ', ').filter(Boolean).pop() || '';
			if (localeTag.length) { iso = getCountryISO(localeTag); }
			else {
				const artist = fb.TitleFormat(globTags.artist).EvalWithMetadb(sel);
				const { iso: artistIso, worldMapData: data } = getLocaleFromId(artist);
				if (artistIso.length) { iso = artistIso; }
				if (data) { worldMapData = data; }
			}
		}
		if (iso) {
			if (bSearchDebug) { console.log('artistRegion: ' + originalWeightValue + ' + ' + calcTags.artistRegion.weight); }
			calcTags.artistRegion.reference = _asciify(iso);
			originalWeightValue += calcTags.artistRegion.weight;
		} else {
			calcTags.artistRegion.reference = '';
			if (calcTags.artistRegion.weight !== 0) {
				if (bBasicLogging) {
					console.log('Weight was not zero but selected track had no artist region tags for: ' + _b(calcTags.artistRegion.tf));
				}
				calcTags.artistRegion.weight = 0;
			}
		}
	}
	// Genre Cultural tag is calculated with previous values
	if (calcTags.genreStyle.referenceNumber !== 0 && calcTags.genreStyleRegion.weight !== 0) {
		calcTags.genreStyleRegion.reference.push(...calcTags.genreStyle.referenceSet);
		calcTags.genreStyleRegion.referenceNumber = calcTags.genreStyleRegion.reference.length;
		if (calcTags.genreStyleRegion.referenceNumber !== 0) {
			if (bSearchDebug) { console.log('genreStyleRegion: ' + originalWeightValue + ' + ' + calcTags.genreStyleRegion.weight); }
			originalWeightValue += calcTags.genreStyleRegion.weight;
		} else {
			if (bBasicLogging) {
				console.log('Weight was not zero but selected track had no genre/style region tags for: ' + _b(calcTags.genreStyleRegion.tf));
			}
			calcTags.genreStyleRegion.weight = 0;
		}
	}
	// Already calculated previously
	['related', 'unrelated'].forEach((key) => {
		const tag = calcTags[key];
		if (tag.referenceNumber === 0 && tag.weight !== 0) {
			if (bBasicLogging) {
				console.log('Weight was not zero but selected track had no ' + key + ' tags for: ' + _b(calcTags[key].tf));
			}
			tag.weight = 0;
		}
		if (key === 'related' && tag.weight !== 0) {
			preQueryLength = query.length;
			query[preQueryLength] = queryJoin(
				queryCombinations([...tag.referenceSet], ['MUSICBRAINZ_TRACKID', 'ARTIST', 'TITLE'], 'OR')
				, 'OR'
			);
		}
	});
	// Total score
	const originalScore = (originalWeightValue * 100) / totalWeight; // if it has tags missing then original Distance != totalWeight
	if (bProfile) { test.Print('Task #1: Reference track / theme', false); }

	// Create final query
	// Pre filtering by query greatly speeds up the next part (weight and graph distance calcs), but it requires variable queries according to the weights.
	// i.e. if genreWeight is set too high, then only same genre tracks would pass the later score/distance filter...
	// But having the same values for other tags could make the track pass to the final pool too, specially for Graph method.
	// So a variable pre-filter would be needed, calculated according to the input weight values and -estimated- later filters scoring.
	// Also an input track missing some tags could break the pre-filter logic if not adjusted.
	preQueryLength = query.length;
	if (preQueryLength === 0) {
		if (!originalScore) {
			console.log('No query available for selected track. Probably missing tags!');
			return;
		} else { query[preQueryLength] = ''; } // Pre-Filter may not be relevant according to weights...
	}
	const queryLength = query.length;
	if (method === 'WEIGHT') { // Weight or Dyngenre method. Pre-filtering is really simple...
		if (queryLength === 1 && !query[0].length) { query[queryLength] = ''; }
		else { query[queryLength] = queryJoin(query, 'OR'); } //join previous queries
	} else { // Graph Method
		let influencesQuery = [];
		if (bUseAntiInfluencesFilter || bConditionAntiInfluences) { // Removes anti-influences using queries
			let influences = [];
			calcTags.genreStyle.referenceSet.forEach((genreStyle) => {
				let anti = bConditionAntiInfluences ? descr.getConditionalAntiInfluences(genreStyle) : descr.getAntiInfluences(genreStyle);
				if (anti.length) { influences.push(...descr.replaceWithSubstitutionsReverse(anti)); }
			});
			// Even if the argument is known to be a genre or style, the output values may be both, genre and styles.. so we use both for the query
			if (influences.length) {
				influences = [...new Set(influences)];
				const match = genreStyleTagQuery.some((tag) => { return tag.indexOf('$') !== -1; }) ? 'HAS' : 'IS'; // Allow partial matches when using funcs
				let temp = queryCombinations(influences, genreStyleTagQuery, 'OR', void (0), match); // min. array with 2 values or more if tags are remapped
				temp = 'NOT (' + queryJoin(temp, 'OR') + ')'; // flattens the array
				influencesQuery.push(temp);
			}
		}
		if (bUseInfluencesFilter) { // Outputs only influences using queries (and changes other settings!)
			let influences = [];
			calcTags.genreStyle.referenceSet.forEach((genreStyle) => {
				let sgInfluences = descr.getInfluences(genreStyle);
				if (sgInfluences.length) { influences.push(...descr.replaceWithSubstitutionsReverse(sgInfluences)); }
			});
			// Even if the argument is known to be a genre or style, the output values may be both, genre and styles.. so we use both for the query
			if (influences.length) {
				influences = [...new Set(influences)];
				const match = genreStyleTagQuery.some((tag) => { return tag.indexOf('$') !== -1; }) ? 'HAS' : 'IS'; // Allow partial matches when using funcs
				let temp = queryCombinations(influences, genreStyleTagQuery, 'OR', void (0), match); // min. array with 2 values or more if tags are remapped
				temp = _p(queryJoin(temp, 'OR')); // flattens the array. Here changes the 'not' part
				influencesQuery.push(temp);
			}
		}
		if (influencesQuery.length) {
			query[queryLength] = queryJoin(influencesQuery);
		} else if (queryLength === 1 && !query[0].length) { query[queryLength] = ''; }
		else { query[queryLength] = queryJoin(query, 'OR'); } //join previous query's
	}
	const queryStages = []; // Micro optimization of queries
	if (bSameArtistFilter && !bUseTheme) {
		// For standard artist tags, it's safer to use all, otherwise limit it to the user tag
		// Exotic separators are preferred to ', ' since this tag may contain such char...
		const tagName = ['ALBUM ARTIST', 'ARTIST'].includes(globTags.artistRaw.toUpperCase())
			? '[$meta_sep(ALBUM ARTIST,|‎ |)|‎ |$meta_sep(ARTIST,|‎ |)]'
			: '[$meta_sep(' + globTags.artistRaw + ',|‎ |)]';
		const tags = [...new Set(
			fb.TitleFormat(tagName)
				.EvalWithMetadb(sel).split('|‎ |').filter(Boolean)
		)];
		let queryArtist = '';
		if (tags.length) {
			queryArtist = tags.map((artist) => { return globTags.artist + ' IS ' + artist; });
			queryArtist = 'NOT ' + _p(queryJoin(queryArtist, 'OR'));
		}
		if (queryArtist.length) {
			if (query[queryLength].length) { query[queryLength] = queryJoin([query[queryLength], queryArtist]); }
			else { query[queryLength] += queryArtist; }
		}
	}
	if (bSimilArtistsFilter && !bUseTheme) {
		const file = folders.data + 'searchByDistance_artists.json';
		const tagName = '[$meta_sep(SIMILAR ARTISTS SEARCHBYDISTANCE,|‎ |)]';
		// Exotic separators are preferred to ', ' since this tag may contain such char...
		const similTags = [...new Set(
			fb.TitleFormat(tagName).EvalWithMetadb(sel).split('|‎ |').filter(Boolean)
		)];
		let querySimil = '';
		if (!similTags.length && _isFile(file)) {
			const data = getSimilarDataFromFile(file);
			const artist = fb.TitleFormat(globTags.artist).EvalWithMetadb(sel);
			if (data) {
				const dataArtist = data.find((obj) => { return obj.artist === artist; });
				if (dataArtist) { dataArtist.val.forEach((artistObj) => { similTags.push(artistObj.artist); }); }
			}
			if (!bSameArtistFilter) { similTags.push(artist); } // Always add the original artist as a valid value
		}
		if (similTags.length) {
			querySimil = similTags.map((artist) => { return globTags.artist + ' IS ' + artist; });
			querySimil = queryJoin(querySimil, 'OR');
		}
		if (querySimil.length) {
			if (query[queryLength].length) { query[queryLength] = queryJoin([query[queryLength], querySimil]); }
			else { query[queryLength] += querySimil; }
		}
	}
	if (artistRegionFilter !== -1) {
		let iso = calcTags.artistRegion.reference;
		if (iso.length) {
			const { query: queryRegion } = getZoneArtistFilter(iso, artistRegionFilter, worldMapData);
			const len = queryRegion.length;
			if (len) {
				if (len > 50000) { // Minor optimization for huge queries
					queryStages.push(queryRegion);
				} else if (query[queryLength].length) {
					query[queryLength] = queryJoin([query[queryLength], queryRegion]);
				} else { query[queryLength] += queryRegion; }
			}
		} else if (bBasicLogging) {
			console.log('Artist cultural filter was used but selected track had no locale tags');
		}
	}
	if (genreStyleRegionFilter !== -1) {
		if (calcTags.genreStyle.referenceNumber) {
			const styleGenreRegion = getZoneGraphFilter([...calcTags.genreStyle.referenceSet], genreStyleRegionFilter).map((sg) => sanitizeQueryVal(sg));
			if (styleGenreRegion.length) {
				const match = genreStyleTagQuery.some((tag) => { return tag.indexOf('$') !== -1; }) ? 'HAS' : 'IS'; // Allow partial matches when using funcs
				let queryRegion = queryCombinations(styleGenreRegion, genreStyleTagQuery, 'OR', void (0), match); // min. array with 2 values or more if tags are remapped
				queryRegion = queryJoin(queryRegion, 'OR'); // flattens the array
				const len = queryRegion.length;
				if (len) {
					if (len > 50000) { // Minor optimization for huge queries
						queryStages.push(queryRegion);
					} else if (query[queryLength].length) {
						query[queryLength] = queryJoin([query[queryLength], queryRegion]);
					} else { query[queryLength] += queryRegion; }
				}
			}
		}
	}
	if (nearGenresFilter !== -1) {
		const maxDistance = nearGenresFilter || (method === 'GRAPH'
			? graphDistance * 2
			: Math.max(
				music_graph_descriptors.cluster * 5 / 4,
				Math.round(music_graph_descriptors.intra_supergenre * 2 * weightDistribution('LOGISTIC', scoreFilter / 100, 5))
			)
		);
		const nearestGenres = getNearestGenreStyles([...calcTags.genreStyle.referenceSet], maxDistance, sbd.allMusicGraph);
		if (nearestGenres.length) {
			const match = genreStyleTagQuery.some((tag) => { return tag.indexOf('$') !== -1; }) ? 'HAS' : 'IS'; // Allow partial matches when using funcs
			let queryNearGenres = queryCombinations(nearestGenres, genreStyleTagQuery, 'OR', void (0), match); // min. array with 2 values or more if tags are remapped
			queryNearGenres = queryJoin(queryNearGenres, 'OR'); // flattens the array
			if (query[queryLength].length) { query[queryLength] = queryJoin([query[queryLength], queryNearGenres]); }
			else { query[queryLength] += queryNearGenres; }
		}
	}
	if (dynQueries.length) {
		const getRemap = (key) => {
			const remap = calcTags[key].tf;
			if (!remap.length && calcTags[key].weight === 0 && tags[key].tf.length) { remap.push(...tags[key].tf); }
			return remap;
		};
		const validTags = Object.keys(calcTags)
			.filter((tag) => !calcTags[tag].type.includes('virtual') || calcTags[tag].type.includes('tfRemap'));
		const regTag = new RegExp('([(% ]|^)(' + validTags.join('|') + ')([)% ])', 'gi');
		const regNot = new RegExp('NOT([(% ]|^)(' + validTags.join('|') + ')([)% ])', 'i');
		// Process every query on array and join
		let selQuery = dynQueries.map((dynQuery, i) => {
			if (!dynQuery || !dynQuery.length || dynQuery === 'ALL') { dynQuery = ''; }
			else {
				// Replace with tags set
				let key = '';
				if (new RegExp('\\b(' + validTags.join('|') + ')\\b', 'i').test(dynQuery)) {
					const match = dynQuery.match(new RegExp(regTag.source, 'i'))[2];
					if (match) {
						key = validTags.find((tag) => tag.toLowerCase() === match.toLowerCase());
						const expanded = getRemap(key).map((tag) => {
							return dynQuery.replace(regTag, function (match, g1, g2, g3) {
								return tag.indexOf('$') !== -1
									? (g1.replace('%', '') + _qCond(tag) + g3.replace('%', ''))
									: (g1 + tag + g3);
							}).replace(/(.*\()("\$)(.*)(\)"[),])/g, function (match, g1, g2, g3, g4) { // eslint-disable-line no-useless-escape
								return g1 + '$' + g3 + g4.replace(/"/g, '');
							});
						});
						dynQuery = queryJoin(expanded, regNot.test(dynQuery) ? 'AND' : 'OR');
					} else { dynQuery = ''; }
				}
				// Execute
				if (dynQuery) {
					if (bUseTheme) {
						const tag = key && Object.hasOwn(calcTags, key) ? { [key.toLowerCase()]: calcTags[key].reference } : {};
						dynQuery = queryReplaceWithCurrent(dynQuery, null, tag);
					} else { dynQuery = queryReplaceWithCurrent(dynQuery, sel); }
				} else { dynQuery = ''; }
			}
			// Check
			if (checkQuery(dynQuery)) { return dynQuery; }
			else {
				console.popup(
					'Non valid Dynamic query or wrong parsing:\n\n' + dynQueries[i] +
					'\n\nConverted to:\n\n' + dynQuery +
					(bUseTheme
						? '\n\n\nCheck the theme has the required tags:\n' + validTags.map((key) => '\t' + (key + ':').padEnd(20, ' ') + calcTags[key].reference).join('\n')
						: ''
					)
					, 'Search by distance'
				);
				return null;
			}
		}).filter(Boolean);
		selQuery = queryJoin(selQuery) || '';
		// Add to list
		const len = selQuery.length;
		if (len) {
			if (len > 50000) { // Minor optimization for huge queries
				queryStages.push(selQuery);
			} else if (query[queryLength].length) {
				query[queryLength] = queryJoin([query[queryLength], selQuery]);
			} else { query[queryLength] += selQuery; }
		}
	}
	if (forcedQuery.length) { //Add user input query to the previous one
		// Swap order to improve performance, since the forced query always short circuits the search
		if (query[queryLength].length) { query[queryLength] = queryJoin([forcedQuery, query[queryLength]]); }
		else { query[queryLength] += forcedQuery; }
	}
	if (!query[queryLength].length) { query[queryLength] = 'ALL'; }

	// Preload lib items
	const libraryItems = fb.GetLibraryItems();

	// Prefill tag Cache
	if (bTagsCache) {
		const missingOnCache = Object.values(calcTags).filter(t => !t.type.includes('virtual')).map(t => t.tf.filter(Boolean)).concat([['TITLE'], [globTags.title]])
			.map((tagName) => { return tagName.map((subTagName) => { return (subTagName.indexOf('$') === -1 ? '%' + subTagName + '%' : subTagName); }); })
			.map((tagName) => { return tagName.join(', '); }).filter(Boolean)
			.filter((tagName) => { return !tagsCache.cache.has(tagName); });
		if (missingOnCache.length) {
			console.log('Caching missing tags...');
			if (parent) { parent.switchAnimation('Tag cache', true); }
			await tagsCache.cacheTags(missingOnCache, 100, 50, libraryItems.Convert(), true);
			if (parent) { parent.switchAnimation('Tag cache', false); }
			tagsCache.save();
		}
	}

	// Load query
	if (bShowQuery) { console.log('Query created: ' + query[queryLength]); }
	let handleList = fb.GetQueryItemsCheck(libraryItems, query[queryLength]);
	const debugQuery = (queryItems, q) => {
		if (!queryItems) {
			fb.ShowPopupMessage(
				'Query not valid. Check query:\n\n' +
				q +
				(bSearchDebug
					? '\n\n' + JSON.stringify(queryDebug, (t, v) => (typeof v === 'undefined' ? 'undefined' : v), '\t')
					: ''
				)
			);
		}
	};
	debugQuery(handleList, query[queryLength]);
	if (queryStages.length) {
		queryStages.forEach((subQuery) => {
			if (bShowQuery) { console.log('Sub-Query created: ' + subQuery); }
			handleList = fb.GetQueryItemsCheck(handleList, subQuery);
			debugQuery(handleList, subQuery);
		});
	}
	if (bBasicLogging) { console.log('Items retrieved by query: ' + handleList.Count + ' tracks'); }
	if (bProfile) { test.Print('Task #2: Query', false); }
	// Find and remove duplicates ~600 ms for 50k tracks
	if (checkDuplicatesByTag && checkDuplicatesByTag.length) {
		const biasGenTags = genreStyleTag.concat([_t(globTags.folksonomy)]);
		if (sortBias) { // Replace hard-coded genre tags with new ones
			sortBias = sortBias.replace(globTags.genreStyle.map((t) => '%' + t + '%').join('\', \''), biasGenTags.join('\', \''));
		}
		if (bTagsCache) {
			handleList = await removeDuplicatesAsync({ handleList, sortOutput: '%TITLE% - ' + globTags.artist + ' - ' + globTags.date, bTagsCache, checkKeys: checkDuplicatesByTag, bAdvTitle, bMultiple });
		} else {
			handleList = removeDuplicates({ handleList, sortBias, sortOutput: '%TITLE% - ' + globTags.artist + ' - ' + globTags.date, checkKeys: checkDuplicatesByTag, bAdvTitle, bMultiple });
		}
	}
	const trackTotal = handleList.Count;
	if (bBasicLogging) { console.log('Items retrieved by query (minus duplicates): ' + trackTotal + ' tracks'); }
	if (!trackTotal) { console.log('Query created: ' + query[queryLength]); return; }
	// Compute similarity distance by Weight and/or Graph
	// Similar Artists, Similar Styles, Dynamic Genre, Date Range & Weighting
	let scoreData = [];

	if (method === 'GRAPH') { // Sort by the things we will look for at the graph! -> Cache speedup
		let tfo = fb.TitleFormat(genreStyleTag.join('|'));
		handleList.OrderByFormat(tfo, 1);
	}
	if (bProfile) { test.Print('Task #3: Remove Duplicates and sorting', false); }
	if (bSearchDebug) { console.log(JSON.stringify(calcTags, void (0), '\t')); }
	// Get the tag values for all the handle list. Skip those with weight 0.
	// Now flat is not needed, we have 1 array of tags per track [i][j]
	// Also filter using boolean to remove '' values within an array, so [''] becomes [] with 0 length, but it's done per track.
	// Using only boolean filter it's 3x faster than filtering by set, here bTagFilter becomes useful since we may skip +40K evaluations
	let tagsArr = [];
	let z = 0;
	for (let key in calcTags) {
		const tag = calcTags[key];
		if (tag.bVirtual) { continue; }
		if (tag.tf.length && (tag.weight !== 0 || tag.bGraphDyn || tag.bKeyMix)) {
			tagsArr.push(tag.tf);
		}
	}
	tagsArr.push(['TITLE']);
	if (calcTags.artistRegion.weight !== 0) {
		tagsArr.push([globTags.artist]);
		if (calcTags.artistRegion.tf.length) { tagsArr.push(calcTags.artistRegion.tf); }
	}
	if (['related', 'unrelated'].some((key) => calcTags[key].weight !== 0)) {
		tagsArr.push(['MUSICBRAINZ_TRACKID']);
	}
	tagsArr = tagsArr.map((arr) => { return arr.map((tag) => { return (tag.indexOf('$') === -1 && tag !== 'skip' ? _t(tag) : tag); }).join(', '); });
	if (bSearchDebug) { console.log(tagsArr); }
	const tagsValByKey = [];
	let tagsVal = [];
	if (bTagsCache) {
		tagsVal = tagsCache.getTags(tagsArr, handleList.Convert());
		tagsArr.forEach((tag, i) => { tagsValByKey[i] = tagsVal[tag]; });
	} else {
		tagsVal = getHandleListTags(handleList, tagsArr);
		tagsArr.forEach((tag, i) => { tagsValByKey[i] = tagsVal.map((tag) => { return tag[i]; }); });
	}
	for (let key in calcTags) {
		const tag = calcTags[key];
		if (bSearchDebug) {console.log('Tag:', key, tag.weight, '- index', z);}
		if (tag.bVirtual) { continue; }
		if (tag.tf.length && (tag.weight !== 0 || tag.bGraphDyn || tag.bKeyMix)) {
			tag.handle = tagsValByKey[z++];
		} else {
			tag.handle = null;
		}
	}
	if (bSearchDebug) {console.log('Tag:', 'title - index', z);}
	const titleHandle = tagsValByKey[z++];
	let artistHandle;
	if (calcTags.artistRegion.weight !== 0) {
		if (bSearchDebug) {console.log('Tag:', 'artist - index', z);}
		artistHandle = tagsValByKey[z++];
		calcTags.artistRegion.handle = calcTags.artistRegion.tf.length ? tagsValByKey[z++] : null;
	}
	if (['related', 'unrelated'].some((key) => calcTags[key].weight !== 0)) {
		if (bSearchDebug) {console.log('Tag:', 'related/unrelated - index', z);}
		calcTags.unrelated.handle = calcTags.related.handle = tagsValByKey[z++];
	}
	if (bProfile) { test.Print('Task #4: Library tags', false); }
	const sortTagKeys = Object.keys(calcTags).sort((a, b) => calcTags[b].weight - calcTags[a].weight); // Sort it by weight to break asap
	let i = 0;
	let weightValue, mapDistance, leftWeight, currScoreAvailable;
	let bRelated, bUnrelated;
	while (i < trackTotal) {
		weightValue = 0;
		mapDistance = Infinity; // We consider points are not linked by default
		// Get the tags according to weight and filter ''. Also create sets for comparison
		const handleTag = { genreStyle: { set: new Set(), number: 0 } };
		for (let key in calcTags) {
			const tag = calcTags[key];
			if (tag.bVirtual && !['related', 'unrelated'].includes(key)) { continue; }
			handleTag[key] = {};
			if (tag.tf.length && (tag.weight !== 0 || tag.bGraphDyn)) { // No need for bKeyMix, since is only used for sorting
				if (tag.bMultiple) {
					if (tag.bGraph && bTagFilter) {
						handleTag[key].val = tag.handle[i].filter((tag) => !genreStyleFilter.has(tag));
					} else {
						handleTag[key].val = tag.handle[i].filter(Boolean);
					}
				} else {
					handleTag[key].val = tag.bString ? tag.handle[i][0] : Number(tag.handle[i][0]);
				}
			} else {
				if (tag.bMultiple) { // NOSONAR [More clear this way...]
					handleTag[key].val = [];
				} else {
					handleTag[key].val = tag.bString ? '' : null;
				}
			}
			if (tag.bString) {
				const valLen = handleTag[key].val.length;
				if (tag.bMultiple) {
					if (valLen && bAscii) { handleTag[key].val.forEach((val, i) => { handleTag[key].val[i] = _asciify(val); }); }
					handleTag[key].set = new Set(handleTag[key].val);
					handleTag[key].number = handleTag[key].set.size;
				} else if (valLen && bAscii) { handleTag[key].val = _asciify(handleTag[key].val); }
				if (tag.bGraphDyn && valLen) {
					if (bFilterWithGraph) {
						handleTag[key].val.forEach((val) => {
							if (!graphExclusions.has(val) && descr.getNodeSet().has(val)) { handleTag.genreStyle.set.add(descr.getSubstitution(val)); }
						});
					} else {
						handleTag[key].val.forEach((val) => {
							if (!graphExclusions.has(val)) { handleTag.genreStyle.set.add(descr.getSubstitution(val)); }
						});
					}
				}
			}
		}
		handleTag.genreStyle.number = handleTag.genreStyle.set.size;

		// O(i*j*k) time
		// i = # tracks retrieved by query, j & K = # number of style/genre tags
		bRelated = bUnrelated = false;
		['related', 'unrelated'].forEach((key) => { // Adds an offset score as base
			const tag = calcTags[key];
			if (tag.weight === 0) { return; }
			const ids = handleTag[key].set.add(titleHandle[0]);
			if (artistHandle) { artistHandle[i].forEach((artist) => ids.add(artist)); }
			if (tag.referenceSet.intersectionSize(ids) !== 0) {
				weightValue += tag.weight;
				if (key === 'related') { bRelated = true; } else { bUnrelated = true; }
			}
		});

		leftWeight = totalWeight;
		currScoreAvailable = 100;
		for (let key of sortTagKeys) {
			const tag = calcTags[key];
			if (tag.weight === 0) { continue; }
			if (tag.bVirtual) { continue; }
			if (currScoreAvailable < minScoreFilter) { break; } // Break asap
			const scoringDistr = tag.scoringDistribution;
			if (tag.bMultiple) {
				const newTag = handleTag[key].number;
				if (tag.referenceNumber !== 0) {
					if (newTag !== 0) {
						const common = tag.referenceSet.intersectionSize(handleTag[key].set);
						if (common !== 0) {
							weightValue += scoringDistr === 'LINEAR' // Avoid memoizing last var if not needed
								? tag.weight * weightDistribution(scoringDistr, common / tag.referenceNumber)
								: tag.weight * weightDistribution(scoringDistr, common / tag.referenceNumber, tag.referenceNumber, newTag);
						}
					} else if (tag.baseScore !== 0) { // When compared track is missing this tag, add a base score
						weightValue += scoringDistr === 'LINEAR'
							? tag.weight * weightDistribution(scoringDistr, tag.baseScore / 100)
							: tag.weight * weightDistribution(scoringDistr, tag.baseScore / 100, tag.referenceNumber, tag.referenceNumber);
					}
				}
			} else if (tag.bSingle) {
				const newTag = handleTag[key].val;
				if (tag.bString) {
					if (tag.reference.length) {
						if (newTag.length) {
							if (newTag === tag.reference) {
								weightValue += tag.weight;
							} else if (tag.bKeyRange && tag.range !== 0) {
								const camelotKey = camelotWheel.getKeyNotationObjectCamelot(tag.reference);
								const camelotKeyNew = camelotWheel.getKeyNotationObjectCamelot(newTag);
								if (camelotKey && camelotKeyNew) {
									const bLetterEqual = (camelotKey.letter === camelotKeyNew.letter);
									const diff = Math.abs(camelotKey.hour - camelotKeyNew.hour);
									const hourDifference = tag.range - (diff > 6 ? 12 - diff : diff);
									// Cross on wheel with length keyRange + 1, can change hour or letter, but not both without a penalty
									if ((hourDifference < 0 && bNegativeWeighting) || hourDifference > 0) {
										const score = bLetterEqual ? ((hourDifference + 1) / (tag.range + 1)) : (hourDifference / tag.range); //becomes negative outside the allowed range!
										weightValue += scoringDistr === 'LINEAR' // Avoid memoizing last var if not needed
											? tag.weight * weightDistribution(scoringDistr, score)
											: tag.weight * weightDistribution(scoringDistr, score, tag.range, Math.abs(hourDifference));
									}
								}
							}
						} else if (tag.baseScore !== 0) {
							weightValue += scoringDistr === 'LINEAR'
								? tag.weight * weightDistribution(scoringDistr, tag.baseScore / 100)
								: tag.weight * weightDistribution(scoringDistr, tag.baseScore / 100, tag.range, tag.range);
						}
					}
				} else if (tag.bNumber) {
					if (tag.reference !== null) {
						if (newTag !== null) {
							if (newTag === tag.reference) {
								weightValue += tag.weight;
							} else if (tag.bPercentRange && tag.range !== 0) {
								const range = tag.reference * tag.range / 100;
								const difference = range - Math.abs(tag.reference - newTag); //becomes negative outside the allowed range!
								if ((difference < 0 && bNegativeWeighting) || difference > 0) {
									weightValue += scoringDistr === 'LINEAR' // Avoid memoizing last var if not needed
										? tag.weight * weightDistribution(scoringDistr, difference / tag.range / tag.reference * 100)
										: tag.weight * weightDistribution(scoringDistr, difference / tag.range / tag.reference * 100, range, Math.abs(difference));
								}
							} else if (tag.bAbsRange && tag.range !== 0) {
								const difference = tag.range - Math.abs(tag.reference - newTag); //becomes negative outside the allowed range!
								if ((difference < 0 && bNegativeWeighting) || difference > 0) {
									weightValue += scoringDistr === 'LINEAR' // Avoid memoizing last var if not needed
										? tag.weight * weightDistribution(scoringDistr, difference / tag.range)
										: tag.weight * weightDistribution(scoringDistr, difference / tag.range, tag.range, Math.abs(difference));
								}
							}
						} else if (tag.baseScore !== 0) {
							weightValue += scoringDistr === 'LINEAR'
								? tag.weight * weightDistribution(scoringDistr, tag.baseScore / 100)
								: tag.weight * weightDistribution(scoringDistr, tag.baseScore / 100, tag.range, tag.range);
						}
					}
				}
			}
			leftWeight -= tag.weight;
			currScoreAvailable = round((weightValue + leftWeight) * 100 / originalWeightValue, 1);
		}
		if (currScoreAvailable < minScoreFilter) { i++; continue; } // Break asap

		if (calcTags.dynGenre.weight !== 0 && calcTags.dynGenre.referenceNumber !== 0) {
			handleTag.dynGenre = { val: [], number: 0 };
			if (handleTag.genreStyle.number !== 0) {
				for (const genreStyle of handleTag.genreStyle.set) {
					const dynGenre = sbd.genreStyleMap.get(genreStyle);
					if (dynGenre) { handleTag.dynGenre.val.push(...dynGenre); }
				}
			}
			handleTag.dynGenre.number = handleTag.dynGenre.val.length;
			if (handleTag.dynGenre.number !== 0) {
				let j = 0;
				let score = 0;
				while (j < calcTags.dynGenre.referenceNumber) {
					let h = 0;
					while (h < handleTag.dynGenre.number) {
						const newVal = handleTag.dynGenre.val[h];
						const refVal = calcTags.dynGenre.reference[j];
						if (newVal === refVal) {
							score += 1 / calcTags.dynGenre.referenceNumber;
							break;
						} else if (calcTags.dynGenre.range !== 0) {
							const [valueLower, valueUpper, lowerLimit, upperLimit] = cyclicTagsDescriptor['dynamic_genre'](refVal, calcTags.dynGenre.range, true);
							if (valueLower !== -1) { //All or none are -1
								if (valueLower > refVal) { // we reached the limits and swapped values (x - y ... upperLimit + 1 = lowerLimit ... x ... x + y ... upperLimit)
									if (lowerLimit <= newVal && newVal <= valueLower) { // (lowerLimit , x)
										score += 1 / calcTags.dynGenre.referenceNumber;
										break;
									}
									else if (valueLower <= newVal && newVal <= refVal) { // NOSONAR [(x, x + y)]
										score += 1 / calcTags.dynGenre.referenceNumber;
										break;
									}
									else if (valueUpper <= newVal && newVal <= upperLimit) { // NOSONAR [(x - y, upperLimit)]
										score += 1 / calcTags.dynGenre.referenceNumber;
										break;
									}
								} else if (valueLower <= newVal && newVal <= valueUpper) {
									score += 1 / calcTags.dynGenre.referenceNumber;
									break;
								}
							}
						}
						h++;
					}
					j++;
				}
				const scoringDistr = calcTags.dynGenre.scoringDistribution;
				weightValue += scoringDistr === 'LINEAR' // Avoid memoizing last var if not needed
					? calcTags.dynGenre.weight * weightDistribution(scoringDistr, score)
					: calcTags.dynGenre.weight * weightDistribution(scoringDistr, score, calcTags.dynGenre.referenceNumber, handleTag.dynGenre.number);
			} else if (calcTags.dynGenre.baseScore !== 0) {
				weightValue += Math.min(calcTags.dynGenre.weight, calcTags.dynGenre.weight * calcTags.dynGenre.baseScore / 100);
			}
		}

		if (calcTags.artistRegion.weight !== 0 && calcTags.artistRegion.reference.length) {
			const tag = calcTags.artistRegion;
			const newTag = handleTag.artistRegion = { val: '' };
			const localeTag = tag.handle ? _asciify(tag.handle[i].pop() || '') : '';
			if (localeTag.length) { newTag.val = getCountryISO(localeTag) || ''; }
			else if (artistHandle) { newTag.val = getLocaleFromId(artistHandle[i][0], worldMapData).iso; }
			if (newTag.val.length) {
				const weight = tag.weight;
				const range = tag.range;
				if (newTag.val === tag.reference) {
					weightValue += weight;
				} else if (range !== 0) {
					const difference = range - music_graph_descriptors_countries.getDistance(tag.reference, newTag.val);
					if ((difference < 0 && bNegativeWeighting) || difference > 0) {
						const scoringDistr = tag.scoringDistribution;
						weightValue += scoringDistr === 'LINEAR' // Avoid memoizing last var if not needed
							? weight * weightDistribution(scoringDistr, difference / range)
							: weight * weightDistribution(scoringDistr, difference / range, range, Math.abs(difference));
					}
				}
			} else if (calcTags.artistRegion.baseScore !== 0) {
				weightValue += Math.min(calcTags.artistRegion.weight, calcTags.artistRegion.weight * calcTags.artistRegion.baseScore / 100);
			}
		}

		if (calcTags.genreStyleRegion.weight !== 0 && calcTags.genreStyleRegion.referenceNumber !== 0) {
			const tag = calcTags.genreStyleRegion;
			const newTag = handleTag.genreStyleRegion = { val: [], number: 0 };
			const weight = tag.weight;
			if (handleTag.genreStyle.number !== 0) {
				newTag.val.push(...handleTag.genreStyle.set);
			}
			newTag.number = newTag.val.length;
			if (newTag.number !== 0) {
				const range = tag.range;
				let j = 0;
				let score = 0;
				while (j < calcTags.genreStyleRegion.referenceNumber) {
					let h = 0;
					let distances = [];
					while (h < newTag.number) {
						const newVal = newTag.val[h];
						const refVal = calcTags.genreStyleRegion.reference[j];
						if (newVal === refVal) {
							distances.push(0);
							break;
						} else if (range !== 0) {
							distances.push(music_graph_descriptors_culture.getDistance(refVal, newVal));
						}
						h++;
					}
					if (distances.length) {
						const min = Math.min.apply(null, distances);
						if (min === 0) { score += 1 / calcTags.genreStyleRegion.referenceNumber; }
						else {
							const difference = range - min;
							if ((difference < 0 && bNegativeWeighting) || difference > 0) {
								score += difference / range / calcTags.genreStyleRegion.referenceNumber;
							}
						}
					}
					j++;
				}
				const scoringDistr = calcTags.genreStyleRegion.scoringDistribution;
				weightValue += scoringDistr === 'LINEAR' // Avoid memoizing last var if not needed
					? weight * weightDistribution(scoringDistr, score)
					: weight * weightDistribution(scoringDistr, score, calcTags.genreStyleRegion.referenceNumber, newTag.number);
			} else if (calcTags.genreStyleRegion.baseScore !== 0) {
				weightValue += Math.min(weight, weight * calcTags.genreStyleRegion.baseScore / 100);
			}
		}
		// The original track will get a 100 score, even if it has tags missing (original Distance != totalWeight)
		const score = Math.max(0, Math.min(round(weightValue * 100 / originalWeightValue, 1), 100));

		if (method === 'GRAPH') {
			// Create cache if it doesn't exist. It may happen when calling the function too fast on first init (this avoids a crash)!
			if (!cacheLink) { cacheLink = new Map(); }
			if (!cacheLinkSet) { cacheLinkSet = new Map(); }
			// Weight filtering excludes most of the tracks before other calcs -> Much Faster than later! (40k tracks can be reduced to just ~1k)
			if (score >= minScoreFilter) {
				if (calcTags.genreStyle.referenceNumber !== 0) {
					if (handleTag.genreStyle.number !== 0) {
						// Get the minimum distance of the entire set of tags (track B, i) to every style of the original track (A, j):
						// Worst case is O(i*j*k*lg(n)) time, greatly reduced by caching results (since tracks may be unique but not their tag values)
						// where n = # nodes on map, i = # tracks retrieved by query, j & K = # number of style/genre tags
						// Pre-filtering number of tracks is the best approach to reduce calc time (!)
						// Distance cached at 2 points, for individual links (Rock -> Jazz) and entire sets ([Rock, Alt. Rock, Indie] -> [Jazz, Swing])
						const fromDiff = calcTags.genreStyle.referenceSet.difference(handleTag.genreStyle.set);
						const toDiff = handleTag.genreStyle.set.difference(calcTags.genreStyle.referenceSet);
						const difference = fromDiff.size < toDiff.size ? fromDiff : toDiff;
						if (difference.size) {
							const toGenreStyle = fromDiff.size < toDiff.size ? handleTag.genreStyle.set : calcTags.genreStyle.referenceSet;
							const mapKey = [
								...[
									[...difference].sort((a, b) => a.localeCompare(b)).join(','),
									[...toGenreStyle].sort((a, b) => a.localeCompare(b)).join(','),
								].sort((a, b) => a.localeCompare(b))
							].join(' -> ');
							const mapValue = cacheLinkSet.get(mapKey); // Mean distance from entire set (A,B,C) to (X,Y,Z)
							if (typeof mapValue !== 'undefined') {
								mapDistance = mapValue;
							} else { // Calculate it if not found
								mapDistance = calcMeanDistance(sbd.allMusicGraph, calcTags.genreStyle.referenceSet, handleTag.genreStyle.set, sbd.influenceMethod);
								cacheLinkSet.set(mapKey, mapDistance); // Caches the mean distance from entire set (A,B,C) to (X,Y,Z)
							}
						} else { mapDistance = 0; } // One is superset of the other
					}
				} else { mapDistance = 0; } // Behaves like weight method
			}
		} // Distance / style_genre_new_length < graphDistance / style_genre_length ?
		if (method === 'GRAPH') {
			if (mapDistance <= graphDistance) {
				scoreData.push({ index: i, name: titleHandle[i][0], score, mapDistance, bRelated, bUnrelated });
			}
		}
		if (method === 'WEIGHT') {
			if (score >= minScoreFilter) {
				scoreData.push({ index: i, name: titleHandle[i][0], score, bRelated, bUnrelated });
			}
		}
		i++;
	}
	if (bProfile) { test.Print('Task #5: Score and Distance', false); }
	let poolLength = scoreData.length;
	if (method === 'WEIGHT') {
		scoreData.sort(function (a, b) { return b.score - a.score; });
		let i = 0;
		let bMin = false;
		while (i < poolLength) {
			const i_score = scoreData[i].score;
			if (i_score < scoreFilter) { //If below minimum score
				if (i >= playlistLength) { //Break when reaching required playlist length
					scoreData.length = i;
					break;
				} else if (i_score < minScoreFilter) { //Or after min score
					scoreData.length = i;
					bMin = true;
					break;
				}
			}
			i++;
		}
		poolLength = scoreData.length;
		if (bBasicLogging) {
			if (bMin && minScoreFilter !== scoreFilter) { console.log('Not enough tracks on pool with current score filter ' + scoreFilter + '%, using minimum score instead ' + minScoreFilter + '%.'); }
			console.log('Pool of tracks with similarity greater than ' + (bMin ? minScoreFilter : scoreFilter) + '%: ' + poolLength + ' tracks');
		}
	}
	else { // GRAPH
		// Done on 3 steps. Weight filtering (done) -> Graph distance filtering (done) -> Graph distance sort
		// Now we check if all tracks are needed (over 'minScoreFilter') or only those over 'scoreFilter'.
		scoreData.sort(function (a, b) { return b.score - a.score; });
		let i = 0;
		let bMin = false;
		while (i < poolLength) {
			const i_score = scoreData[i].score;
			if (i_score < scoreFilter) {	//If below minimum score
				if (i >= playlistLength) {	//Break when reaching required playlist length
					scoreData.length = i;
					break;
				} else if (i_score < minScoreFilter) { //Or after min score
					scoreData.length = i;
					bMin = true;
					break;
				}
			}
			i++;
		}
		scoreData.sort(function (a, b) { return a.mapDistance - b.mapDistance; }); // First sorted by graph distance, then by weight
		poolLength = scoreData.length;
		if (bMin && minScoreFilter !== scoreFilter) { console.log('Not enough tracks on pool with current score filter ' + scoreFilter + '%, using minimum score instead ' + minScoreFilter + '%.'); }
		if (bBasicLogging) { console.log('Pool of tracks with similarity greater than ' + (bMin ? minScoreFilter : scoreFilter) + '% and graph distance lower than ' + graphDistance + ': ' + poolLength + ' tracks'); }
	}

	// Post Filter (note there are no real duplicates at this point)
	if (bPoolFiltering) {
		let handlePoolArray = [];
		let i = poolLength;
		while (i--) { handlePoolArray.push(handleList[scoreData[i].index]); }
		let handlePool = new FbMetadbHandleList(handlePoolArray);
		handlePool = filterDuplicates({ handleList: handlePool, checkKeys: poolFilteringTag, nAllowed: poolFilteringN }); // n + 1
		/** * @type {[string[][]]} */
		const [titleHandlePool] = getHandleListTagsV2(handlePool, ['TITLE'], { splitBy: null });
		let filteredScoreData = [];
		i = 0;
		while (i < handlePool.Count) {
			let j = 0;
			while (j < poolLength) {
				if (titleHandlePool[i][0] === scoreData[j].name) {
					filteredScoreData[i] = scoreData[j]; // Copies references
				}
				j++;
			}
			i++;
		}
		scoreData = filteredScoreData; // Maintains only selected references...
		poolLength = scoreData.length;
		if (bBasicLogging) { console.log('Pool of tracks after post-filtering, ' + ++poolFilteringN + ' tracks per ' + poolFilteringTag.join(', ') + ': ' + poolLength + ' tracks'); }
	}

	// Final selection
	// In Key Mixing or standard methods.
	let selectedHandlesArray = []; // Final playlist output
	let selectedHandlesData = []; // For console
	let finalPlaylistLength = 0;
	if (poolLength) {
		if (bInKeyMixingPlaylist) {
			// DJ-like playlist creation with key changes following harmonic mixing rules... Uses 9 movements described at 'camelotWheel' on camelot_wheel_xxx.js
			// The entire pool is considered, instead of using the standard playlist selection. Since the pattern is random, it makes no sense
			// to use any specific order of pre-selection or override the playlist with later sorting.
			// Also note the movements creates a 'path' along the track keys, so even changing or skipping one movement changes drastically the path;
			// Therefore, the track selection changes on every execution. Specially if there are not tracks on the pool to match all required movements.
			// Those unmatched movements will get skipped (lowering the playlist length per step), but next movements are relative to the currently selected track...
			// so successive calls on a 'small' pool, will give totally different playlist lengths. We are not matching only keys, but a 'key path', which is stricter.
			if (bSortRandom) { console.log('Warning: Harmonic mixing is overriding Random Sorting.'); }
			if (bScatterInstrumentals) { console.log('Warning: Harmonic mixing is overriding Instrumental track\'s Scattering.'); }
			if (bProgressiveListOrder) { console.log('Warning: Harmonic mixing is overriding sort by score.'); }
			if (bSmartShuffle) { console.log('Warning: Harmonic mixing is overriding Smart Shuffle.'); }
			bSortRandom = bProgressiveListOrder = bScatterInstrumentals = bSmartShuffle = bInverseListOrder = false;
			if (calcTags.key.reference.length) {
				// Instead of predefining a mixing pattern, create one randomly each time, with predefined proportions
				const size = poolLength < playlistLength ? poolLength : playlistLength;
				const pattern = camelotWheel.createHarmonicMixingPattern(size); // On camelot_wheel_xxx.js
				if (bSearchDebug) { console.log(pattern); }
				let nextKeyObj;
				let keyCache = new Map();
				let keyDebug = [];
				let keySharpDebug = [];
				let patternDebug = [];
				let toCheck = new Set(Array(poolLength).fill().map((_, index) => index).shuffle());
				let nextIndexScore = 0;
				let nextIndex = scoreData[nextIndexScore].index; // Initial track, it will match most times the last reference track when using progressive playlists
				let camelotKeyCurrent, camelotKeyNew;
				for (let i = 0, j = 0; i < size - 1; i++) {
					// Search key
					const indexScore = nextIndexScore;
					const index = nextIndex;
					if (!keyCache.has(index)) {
						const keyCurrent = calcTags.key.handle[index][0];
						camelotKeyCurrent = keyCurrent.length ? camelotWheel.getKeyNotationObjectCamelot(keyCurrent) : null;
						if (camelotKeyCurrent) { keyCache.set(index, camelotKeyCurrent); }
					} else { camelotKeyCurrent = keyCache.get(index); }
					// Delete from check selection
					toCheck.delete(indexScore);
					if (!toCheck.size) { break; }
					// Find next key
					nextKeyObj = camelotKeyCurrent ? camelotWheel[pattern[i]]({ ...camelotKeyCurrent }) : null; // Applies movement to copy of current key
					if (nextKeyObj) { // Finds next track, but traverse pool with random indexes...
						let bFound = false;
						for (const indexNewScore of toCheck) {
							const indexNew = scoreData[indexNewScore].index;
							if (!keyCache.has(indexNew)) {
								const keyNew = calcTags.key.handle[indexNew][0];
								camelotKeyNew = keyNew.length ? camelotWheel.getKeyNotationObjectCamelot(keyNew) : null;
								if (camelotKeyNew) { keyCache.set(indexNew, camelotKeyNew); }
								else { toCheck.delete(indexNew); }
							} else { camelotKeyNew = keyCache.get(indexNew); }
							if (camelotKeyNew) {
								if (nextKeyObj.hour === camelotKeyNew.hour && nextKeyObj.letter === camelotKeyNew.letter) {
									selectedHandlesArray.push(handleList[index]);
									selectedHandlesData.push(scoreData[indexScore]);
									if (bSearchDebug) { keyDebug.push(camelotKeyCurrent); keySharpDebug.push(camelotWheel.getKeyNotationSharp(camelotKeyCurrent)); patternDebug.push(pattern[i]); }
									nextIndex = indexNew; // Which will be used for next movement
									nextIndexScore = indexNewScore; // Which will be used for next movement
									bFound = true;
									break;
								}
							}
						}
						if (!bFound) { // If nothing is found, then continue next movement with current track
							camelotKeyNew = camelotKeyCurrent; // For debug console on last item
							if (j === 1) { j = 0; continue; } // try once retrying this step with default movement
							else {
								pattern[i] = 'perfectMatch';
								i--; // NOSONAR [is intended]
								j++;
							}
						} else { j = 0; } // Reset retry counter if found
					} else { // No tag or bad tag
						i--; // NOSONAR [is intended]
						if (toCheck.size) { nextIndexScore = [...toCheck][0]; nextIndex = scoreData[nextIndexScore].index; } // If tag was not found, then use next handle
					}
				}
				// Add tail
				selectedHandlesArray.push(handleList[nextIndex]);
				selectedHandlesData.push(scoreData[nextIndexScore]);
				if (bSearchDebug) { keyDebug.push(camelotKeyNew); keySharpDebug.push(camelotWheel.getKeyNotationSharp(camelotKeyNew)); }
				// Double pass
				if (bHarmonicMixDoublePass && poolLength >= playlistLength) {
					let tempPlaylistLength = selectedHandlesArray.length;
					if (tempPlaylistLength < playlistLength) {
						const toAdd = {};
						const toAddData = {};
						const keyMap = new Map();
						// Find positions where the remainder tracks could be placed as long as they have the same key than other track
						for (let i = 0; i < poolLength; i++) {
							const currTrackData = scoreData[i];
							if (selectedHandlesData.indexOf(currTrackData) === -1) {
								const matchIdx = selectedHandlesData.findIndex((selTrackData, j) => {
									let idx = -1;
									if (keyMap.has(j)) { idx = keyMap.get(j); }
									else { idx = scoreData.indexOf(selTrackData); keyMap.set(j, idx); }
									const selKey = calcTags.key.handle[idx];
									return selKey[0] === calcTags.key.handle[i][0];
								});
								if (matchIdx !== -1) {
									const currTrack = handleList[currTrackData.index];
									if (Object.hasOwn(toAdd, matchIdx)) { toAdd[matchIdx].push(currTrack); toAddData[matchIdx].push(currTrackData); }
									else { toAdd[matchIdx] = [currTrack]; toAddData[matchIdx] = [currTrackData]; }
									tempPlaylistLength++;
								}
							}
							if (tempPlaylistLength >= playlistLength) { break; }
						}
						// Add items in reverse order to not recalculate new idx
						const indexes = Object.keys(toAdd).sort((a, b) => a.localeCompare(b)).reverse();
						if (indexes.length) {
							let count = 0;
							for (let idx of indexes) {
								selectedHandlesArray.splice(idx, 0, ...toAdd[idx]); // NOSONAR [is not an array]
								selectedHandlesData.splice(idx, 0, ...toAddData[idx]); // NOSONAR [is not an array]
								count += toAdd[idx].length;
							}
							if (bSearchDebug) { console.log('Added ' + count + ' items on second pass'); }
						}
					}
					// Debug console: using double pass reports may not be accurate since tracks on second pass are skipped on log
					if (bSearchDebug) {
						console.log('Keys from selection:');
						console.log(keyDebug); // DEBUG
						console.log(keySharpDebug); // DEBUG
						console.log('Pattern applied:');
						console.log(patternDebug); // Always has one item less than key arrays
					}
				}
			} else { console.log('Warning: Can not create in key mixing playlist, selected track has not a key tag.'); }
		} else { // Standard methods
			if (bInversePick) { scoreData.reverse(); } // Note this changes the most distant track output at the end
			if (poolLength > playlistLength) {
				if (bRandomPick) {	//Random from pool
					const numbers = Array(poolLength).fill().map((_, index) => index).shuffle();
					const randomSeed = numbers.slice(0, playlistLength); //random numbers from 0 to poolLength - 1
					let i = 0;
					while (i < playlistLength) {
						const i_random = randomSeed[i];
						selectedHandlesArray.push(handleList[scoreData[i_random].index]);
						selectedHandlesData.push(scoreData[i_random]);
						i++;
					}
				} else {
					if (probPick < 100) { // NOSONAR [Random but starting from high score picked tracks]
						let randomSeed = 0;
						let indexSelected = new Set(); //Save index and handles in parallel. Faster than comparing handles.
						let i = 0;
						while (indexSelected.size < playlistLength) {
							randomSeed = Math.floor((Math.random() * 100) + 1);
							if (randomSeed < probPick) {
								if (!indexSelected.has(scoreData[i].index)) { //No duplicate selection
									indexSelected.add(scoreData[i].index);
									selectedHandlesArray.push(handleList[scoreData[i].index]);
									selectedHandlesData.push(scoreData[i]);
								}
							}
							i++;
							if (i >= poolLength) { //Start selection from the beginning of pool
								i = 0;
							}
						}
					} else { //In order starting from high score picked tracks
						let i = 0;
						while (i < playlistLength) {
							selectedHandlesArray.push(handleList[scoreData[i].index]);
							selectedHandlesData.push(scoreData[i]);
							i++;
						}
					}
				}
			} else {	//Entire pool
				let i = 0;
				while (i < poolLength) {
					selectedHandlesArray[i] = handleList[scoreData[i].index];
					selectedHandlesData.push(scoreData[i]);
					i++;
				}
				if (isFinite(playlistLength)) {
					if (method === 'GRAPH') {
						if (bBasicLogging) {
							let propertyText = Object.hasOwn(properties, 'graphDistance') ? properties['graphDistance'][0] : SearchByDistance_properties['graphDistance'][0];
							console.log('Warning: Final Playlist selection length (= ' + i + ') lower/equal than ' + playlistLength + ' tracks. You may want to check \'' + propertyText + '\' parameter (= ' + graphDistance + ').');
						}
					}
					if (bBasicLogging) {
						let propertyText = Object.hasOwn(properties, 'scoreFilter') ? properties['scoreFilter'][0] : SearchByDistance_properties['scoreFilter'][0];
						console.log('Warning: Final Playlist selection length (= ' + i + ') lower/equal than ' + playlistLength + ' tracks. You may want to check \'' + propertyText + '\' parameter (= ' + scoreFilter + '%).');
					}
				}
			}
		}

		// Final sorting
		// This are final sorting-only steps, which may override previous one(s). But always outputs the same set of tracks.
		// Sorting is disabled when using bInKeyMixingPlaylist for harmonic mixed playlists, since they have its own order.
		// bProgressiveListCreation also changes sorting, since it has its own order after playlist creation/sorting!
		finalPlaylistLength = selectedHandlesArray.length;
		// Note that bRandomPick makes playlist randomly sorted too (but using different sets of tracks on every call)!
		if (bSortRandom) {
			for (let i = finalPlaylistLength - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[selectedHandlesArray[i], selectedHandlesArray[j]] = [selectedHandlesArray[j], selectedHandlesArray[i]];
				[selectedHandlesData[i], selectedHandlesData[j]] = [selectedHandlesData[j], selectedHandlesData[i]];
			}
		}
		// Forces progressive changes on tracks, independently of the previous sorting/picking methods
		// Meant to be used along bRandomPick or low probPick, otherwise the playlist is already sorted!
		if (bProgressiveListOrder && (poolLength < playlistLength || bRandomPick || probPick < 100)) { //
			if (bSortRandom) { console.log('Warning: Sorting by Score is overriding Random Sorting.'); }
			selectedHandlesData.sort(function (a, b) { return b.score - a.score; });
			selectedHandlesArray.sort(function (a, b) { return b.score - a.score; });
			if (method === 'GRAPH') { // First sorted by graph distance, then by score
				selectedHandlesData.sort(function (a, b) { return a.mapDistance - b.mapDistance; });
				selectedHandlesArray.sort(function (a, b) { return a.mapDistance - b.mapDistance; });
			}
		} else if (bProgressiveListOrder && !bRandomPick && probPick === 100) { console.log('Warning: Sorting by Score has no use if tracks are already chosen by scoring order from pool.'); }
		// Tries to intercalate vocal & instrumental tracks, breaking clusters of instrumental tracks.
		// May override previous sorting methods (only for instrumental tracks).
		// Finds instrumental track indexes, and move them to a random range without overlapping.
		if (bScatterInstrumentals) { // Could reuse scatterByTags but since we already have the tags... done here
			if (finalPlaylistLength > 2) { // Otherwise don't spend time with this...
				let newOrder = [];
				/** * @type {[string[][], string[][]]} */
				const [language, speechness] = getHandleListTagsV2(new FbMetadbHandleList(selectedHandlesArray), ['LANGUAGE', 'SPEECHNESS']);
				for (let i = 0; i < finalPlaylistLength; i++) {
					const index = selectedHandlesData[i].index;
					const genreStyleTag = Object.values(calcTags)
						.filter((t) => t.bGraph && !t.bVirtual && (t.weight !== 0 || calcTags.dynGenre.weight !== 0))
						.map((t) => t.handle[index].filter(Boolean)).flat(Infinity);
					const tagSet_i = new Set(genreStyleTag.map((item) => { return item.toLowerCase(); }));
					if (tagSet_i.has('instrumental') || language[i][0] === 'zxx' || Number(speechness[i][0]) === 0) { // Any match, then add to reorder list
						newOrder.push(i);
					}
				}
				// Reorder
				const toMoveTracks = newOrder.length;
				if (bSearchDebug) { console.log('toMoveTracks: ' + toMoveTracks); }
				const scatterInterval = toMoveTracks ? Math.round(finalPlaylistLength / toMoveTracks) : 0;
				if (scatterInterval >= 2) { // Lower value means we can not uniformly scatter instrumental tracks, better left it 'as is'
					let removed = [], removedData = [];
					[...newOrder].reverse().forEach((index) => {
						removed.push(...selectedHandlesArray.splice(index, 1));
						removedData.push(...selectedHandlesData.splice(index, 1));
					});
					removed.reverse();
					removedData.reverse();
					removed.forEach((handle, index) => {
						const i_scatterInterval = index * scatterInterval;
						let j = Math.floor(Math.random() * (scatterInterval - 1)) + i_scatterInterval;
						if (j === 0 && scatterInterval > 2) { j = 1; } // Don't put first track as instrumental if possible
						if (bSearchDebug) { console.log('bScatterInstrumentals: ' + index + '->' + j); }
						selectedHandlesArray.splice(j, 0, handle); // (at, 0, item)
						selectedHandlesData.splice(j, 0, removedData[index]); // (at, 0, item)
					});
				} else if (toMoveTracks) { console.log('Warning: Not possible to apply Instrumental track\'s Scattering. Interval is too low. (' + toMoveTracks + ' < 2)'); }
			}
		}
		// Spotify's smart shuffle by artist
		if (bSmartShuffle) { // Sort arrays in place using original data
			if (bSortRandom) { console.log('Warning: Smart Shuffle is overriding Random Sorting.'); }
			if (bScatterInstrumentals) { console.log('Warning: Smart Shuffle is overriding Instrumental track\'s Scattering.'); }
			if (finalPlaylistLength > 2) { // Otherwise don't spend time with this...
				const shuffle = shuffleByTags({
					tagName: smartShuffleTag,
					data: { handleArray: selectedHandlesArray, dataArray: selectedHandlesData, tagsArray: null },
					selItems: null,
					bSendToActivePls: false,
					bAdvancedShuffle: bSmartShuffleAdvc,
					sortBias: smartShuffleSortBias,
					bDebug: bSearchDebug
				});
				selectedHandlesArray = shuffle.handleArray;
				selectedHandlesData = shuffle.dataArray;
			}
		}
		// Progressive list creation, uses output tracks as new references, and so on...
		// Note it can be combined with 'bInKeyMixingPlaylist', creating progressive playlists with harmonic mixing for every sub-group of tracks
		if (bProgressiveListCreation) {
			if (progressiveListCreationN > 1 && progressiveListCreationN < 100) { // Safety limit
				const newPlaylistLength = Math.floor(playlistLength / (progressiveListCreationN + 1)); // First call also included N + 1!
				const firstPlaylistLength = newPlaylistLength + playlistLength % (progressiveListCreationN + 1); // Get most tracks from 1st call
				if (newPlaylistLength > 2) { // Makes no sense to create a list with groups of 1 or 2 tracks...
					if (finalPlaylistLength >= firstPlaylistLength) { // Don't continue if 1st playlist doesn't have required num of tracks
						selectedHandlesArray.length = firstPlaylistLength;
						// Use the track with less score from pool as new reference or the last track of the playlist when using 'In key mixing'
						let newSel = bInKeyMixingPlaylist ? selectedHandlesArray[firstPlaylistLength - 1] : handleList[scoreData[poolLength - 1].index];
						// Reuse arguments for successive calls and disable debug/logs and playlist creation
						let newArgs = {};
						for (const arg of arguments) { newArgs = { ...newArgs, ...arg }; }
						newArgs = { ...newArgs, bSearchDebug: false, bProfile: false, bShowQuery: false, bShowFinalSelection: false, bProgressiveListCreation: false, bRandomPick: true, bSortRandom: true, bProgressiveListOrder: false, sel: newSel, bCreatePlaylist: false };
						// Get #n tracks per call and reuse lower scoring track as new selection
						let newSelectedHandlesArray;
						for (let i = 0; i < progressiveListCreationN; i++) {
							const prevLength = selectedHandlesArray.length;
							if (bSearchDebug) { console.log('selectedHandlesArray.length: ' + prevLength); }
							[newSelectedHandlesArray, , , newArgs['sel']] = await searchByDistance(newArgs);
							// Get all new tracks, remove duplicates after merging with previous tracks and only then cut to required length
							selectedHandlesArray = removeDuplicates({
								handleList: new FbMetadbHandleList(selectedHandlesArray.concat(newSelectedHandlesArray)),
								checkKeys: checkDuplicatesByTag,
								bAdvTitle,
								bMultiple
							}).Convert();
							if (selectedHandlesArray.length > prevLength + newPlaylistLength) { selectedHandlesArray.length = prevLength + newPlaylistLength; }
						}
					} else { console.log('Warning: Can not create a Progressive List. First Playlist selection contains less than the required number of tracks.'); }
				} else { console.log('Warning: Can not create a Progressive List. Current finalPlaylistLength (' + finalPlaylistLength + ') and progressiveListCreationN (' + progressiveListCreationN + ') values would create a playlist with track groups size (' + newPlaylistLength + ') lower than the minimum 3.'); }
			} else { console.popup('Warning: Can not create a Progressive List. progressiveListCreationN (' + progressiveListCreationN + ') must be greater than 1 (and less than 100 for safety).', 'Search by distance'); }
		}
		// Invert any previous algorithm
		if (bInverseListOrder) {
			selectedHandlesArray.reverse();
			selectedHandlesData.reverse();
		}
		// Logging
		if (bProfile) { test.Print('Task #6: Final Selection', false); }
		if (bShowFinalSelection && !bProgressiveListCreation) {
			let i = finalPlaylistLength;
			let conText = 'List of selected tracks:';
			const bNoGraph = calcTags.genreStyle.referenceNumber === 0 && method === 'GRAPH';
			while (i--) {
				conText += '\n                  ' + selectedHandlesData[i].name +
					' - ' + selectedHandlesData[i].score + '/100 Simil.' +
					(typeof selectedHandlesData[i].mapDistance !== 'undefined' ? ' - ' + selectedHandlesData[i].mapDistance + ' Graph' : '') +
					(bNoGraph ? ' [no genre/style tag]' : '') +
					(selectedHandlesData[i].bRelated ? ' [related]' : '') +
					(selectedHandlesData[i].bUnrelated ? ' [unrelated]' : '');
			}
			console.log(conText); // Much faster to output the entire list at once than calling log n times. It takes more than 2 secs with +50 Tracks!!
		}
	} else {
		if (bProfile) { test.Print('Task #6: Final Selection', false); }
		if (bBasicLogging) {
			let propertyText = '';
			if (method === 'GRAPH') {
				propertyText = Object.hasOwn(properties, 'graphDistance') ? properties['graphDistance'][0] : SearchByDistance_properties['graphDistance'][0];
				console.log('Warning: Final Playlist selection length (= ' + finalPlaylistLength + ') lower/equal than ' + playlistLength + ' tracks. You may want to check \'' + propertyText + '\' parameter (= ' + graphDistance + ').');
			}
			propertyText = Object.hasOwn(properties, 'scoreFilter') ? properties['scoreFilter'][0] : SearchByDistance_properties['scoreFilter'][0];
			console.log('Warning: Final Playlist selection length (= ' + finalPlaylistLength + ') lower/equal than ' + playlistLength + ' tracks. You may want to check \'' + propertyText + '\' parameter (= ' + scoreFilter + '%).');
		}
	}
	// Insert to playlist
	if (bCreatePlaylist) {
		// Look if target playlist already exists and clear it. Preferred to removing it, since then we can undo later...
		let playlistNameEval;
		const bIsTF = /(%.*%)|(\$.*\(.*\))/.test(playlistName);
		if (bUseTheme) {
			const themeRegexp = /%SBD_THEME%/gi;
			if (bIsTF && themeRegexp.test(playlistName)) {
				playlistNameEval = fb.TitleFormat(playlistName.replace(themeRegexp, '$puts(x,' + theme.name + ')$get(x)')).Eval(true); // Hack to evaluate strings as true on conditional expressions
			} else {
				playlistNameEval = playlistName;
			}
		} else {
			playlistNameEval = bIsTF ? fb.TitleFormat(playlistName).EvalWithMetadb(sel) : playlistName;
		}
		let i = 0;
		const plc = plman.PlaylistCount;
		while (i < plc) {
			if (plman.GetPlaylistName(i) === playlistNameEval) {
				plman.ActivePlaylist = i;
				plman.UndoBackup(i);
				plman.ClearPlaylist(i);
				break;
			}
			i++;
		}
		if (i === plc) { //if no playlist was found before
			plman.CreatePlaylist(plc, playlistNameEval);
			plman.ActivePlaylist = plc;
		}
		const outputHandleList = new FbMetadbHandleList(selectedHandlesArray);
		plman.InsertPlaylistItems(plman.ActivePlaylist, 0, outputHandleList);
		if (bBasicLogging) { console.log('Final Playlist selection length: ' + finalPlaylistLength + ' tracks.'); }
	} else if (bBasicLogging) { console.log('Final selection length: ' + finalPlaylistLength + ' tracks.'); }
	// Store options
	sbd.lastSearch.handle = sel;
	sbd.lastSearch.options = {
		theme, recipe, bAscii, bTagsCache, bAdvTitle, bMultiple, checkDuplicatesByTag, sortBias, tags, bNegativeWeighting, bFilterWithGraph, forcedQuery, dynQueries, bSameArtistFilter, bSimilArtistsFilter, bConditionAntiInfluences, bUseAntiInfluencesFilter, bUseInfluencesFilter, artistRegionFilter, genreStyleRegionFilter, method, scoreFilter, minScoreFilter, graphDistance, poolFilteringTag, poolFilteringN, bPoolFiltering, bRandomPick, bInversePick, probPick, playlistLength, bSortRandom, bProgressiveListOrder, bInverseListOrder, bScatterInstrumentals, bSmartShuffle, bSmartShuffleAdvc, smartShuffleSortBias, bInKeyMixingPlaylist, bHarmonicMixDoublePass, bProgressiveListCreation, progressiveListCreationN, bProfile, bShowQuery, bShowFinalSelection, bBasicLogging, bSearchDebug, playlistName, bCreatePlaylist
	};
	// Share changes on cache (checks undefined to ensure no crash if it gets run on the first 3 seconds after loading a panel)
	if (typeof cacheLink !== 'undefined' && oldCacheLinkSize !== cacheLink.size && method === 'GRAPH') { window.NotifyOthers('Search by Distance: cacheLink map', cacheLink); }
	if (typeof cacheLinkSet !== 'undefined' && oldCacheLinkSetSize !== cacheLinkSet.size && method === 'GRAPH') { window.NotifyOthers('Search by Distance: cacheLinkSet map', cacheLinkSet); }
	// Output handle list (as array), the score data, current selection (reference track) and more distant track
	return [selectedHandlesArray, selectedHandlesData, sel, (poolLength ? handleList[scoreData[poolLength - 1].index] : -1)];
}

/*
	Helpers
*/

function parseGraphDistance(graphDistance, descr = music_graph_descriptors, bBasicLogging = true) {
	let output = graphDistance;
	if (isString(output)) { // Safety check
		if (!Number.isNaN(Number(output))) {
			output = Number(output);
			if (output.toString() !== graphDistance) {
				fb.ShowPopupMessage('Error parsing graphDistance (not a valid number): ' + output, 'Search by Distance');
				return null;
			}
		} else {
			if (output.length >= 50) {
				fb.ShowPopupMessage('Error parsing graphDistance (length >= 50): ' + output, 'Search by Distance');
				return null;
			}
			if (output.indexOf('music_graph_descriptors') === -1 || output.indexOf('()') !== -1 || output.indexOf(',') !== -1) {
				fb.ShowPopupMessage('Error parsing graphDistance (is not a valid variable or using a func): ' + output, 'Search by Distance');
				return null;
			}
			const validVars = Object.keys(descr).map((key) => { return 'music_graph_descriptors.' + key; });
			if (output.indexOf('+') === -1 && output.indexOf('-') === -1 && output.indexOf('*') === -1 && output.indexOf('/') === -1 && validVars.indexOf(output) === -1) {
				fb.ShowPopupMessage('Error parsing graphDistance (using no arithmetic or variable): ' + output, 'Search by Distance');
				return null;
			}
			output = eval(output);
			if (Number.isNaN(output)) { fb.ShowPopupMessage('Error parsing graphDistance (not a valid number): ' + output, 'Search by Distance'); }
		}
		if (bBasicLogging) { console.log('Parsed graphDistance to: ' + output); }
	}
	if (Number.isFinite(output)) { output = Math.round(output); }
	if (output < 0) {
		fb.ShowPopupMessage('Error parsing graphDistance (< 0): ' + output, 'Search by Distance');
		return null;
	}
	return output;
}

function findStyleGenresMissingGraphCheck(properties) {
	const answer = WshShell.Popup('It\'s recommended to check your current Library tags against the Graph to look for missing genres/styles not on Graph.\nDo you want to do it now? (can be done afterwards at debug menu).', 0, 'Search by distance', popup.question + popup.yes_no);
	if (answer === popup.yes) {
		const tags = JSON.parse(properties.tags[1]); // At least tags must be provided, genreStyleFilter and bAscii are optional
		findStyleGenresMissingGraph({
			genreStyleFilter: Object.hasOwn(properties, 'genreStyleFilterTag') ? JSON.parse(properties.genreStyleFilterTag[1]).filter(Boolean) : [],
			genreStyleTag: Object.values(tags).filter((t) => t.type.includes('graph') && !t.type.includes('virtual')).map((t) => t.tf).flat(Infinity),
			bAscii: Object.hasOwn(properties, 'bAscii') ? properties.bAscii[1] : true,
			bPopup: true
		});
	}
}

function checkMethod(method) {
	return (new Set(['WEIGHT', 'GRAPH', 'DYNGENRE']).has(method));
}

function checkScoringDistribution(distr) {
	return (new Set(['LINEAR', 'LOGARITHMIC', 'LOGISTIC', 'NORMAL']).has(distr));
}

// Save and load cache on json
// Save without formatting to make it smaller (~ 1 MB less) and faster (~ 50 ms less) for 100K entries
function saveCache(cacheMap, path) {
	_save(path, JSON.stringify(Object.fromEntries(cacheMap)));
}

function loadCache(path) {
	let cacheMap;
	if (_isFile(path)) {
		if (utils.GetFileSize(path) > 400000000) { console.log('Search by Distance: cache link file size exceeds 40 Mb, file is probably corrupted (try resetting it): ' + path); }
		let obj = _jsonParseFileCheck(path, 'Cache Link json', 'Search by Distance', utf8);
		if (obj) {
			obj = Object.entries(obj);
			obj.forEach((pair) => { // There are 2 possible cache structures
				if (pair[1] === null) { pair[1] = Infinity; }
				else if (pair[1][0] === null) { pair[1][0] = Infinity; }
			}); // stringify converts Infinity to null, this reverts the change
			cacheMap = new Map(obj);
		}
	}
	return (cacheMap || new Map());
}

// Process nested recipes
function processRecipe(initialRecipe) {
	let toAdd = {};
	const processRecipeFile = (newRecipe) => {
		const newPath = _isFile(newRecipe)
			? newRecipe
			: _isFile(recipePath + newRecipe)
				? recipePath + newRecipe
				: null;
		const newRecipeObj = newPath ? _jsonParseFileCheck(newPath, 'Recipe json', 'Search by Distance', utf8) : null;
		if (!newRecipeObj) { console.log('Recipe not found: ' + newPath); }
		else if (Object.hasOwn(newRecipeObj, 'tags') && Object.hasOwn(toAdd, 'tags')) {
			const tags = deepMergeTags(newRecipeObj.tags, toAdd.tags);
			toAdd = { ...newRecipeObj, ...toAdd, tags };
		} else { toAdd = { ...newRecipeObj, ...toAdd }; }
		return newRecipeObj;
	};
	const deepMergeTags = (newTags, toAddTags) => {
		const tags = { ...newTags };
		for (let key in toAddTags) {
			if (!Object.hasOwn(tags, key)) {
				tags[key] = toAddTags[key];
			} else {
				for (let subKey in toAddTags[key]) {
					if (!Object.hasOwn(tags[key], subKey)) {
						tags[key][subKey] = toAddTags[key][subKey];
					}
				}
			}
		}
		return tags;
	};
	let newRecipe = initialRecipe;
	while (newRecipe.length) {
		if (isString(newRecipe)) {
			const newRecipeObj = processRecipeFile(newRecipe);
			if (!newRecipeObj) { break; }
			newRecipe = newRecipeObj.recipe || '';
		} else if (isArrayStrings(newRecipe)) {
			for (const subRecipe of newRecipe) {
				const newRecipeObj = processRecipeFile(subRecipe);
				if (!newRecipeObj) { newRecipe = ''; break; }
				newRecipe = newRecipeObj.recipe || '';
				if (newRecipe.length) {
					const procRecipe = processRecipe(newRecipe);
					if (Object.hasOwn(procRecipe, 'tags') && Object.hasOwn(toAdd, 'tags')) {
						const tags = deepMergeTags(newRecipeObj.tags, toAdd.tags);
						toAdd = { ...procRecipe, ...toAdd, tags };
					} else { toAdd = { ...procRecipe, ...toAdd }; }
				}
			}
		} else {
			console.log('Recipe not found: ' + newRecipe);
			break;
		}
	}
	return toAdd;
}

/**
 * Description
 *
 * @function
 * @name weightDistribution
 * @kind Function
 * @param {'LINEAR'|'LOGARITHMIC'|'LOGISTIC'|'NORMAL'} scoringDistribution
 * @param {number} proportion - Input score (linear)
 * @param {number} tagNumber - [=0] Number of tags from reference (to shape distribution)
 * @param {number} newTagNumber - [=0] Number of tags from target (to shape distribution)
 * @returns {number}
 */
const weightDistribution = memoize((/** @type {'LINEAR'|'LOGARITHMIC'|'LOGISTIC'|'NORMAL'} */ scoringDistribution, proportion /* Should never be zero! */, tagNumber = 0, newTagNumber = 0) => {
	if (proportion < 0) {
		return - weightDistribution(scoringDistribution, - proportion, tagNumber, newTagNumber);
	}
	let proportionWeight = 1;
	if (scoringDistribution === 'LINEAR' || proportion === 1 || proportion === 0) {
		proportionWeight = proportion;
	} else if (scoringDistribution === 'LOGARITHMIC') {
		const alpha = 2 - Math.abs(tagNumber - newTagNumber) / Math.max(tagNumber, newTagNumber);
		proportionWeight = ((1 + Math.log(proportion) * 0.5) + ((1 - proportion) * 0.5) ** (Math.exp(proportion) * alpha));
	} else if (scoringDistribution === 'LOGISTIC') {
		const alpha = 2 + Math.abs(tagNumber - newTagNumber);
		proportionWeight = Math.max(1 - 2 / (Math.exp(alpha * proportion) + 1), Math.min(Math.log(1 + proportion * 1.8), 1));
	} else if (scoringDistribution === 'NORMAL') {
		const sigma = 0.3 * (1 + Math.abs(tagNumber - newTagNumber)) / Math.max(tagNumber, newTagNumber);
		const mu = 0.4;
		proportionWeight = proportion > mu
			? zScoreToCDF((proportion - mu) / sigma)
			: 0;
	}
	return proportionWeight;
});