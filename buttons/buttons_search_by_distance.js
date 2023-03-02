'use strict';
//28/02/23

include('..\\helpers\\buttons_xxx.js');
include('..\\helpers\\helpers_xxx_properties.js');
include('..\\helpers\\buttons_xxx_menu.js');

try {window.DefineScript('Search by Distance Buttons', {author:'xxx', features: {drag_n_drop: false}});} catch (e) {/* console.log('Search by Distance Buttons loaded.'); */} //May be loaded along other buttons

include('..\\main\\search_by_distance\\search_by_distance.js'); // Load after buttons_xxx.js so properties are only set once
include('..\\helpers\\helpers_xxx_properties.js');
var prefix = 'sbd';
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
	bIconMode:		['Icon-only mode?', false, {func: isBoolean}, false]
};
newButtonsProperties = {...SearchByDistance_properties, ...newButtonsProperties}; // Add default properties at the beginning to be sure they work 
delete newButtonsProperties.probPick;
delete newButtonsProperties.minScoreFilter;
delete newButtonsProperties.scoreFilter;
delete newButtonsProperties.graphDistance;
delete newButtonsProperties.bSameArtistFilter;
delete newButtonsProperties.bRandomPick;
delete newButtonsProperties.bSortRandom;
delete newButtonsProperties.bProgressiveListOrder;
delete newButtonsProperties.bUseAntiInfluencesFilter;
delete newButtonsProperties.bConditionAntiInfluences;
delete newButtonsProperties.bUseInfluencesFilter;
delete newButtonsProperties.bSimilArtistsFilter;
delete newButtonsProperties.poolFilteringTag;
delete newButtonsProperties.poolFilteringN;
delete newButtonsProperties.bProgressiveListCreation;
delete newButtonsProperties.progressiveListCreationN;
delete newButtonsProperties.bHarmonicMixDoublePass;
delete newButtonsProperties.bAscii;
delete newButtonsProperties.bAdvTitle;
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
{
	const properties = getPropertiesPairs(newButtonsProperties, prefix, 0);
	newButtonsProperties = properties;
	buttonsBar.list.push(properties);
	// Update cache with user set tags
	doOnce('Update SBD cache', debounce(updateCache, 3000))({properties});
	// Make the user check their tags before use...
	if (!sbd.panelProperties.firstPopup[1]) {
		doOnce('findStyleGenresMissingGraphCheck', debounce(findStyleGenresMissingGraphCheck, 500))(properties);
	}
}

/*
	Some button examples for 'search_by_distance.js'. Look at that file to see what they do. Note you must explicitly pass all arguments to make them work, since it's within buttons framework. If we were calling searchByDistance() outside buttons, it would work with default arguments.
*/

addButton({
	'Search by Distance nearest tracks': new themedButton({x: 0, y: 0, w: _gr.CalcTextWidth('Nearest Tracks', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) /_scale(buttonsBar.config.scale), h: 22}, 'Nearest Tracks', function (mask) {
		if (mask === MK_SHIFT) {
			settingsMenu(this, true, ['buttons_search_by_distance.js'], {bAdvTitle: {popup: globRegExp.title.desc}}).btn_up(this.currX, this.currY + this.currH);
		} else {
			// Mix with only nearest tracks
			const tags = JSON.parse(this.buttonsProperties.tags[1]);
			tags.genre.weight = 15; tags.style.weight = 10; tags.mood.weight = 5; tags.key.weight = 10; tags.date.weight = 25; tags.bpm.weight = 5;
			tags.date.range = 15; tags.bpm.range = 25;
			tags.dynGenre.weight = 25; tags.dynGenre.range = 1;
			const defArgs = {tags, bRandomPick: true, bHarmonicMixDoublePass: true, properties: this.buttonsProperties}
			const args = {...defArgs, minScoreFilter: 65, scoreFilter: 70, graphDistance: music_graph_descriptors.intra_supergenre / 2};
			searchByDistance(args);
		}
	}, null, void(0), buttonTooltipSbd, prefix, newButtonsProperties, chars.wand, void(0), {descriptionText: 'Random mix with only nearest tracks'}),
	'Search by Distance similar tracks': new themedButton({x: 0, y: 0, w: _gr.CalcTextWidth('Similar Tracks', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) /_scale(buttonsBar.config.scale), h: 22}, 'Similar Tracks', function (mask) {
		if (mask === MK_SHIFT) {
			settingsMenu(this, true, ['buttons_search_by_distance.js'], {bAdvTitle: {popup: globRegExp.title.desc}}).btn_up(this.currX, this.currY + this.currH);
		} else {
			// Mix a bit varied on styles/genres most from the same decade
			const tags = JSON.parse(this.buttonsProperties.tags[1]);
			tags.genre.weight = 15; tags.style.weight = 10; tags.mood.weight = 5; tags.key.weight = 5; tags.date.weight = 25; tags.bpm.weight = 5;
			tags.date.range = 15; tags.bpm.range = 25;
			tags.dynGenre.weight = 10; tags.dynGenre.range = 1;
			const defArgs = {tags, bRandomPick: true, bHarmonicMixDoublePass: true, properties: this.buttonsProperties}
			const args = {...defArgs, minScoreFilter: 55, scoreFilter: 60, graphDistance: music_graph_descriptors.cluster};
			searchByDistance(args);
		}
	}, null, void(0), buttonTooltipSbd, prefix, newButtonsProperties, chars.wand, void(0), {descriptionText: 'Random mix a bit varied on styles (but similar genre), most tracks within a decade'}),
	'Search by Distance similar genres': new themedButton({x: 0, y: 0, w: _gr.CalcTextWidth('Similar Genres', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) /_scale(buttonsBar.config.scale), h: 22}, 'Similar Genres', function (mask) {
		if (mask === MK_SHIFT) {
			settingsMenu(this, true, ['buttons_search_by_distance.js'], {bAdvTitle: {popup: globRegExp.title.desc}}).btn_up(this.currX, this.currY + this.currH);
		} else {
			// Mix even more varied on styles/genres most from the same decade
			const tags = JSON.parse(this.buttonsProperties.tags[1]);
			tags.genre.weight = 0; tags.style.weight = 5; tags.mood.weight = 15; tags.key.weight = 10; tags.date.weight = 25; tags.bpm.weight = 5;
			tags.date.range = 15; tags.bpm.range = 25;
			tags.dynGenre.weight = 10; tags.dynGenre.range = 2;
			const defArgs = {tags, bRandomPick: true, bHarmonicMixDoublePass: true, properties: this.buttonsProperties}
			const args = {...defArgs, minScoreFilter: 55, scoreFilter: 60, graphDistance: music_graph_descriptors.intra_supergenre * 3/2};
			searchByDistance(args);
		}
	}, null, void(0), buttonTooltipSbd, prefix, newButtonsProperties, chars.wand, void(0), {descriptionText: 'Random mix even more varied on styles/genres, most tracks within a decade'}),
	'Search by Distance similar mood': new themedButton({x: 0, y: 0, w: _gr.CalcTextWidth('Similar Mood', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) /_scale(buttonsBar.config.scale), h: 22}, 'Similar Mood', function (mask) {
		if (mask === MK_SHIFT) {
			settingsMenu(this, true, ['buttons_search_by_distance.js'], {bAdvTitle: {popup: globRegExp.title.desc}}).btn_up(this.currX, this.currY + this.currH);
		} else {
			// Mix with different genres but same mood from any date
			const tags = JSON.parse(this.buttonsProperties.tags[1]);
			tags.genre.weight = 0; tags.style.weight = 5; tags.mood.weight = 15; tags.key.weight = 10; tags.date.weight = 0; tags.bpm.weight = 5;
			tags.date.range = 0; tags.bpm.range = 25;
			tags.dynGenre.weight = 5; tags.dynGenre.range = 4;
			const defArgs = {tags, bRandomPick: true, bHarmonicMixDoublePass: true, properties: this.buttonsProperties}
			const args = {...defArgs, minScoreFilter: 45, scoreFilter: 50, graphDistance: music_graph_descriptors.intra_supergenre * 4};
			searchByDistance(args);
		}
	}, null, void(0), buttonTooltipSbd, prefix, newButtonsProperties, chars.wand, void(0), {descriptionText: 'Random mix with different genres but same mood from any date'}),
});

// Helper
function buttonTooltipSbd(parent) {
	let info = parent.descriptionText + ':';
	info += '\nMethod:\t' + parent.buttonsProperties.method[1];
	const sort = (
		(parent.buttonsProperties.bSmartShuffle[1] ? 'Smart Shuffle' : '') 
		|| (parent.buttonsProperties.bInKeyMixingPlaylist[1] ? 'Harmonic Mix' : '')
		|| ('Random sorting')
	);
	info += sort ? '   ' + _p(sort) : '';
	info += '\nTracks:\t' + parent.buttonsProperties.playlistLength[1];
	// Modifiers
	const bShift = utils.IsKeyPressed(VK_SHIFT);
	const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
	if (bShift || bInfo) {
		info += '\n-----------------------------------------------------';
		info += '\n(Shift + L. Click to open config menu)';
	}
	return info;
}