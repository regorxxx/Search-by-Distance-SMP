'use strict';
//11/08/25

include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable */
/* global menu_panelProperties:readable */
include('..\\helpers\\buttons_xxx_menu.js');
/* global settingsMenu:readable  */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, MK_SHIFT:readable, VK_SHIFT:readable, globRegExp:readable, doOnce:readable, debounce:readable */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, _p:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable, chars:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable */
include('..\\main\\search_by_distance\\search_by_distance.js'); // Load after buttons_xxx.js so properties are only set once
/* global SearchByDistance_properties:readable, sbd:readable, updateCache:readable, findStyleGenresMissingGraphCheck:readable, testBaseTags:readable */
include('helpers\\buttons_sbd_menu_presets.js'); // Button menu
/* global choosePresetMenu:readable */
var version = sbd.version; // NOSONAR[global]

try { window.DefineScript(sbd.name + ' Basic Buttons', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) { /* May be loaded along other buttons */ } // eslint-disable-line no-unused-vars

var prefix = 'sbd'; // NOSONAR[global]
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { // NOSONAR[global]
	bIconMode: ['Icon-only mode', false, { func: isBoolean }, false]
};
newButtonsProperties = { ...SearchByDistance_properties, ...newButtonsProperties }; // Add default properties at the beginning to be sure they work
delete newButtonsProperties.probPick;
delete newButtonsProperties.minScoreFilter;
delete newButtonsProperties.scoreFilter;
delete newButtonsProperties.graphDistance;
delete newButtonsProperties.bSameArtistFilter;
delete newButtonsProperties.bRandomPick;
delete newButtonsProperties.bInversePick;
delete newButtonsProperties.bSortRandom;
delete newButtonsProperties.bInverseListOrder;
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
delete newButtonsProperties.sortBias;
delete newButtonsProperties.artistRegionFilter;
delete newButtonsProperties.genreStyleRegionFilter;
delete newButtonsProperties.dynQueries;
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
{
	const properties = getPropertiesPairs(newButtonsProperties, prefix, 0);
	newButtonsProperties = properties;
	buttonsBar.list.push(properties);
	// Update cache with user set tags
	doOnce('Update SBD cache', debounce(updateCache, 3000))({ properties });
	// Make the user check their tags before use...
	if (!sbd.panelProperties.firstPopup[1]) {
		doOnce('findStyleGenresMissingGraphCheck', debounce(findStyleGenresMissingGraphCheck, 500))(properties);
	}
	// Test tags
	testBaseTags(JSON.parse(newButtonsProperties.tags[1]));
}

/*
	Some button examples for 'search_by_distance.js'. Look at that file to see what they do. Note you must explicitly pass all arguments to make them work, since it's within buttons framework. If we were calling searchByDistance() outside buttons, it would work with default arguments.
*/

addButton({
	[sbd.name + ' basic']: new ThemedButton({
		coordinates: { x: 0, y: 0, w: _gr.CalcTextWidth('Similar Tracks', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 },
		text: 'Similar Tracks',
		func: function (mask) {
			if (mask === MK_SHIFT) {
				settingsMenu(this, true, ['buttons_music_map_basic.js'], { bAdvTitle: { popup: globRegExp.title.desc } }).btn_up(this.currX, this.currY + this.currH);
			} else {
				choosePresetMenu(this).btn_up(this.currX, this.currY + this.currH);
			}
		},
		description: buttonTooltipSbd,
		prefix, buttonsProperties: newButtonsProperties,
		icon: chars.wand
	})
});

// Helper
function buttonTooltipSbd() {
	let info = 'Search similar tracks by acoustic-folksonomy models:';
	info += '\nMethod:\t' + this.buttonsProperties.method[1];
	const sort = (
		(this.buttonsProperties.bSmartShuffle[1] ? 'Smart Shuffle' : '')
		|| (this.buttonsProperties.bInKeyMixingPlaylist[1] ? 'Harmonic Mix' : '')
		|| ('Random sorting')
	);
	info += sort ? '   ' + _p(sort) : '';
	info += '\nTracks:\t' + this.buttonsProperties.playlistLength[1];
	// Modifiers
	const bShift = utils.IsKeyPressed(VK_SHIFT);
	const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
	if (bShift || bInfo) {
		info += '\n-----------------------------------------------------';
		info += '\n(Shift + L. Click to open config menu)';
	}
	return info;
}