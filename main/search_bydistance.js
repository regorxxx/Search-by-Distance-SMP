'use strict';
//05/10/22

/*	
	Search by Distance
	-----------------------------------
	Creates a playlist with similar tracks to the currently selected one according
	to genre, style, key, etc. Every library track is given a score using its tags
	and/or a graph distance with their genre/style.
	
	When their score is over 'scoreFilter', then they are included in the final pool.
	After all tracks have been evaluated and the final pool is complete, some of 
	them are chosen to populate 	the playlist. You can choose whether this final
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

include('..\\helpers-external\\ngraph\\a-star.js');
include('..\\helpers-external\\ngraph\\a-greedy-star.js');
include('..\\helpers-external\\ngraph\\NBA.js');
include('..\\helpers\\ngraph_helpers_xxx.js');
var bLoadTags = true; // This tells the helper to load tags descriptors extra files
include('..\\helpers\\helpers_xxx.js');
include('..\\helpers\\helpers_xxx_crc.js');
include('..\\helpers\\helpers_xxx_prototypes.js');
include('..\\helpers\\helpers_xxx_properties.js');
include('..\\helpers\\helpers_xxx_tags.js');
if (isCompatible('2.0', 'fb')) {include('..\\helpers\\helpers_xxx_tags_cache.js');}
include('..\\helpers\\helpers_xxx_math.js');
include('..\\helpers\\camelot_wheel_xxx.js');
include('..\\helpers\\dyngenre_map_xxx.js');
include('..\\helpers\\music_graph_xxx.js');
include('..\\helpers\\music_graph_test_xxx.js');
include('remove_duplicates.js');
include('..\\helpers\\callbacks_xxx.js');

checkCompatible('1.6.1', 'smp');

/* 
	Properties
*/
const SearchByDistance_properties = {
	genreWeight				: 	['Genre Weight for final scoring', 15],
	styleWeight				:	['Style Weight for final scoring', 15],
	dyngenreWeight			:	['Dynamic Genre Weight for final scoring (only with DYNGENRE method)', 40],
	dyngenreRange			:	['Dynamic Genre Range (only tracks within range will score)', 1],
	moodWeight				:	['Mood Weight for final scoring', 10],
	keyWeight				:	['Key Weight for final scoring', 5],
	keyRange				:	['Key Range (uses Camelot Wheel \'12 hours\' scale)', 1],
	dateWeight				:	['Date Weight for final scoring', 10],
	dateRange				:	['Date Range (only tracks within range will score positively)', 15],
	bpmWeight				:	['BPM Weight for final scoring', 5],
	bpmRange				:	['BPM Range in % (for considering BPM Weight)', 25],
	composerWeight			:	['Composer Weight for final scoring', 0],
	customStrWeight			:	['CustomStr Weight for final scoring', 0],
	customNumWeight			:	['CustomNum Weight for final scoring', 0],
	customNumRange			:	['CustomNum Range for final scoring', 0],
	genreTag				:	['To remap genre tag to other tag(s) change this (sep. by comma)', 'GENRE'],
	styleTag				:	['To remap style tag to other tag(s) change this (sep. by comma)', 'STYLE'],
	moodTag					:	['To remap mood tag to other tag(s) change this (sep. by comma)', 'MOOD'],
	dateTag					:	['To remap date tag or TF expression change this (1 numeric value / track)', globTags.date],
	keyTag					:	['To remap key tag to other tag change this', 'KEY'],
	bpmTag					:	['To remap bpm tag to other tag change this (sep. by comma)', 'BPM'],
	composerTag				:	['To remap composer tag to other tag(s) change this (sep. by comma)', 'COMPOSER'],
	customStrTag			:	['To use a custom string tag(s) change this (sep.by comma)', ''],
	customNumTag			:	['To use a custom numeric tag or TF expression change this (1 numeric value / track)', ''],
	forcedQuery				:	['Forced query to pre-filter database (added to any other internal query)', globQuery.filter],
	bSameArtistFilter		:	['Exclude tracks by same artist', false],
	bUseAntiInfluencesFilter:	['Exclude anti-influences by query', false],
	bConditionAntiInfluences:	['Conditional anti-influences filter', false],
	bUseInfluencesFilter	:	['Allow only influences by query', false],
	bSimilArtistsFilter		:	['Allow only similar artists', false],
	genreStyleFilter		:	['Filter these values globally for genre/style (sep. by comma)', 'Children\'s Music', {func: isStringWeak}, 'Children\'s Music'],
	scoreFilter				:	['Exclude any track with similarity lower than (in %)', 75, {range: [[0,100]], func: isInt}, 75],
	minScoreFilter			:	['Minimum in case there are not enough tracks (in %)', 70, {range: [[0,100]], func: isInt}, 70],
	sbd_max_graph_distance	:	['Exclude any track with graph distance greater than (only GRAPH method):', 'music_graph_descriptors.intra_supergenre', {func: (x) => {return (isString(x) && music_graph_descriptors.hasOwnProperty(x.split('.').pop())) || isInt(x);}}, 'music_graph_descriptors.intra_supergenre'],
	method					:	['Method to use (\'GRAPH\', \'DYNGENRE\' or \'WEIGHT\')', 'WEIGHT', {func: checkMethod}, 'WEIGHT'],
	bNegativeWeighting		:	['Assign negative score when tags fall outside their range', true],
	poolFilteringTag		:	['Filter pool by tag', 'artist'],
	poolFilteringN			:	['Allows only N + 1 tracks on the pool (-1 = disabled)', -1, {greaterEq: -1, func: isInt}, -1],
	bRandomPick				:	['Take randomly from pool? (not sorted by weighting)', true],
	probPick				:	['Probability of tracks being choosen for final mix (makes playlist a bit random!)', 100, {range: [[1,100]], func: isInt}, 100],
	playlistLength			:	['Max Playlist Mix length', 50],
	bSortRandom				:	['Sort final playlist randomly', true],
	bProgressiveListOrder	:	['Sort final playlist by score', false],
	bScatterInstrumentals	:	['Intercalate instrumental tracks', true],
	bInKeyMixingPlaylist	:	['DJ-like playlist creation, following harmonic mixing rules', false],
	bHarmonicMixDoublePass	:	['Harmonic mixing double pass to match more tracks', true],
	bProgressiveListCreation:	['Recursive playlist creation, uses output as new references', false],
	progressiveListCreationN:	['Steps when using recursive playlist creation (>1 and <100)', 4, {range: [[2,99]], func: isInt}, 4],
	playlistName			:	['Playlist name (TF allowed)', 'Search...'],
	bAscii					:	['Asciify string values internally?', true],
	bTagsCache				:	['Read tags from cache instead of files?', isCompatible('2.0', 'fb')]
};
// Checks
Object.keys(SearchByDistance_properties).forEach( (key) => { // Checks
	if (key.toLowerCase().endsWith('weight')) {
		SearchByDistance_properties[key].push({greaterEq: 0, func: Number.isSafeInteger}, SearchByDistance_properties[key][1]);
	} else if (key.toLowerCase().endsWith('range')) {
		SearchByDistance_properties[key].push({greaterEq: 0, func: Number.isSafeInteger}, SearchByDistance_properties[key][1]);
	} else if (key.toLowerCase().endsWith('length')) {
		SearchByDistance_properties[key].push({greaterEq: 0, func: Number.isSafeInteger}, SearchByDistance_properties[key][1]);
	} else if (key.toLowerCase().endsWith('query')) {
		SearchByDistance_properties[key].push({func: (query) => {return checkQuery(query, true);}}, SearchByDistance_properties[key][1]);
	} else if (key.toLowerCase().endsWith('tag')) {
		SearchByDistance_properties[key].push({func: isStringWeak}, SearchByDistance_properties[key][1]);
	} else if (regExBool.test(key)) {
		SearchByDistance_properties[key].push({func: isBoolean}, SearchByDistance_properties[key][1]);
	}
});

const SearchByDistance_panelProperties = {
	bCacheOnStartup 		:	['Calculates link cache on script startup (instead of on demand)', true],
	bGraphDebug 			:	['Warnings about links/nodes set wrong', false],
	bSearchDebug			:	['Enables debugging console logs', false],
	bProfile 				:	['Enables profiling console logs', false],
	bShowQuery 				:	['Enables query console logs', false],	
	bBasicLogging 			:	['Enables basic console logs', true],
	bShowFinalSelection 	:	['Enables selection\'s final scoring console logs', true],
	firstPopup				:	['Search by distance: Fired once', false],
	descriptorCRC			:	['Graph Descriptors CRC', -1], // Calculated later on first time
	bAllMusicDescriptors	:	['Load All Music descriptors?', false],
	bLastfmDescriptors		:	['Load Last.fm descriptors?', false],
	bStartLogging 			:	['Startup logging', false]
};
// Checks
Object.keys(SearchByDistance_panelProperties).forEach( (key) => { // Checks
	if (regExBool.test(key)) {
		SearchByDistance_panelProperties[key].push({func: isBoolean}, SearchByDistance_panelProperties[key][1]);
	}
});

var sbd_prefix = 'sbd_';
if (typeof buttonsBar === 'undefined' && typeof bNotProperties === 'undefined') { // Merge all properties when not loaded along buttons
	// With const var creating new properties is needed, instead of reassigning using A = {...A,...B}
	Object.entries(SearchByDistance_panelProperties).forEach(([key, value]) => {SearchByDistance_properties[key] = value;});
	setProperties(SearchByDistance_properties, sbd_prefix);
} else { // With buttons, set these properties only once per panel
	setProperties(SearchByDistance_panelProperties, sbd_prefix);
}
const panelProperties = (typeof buttonsBar === 'undefined' && typeof bNotProperties === 'undefined') ? getPropertiesPairs(SearchByDistance_properties, sbd_prefix) : getPropertiesPairs(SearchByDistance_panelProperties, sbd_prefix);

// Info Popup
if (!panelProperties.firstPopup[1]) {
	panelProperties.firstPopup[1] = true;
	overwriteProperties(panelProperties); // Updates panel
	const readmeKeys = [{name: 'search_bydistance', title: 'Search by Distance'}, {name: 'tags_structure', title: 'Tagging requisites'}]; // Must read files on first execution
	readmeKeys.forEach((objRead) => {
		const readmePath = folders.xxx + 'helpers\\readme\\' + objRead.name + '.txt';
		const readme = _open(readmePath, utf8);
		if (readme.length) {fb.ShowPopupMessage(readme, objRead.title);}
	});
}

/* 
	Load additional descriptors: All Music, Last.fm, ...
*/
[
	{name: 'All Music', file: 'helpers\\music_graph_descriptors_xxx_allmusic.js', prop: 'bAllMusicDescriptors'},
	{name: 'Last.fm', file: 'helpers\\music_graph_descriptors_xxx_lastfm.js', prop: 'bLastfmDescriptors'}
].forEach((descr) => {
	if (panelProperties[descr.prop][1]) {
		if (_isFile(folders.xxx + descr.file)) {
			if (panelProperties.bStartLogging[1]) {console.log(descr.name + '\'s music_graph_descriptors - File loaded: ' + folders.xxx + descr.file);}
			include('..\\' + descr.file);
		}
	}
});

/* 
	Initialize maps/graphs at start. Global variables
*/
const allMusicGraph = musicGraph();
const [genre_map , style_map, genre_style_map] = dyngenre_map();
const kMoodNumber = 6;  // Used for query filtering, combinations of K moods for queries. Greater values will pre-filter better the library..
const influenceMethod = 'adjacentNodes'; // direct, zeroNodes, adjacentNodes, fullPath

/* 
	Reuse cache on the same session, from other panels and from json file
*/
// Only use file cache related to current descriptors, otherwise delete it
if (panelProperties.bProfile[1]) {var profiler = new FbProfiler('descriptorCRC');}
const descriptorCRC = crc32(JSON.stringify(music_graph_descriptors) + musicGraph.toString() + calcGraphDistance.toString() + calcMeanDistance.toString() + influenceMethod + 'v1.1.0');
const bMissmatchCRC = panelProperties.descriptorCRC[1] !== descriptorCRC;
if (bMissmatchCRC) {
	console.log('SearchByDistance: CRC mistmatch. Deleting old json cache.');
	_deleteFile(folders.data + 'searchByDistance_cacheLink.json');
	_deleteFile(folders.data + 'searchByDistance_cacheLinkSet.json');
	panelProperties.descriptorCRC[1] = descriptorCRC;
	overwriteProperties(panelProperties); // Updates panel
}
if (panelProperties.bProfile[1]) {profiler.Print();}
// Start cache
var cacheLinkSet;
if (_isFile(folders.data + 'searchByDistance_cacheLink.json')) {
	const data = loadCache(folders.data + 'searchByDistance_cacheLink.json');
	if (data.size) {cacheLink = data; if (panelProperties.bStartLogging[1]) {console.log('SearchByDistance: Used Cache - cacheLink from file.');}}
}
if (_isFile(folders.data + 'searchByDistance_cacheLinkSet.json')) {
	const data = loadCache(folders.data + 'searchByDistance_cacheLinkSet.json');
	if (data.size) {cacheLinkSet = data; if (panelProperties.bStartLogging[1]) {console.log('SearchByDistance: Used Cache - cacheLinkSet from file.');}}
}
// Delays cache update after startup (must be called by the button file if it's not done here)
if (typeof buttonsBar === 'undefined' && typeof bNotProperties === 'undefined') {debounce(updateCache, 3000)({properties: panelProperties});}
// Ask others instances to share cache on startup
if (typeof cacheLink === 'undefined') {
	window.NotifyOthers('SearchByDistance: requires cacheLink map', true);
}
if (typeof cacheLinkSet === 'undefined') {
	window.NotifyOthers('SearchByDistance: requires cacheLinkSet map', true);
}
async function updateCache({newCacheLink, newCacheLinkSet, bForce = false, properties = null} = {}) {
	if (typeof cacheLink === 'undefined' && !newCacheLink) { // only required if on_notify_data did not fire before
		if (panelProperties.bProfile[1]) {var profiler = new FbProfiler('calcCacheLinkSGV2');}
		if (panelProperties.bCacheOnStartup[1] || bForce) {
			const genreTag = properties && properties.hasOwnProperty('genreTag') ? properties.genreTag[1].split(/, */g).map((tag) => {
				return tag.indexOf('$') === -1 ? '%' + tag + '%' : tag;
			}).join('|') : '%GENRE%';
			const styleTag = properties && properties.hasOwnProperty('styleTag') ? properties.styleTag[1].split(/, */g).map((tag) => {
				return tag.indexOf('$') === -1 ? '%' + tag + '%' : tag;
			}).join('|') : '%STYLE%';
			const tags = [genreTag, styleTag].filter(Boolean).join('|');
			console.log('SearchByDistance: tags used for cache - ' + tags);
			const tfo = fb.TitleFormat(tags);
			const styleGenres = await new Promise((resolve) => {
				const libItems = fb.GetLibraryItems().Convert();
				const num = libItems.length;
				let tagValues = [];
				const promises = [];
				let step = 0;
				let prevProgress = -1;
				// All styles/genres from library without duplicates
				for (let i = 0; step < num; i ++) {
					promises.push(new Promise((resolve) => {
						step += 300;
						const items = new FbMetadbHandleList(libItems.slice(i, step));
						setTimeout((step) => {
							tagValues.push(...new Set(tfo.EvalWithMetadbs(items).join('|').split(/\| *|, */g)));
							const progress = Math.round(step / num * 4) * 25;
							if (progress > prevProgress) {prevProgress = progress; console.log('Calculating tags ' + (progress <= 100 ? progress : 100) + '%.');}
							resolve('done');
						}, iDelayLibrary * 6 * i, step);
					}));
				}
				Promise.all(promises).then(() => {
					if (properties && properties.hasOwnProperty('bAscii') && properties.bAscii[1]) {
						setTimeout(() => {resolve(new Set([...new Set(tagValues)].map((tag) => {return _asciify(tag);})));}, 500);
					} else {
						setTimeout(() => {resolve(new Set(tagValues));}, 500);
					}
				});
			});
			cacheLink = await calcCacheLinkSGV2(allMusicGraph, styleGenres);
		} else {
			cacheLink = new Map();
		}
		saveCache(cacheLink, folders.data + 'searchByDistance_cacheLink.json');
		if (panelProperties.bProfile[1]) {profiler.Print();}
		console.log('SearchByDistance: New Cache - cacheLink');
		window.NotifyOthers(window.Name + ' SearchByDistance: cacheLink map', cacheLink);
	} else if (newCacheLink) {
		cacheLink = newCacheLink;
	}
	if (typeof cacheLinkSet === 'undefined' && !newCacheLinkSet) { // only required if on_notify_data did not fire before
		cacheLinkSet = new Map();
		console.log('SearchByDistance: New Cache - cacheLinkSet');
		window.NotifyOthers(window.Name + ' SearchByDistance: cacheLinkSet map', cacheLinkSet);
	} else if (newCacheLinkSet) {
		cacheLinkSet = newCacheLinkSet;
	}
	// Multiple Graph testing and logging of results using the existing cache
	if (panelProperties.bSearchDebug[1]) {
		doOnce('Test 1',testGraph)(allMusicGraph);
		doOnce('Test 2',testGraphV2)(allMusicGraph);
	}
}

addEventListener('on_notify_data', (name, info) => {
	if (name) {
		if (name.indexOf('SearchByDistance: requires cacheLink map') !== -1 && typeof cacheLink !== 'undefined' && cacheLink.size) { // When asked to share cache, delay 1 sec. to allow script loading
			debounce(() => {if (typeof cacheLink !== 'undefined') {window.NotifyOthers(window.Name + ' SearchByDistance: cacheLink map', cacheLink);}}, 1000)();
			console.log('SearchByDistance: Requested Cache - cacheLink.');
		}
		if (name.indexOf('SearchByDistance: requires cacheLinkSet map') !== -1 && typeof cacheLinkSet !== 'undefined' && cacheLinkSet.size) { // When asked to share cache, delay 1 sec. to allow script loading
			debounce(() => {if (typeof cacheLinkSet !== 'undefined') {window.NotifyOthers(window.Name + ' SearchByDistance: cacheLinkSet map', cacheLinkSet);}}, 1000)();
			console.log('SearchByDistance: Requested Cache - cacheLinkSet.');
		} 
		if (name.indexOf('SearchByDistance: cacheLink map') !== -1 && info) {
			console.log('SearchByDistance: Used Cache - cacheLink from other panel.');
			let data = JSON.parse(JSON.stringify([...info])); // Deep copy
			data.forEach((pair) => {if (pair[1].distance === null) {pair[1].distance = Infinity;}}); // stringify converts Infinity to null, this reverts the change
			updateCache({newCacheLink: new Map(data)});
		}
		if (name.indexOf('SearchByDistance: cacheLinkSet map') !== -1 && info) {
			console.log('SearchByDistance: Used Cache - cacheLinkSet from other panel.');
			let data = JSON.parse(JSON.stringify([...info])); // Deep copy
			data.forEach((pair) => {if (pair[1] === null) {pair[1] = Infinity;}}); // stringify converts Infinity to null, this reverts the change
			updateCache({newCacheLinkSet: new Map(data)});
		}
	}
});

addEventListener('on_script_unload', () => {
	if (panelProperties.bStartLogging[1]) {console.log('SearchByDistance: Saving Cache.');}
	if (cacheLink) {saveCache(cacheLink, folders.data + 'searchByDistance_cacheLink.json');}
	if (cacheLinkSet) {saveCache(cacheLinkSet, folders.data + 'searchByDistance_cacheLinkSet.json');}
});

/* 
	Warnings about links/nodes set wrong
*/
if (panelProperties.bGraphDebug[1]) {
	if (panelProperties.bProfile[1]) {var profiler = new FbProfiler('graphDebug');}
	graphDebug(allMusicGraph);
	if (panelProperties.bProfile[1]) {profiler.Print();}
}

/* 
	Variables allowed at recipe files and automatic documentation update
*/
const recipeAllowedKeys = new Set(['name', 'properties', 'theme', 'recipe', 'genreWeight', 'styleWeight', 'dyngenreWeight', 'moodWeight', 'keyWeight', 'dateWeight', 'bpmWeight', 'composerWeight', 'customStrWeight', 'customNumWeight', 'dyngenreRange', 'keyRange', 'dateRange', 'bpmRange', 'customNumRange', 'bNegativeWeighting', 'forcedQuery', 'bSameArtistFilter', 'bConditionAntiInfluences', 'bUseAntiInfluencesFilter', 'bUseInfluencesFilter', 'bSimilArtistsFilter', 'method', 'scoreFilter', 'minScoreFilter', 'sbd_max_graph_distance', 'poolFilteringTag', 'poolFilteringN', 'bPoolFiltering', 'bRandomPick', 'probPick', 'playlistLength', 'bSortRandom', 'bProgressiveListOrder', 'bScatterInstrumentals', 'bInKeyMixingPlaylist', 'bProgressiveListCreation', 'progressiveListCreationN', 'playlistName', 'bProfile', 'bShowQuery', 'bShowFinalSelection', 'bBasicLogging', 'bSearchDebug', 'bCreatePlaylist', 'bAscii']);
const recipePropertiesAllowedKeys = new Set(['genreTag', 'styleTag', 'moodTag', 'dateTag', 'keyTag', 'bpmTag', 'composerTag', 'customStrTag', 'customNumTag']);
const themePath = folders.xxx + 'presets\\Search by\\themes\\';
const recipePath = folders.xxx + 'presets\\Search by\\recipes\\';
if (!_isFile(folders.xxx + 'presets\\Search by\\recipes\\allowedKeys.txt') || bMissmatchCRC) {
	const data = [...recipeAllowedKeys].map((key) => {
		const propDescr = SearchByDistance_properties[key] || SearchByDistance_panelProperties[key];
		let descr = propDescr ? propDescr[0] : '';
		if (!descr.length) {
			if (key.toLowerCase().indexOf('properties') !== -1) {
				descr = {'Object properties to pass other arguments': 
					Object.fromEntries([...recipePropertiesAllowedKeys].map((key) => {return [key, (SearchByDistance_properties[key] || SearchByDistance_panelProperties[key])[0]];}))
				};
			}
			if (key === 'name') {descr = 'Preset name (instead of filename)';}
			if (key === 'theme') {descr = 'Load additional theme by file name or path';}
			if (key === 'recipe') {descr = 'Load additional recipe(s) by file name or path. Nesting and multiple values (array) allowed';}
			if (key === 'bPoolFiltering') {descr = 'Global enable/disable switch. Equivalent to setting poolFilteringN to >0 or -1';}
			if (key === 'bCreatePlaylist') {descr = 'Output results to a playlist or only for internal use';}
		}
		return [key, descr];
	});
	if (panelProperties.bStartLogging[1]) {console.log('Updating recipes documentation at: ' + folders.xxx + 'presets\\Search by\\recipes\\allowedKeys.txt');}
	_save(folders.xxx + 'presets\\Search by\\recipes\\allowedKeys.txt', JSON.stringify(Object.fromEntries(data), null, '\t'));
}

// 1900 ms 24K tracks GRAPH all default on i7 920 from 2008
// 3144 ms 46K tracks DYNGENRE all default on i7 920 from 2008
async function do_searchby_distance({
								// --->Default args (aka properties from the panel and input)
								properties	 			= getPropertiesPairs(SearchByDistance_properties, sbd_prefix),
								panelProperties			= (typeof buttonsBar === 'undefined') ? properties : getPropertiesPairs(SearchByDistance_panelProperties, sbd_prefix),
								sel 					= fb.GetFocusItem(), // Reference track, first item of act. pls. if can't get focus item
								theme					= {}, // May be a file path or object with Arr of tags {name, tags: [{genre, style, mood, key, date, bpm, composer, customStr, customNum}]}
								recipe 					= {}, // May be a file path or object with Arr of arguments {genreWeight, styleWeight, ...}
								// --->Args modifiers
								bAscii					= properties.hasOwnProperty('bAscii') ? properties['bAscii'][1] : true, // Sanitize all tag values with ACII equivalent chars
								bTagsCache				= properties.hasOwnProperty('bTagsCache') ? properties['bTagsCache'][1] : false, // Read from cache
								// --->Weights
								genreWeight				= properties.hasOwnProperty('genreWeight') ? Number(properties['genreWeight'][1]) : 0, // Number() is used to avoid bugs with dates or other values...
								styleWeight				= properties.hasOwnProperty('styleWeight') ? Number(properties['styleWeight'][1]) : 0,
								dyngenreWeight			= properties.hasOwnProperty('dyngenreWeight') ? Number(properties['dyngenreWeight'][1]) : 0,
								moodWeight				= properties.hasOwnProperty('moodWeight') ? Number(properties['moodWeight'][1]) : 0,
								keyWeight				= properties.hasOwnProperty('keyWeight') ? Number(properties['keyWeight'][1]) : 0,
								dateWeight				= properties.hasOwnProperty('dateWeight') ? Number(properties['dateWeight'][1]) : 0,
								bpmWeight				= properties.hasOwnProperty('bpmWeight') ? Number(properties['bpmWeight'][1]) : 0,
								composerWeight 			= properties.hasOwnProperty('composerWeight') ? Number(properties['composerWeight'][1]) : 0,
								customStrWeight 		= properties.hasOwnProperty('customStrWeight') ? Number(properties['customStrWeight'][1]) : 0, // Only used if tag is set at properties
								customNumWeight 		= properties.hasOwnProperty('customNumWeight') ? Number(properties['customNumWeight'][1]) : 0, // Only used if tag is set at properties
								// --->Ranges (for associated weighting)
								dyngenreRange 			= dyngenreWeight !== 0 && properties.hasOwnProperty('dyngenreRange') ? Number(properties['dyngenreRange'][1]) : 0,
								keyRange 				= keyWeight !== 0 && properties.hasOwnProperty('keyRange') ? Number(properties['keyRange'][1]) : 0,
								dateRange				= dateWeight !== 0 && properties.hasOwnProperty('dateRange') ? Number(properties['dateRange'][1]) : 0,
								bpmRange				= bpmWeight !== 0 && properties.hasOwnProperty('bpmRange')? Number(properties['bpmRange'][1]) : 0,
								customNumRange 			= customNumWeight !== 0  && properties.hasOwnProperty('customNumRange') ? Number(properties['customNumRange'][1]) : 0,
								bNegativeWeighting		= properties.hasOwnProperty('bNegativeWeighting') ? properties['bNegativeWeighting'][1] : true, // Assigns negative score for num. tags when they fall outside range
								// --->Pre-Scoring Filters
								// Query to filter library
								forcedQuery				= properties.hasOwnProperty('forcedQuery') ? properties['forcedQuery'][1] : '',
								// Exclude same artist
								bSameArtistFilter		= properties.hasOwnProperty('bSameArtistFilter') ? properties['bSameArtistFilter'][1] : false,
								// Similar artists
								bSimilArtistsFilter		= properties.hasOwnProperty('bSimilArtistsFilter') ? properties['bSimilArtistsFilter'][1] : false, 
								// Filter anti-influences by query, before any scoring/distance calc.
								bConditionAntiInfluences= properties.hasOwnProperty('bConditionAntiInfluences') ? properties['bConditionAntiInfluences'][1] : false, // Only for specific style/genres (for ex. Jazz) 
								bUseAntiInfluencesFilter= !bConditionAntiInfluences && properties.hasOwnProperty('bUseAntiInfluencesFilter') ? properties['bUseAntiInfluencesFilter'][1] : false,
								// Allows only influences by query, before any scoring/distance calc.
								bUseInfluencesFilter	= properties.hasOwnProperty('bUseInfluencesFilter') ? properties['bUseInfluencesFilter'][1] : false, 
								// --->Scoring Method
								method					= properties.hasOwnProperty('method') ? properties['method'][1] : 'WEIGHT',
								// --->Scoring filters
								scoreFilter				= properties.hasOwnProperty('scoreFilter') ? Number(properties['scoreFilter'][1]) :  75,
								minScoreFilter			= properties.hasOwnProperty('minScoreFilter') ? Number(properties['minScoreFilter'][1]) :  scoreFilter - 10,
								sbd_max_graph_distance	= properties.hasOwnProperty('sbd_max_graph_distance') ? (isString(properties['sbd_max_graph_distance'][1]) ? properties['sbd_max_graph_distance'][1] : Number(properties['sbd_max_graph_distance'][1])) : Infinity,
								// --->Post-Scoring Filters
								// Allows only N +1 tracks per tag set... like only 2 tracks per artist, etc.
								poolFilteringTag 		= properties.hasOwnProperty('poolFilteringTag') ? properties['poolFilteringTag'][1].split(',').filter(Boolean) : [],
								poolFilteringN			= properties.hasOwnProperty('poolFilteringN') ? Number(properties['poolFilteringN'][1]) : -1,
								bPoolFiltering 			= poolFilteringN >= 0 && poolFilteringN < Infinity ? true : false,
								// --->Playlist selection
								// How tracks are chosen from pool
								bRandomPick				= properties.hasOwnProperty('bRandomPick') ? properties['bRandomPick'][1] : false, // Get randomly
								probPick				= properties.hasOwnProperty('probPick') ? Number(properties['probPick'][1]) : 100, // Get by scoring order but with x probability of being chosen
								playlistLength			= properties.hasOwnProperty('playlistLength') ? Number(properties['playlistLength'][1]) : 50, // Max playlist size
								// --->Playlist sorting
								// How playlist is sorted (independently of playlist selection)
								bSortRandom				= properties.hasOwnProperty('bSortRandom') ? properties['bSortRandom'][1] : false, // Random sorting 
								bProgressiveListOrder	= properties.hasOwnProperty('bProgressiveListOrder') ? properties['bProgressiveListOrder'][1] : false, // Sorting following progressive changes on tags (score)
								bScatterInstrumentals	= properties.hasOwnProperty('bScatterInstrumentals') ? properties['bScatterInstrumentals'][1] : false, // Intercalate instrumental tracks breaking clusters if possible
								// --->Special Playlists
								// Use previous playlist selection, but override playlist sorting, since they use their own logic
								bInKeyMixingPlaylist	= properties.hasOwnProperty('bInKeyMixingPlaylist') ? properties['bInKeyMixingPlaylist'][1] : false, // Key changes following harmonic mixing rules like a DJ
								bHarmonicMixDoublePass	= properties.hasOwnProperty('bHarmonicMixDoublePass') ? properties['bHarmonicMixDoublePass'][1] : false, // Usually outputs more tracks in harmonic mixing
								bProgressiveListCreation= properties.hasOwnProperty('bProgressiveListCreation') ? properties['bProgressiveListCreation'][1] : false, // Uses output tracks as new references, and so on...
								progressiveListCreationN= bProgressiveListCreation ? Number(properties['progressiveListCreationN'][1]) : 1, // > 1 and < 100
								// --->Console logging
								// Uses panelProperties instead of properties, so it always points to the right properties... used along buttons or not.
								// They are the same for all instances within the same panel
								bProfile 				= panelProperties.hasOwnProperty('bProfile') ? panelProperties['bProfile'][1] : false,
								bShowQuery 				= panelProperties.hasOwnProperty('bShowQuery') ? panelProperties['bShowQuery'][1] : true,
								bShowFinalSelection 	= panelProperties.hasOwnProperty('bShowFinalSelection') ? panelProperties['bShowFinalSelection'][1] : true,
								bBasicLogging			= panelProperties.hasOwnProperty('bBasicLogging') ? panelProperties['bBasicLogging'][1] : false,
								bSearchDebug 			= panelProperties.hasOwnProperty('bSearchDebug') ? panelProperties['bSearchDebug'][1] : false,
								// --->Output
								playlistName			= properties.hasOwnProperty('playlistName') ? properties['playlistName'][1] : 'Search...',
								bCreatePlaylist			= true, // false: only outputs handle list. To be used along other scripts and/or recursive calls
								} = {}) {
		const descr = music_graph_descriptors;
		const oldCacheLinkSize = cacheLink ? cacheLink.size : 0;
		const oldCacheLinkSetSize = cacheLinkSet ? cacheLinkSet.size : 0;
		// Recipe check
		const bUseRecipe = recipe && (recipe.length || Object.keys(recipe).length);
		const recipeProperties = {};
		if (bUseRecipe) {
			let path;
			if (isString(recipe)) { // File path
				path = !_isFile(recipe) && _isFile(recipePath + recipe) ? recipePath + recipe : recipe;
				recipe = _jsonParseFileCheck(path, 'Recipe json', 'Search by Distance', utf8);
				if (!recipe) {console.log('Recipe not found: ' + path); return;}
			}
			const name = recipe.hasOwnProperty('name') ? recipe.name : (path ? utils.SplitFilePath(path)[1] : '-no name-');
			// Rewrite args or use destruct when passing args
			// Sel is omitted since it's a function or a handle
			// Note a theme may be set within a recipe too, overwriting any other theme set
			// Changes null to infinity and not found theme filenames into full paths
			let bOverwriteTheme = false;
			if (recipe.hasOwnProperty('recipe')) { // Process nested recipes
				let toAdd = processRecipe(recipe.recipe);
				delete toAdd.recipe;
				Object.keys(toAdd).forEach((key) => {if (!recipe.hasOwnProperty(key)) {recipe[key] = toAdd[key];}});
			}
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
								if (!properties.hasOwnProperty(rKey)) {console.log('Recipe has a property key not recognized: ' + rKey); return;}
								recipeProperties[rKey] = newProperties[rKey];
							});
						}
					} else {
						if (isStringWeak(value)) {
							eval(key + ' = \'' + value + '\'');
						} else if (isArrayStrings(value)) {
							const newVal = '\'' + value.join('\',\'') + '\'';
							eval(key + ' = [' + newVal + ']');
						} else {eval(key + ' = ' + value);}
						if (key === 'theme') {bOverwriteTheme = true;}
					}
				} else {console.log('Recipe has a variable not recognized: ' + key);}
			});
			if (bBasicLogging) {
				console.log('Using recipe as config: ' + name + (path ? ' (' + path + ')' : ''));
				if (bOverwriteTheme) {console.log('Recipe forces its own theme.');}
			}
		}
		// Parse args
		if (isString(sbd_max_graph_distance)) { // Safety check
			if (sbd_max_graph_distance.length >= 50) {
				console.log('Error parsing sbd_max_graph_distance (length >= 50): ' + sbd_max_graph_distance);
				return;
			}
			if (sbd_max_graph_distance.indexOf('music_graph_descriptors') === -1 || sbd_max_graph_distance.indexOf('()') !== -1 || sbd_max_graph_distance.indexOf(',') !== -1) {
				console.log('Error parsing sbd_max_graph_distance (is not a valid variable or using a func): ' + sbd_max_graph_distance);
				return;
			}
			const validVars = Object.keys(descr).map((key) => {return 'music_graph_descriptors.' + key;});
			if (sbd_max_graph_distance.indexOf('+') === -1 && sbd_max_graph_distance.indexOf('-') === -1 && sbd_max_graph_distance.indexOf('*') === -1 && sbd_max_graph_distance.indexOf('/') === -1 && validVars.indexOf(sbd_max_graph_distance) === -1) {
				console.log('Error parsing sbd_max_graph_distance (using no arithmethics or variable): ' + sbd_max_graph_distance);
				return;
			}
			sbd_max_graph_distance = Math.floor(eval(sbd_max_graph_distance));
			if (bBasicLogging) {console.log('Parsed sbd_max_graph_distance to: ' + sbd_max_graph_distance);}
		}
		// Theme check
		const bUseTheme = theme && (theme.length || Object.keys(theme).length);
		if (bUseTheme) {
			let path;
			if (isString(theme)) { // File path: try to use plain path or themes folder + filename
				path = !_isFile(theme) && _isFile(themePath + theme) ? themePath + theme : theme;
				theme = _jsonParseFileCheck(path, 'Theme json', 'Search by Distance', utf8);
				if (!theme) {return;}
			}
			
			// Array of objects
			const tagsToCheck = ['genre', 'style', 'mood', 'key', 'date', 'bpm', 'composer', 'customStr', 'customNum'];
			const tagCheck = theme.hasOwnProperty('tags') ? theme.tags.findIndex((tagArr) => {return !isArrayEqual(Object.keys(tagArr), tagsToCheck);}) : 0;
			const bCheck = theme.hasOwnProperty('name') && tagCheck === -1;
			if (!bCheck) {
				console.log('Theme selected for mix is missing some keys: ' + (theme.hasOwnProperty('name') ? [...new Set(tagsToCheck).difference(new Set(Object.keys(theme.tags[tagCheck])))] : 'name'));
				return;
			}
			if (bBasicLogging) {
				console.log('Using theme as reference: ' + theme.name + (path ? ' (' + path + ')' : ''));
				console.log(theme);
			}
		}
		// Sel check
		if (!bUseTheme) {
			if (!sel) {
				console.log('No track\\theme selected for mix.');
				return;
			}
			if (bBasicLogging) {
				console.log('Using selection as reference: ' + fb.TitleFormat('[%track% - ]%title%').EvalWithMetadb(sel) + ' (' + sel.RawPath + ')');
			}
		}
		// Method check
		if (!checkMethod(method)) {console.popup('Method not recognized: ' + method +'\nOnly allowed GRAPH, DYNGENRE or WEIGHT.', 'Search by distance'); return;}
		
		// Start calcs
		if (bProfile) {var test = new FbProfiler('do_searchby_distance');}
		// May be more than one tag so we use split(). Use filter() to remove '' values. For ex:
		// styleTag: 'tagName,, ,tagName2' => ['tagName','Tagname2']
		// We check if weights are zero first
		const genreTag = (genreWeight !== 0 || dyngenreWeight !== 0 || method === 'GRAPH') ? (recipeProperties.genreTag || properties.genreTag[1]).split(',').filter(Boolean) : [];
		const styleTag = (styleWeight !== 0 || dyngenreWeight !== 0 || method === 'GRAPH') ? (recipeProperties.styleTag || properties.styleTag[1]).split(',').filter(Boolean) : [];
		const moodTag = (moodWeight !== 0) ?(recipeProperties.moodTag || properties.moodTag[1]).split(',').filter(Boolean) : [];
		const dateTag = (dateWeight !== 0) ?(recipeProperties.dateTag || properties.dateTag[1]).split(',').filter(Boolean) : []; // This one only allows 1 value, but we put it into an array
		const keyTag = (keyWeight !== 0 || bInKeyMixingPlaylist) ? (recipeProperties.keyTag || properties.keyTag[1]).split(',').filter(Boolean) : []; // This one only allows 1 value, but we put it into an array
		const bpmTag = (bpmWeight !== 0) ? (recipeProperties.bpmTag || properties.bpmTag[1]).split(',').filter(Boolean) : []; // This one only allows 1 value, but we put it into an array
		const composerTag = (composerWeight !== 0) ? (recipeProperties.composerTag || properties.composerTag[1]).split(',').filter(Boolean) : [];
		const customStrTag = (customStrWeight !== 0) ? (recipeProperties.customStrTag || properties.customStrTag[1]).split(',').filter(Boolean) : [];
		const customNumTag = (customNumWeight !== 0) ? (recipeProperties.customNumTag || properties.customNumTag[1]).split(',').filter(Boolean) : []; // This one only allows 1 value, but we put it into an array
		
		// Check input
		playlistLength = (playlistLength >= 0) ? playlistLength : 0;
		probPick = (probPick <= 100 && probPick > 0) ? probPick : 100;
		scoreFilter = (scoreFilter <= 100 && scoreFilter >= 0) ? scoreFilter : 100;
		minScoreFilter = (minScoreFilter <= scoreFilter && minScoreFilter >= 0) ? minScoreFilter : scoreFilter;
		bPoolFiltering = bPoolFiltering && (poolFilteringN >= 0 && poolFilteringN < Infinity) ? true : false;
		if (bPoolFiltering && (!poolFilteringTag || !poolFilteringTag.length || !isArrayStrings(poolFilteringTag))) {fb.ShowPopupMessage('Tags for pool filtering are not set or have an invalid value:\n' + poolFilteringTag); return;}
		if (customNumTag.length > 1) { // Safety Check. Warn users if they try wrong settings
			if (bBasicLogging) {console.log('Check \'' + properties['customNumTag'][0] + '\' value (' + properties['customNumTag'][1] + '). Must be only one tag name!.');}
			return;
		}
		if (genreTag.length === 0 && styleTag.length === 0 && (method === 'GRAPH' || method === 'DYNGENRE')) { // Can not use those methods without genre/style tags at all
			if (bBasicLogging) {console.log('Check \'' + properties['genreTag'][0] + '\' and \''  + properties['styleTag'][0] + '\'. Both can not be empty when using GRAPH or DYNGENRE methods.');}
			return;
		}
		
		// Zero weights if there are no tag names to look for
		if (genreTag.length === 0) {genreWeight = 0;}
		if (styleTag.length === 0) {styleWeight = 0;}
		if (moodTag.length === 0) {moodWeight = 0;}
		if (dateTag.length === 0) {dateWeight = 0;}
		if (keyTag.length === 0) {keyWeight = 0; bInKeyMixingPlaylist = false;}
		if (bpmTag.length === 0) {bpmWeight = 0;}
		if (composerTag.length === 0) {composerWeight = 0;}
		if (customStrTag.length === 0) {customStrWeight = 0;}
		if (customNumTag.length === 0) {customNumWeight = 0;}
		
		if (method === 'DYNGENRE') {  // Warn users if they try wrong settings
			if (dyngenreWeight === 0) {
				if (bBasicLogging) {console.log('Check \'' + properties['dyngenreWeight'][0] + '\' value (' + dyngenreWeight + '). Must be greater than zero if you want to use DYNGENRE method!.');}
				return;
			} else {method = 'WEIGHT';} // For calcs they are the same!
		} else {dyngenreWeight = 0;}
	
		const totalWeight = genreWeight + styleWeight + dyngenreWeight +  moodWeight + keyWeight + dateWeight + bpmWeight + customStrWeight + customNumWeight + composerWeight; //100%
		const countWeights = (genreWeight ? 1 : 0) + (styleWeight ? 1 : 0) + (dyngenreWeight ? 1 : 0) + (moodWeight ? 1 : 0) + (keyWeight ? 1 : 0) + (dateWeight ? 1 : 0) + (bpmWeight ? 1 : 0) + (customStrWeight ? 1 : 0) + (customNumWeight ? 1 : 0) + (composerWeight ? 1 : 0);
		
		if (!playlistLength) {
			if (bBasicLogging) {console.log('Check \'Playlist Mix length\' value (' + playlistLength + '). Must be greater than zero.');}
            return;
		}
		if (!totalWeight && method === 'WEIGHT') {
			if (bBasicLogging) {
				if (properties['dyngenreWeight'][1] !== 0) {console.log('Check weight values, all are set to zero and ' + properties['dyngenreWeight'][0] + ' is not used for WEIGHT method.');}
				else {console.log('Check weight values, all are set to zero.');}
			}
			return;
		}
		
		try {fb.GetQueryItems(new FbMetadbHandleList(), forcedQuery);} // Sanity check
		catch (e) {fb.ShowPopupMessage('Query not valid, check forced query:\n' + forcedQuery); return;}
		// Query
		let query = [];
		let queryl = 0;
		
		// These should be music characteristics not genre/styles. Like 'electric blues' o 'acoustic', which could apply to any blues style... those things are not connected by graph, but considered only for weight scoring instead.
		const map_distance_exclusions = descr.map_distance_exclusions; // Set
		
		// Tag filtering: applied globally. Matched values omitted on both calcs, graph and scoring..
		// Add '' value to set so we also apply a ~boolean filter when evaluating. Since we are using the filter on string tags, it's good enough.
		// It's faster than applying array.filter(Boolean).filter(genreStyleFilter)
		const genreStyleFilter = properties['genreStyleFilter'][1].length ? new Set(properties['genreStyleFilter'][1].split(',').concat('')) : null;
		const bTagFilter = genreStyleFilter ? true : false; // Only use filter when required
		
		// Get the tag value. Skip those with weight 0 and get num of values per tag right (they may be arrays, single values, etc.)
		// We use flat since it's only 1 track: genre[0][i] === genre.flat()[i]
		// Also filter using boolean to remove '' values within an array, so [''] becomes [] with 0 length.
		// Using only boolean filter it's 3x faster than filtering by set
		const selHandleList = bUseTheme ? null : new FbMetadbHandleList(sel);
		const genre = (genreTag.length && (genreWeight !== 0 || dyngenreWeight !== 0 || method === 'GRAPH')) ? (bUseTheme ? theme.tags[0].genre : getTagsValuesV3(selHandleList, genreTag, true).flat()).filter(bTagFilter ? (tag) => !genreStyleFilter.has(tag) : Boolean): [];
		const style = (styleTag.length && (styleWeight !== 0 || dyngenreWeight !== 0 || method === 'GRAPH')) ? (bUseTheme ? theme.tags[0].style : getTagsValuesV3(selHandleList, styleTag, true).flat()).filter(bTagFilter ? (tag) => !genreStyleFilter.has(tag) : Boolean): [];
		const mood = (moodWeight !== 0) ? (bUseTheme ? theme.tags[0].mood : getTagsValuesV3(selHandleList, moodTag, true).flat()).filter(Boolean) : [];
		const composer = (composerWeight !== 0) ? (bUseTheme ? theme.tags[0].composer : getTagsValuesV3(selHandleList, composerTag, true).flat()).filter(Boolean) : [];
		const customStr = (customStrWeight !== 0) ? (bUseTheme ? theme.tags[0].customStr : getTagsValuesV3(selHandleList, customStrTag, true).flat()).filter(Boolean) : [];
		if (bAscii) {
			[genre, style, mood, composer, customStr].forEach((arr) => {
				arr.forEach((tag, i) => {arr[i] = _asciify(tag);});
			});
		}
		const restTagNames = [(keyWeight !== 0 || bInKeyMixingPlaylist) ? keyTag[0] : 'skip', (dateWeight !== 0) ? dateTag[0] : 'skip', (bpmWeight !== 0) ? bpmTag[0] : 'skip', (customNumWeight !== 0) ? customNumTag[0] : 'skip']; // 'skip' returns empty arrays...
		const [keyArr, dateArr, bpmArr, customNumArr] = bUseTheme ? [theme.tags[0].key, theme.tags[0].date, theme.tags[0].bpm, theme.tags[0].customNum]: getTagsValuesV4(selHandleList, restTagNames).flat();
		const key = (keyWeight !== 0 || bInKeyMixingPlaylist) ? keyArr[0] : '';
		const date =(dateWeight !== 0 && dateArr[0] !== '') ? Number(dateArr[0]) : null;
		const bpm = (bpmWeight !== 0 && bpmArr[0] !== '') ? Number(bpmArr[0]) : null;
		const customNum = (customNumWeight !== 0 && customNumArr[0] !== '') ? Number(customNumArr[0]) : null;
		// Sets for later comparison
		const style_genreSet = new Set(genre.concat(style)).difference(map_distance_exclusions); // We remove exclusions
		const genreSet = new Set(genre);
		const styleSet = new Set(style);
		const moodSet = new Set(mood);
		const composerSet = new Set(composer);
		const customStrSet = new Set(customStr);
		
		let originalWeightValue = 0;
		// Genres
        const genreNumber = genreSet.size;
		if (genreNumber !== 0) {
			originalWeightValue += genreWeight;
			if (genreWeight / totalWeight >= totalWeight / countWeights / 100) {
				queryl = query.length;
				query[queryl] = '';
				const tagNameTF = genreTag.map((tag) => {return ((tag.indexOf('$') === -1) ? tag : _q(tag));}); // May be a tag or a function...
				const match = tagNameTF.some((tag) => {return tag.indexOf('$') !== -1}) ? 'HAS' : 'IS'; // Allow partial matches when using funcs
				if (tagNameTF.length > 1) {query[queryl] += query_join(query_combinations(genre, tagNameTF, 'OR', void(0), match), 'OR');}
				else {query[queryl] += query_combinations(genre, tagNameTF, 'OR');}
			}
		} else if (genreWeight !== 0 && bBasicLogging) {console.log('GenreWeight was not zero but selected track had no genre tags');}
        // Styles
		const styleNumber = styleSet.size;
		if (styleNumber !== 0) {
			originalWeightValue += styleWeight;
			if (styleWeight / totalWeight >= totalWeight / countWeights / 100) {
				queryl = query.length;
				query[queryl] = '';
				const tagNameTF = styleTag.map((tag) => {return ((tag.indexOf('$') === -1) ? tag : _q(tag));}); // May be a tag or a function...
				const match = tagNameTF.some((tag) => {return tag.indexOf('$') !== -1}) ? 'HAS' : 'IS'; // Allow partial matches when using funcs
				if (tagNameTF.length > 1) {query[queryl] += query_join(query_combinations(style, tagNameTF, 'OR', void(0), match), 'OR');}
				else {query[queryl] += query_combinations(style, tagNameTF, 'OR');}
			}
		} else if (styleWeight !== 0 && bBasicLogging) {console.log('styleWeight was not zero but selected track had no style tags');}
		// Dyngenre
		const style_genre_length = style_genreSet.size;
		let dyngenreNumber = 0, dyngenre = [];
		if (dyngenreWeight !== 0 && style_genre_length !== 0) {
			// This virtual tag is calculated with previous values
			for (const style_genre_i of style_genreSet) {
				const dyngenre_i = genre_style_map.get(style_genre_i);
				if (dyngenre_i) {dyngenre = dyngenre.concat(dyngenre_i);}
			}
			dyngenreNumber = dyngenre.length;
			if (dyngenreNumber !== 0) {
				originalWeightValue += dyngenreWeight;
			}
		} else if (dyngenreWeight !== 0 && bBasicLogging) {console.log('dyngenreWeight was not zero but selected track had no style nor genre tags');}
        // Moods
		const moodNumber = moodSet.size;
		if (moodNumber !== 0) {
			originalWeightValue += moodWeight;
			if (moodWeight / totalWeight / moodNumber * kMoodNumber >= totalWeight / countWeights / 100) {
				queryl = query.length;
				query[queryl] = '';
				const k = moodNumber >= kMoodNumber ? kMoodNumber : moodNumber; //on combinations of 6
				const moodComb = k_combinations(mood, k);
				const tagNameTF = moodTag.map((tag) => {return ((tag.indexOf('$') === -1) ? tag : _q(tag));}); // May be a tag or a function...
				const match = tagNameTF.some((tag) => {return tag.indexOf('$') !== -1}) ? 'HAS' : 'IS'; // Allow partial matches when using funcs
				if (tagNameTF.length > 1) {query[queryl] += query_join(query_combinations(moodComb, tagNameTF, 'OR', 'AND', void(0), match), 'OR');}
				else {query[queryl] += query_combinations(moodComb, tagNameTF, 'OR', 'AND');}
			}
		} else if (moodWeight !== 0 && bBasicLogging) {console.log('moodWeight was not zero but selected track had no mood tags');}
        // Key
		const keyLength = key.length;
		if (keyLength) {
			originalWeightValue += keyWeight;
			if (keyWeight / totalWeight >= totalWeight / countWeights / 100) {
				queryl = query.length;
				query[queryl] = '';
				const tagNameTF = ((keyTag[0].indexOf('$') === -1) ? keyTag[0] : _q(keyTag[0])); // May be a tag or a function...
				// Cross on wheel with length keyRange, can change hour or letter, but not both without a penalty (-1 length)
				// Gets both, flat and sharp equivalences
				const camelotKey = camelotWheel.getKeyNotationObjectCamelot(key);
				if (camelotKey) {
					let nextKeyObj, nextKeyFlat, nextKeySharp;
					let keyComb = [];
					// Mayor axis with same letter
					nextKeyObj = {...camelotKey};
					for (let i = 0; i < keyRange; i++) {
						nextKeyObj = camelotWheel.energyBoost(nextKeyObj);
						nextKeyFlat = camelotWheel.wheelNotationSharp.get(nextKeyObj.hour)[nextKeyObj.letter];
						nextKeySharp = camelotWheel.wheelNotationFlat.get(nextKeyObj.hour)[nextKeyObj.letter];
						if (nextKeyFlat !== nextKeySharp) {keyComb.push(tagNameTF + ' IS ' + nextKeySharp + ' OR ' + tagNameTF + ' IS ' + nextKeyFlat);}
						else {keyComb.push(tagNameTF + ' IS ' + nextKeySharp);}
					}
					nextKeyObj = {...camelotKey};
					for (let i = 0; i <  keyRange; i++) {
						nextKeyObj = camelotWheel.energyDrop(nextKeyObj);
						nextKeyFlat = camelotWheel.wheelNotationSharp.get(nextKeyObj.hour)[nextKeyObj.letter];
						nextKeySharp = camelotWheel.wheelNotationFlat.get(nextKeyObj.hour)[nextKeyObj.letter];
						if (nextKeyFlat !== nextKeySharp) {keyComb.push(tagNameTF + ' IS ' + nextKeySharp + ' OR ' + tagNameTF + ' IS ' + nextKeyFlat);}
						else {keyComb.push(tagNameTF + ' IS ' + nextKeySharp);}
					}
					// Minor axis after changing letter
					nextKeyObj = {...camelotKey};
					nextKeyObj = camelotWheel.energySwitch(nextKeyObj);
					for (let i = 0; i <  keyRange - 1; i++) {
						nextKeyObj = camelotWheel.energyBoost(nextKeyObj);
						nextKeyFlat = camelotWheel.wheelNotationSharp.get(nextKeyObj.hour)[nextKeyObj.letter];
						nextKeySharp = camelotWheel.wheelNotationFlat.get(nextKeyObj.hour)[nextKeyObj.letter];
						if (nextKeyFlat !== nextKeySharp) {keyComb.push(tagNameTF + ' IS ' + nextKeySharp + ' OR ' + tagNameTF + ' IS ' + nextKeyFlat);}
						else {keyComb.push(tagNameTF + ' IS ' + nextKeySharp);}
					}
					nextKeyObj = {...camelotKey};
					nextKeyObj = camelotWheel.energySwitch(nextKeyObj);
					for (let i = 0; i < keyRange - 1; i++) {
						nextKeyObj = camelotWheel.energyDrop(nextKeyObj);
						nextKeyFlat = camelotWheel.wheelNotationSharp.get(nextKeyObj.hour)[nextKeyObj.letter];
						nextKeySharp = camelotWheel.wheelNotationFlat.get(nextKeyObj.hour)[nextKeyObj.letter];
						if (nextKeyFlat !== nextKeySharp) {keyComb.push(tagNameTF + ' IS ' + nextKeySharp + ' OR ' + tagNameTF + ' IS ' + nextKeyFlat);}
						else {keyComb.push(tagNameTF + ' IS ' + nextKeySharp);}
						i++;
					}
					// Different letter and same number
					nextKeyObj = {...camelotKey};
					nextKeyObj = camelotWheel.energySwitch(nextKeyObj);
					nextKeyFlat = camelotWheel.wheelNotationSharp.get(nextKeyObj.hour)[nextKeyObj.letter];
					nextKeySharp = camelotWheel.wheelNotationFlat.get(nextKeyObj.hour)[nextKeyObj.letter];
					if (nextKeyFlat !== nextKeySharp) {keyComb.push(tagNameTF + ' IS ' + nextKeySharp + ' OR ' + tagNameTF + ' IS ' + nextKeyFlat);}
					else {keyComb.push(tagNameTF + ' IS ' + nextKeySharp);}
					// Same letter and number
					nextKeyObj = {...camelotKey};
					nextKeyFlat = camelotWheel.wheelNotationSharp.get(nextKeyObj.hour)[nextKeyObj.letter];
					nextKeySharp = camelotWheel.wheelNotationFlat.get(nextKeyObj.hour)[nextKeyObj.letter];
					if (nextKeyFlat !== nextKeySharp) {keyComb.push(tagNameTF + ' IS ' + nextKeySharp + ' OR ' + tagNameTF + ' IS ' + nextKeyFlat);}
					else {keyComb.push(tagNameTF + ' IS ' + nextKeySharp);}
					// And combinate queries
					if (keyComb.length !== 0) {query[queryl] = query_join(keyComb, 'OR');}
				} else {query[queryl] = tagNameTF + ' IS ' + key;} // For non-standard notations just use simple matching
			}
		} else if (keyWeight !== 0 && bBasicLogging) {console.log('keyWeight was not zero but selected track had no key tags');}
		// Date
		if (date !== null) {
			originalWeightValue += dateWeight;
			if (dateWeight / totalWeight >= totalWeight / countWeights / 100) {
				queryl = query.length;
				query[queryl] = '';
				const dateUpper = date + dateRange;
				const dateLower = date - dateRange;
				const tagNameTF = ((dateTag[0].indexOf('$') === -1) ? dateTag[0] : _q(dateTag[0])); // May be a tag or a function...
				if (dateUpper !== dateLower) {query[queryl] += tagNameTF + ' GREATER ' + dateLower + ' AND ' + tagNameTF + ' LESS ' + dateUpper;} 
				else {query[queryl] += tagNameTF + ' EQUAL ' + date;}
			}
		} else if (dateWeight !== 0 && bBasicLogging) {console.log('dateWeight was not zero but selected track had no date tags');}
		// BPM
		if (bpm !== null) {
			originalWeightValue += bpmWeight;
			if (bpmWeight / totalWeight >= totalWeight / countWeights / 100) {
				queryl = query.length;
				query[queryl] = '';
				const bmpUpper = round(bpm * (100 + bpmRange) / 100, 0);
				const bmpLower = round(bpm * (100 - bpmRange) / 100, 0);
				const tagNameTF = ((bpmTag[0].indexOf('$') === -1) ? bpmTag[0] : _q(bpmTag[0])); // May be a tag or a function...
				if (bmpUpper !== bmpLower) {query[queryl] += tagNameTF + ' GREATER ' + bmpLower + ' AND ' + tagNameTF + ' LESS ' + bmpUpper;}
				else {query[queryl] += tagNameTF + ' EQUAL ' + bpm;}
			}
		} else if (bpmWeight !== 0 && bBasicLogging) {console.log('bpmWeight was not zero but selected track had no bpm tags');}
		// Composer
		const composerNumber = composerSet.size;
		if (composerNumber !== 0) {
			originalWeightValue += composerWeight;
			if (composerWeight / totalWeight >= totalWeight / countWeights / 100) {
				queryl = query.length;
				query[queryl] = '';
				const tagNameTF = composerTag.map((tag) => {return ((tag.indexOf('$') === -1) ? tag : _q(tag));}); // May be a tag or a function...
				const match = tagNameTF.some((tag) => {return tag.indexOf('$') !== -1}) ? 'HAS' : 'IS'; // Allow partial matches when using funcs
				if (composerTag.length > 1) {query[queryl] += query_join(query_combinations(composer, tagNameTF, 'OR', void(0), match), 'OR');}
				else {query[queryl] += query_combinations(composer, composerTag, 'OR');}
			}
		} else if (composerWeight !== 0 && bBasicLogging) {console.log('composerWeight was not zero but selected track had no composer tags');}
        // customStringTag
		const customStrNumber = customStrSet.size;
		if (customStrNumber !== 0) {
			originalWeightValue += customStrWeight;
			if (customStrWeight / totalWeight >= totalWeight / countWeights / 100) {
				queryl = query.length;
				query[queryl] = '';
				const tagNameTF = customStrTag.map((tag) => {return ((tag.indexOf('$') === -1) ? tag : _q(tag));}); // May be a tag or a function...
				const match = tagNameTF.some((tag) => {return tag.indexOf('$') !== -1}) ? 'HAS' : 'IS'; // Allow partial matches when using funcs
				if (customStrTag.length > 1) {query[queryl] += query_join(query_combinations(customStr, tagNameTF, 'OR', void(0), match), 'OR');}
				else {query[queryl] += query_combinations(customStr, customStrTag, 'OR');}
			}
		} else if (customStrWeight !== 0 && bBasicLogging) {console.log('customStrWeight was not zero but selected track had no custom string tags');}
		// customNumTag
		if (customNum !== null) {
			originalWeightValue += customNumWeight;
			if (customNumWeight / totalWeight >= totalWeight / countWeights / 100) {
				queryl = query.length;
				query[queryl] = '';
				const customNumUpper = customNum + customNumRange;
				const customNumLower = customNum - customNumRange;
				const tagNameTF = ((customNumTag[0].indexOf('$') === -1) ? customNumTag[0] : _q(customNumTag[0])); // May be a tag or a function...
				if (customNumUpper !== customNumLower) {query[queryl] += tagNameTF + ' GREATER ' + customNumLower + ' AND ' + tagNameTF + ' LESS ' + customNumUpper;}
				else {query[queryl] += tagNameTF + ' EQUAL ' + customNum;}
			}
		} else if (customNumWeight !== 0 && bBasicLogging) {console.log('customNumWeight was not zero but selected track had no custom number tags');}
		// Total score
		const originalScore = (originalWeightValue * 100) / totalWeight; // if it has tags missing then original Distance != totalWeight
		if (bProfile) {test.Print('Task #1: Reference track / theme', false);}
		
        // Create final query
		// Pre filtering by query greatly speeds up the next part (weight and graph distance calcs), but it requires variable queries according to the weights.
		// i.e. if genreWeight is set too high, then only same genre tracks would pass the later score/distance filter... 
		// But having the same values for other tags could make the track pass to the final pool too, specially for Graph method. 
		// So a variable pre-filter would be needed, calculated according to the input weight values and -estimated- later filters scoring.
		// Also an input track missing some tags could break the pre-filter logic if not adjusted.
        queryl = query.length;
		if (queryl === 0) {
			if (!originalScore) {
				console.log('No query available for selected track. Probably missing tags!');
				return;
			} else {query[queryl] = '';} // Pre-Filter may not be relevant according to weights...
		}
		const querylength = query.length;
		if (method === 'WEIGHT' && dyngenreWeight === 0) { // Weight method. Pre-filtering is really simple...
			if (querylength === 1 && !query[0].length) {query[querylength] = '';}
			else {query[querylength] = query_join(query, 'OR');} //join previous query's
		} else if (method === 'WEIGHT' && dyngenreWeight !== 0) { //Dyngenre method.
			query[querylength] = ''; // TODO: Add weight query, now is dynamically set
		} else { // Graph Method
			let influencesQuery = [];
			if (bUseAntiInfluencesFilter || bConditionAntiInfluences) { // Removes anti-influences using queries
				let influences = [];
				style_genreSet.forEach((styleGenre) => {
					let anti = bConditionAntiInfluences ? descr.getConditionalAntiInfluences(styleGenre) : descr.getAntiInfluences(styleGenre);
					if (anti.length) {influences.push(...descr.replaceWithSubstitutionsReverse(anti));}
				});
				// Even if the argument is known to be a genre or style, the output values may be both, genre and styles.. so we use both for the query
				if (influences.length) {
					influences = [...new Set(influences)];
					const tagNameTF = [...new Set(genreTag.concat(styleTag))].map((tag) => {return ((tag.indexOf('$') === -1) ? tag : _q(tag));}); // May be a tag or a function...
					const match = tagNameTF.some((tag) => {return tag.indexOf('$') !== -1}) ? 'HAS' : 'IS'; // Allow partial matches when using funcs
					let temp = query_combinations(influences, tagNameTF, 'OR', void(0), match); // min. array with 2 values or more if tags are remapped
					temp = 'NOT (' + query_join(temp, 'OR') + ')'; // flattens the array
					influencesQuery.push(temp);
				}
			}
			if (bUseInfluencesFilter) { // Outputs only influences using queries (and changes other settings!)
				let influences = [];
				style_genreSet.forEach((styleGenre) => {
					let infl = descr.getInfluences(styleGenre);
					if (infl.length) {influences.push(...descr.replaceWithSubstitutionsReverse(infl));}
				});
				// Even if the argument is known to be a genre or style, the output values may be both, genre and styles.. so we use both for the query
				if (influences.length) {
					influences = [...new Set(influences)];
					const tagNameTF = [...new Set(genreTag.concat(styleTag))].map((tag) => {return ((tag.indexOf('$') === -1) ? tag : _q(tag));}); // May be a tag or a function...
					const match = tagNameTF.some((tag) => {return tag.indexOf('$') !== -1}) ? 'HAS' : 'IS'; // Allow partial matches when using funcs
					let temp = query_combinations(influences, tagNameTF, 'OR', void(0), match); // min. array with 2 values or more if tags are remapped
					temp = _p(query_join(temp, 'OR')); // flattens the array. Here changes the 'not' part
					influencesQuery.push(temp);
				}
			}
			
			query[querylength] = influencesQuery.length ? query_join(influencesQuery, 'AND') : ''; // TODO: Add weight query, now is dynamically set
		}
		if (bSameArtistFilter && !bUseTheme) {
			let tags = fb.TitleFormat('[%ARTIST%]').EvalWithMetadb(sel).split(', ').filter(Boolean);
			let queryArtist = '';
			if (tags.length) {
				queryArtist = tags.map((artist) => {return 'ARTIST IS ' + artist;});
				queryArtist = 'NOT ' + _p(query_join(queryArtist, 'OR'));
			}
			if (queryArtist.length) {
				if (query[querylength].length) {query[querylength] = _p(query[querylength]) + ' AND ' + _p(queryArtist);}
				else {query[querylength] += queryArtist;}
			}
		}
		if (bSimilArtistsFilter && !bUseTheme) {
			const file = folders.data + 'searchByDistance_artists.json';
			const tagName = 'SIMILAR ARTISTS SEARCHBYDISTANCE';
			let similTags = fb.TitleFormat(_bt(tagName)).EvalWithMetadb(sel).split(', ').filter(Boolean);
			let querySimil = '';
			if (!similTags.length && _isFile(file)) {
				const data = _jsonParseFile(file, utf8);
				const artist = fb.TitleFormat('%ARTIST%').EvalWithMetadb(sel);
				if (data) {
					const dataArtist = data.find((obj) => {return obj.artist === artist;});
					if (dataArtist) {dataArtist.val.forEach((artistObj) => {similTags.push(artistObj.artist);});}
				}
				if (!bSameArtistFilter) {similTags.push(artist);} // Always add the original artist as a valid value
			}
			if (similTags.length) {
				querySimil = similTags.map((artist) => {return 'ARTIST IS ' + artist;});
				querySimil = query_join(querySimil, 'OR');
			}
			if (querySimil.length) {
				if (query[querylength].length) {query[querylength] = _p(query[querylength]) + ' AND ' + _p(querySimil);}
				else {query[querylength] += querySimil;}
			}
		}
		if (forcedQuery.length) { //Add user input query to the previous one
			if (query[querylength].length) {query[querylength] = _p(query[querylength]) + ' AND ' + _p(forcedQuery);}
			else {query[querylength] += forcedQuery;}
		}
		if (!query[querylength].length) {query[querylength] = 'ALL';}
		
		// Preload lib items
		const libraryItems = fb.GetLibraryItems();

		// Prefill tag Cache
		if (bTagsCache) {
			const missingOnCache = [genreTag, styleTag, moodTag, dateTag, keyTag, bpmTag, composerTag, customStrTag, customNumTag, ['TITLE'], [globTags.title]]
				.map((tagName) => {return tagName.map((subTagName) => {return (subTagName.indexOf('$') === -1 ? '%' + subTagName + '%' : subTagName);});})
				.map((tagName) => {return tagName.join(', ');}).filter(Boolean)
				.filter((tagName) => {return !tagsCache.cache.has(tagName);});
			if (missingOnCache.length) {
				console.log('Caching missing tags...');
				await tagsCache.cacheLibraryTags(missingOnCache, 100, 50, libraryItems.Convert(), true);
			}
		}
		
		// Load query
		if (bShowQuery) {console.log('Query created: ' + query[querylength]);}
		let handleList;
		try {handleList = fb.GetQueryItems(libraryItems, query[querylength]);} // Sanity check
		catch (e) {fb.ShowPopupMessage('Query not valid. Check query:\n' + query[querylength]); return;}
		if (bBasicLogging) {console.log('Items retrieved by query: ' + handleList.Count + ' tracks');}
		if (bProfile) {test.Print('Task #2: Query', false);}
		// Find and remove duplicates ~600 ms for 50k tracks
		if (bTagsCache) {
			handleList = await removeDuplicatesV3({handleList, sortOutput: '%TITLE% - %ARTIST% - $year(%DATE%)', bTagsCache});
		} else {
			handleList = removeDuplicatesV2({handleList, sortOutput: '%TITLE% - %ARTIST% - $year(%DATE%)'});
		}
		const tracktotal = handleList.Count;
		if (bBasicLogging) {console.log('Items retrieved by query (minus duplicates): ' + tracktotal + ' tracks');}
		if (!tracktotal) {console.log('Query created: ' + query[querylength]); return;}
        // Compute similarity distance by Weight and/or Graph
		// Similar Artists, Similar Styles, Dynamic Genre, Date Range & Weighting
        let scoreData = [];
		
		if (method === 'GRAPH') { // Sort by the things we will look for at the graph! -> Cache speedup
			let tfo = fb.TitleFormat([...new Set(genreTag.concat(styleTag))].join('|'));
			handleList.OrderByFormat(tfo, 1);
		}
		if (bProfile) {test.Print('Task #3: Remove Duplicates and sorting', false);}
		// Get the tag values for all the handle list. Skip those with weight 0.
		// Now flat is not needed, we have 1 array of tags per track [i][j]
		// Also filter using boolean to remove '' values within an array, so [''] becomes [] with 0 length, but it's done per track.
		// Using only boolean filter it's 3x faster than filtering by set, here bTagFilter becomes useful since we may skip +40K evaluations 
		let tagsArr = [];
		let z = 0;
		if (genreTag.length && (genreWeight !== 0 || dyngenreWeight !== 0 || method === 'GRAPH')) {tagsArr.push(genreTag.join(', '));}
		if (styleTag.length && (styleWeight !== 0 || dyngenreWeight !== 0 || method === 'GRAPH')) {tagsArr.push(styleTag.join(', '));}
		if (moodWeight !== 0) {tagsArr.push(moodTag.join(', '));}
		if (composerWeight !== 0) {tagsArr.push(composerTag.join(', '));}
		if (customStrWeight !== 0) {tagsArr.push(customStrTag.join(', '));}
		tagsArr.push('TITLE');
		tagsArr.push(...restTagNames);
		const tagsValByKey = [];
		let tagsVal = [];
		if (bTagsCache) {
			tagsArr = tagsArr.map((tagName) => {return (tagName.indexOf('$') === -1 && tagName.toLowerCase() !== 'skip' ? '%' + tagName + '%' : tagName);});
			tagsVal = tagsCache.getTags(tagsArr, handleList.Convert());
			tagsArr.forEach((tag, i) => {tagsValByKey[i] = tagsVal[tag];});
		} else {
			tagsVal = getTagsValuesV3(handleList, tagsArr);
			tagsArr.forEach((tag, i) => {tagsValByKey[i] = tagsVal.map((tag) => {return tag[i];});});
		}
		const genreHandle = (genreTag.length && (genreWeight !== 0 || dyngenreWeight !== 0 || method === 'GRAPH')) ? tagsValByKey[z++] : null;
		const styleHandle = (styleTag.length && (styleWeight !== 0 || dyngenreWeight !== 0 || method === 'GRAPH')) ? tagsValByKey[z++] : null;
		const moodHandle = (moodWeight !== 0) ? tagsValByKey[z++] : null;
		const composerHandle = (composerWeight !== 0) ? tagsValByKey[z++] : null;
		const customStrHandle = (customStrWeight !== 0) ? tagsValByKey[z++] : null;
		const titleHandle = tagsValByKey[z++];
		const [keyHandle, dateHandle, bpmHandle, customNumHandle] = tagsValByKey.slice(z);
		if (bProfile) {test.Print('Task #4: Library tags', false);}
		let i = 0;
		while (i < tracktotal) {
            let weightValue = 0;
			let mapDistance = Infinity; // We consider points are not linked by default
			let dyngenreNumberNew = 0;
			let dyngenreNew = [];
			
			// Get the tags according to weight and filter ''. Also create sets for comparison
			const genreNew = (genreWeight !== 0 || dyngenreWeight !== 0 || method === 'GRAPH') ? genreHandle[i].filter(bTagFilter ? (tag) => !genreStyleFilter.has(tag) : Boolean) : [];
			const styleNew = (styleWeight !== 0 || dyngenreWeight !== 0 || method === 'GRAPH') ? styleHandle[i].filter(bTagFilter ? (tag) => !genreStyleFilter.has(tag) : Boolean) : [];
			const moodNew = (moodWeight !== 0) ? moodHandle[i].filter(Boolean) : [];
			const composerNew = (composerWeight !== 0) ? composerHandle[i].filter(Boolean) : [];
			const customStrNew = (customStrWeight !== 0) ? customStrHandle[i].filter(Boolean) : [];
			if (bAscii) {
				[genreNew, styleNew, moodNew, composerNew, customStrNew].forEach((arr) => {
					arr.forEach((tag, i) => {arr[i] = _asciify(tag);});
				});
			}
			const genreNewSet = new Set(genreNew);
			const styleNewSet = new Set(styleNew);
			const moodNewSet = new Set(moodNew);
			const composerNewSet = new Set(composerNew);
			const customStrNewSet = new Set(customStrNew);
			
			const keyNew = (keyWeight !== 0) ? keyHandle[i][0] : '';
			const dateNew = (dateWeight !== 0 && dateHandle[i][0] !== '') ? Number(dateHandle[i][0]) : null;
			const bpmNew =(bpmWeight !== 0 && bpmHandle[i][0] !== '') ? Number(bpmHandle[i][0]) : null;
			const customNumNew = (customNumWeight !== 0 && customNumHandle[i][0] !== '') ? Number(customNumHandle[i][0]) : null;
			
			const style_genreSetNew = new Set(genreNew.concat(styleNew)).difference(map_distance_exclusions); // Remove exclusions
			
			// O(i*j*k) time
			// i = # tracks retrieved by query, j & K = # number of style/genre tags
			if (genreWeight !== 0 && genreNumber !== 0 && genreNew.length) {
				let common = genreSet.intersectionSize(genreNewSet);
				if (common) {
					weightValue += genreWeight / genreNumber * common;
				}
			}
			
			if (styleWeight !== 0 && styleNumber !== 0 && styleNew.length) {
				let common = styleSet.intersectionSize(styleNewSet);
				if (common) {
					weightValue += styleWeight / styleNumber * common;
				}
			}
			
			if (moodWeight !== 0 && moodNumber !== 0 && moodNew.length) {
				let common = moodSet.intersectionSize(moodNewSet);
				if (common) {
					weightValue += moodWeight / moodNumber * common;
				}
			}
			
			if (keyWeight !== 0 && keyLength !== 0 && keyNew.length) {
				if (key === keyNew) { // Not only fastest but also allows for arbitrary key notations (although only using simple matching)
					weightValue += keyWeight;
				} else if (keyRange !== 0){
					const camelotKeyNew = camelotWheel.getKeyNotationObjectCamelot(keyNew);
					const camelotKey = camelotWheel.getKeyNotationObjectCamelot(key);
					if (camelotKey && camelotKeyNew) {
						const bLetterEqual = (camelotKey.letter === camelotKeyNew.letter);
						const hourDifference = keyRange - Math.abs(camelotKey.hour - camelotKeyNew.hour);
						// Cross on wheel with length keyRange + 1, can change hour or letter, but not both without a penalty
						if ((hourDifference < 0 && bNegativeWeighting) || hourDifference > 0) {
							weightValue += (bLetterEqual) ? ((hourDifference + 1)/ (keyRange + 1)) * keyWeight : (hourDifference / keyRange) * keyWeight;  //becomes negative outside the allowed range!
						}
					}
				}
			}
			
			if (dateWeight !== 0 && date !== null) {
				if (dateNew !== null) {
					if (date === dateNew){
						weightValue += dateWeight;
					} else if (dateRange !== 0) {
						const dateDifference = dateRange - Math.abs(date -  dateNew);
						if ((dateDifference < 0 && bNegativeWeighting) || dateDifference > 0) {
							weightValue += (dateDifference / dateRange) * dateWeight;  //becomes negative outside the allowed range!
						}
					}
				}
			}
			
			if (bpmWeight !== 0 && bpm !== null) {
				if (bpmNew !== null) {
					if (bpm === bpmNew){
						weightValue += bpmWeight;
					} else if (bpmRange !== 0) {
						const iRange = bpm * bpmRange / 100;
						const bpmdifference = iRange - Math.abs(bpm -  bpmNew);
						if ((bpmdifference < 0 && bNegativeWeighting) || bpmdifference > 0) {
							weightValue += (bpmdifference / bpmRange / bpm * 100 ) * bpmWeight; //becomes negative outside the allowed range!
						}
					}
				}
			}
			
			if (composerWeight !== 0 && composerNumber !== 0 && composerNew.length) {
				let common = composerSet.intersectionSize(composerNewSet);
				if (common) {
					weightValue += composerWeight / composerNumber * common;
				}
			}
			
			if (customStrWeight !== 0 && customStrNumber !== 0 && customStrNew.length) {
				let common = customStrSet.intersectionSize(customStrNewSet);
				if (common) {
					weightValue += customStrWeight / customStrNumber * common;
				}
			}
			
			if (customNumWeight !== 0 && customNum !== null) {
				if (customNumNew !== null) {
					if (customNum === customNumNew){
						weightValue += customNumWeight;
					} else if (customNumRange !== 0) {
						const customNumdifference = customNumRange - Math.abs(customNum - customNumNew);
						if ((customNumdifference < 0 && bNegativeWeighting) || customNumdifference > 0) {
							weightValue += (customNumdifference / customNumRange) * customNumWeight;  //becomes negative outside the allowed range!
						}
					}
				}
			}
			
			if (dyngenreWeight !== 0 && dyngenreNumber !== 0) {
				if (style_genreSetNew.size !== 0) {
					for (let style_genreNew_i of style_genreSetNew) {
						const dyngenre_i = genre_style_map.get(style_genreNew_i);
						if (dyngenre_i) {dyngenreNew = dyngenreNew.concat(dyngenre_i);}
					}
				}
				dyngenreNumberNew = dyngenreNew.length;
				if (dyngenreNumberNew !== 0) {
					let j = 0;
					while (j < dyngenreNumber) {
						let h = 0;
							while (h < dyngenreNumberNew) {
								if (dyngenreNew[h] === dyngenre[j]) {
									weightValue += dyngenreWeight / dyngenreNumber;
									break;
								} else if (dyngenreRange !== 0) {
									const [valueLower, valueUpper, lowerLimit, upperLimit] = cyclicTagsDescriptor['dynamic_genre'](dyngenre[j], dyngenreRange, true);
									if (valueLower !== -1) { //All or none are -1
										if (valueLower > dyngenre[j]) { // we reached the limits and swapped values (x - y ... upperLimit + 1 = lowerLimit ... x ... x + y ... upperLimit)
											if (lowerLimit <= dyngenreNew[h] && dyngenreNew[h] <= valueLower) {  // (lowerLimit , x)
												weightValue += dyngenreWeight / dyngenreNumber;
												break;
											}
											else if (valueLower <= dyngenreNew[h] && dyngenreNew[h] <= dyngenre[j]) {  // (x, x + y)
												weightValue += dyngenreWeight / dyngenreNumber;
												break;
											}
											else if (valueUpper <= dyngenreNew[h] && dyngenreNew[h] <= upperLimit) { // (x - y, upperLimit)
												weightValue += dyngenreWeight / dyngenreNumber;
												break;
											}
										} else if (valueLower <= dyngenreNew[h] && dyngenreNew[h] <= valueUpper) {
											weightValue += dyngenreWeight / dyngenreNumber;
											break;
										}
									}
								}
							h++;
						}
						j++;
					}
				}
			}
			const score = round(weightValue * 10000 / originalScore / totalWeight, 1); // The original track will get a 100 score, even if it has tags missing (original Distance != totalWeight)
			
			if (method === 'GRAPH') {
				// Create cache if it doesn't exist. It may happen when calling the function too fast on first init (this avoids a crash)!
				if (!cacheLink) {cacheLink = new Map();}
				if (!cacheLinkSet) {cacheLinkSet = new Map();}
				// Weight filtering excludes most of the tracks before other calcs -> Much Faster than later! (40k tracks can be reduced to just ~1k)
				if (score >= minScoreFilter) {
					// Get the minimum distance of the entire set of tags (track B, i) to every style of the original track (A, j): 
					// Worst case is O(i*j*k*lg(n)) time, greatly reduced by caching results (since tracks may be unique but not their tag values)
					// where n = # nodes on map, i = # tracks retrieved by query, j & K = # number of style/genre tags
					// Pre-filtering number of tracks is the best approach to reduce calc time (!)
					// Distance cached at 2 points, for individual links (Rock -> Jazz) and entire sets ([Rock, Alt. Rock, Indie] -> [Jazz, Swing])
					const fromDiff = style_genreSet.difference(style_genreSetNew);
					const toDiff = style_genreSetNew.difference(style_genreSet);
					const difference = fromDiff.size < toDiff.size ? fromDiff : toDiff;
					const toStyleGenre = fromDiff.size < toDiff.size ? style_genreSetNew : style_genreSet;
					let mapKey = [[...difference].sort(),[...toStyleGenre].sort()].join(' -> ');
					if (cacheLinkSet.has(mapKey)) { // Mean distance from entire set (A,B,C) to (X,Y,Z)
						mapDistance = cacheLinkSet.get(mapKey);
					} else { // Calculate it if not found
						mapDistance = calcMeanDistance(allMusicGraph, style_genreSet, style_genreSetNew);
						cacheLinkSet.set(mapKey, mapDistance); // Caches the mean distance from entire set (A,B,C) to (X,Y,Z)
					}
				}
			} // Distance / style_genre_new_length < sbd_max_graph_distance / style_genre_length ?
			if (method === 'GRAPH') {
				if (mapDistance <= sbd_max_graph_distance) {
					scoreData.push({ index: i, name: titleHandle[i][0], score, mapDistance});
				}
			}
			if (method === 'WEIGHT') {
				if (score > minScoreFilter) {
					scoreData.push({ index: i, name: titleHandle[i][0], score });
				}
			}
            i++;
        }
		if (bProfile) {test.Print('Task #5: Score and Distance', false);}
		let poolLength = scoreData.length;
		if (method === 'WEIGHT') {
			scoreData.sort(function (a, b) {return b.score - a.score;});
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
				if (bMin && minScoreFilter !== scoreFilter) {console.log('Not enough tracks on pool with current score filter ' +  scoreFilter + '%, using minimum score instead ' + minScoreFilter + '%.');}
				console.log('Pool of tracks with similarity greater than ' + (bMin ? minScoreFilter : scoreFilter) + '%: ' + poolLength + ' tracks');
			}
		} 
		else { // GRAPH
			// Done on 3 steps. Weight filtering (done) -> Graph distance filtering (done) -> Graph distance sort
			// Now we check if all tracks are needed (over 'minScoreFilter') or only those over 'scoreFilter'.
			// TODO: FILTER DYNAMICALLY MAX DISTANCE*STYLES OR ABSOLUTE score?
			scoreData.sort(function (a, b) {return b.score - a.score;});
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
			scoreData.sort(function (a, b) {return a.mapDistance - b.mapDistance;}); // First sorted by graph distance, then by weight
			poolLength = scoreData.length;
			if (bMin && minScoreFilter !== scoreFilter) {console.log('Not enough tracks on pool with current score filter ' +  scoreFilter + '%, using minimum score instead ' + minScoreFilter + '%.');}
			if (bBasicLogging) {console.log('Pool of tracks with similarity greater than ' + (bMin ? minScoreFilter : scoreFilter) + '% and graph distance lower than ' + sbd_max_graph_distance +': ' + poolLength + ' tracks');}
		}
		
		// Post Filter (note there are no real duplicates at this point)
		if (bPoolFiltering) {
			let handlePoolArray = [];
			let i = poolLength;
			while (i--) {handlePoolArray.push(handleList[scoreData[i].index]);}
			let handlePool = new FbMetadbHandleList(handlePoolArray);
			handlePool = removeDuplicates({handleList: handlePool, checkKeys: poolFilteringTag, nAllowed: poolFilteringN}); // n + 1
			const [titleHandlePool] = getTagsValuesV4(handlePool, ['title'], void(0), void(0), null);
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
			if (bBasicLogging) {console.log('Pool of tracks after post-filtering, ' + ++poolFilteringN + ' tracks per ' + poolFilteringTag.join(', ') + ': ' + poolLength + ' tracks');}
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
				bSortRandom = bProgressiveListOrder = bScatterInstrumentals = false;
				if (key.length) {
					// Instead of predefining a mixing pattern, create one randomly each time, with predefined proportions
					const size = poolLength < playlistLength ? poolLength : playlistLength;
					const pattern = createHarmonicMixingPattern(size);  // On camelot_wheel_xxx.js
					if (bSearchDebug) {console.log(pattern);}
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
							const keyCurrent = keyHandle[index][0];
							camelotKeyCurrent = keyCurrent.length ? camelotWheel.getKeyNotationObjectCamelot(keyCurrent) : null;
							if (camelotKeyCurrent) {keyCache.set(index, camelotKeyCurrent);}
						} else {camelotKeyCurrent = keyCache.get(index);}
						// Delete from check selection
						toCheck.delete(indexScore);
						if (!toCheck.size) {break;}
						// Find next key
						nextKeyObj = camelotKeyCurrent ? camelotWheel[pattern[i]]({...camelotKeyCurrent}) : null; // Applies movement to copy of current key
						if (nextKeyObj) { // Finds next track, but traverse pool with random indexes...
							let bFound = false;
							for (const indexNewScore of toCheck) {
								const indexNew = scoreData[indexNewScore].index;
								if (!keyCache.has(indexNew)) {
									const keyNew = keyHandle[indexNew][0];
									camelotKeyNew = keyNew.length ? camelotWheel.getKeyNotationObjectCamelot(keyNew) : null;
									if (camelotKeyNew) {keyCache.set(indexNew, camelotKeyNew);}
									else {toCheck.delete(indexNew);}
								} else {camelotKeyNew = keyCache.get(indexNew);}
								if (camelotKeyNew) {
									if (nextKeyObj.hour === camelotKeyNew.hour && nextKeyObj.letter === camelotKeyNew.letter) {
										selectedHandlesArray.push(handleList[index]);
										selectedHandlesData.push(scoreData[indexScore]);
										if (bSearchDebug) {keyDebug.push(camelotKeyCurrent); keySharpDebug.push(camelotWheel.getKeyNotationSharp(camelotKeyCurrent)); patternDebug.push(pattern[i]);}
										nextIndex = indexNew; // Which will be used for next movement
										nextIndexScore = indexNewScore; // Which will be used for next movement
										bFound = true;
										break;
									}
								}
							}
							if (!bFound) { // If nothing is found, then continue next movement with current track
								camelotKeyNew = camelotKeyCurrent; // For debug console on last item
								if (j === 1) {j = 0; continue;}  // try once retrying this step with default movement
								else {
									pattern[i] = 'perfectMatch';
									i--;
									j++;
								}
							} else {j = 0;} // Reset retry counter if found 
						} else { // No tag or bad tag
							i--;
							if (toCheck.size) {nextIndexScore = [...toCheck][0]; nextIndex = scoreData[nextIndexScore].index;} // If tag was not found, then use next handle
						}
					}
					// Add tail
					selectedHandlesArray.push(handleList[nextIndex]); 
					selectedHandlesData.push(scoreData[nextIndexScore]);
					if (bSearchDebug) {keyDebug.push(camelotKeyNew); keySharpDebug.push(camelotWheel.getKeyNotationSharp(camelotKeyNew));}
					// Double pass
					if (bHarmonicMixDoublePass && poolLength >= playlistLength) {
						let tempPlaylistLength = selectedHandlesArray.length;
						if (tempPlaylistLength < playlistLength) {
							const toAdd = {};
							const toAddData = {};
							const keyMap = new Map();
							// Find positions where the remainder tracks could be placed as long as they have the same key than other track
							for (let i = 0;  i < poolLength; i++) {
								const currTrackData = scoreData[i];
								if (selectedHandlesData.indexOf(currTrackData) === -1) {
									const matchIdx = selectedHandlesData.findIndex((selTrackData, j) => {
										let idx = -1;
										if (keyMap.has(j)) {idx = keyMap.get(j);}
										else {idx = scoreData.indexOf(selTrackData); keyMap.set(j, idx);}
										const selKey = keyHandle[idx];
										return selKey[0] === keyHandle[i][0];
									});
									if (matchIdx !== -1) {
										const currTrack = handleList[currTrackData.index];
										if (toAdd.hasOwnProperty(matchIdx)) {toAdd[matchIdx].push(currTrack); toAddData[matchIdx].push(currTrackData);}
										else {toAdd[matchIdx] = [currTrack]; toAddData[matchIdx] = [currTrackData];}
										tempPlaylistLength++;
									}
								}
								if (tempPlaylistLength >= playlistLength) {break;}
							}
							// Add items in reverse order to not recalculate new idx
							const indexes = Object.keys(toAdd).sort().reverse();
							if (indexes.length) {
								let count = 0;
								for (let idx of indexes) {
									selectedHandlesArray.splice(idx, 0, ...toAdd[idx]);
									selectedHandlesData.splice(idx, 0, ...toAddData[idx]);
									count += toAdd[idx].length;
								}
								if (bSearchDebug) {console.log('Added ' + count + ' items on second pass');}
							}
						}
						// Debug console: using double pass reports may not be accurate since tracks on second pass are skipped on log
						if (bSearchDebug) {
							console.log('Keys from selection:');
							console.log(keyDebug);
							console.log(keySharpDebug);
							console.log('Pattern applied:');
							console.log(patternDebug); // Always has one item less than key arrays
						}
					}
				} else {console.log('Warning: Can not create in key mixing playlist, selected track has not a key tag.');}
			} else { // Standard methods
				if (poolLength > playlistLength) {
					if (bRandomPick){	//Random from pool
						const numbers = Array(poolLength).fill().map((_, index) => index).shuffle();
						const randomseed = numbers.slice(0, playlistLength); //random numbers from 0 to poolLength - 1
						let i = 0;
						while (i < playlistLength) {
							const i_random = randomseed[i];
							selectedHandlesArray.push(handleList[scoreData[i_random].index]);
							selectedHandlesData.push(scoreData[i_random]);
							i++;
						}
					} else { 
						if (probPick < 100) {	//Random but starting from high score picked tracks
							let randomseed = 0;
							let indexSelected = new Set(); //Save index and handles in parallel. Faster than comparing handles.
							let i = 0;
							while (indexSelectionArray.length < playlistLength) {
								randomseed = Math.floor((Math.random() * 100) + 1);
								if (randomseed < probPick) {
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
						} else {	//In order starting from high score picked tracks
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
								let propertyText = properties.hasOwnProperty('sbd_max_graph_distance') ? properties['sbd_max_graph_distance'][0] : SearchByDistance_properties['sbd_max_graph_distance'][0];
								console.log('Warning: Final Playlist selection length (= ' + i + ') lower/equal than ' + playlistLength + ' tracks. You may want to check \'' + propertyText + '\' parameter (= ' + sbd_max_graph_distance + ').');
							}
						}
						if (bBasicLogging) {
							let propertyText = properties.hasOwnProperty('scoreFilter') ? properties['scoreFilter'][0] : SearchByDistance_properties['scoreFilter'][0];
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
				if (bProgressiveListOrder) {console.log('Warning: bSortRandom and bProgressiveListOrder are both set to true, but last one overrides random order.');}
				for (let i = finalPlaylistLength - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					[selectedHandlesArray[i], selectedHandlesArray[j]] = [selectedHandlesArray[j], selectedHandlesArray[i]];
					[selectedHandlesData[i], selectedHandlesData[j]] = [selectedHandlesData[j], selectedHandlesData[i]];
				}
			}
			// Forces progressive changes on tracks, independently of the previous sorting/picking methods
			// Meant to be used along bRandomPick or low probPick, otherwise the playlist is already sorted!
			if (bProgressiveListOrder && (poolLength < playlistLength || bRandomPick || probPick < 100)) { //
				if (bSortRandom) {console.log('Warning: bProgressiveListOrder is overriding random sorting when used along bSortRandom.');}
				selectedHandlesData.sort(function (a, b) {return b.score - a.score;});
				selectedHandlesArray.sort(function (a, b) {return b.score - a.score;});
				if (method === 'GRAPH') { // First sorted by graph distance, then by score
					selectedHandlesData.sort(function (a, b) {return a.mapDistance - b.mapDistance;});
					selectedHandlesArray.sort(function (a, b) {return a.mapDistance - b.mapDistance;}); 
				}
			} else if (bProgressiveListOrder && !bRandomPick && probPick === 100) {console.log('Warning: bProgressiveListOrder has no use if tracks are already choosen by scoring order from pool.');}
			// Tries to intercalate vocal & instrumental tracks, breaking clusters of instrumental tracks. 
			// May override previous sorting methods (only for instrumental tracks). 
			// Finds instrumental track indexes, and move them to a random range without overlapping.
			if (bScatterInstrumentals) { // Could reuse scatter_by_tags but since we already have the tags... done here
				let newOrder = [];
				for (let i = 0; i < finalPlaylistLength; i++) {
					const index = selectedHandlesData[i].index;
					const genreNew = (genreWeight !== 0 || dyngenreWeight !== 0) ? genreHandle[index].filter(Boolean) : [];
					const styleNew = (styleWeight !== 0 || dyngenreWeight !== 0) ? styleHandle[index].filter(Boolean) : [];
					const tagSet_i = new Set(genreNew.concat(styleNew).map((item) => {return item.toLowerCase();}));
					if (tagSet_i.has('instrumental')) { // Any match, then add to reorder list
						newOrder.push(i);
					}
				}
				// Reorder
				const toMoveTracks = newOrder.length;
				if (bSearchDebug) {console.log('toMoveTracks: ' + toMoveTracks);}
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
						if (j === 0 && scatterInterval > 2) {j = 1;} // Don't put first track as instrumental if possible
						if (bSearchDebug) {console.log('bScatterInstrumentals: ' + index + '->' + j);}
						selectedHandlesArray.splice(j, 0, handle); // (at, 0, item)
						selectedHandlesData.splice(j, 0, removedData[index]); // (at, 0, item)
					});
				} else if (toMoveTracks) {console.log('Warning: Could not scatter instrumentals. Interval is too low. (' + toMoveTracks + ' < 2)');}
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
							for (let j = 0; j < arguments.length; j++) {newArgs = {...newArgs, ...arguments[j]};}
							newArgs = {...newArgs, bSearchDebug: false, bProfile: false, bShowQuery: false ,bShowFinalSelection: false, bProgressiveListCreation: false, bRandomPick: true, bSortRandom: true, bProgressiveListOrder: false, sel: newSel, bCreatePlaylist: false};
							// Get #n tracks per call and reuse lower scoring track as new selection
							let newSelectedHandlesArray;
							for (let i = 0; i < progressiveListCreationN; i++) {
								const prevtLength = selectedHandlesArray.length;
								if (bSearchDebug) {console.log('selectedHandlesArray.length: ' + prevtLength);}
								[newSelectedHandlesArray, , , newArgs['sel']] = do_searchby_distance(newArgs);
								// Get all new tracks, remove duplicates after merging with previous tracks and only then cut to required length
								selectedHandlesArray = removeDuplicatesV2({handleList: new FbMetadbHandleList(selectedHandlesArray.concat(newSelectedHandlesArray))}).Convert();
								if (selectedHandlesArray.length > prevtLength + newPlaylistLength) {selectedHandlesArray.length = prevtLength + newPlaylistLength;}
							}
						} else {console.log('Warning: Can not create a Progressive List. First Playlist selection contains less than the required number of tracks.');}
					} else {console.log('Warning: Can not create a Progressive List. Current finalPlaylistLength (' + finalPlaylistLength + ') and progressiveListCreationN (' + progressiveListCreationN + ') values would create a playlist with track groups size (' + newPlaylistLength + ') lower than the minimum 3.');}
				} else {console.log('Warning: Can not create a Progressive List. rogressiveListCreationN (' + progressiveListCreationN + ') must be greater than 1 (and less than 100 for safety).');}
			}
			// Logging
			if (bProfile) {test.Print('Task #6: Final Selection', false);}
			if (bShowFinalSelection && !bProgressiveListCreation) {
				let i = finalPlaylistLength;
				let conText = 'List of selected tracks:';
				while (i--) {conText += '\n                  ' + selectedHandlesData[i].name + ' - ' + selectedHandlesData[i].score + '/100 Simil.' + (typeof selectedHandlesData[i].mapDistance !== 'undefined' ? ' - ' + selectedHandlesData[i].mapDistance  + ' Graph' : '');}
				console.log(conText); // Much faster to output the entire list at once than calling log n times. It takes more than 2 secs with +50 Tracks!!
			}
		} else {
			if (bProfile) {test.Print('Task #6: Final Selection', false);}
			if (bBasicLogging) {
				let propertyText = '';
				if (method === 'GRAPH') {
					propertyText = properties.hasOwnProperty('sbd_max_graph_distance') ? properties['sbd_max_graph_distance'][0] : SearchByDistance_properties['sbd_max_graph_distance'][0];
					console.log('Warning: Final Playlist selection length (= ' + finalPlaylistLength + ') lower/equal than ' + playlistLength + ' tracks. You may want to check \'' + propertyText + '\' parameter (= ' + sbd_max_graph_distance + ').');
				}
				propertyText = properties.hasOwnProperty('scoreFilter') ? properties['scoreFilter'][0] : SearchByDistance_properties['scoreFilter'][0];
				console.log('Warning: Final Playlist selection length (= ' + finalPlaylistLength + ') lower/equal than ' + playlistLength + ' tracks. You may want to check \'' + propertyText + '\' parameter (= ' + scoreFilter + '%).');
			}
		}
		// Insert to playlist
		if (bCreatePlaylist) {
			// Look if target playlist already exists and clear it. Preferred to removing it, since then we can undo later...
			let playlistNameEval;
			const bIsTF =  /(%.*%)|(\$.*\(.*\))/.test(playlistName);
			if (bUseTheme) {
				const themeRegexp = /%sbd_theme%/gi;
				if (bIsTF && themeRegexp.test(playlistName)) {
					playlistNameEval = fb.TitleFormat(playlistName.replace(themeRegexp, '$puts(x,' + theme.name +')$get(x)')).Eval(true); // Hack to evaluate strings as true on conditional expressions
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
			if (bBasicLogging) {console.log('Final Playlist selection length: ' + finalPlaylistLength + ' tracks.');}
		} else {
			if (bBasicLogging) {console.log('Final selection length: ' + finalPlaylistLength + ' tracks.');}
		}
		// Share changes on cache (checks undefined to ensure no crash if it gets run on the first 3 seconds after loading a panel)
		if (typeof cacheLink !== 'undefined' && oldCacheLinkSize !== cacheLink.size && method === 'GRAPH') {window.NotifyOthers(window.Name + ' SearchByDistance: cacheLink map', cacheLink);}
		if (typeof cacheLinkSet !== 'undefined' && oldCacheLinkSetSize !== cacheLinkSet.size && method === 'GRAPH') {window.NotifyOthers(window.Name + ' SearchByDistance: cacheLinkSet map', cacheLinkSet);}
		// Output handle list (as array), the score data, current selection (reference track) and more distant track
		return [selectedHandlesArray, selectedHandlesData, sel, (poolLength ? handleList[scoreData[poolLength - 1].index] : -1)];
}


/* 
	Helpers
*/

function checkMethod(method) {
	return (new Set(['WEIGHT','GRAPH','DYNGENRE']).has(method));
}

// Save and load cache on json
function saveCache(cacheMap, path) {
	_save(path, JSON.stringify(Object.fromEntries(cacheMap), null, '\t'));
}

function loadCache(path) {
	let cacheMap = new Map();
	if (_isFile(path)) {
		if (utils.GetFileSize(path) > 400000000) {console.log('SearchByDistance: cache link file size exceeds 40 Mb, file is probably corrupted (try resetting it): ' + path);}
		let obj = _jsonParseFileCheck(path, 'Cache Link json', 'Search by Distance',  utf8);
		if (obj) { 
			obj = Object.entries(obj);
			obj.forEach((pair) => {
				if (pair[1] === null) {pair[1] = Infinity;} // TODO: Only 1 cache structure for both files
				if (pair[1].distance === null) {pair[1].distance = Infinity;}
			}); // stringify converts Infinity to null, this reverts the change
			cacheMap = new Map(obj);
		}
	}
	return cacheMap;
}

// Process nested recipes
function processRecipe(initialRecipe) {
	let toAdd = {};
	const processRecipeFile = (newRecipe) => {
		const newPath = !_isFile(newRecipe) && _isFile(recipePath + newRecipe) ? recipePath + newRecipe : newRecipe;
		const newRecipeObj = _jsonParseFileCheck(newPath, 'Recipe json', 'Search by Distance', utf8);
		if (!newRecipeObj) {console.log('Recipe not found: ' + newPath);}
		else {toAdd = {...newRecipeObj, ...toAdd};}
		return newRecipeObj;
	};
	let newRecipe = initialRecipe;
	while (newRecipe.length) {
		if (isString(newRecipe)) {
			const newRecipeObj = processRecipeFile(newRecipe);
			if (!newRecipeObj) {break;}
			newRecipe = newRecipeObj.recipe || '';
		} else if (isArrayStrings(newRecipe)) {
			for (const subRecipe of newRecipe) {
				const newRecipeObj = processRecipeFile(subRecipe);
				if (!newRecipeObj) {newRecipe = ''; break;}
				newRecipe = newRecipeObj.recipe || '';
				if (newRecipe.length) {toAdd = {...processRecipe(newRecipe), ...toAdd};}
			}
		} else {
			console.log('Recipe not found: ' + newRecipe);
			break;
		}
	}
	return toAdd;
}