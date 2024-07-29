'use strict';
//25/07/24

include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, MK_SHIFT:readable, VK_SHIFT:readable, MK_CONTROL:readable, VK_CONTROL:readable, doOnce:readable, debounce:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable, overwriteProperties:readable */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, isJSON:readable, _p:readable , isStringWeak:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable, chars:readable */
include('..\\helpers\\helpers_xxx_file.js');
/* global _isFile:readable, utf8:readable, _jsonParseFileCheck:readable, WshShell:readable , popup:readable */
include('..\\main\\search_by_distance\\search_by_distance.js'); // Load after buttons_xxx.js so properties are only set once
/* global SearchByDistance_properties:readable, sbd:readable, searchByDistance:readable, updateCache:readable, findStyleGenresMissingGraphCheck:readable, testBaseTags:readable, recipePath:readable, testRecipe:readable */
include('helpers\\buttons_sbd_menu_theme.js'); // Button menu
/* global createThemeMenu:readable */
include('helpers\\buttons_sbd_menu_recipe.js'); // Button menu
/* global createRecipeMenu:readable */
include('helpers\\buttons_sbd_menu_config.js'); // Button menu
/* global createConfigMenu:readable */

var version = sbd.version; // NOSONAR [shared on files]

try { window.DefineScript('Search by Distance Customizable Button', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) { /* May be loaded along other buttons */ }

var prefix = 'sbd'; // NOSONAR [shared on files]
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { // NOSONAR [shared on files]
	customName: ['Name for the custom UI button', 'Customize!', { func: isStringWeak }, 'Customize!'],
	theme: ['Path to theme file (instead of using selection)', '', { func: isStringWeak }, ''],
	recipe: ['Path to recipe file (instead of using properties)', '', { func: isStringWeak }, ''],
	data: ['Internal data', JSON.stringify({ forcedTheme: '', theme: 'None', recipe: 'None' }), { func: isJSON }, JSON.stringify({ forcedTheme: '', theme: 'None', recipe: 'None' })],
	bTooltipInfo: ['Show shortcuts on tooltip', true, { func: isBoolean }, true],
	bIconMode: ['Icon-only mode?', false, { func: isBoolean }, false]
};
newButtonsProperties = { ...SearchByDistance_properties, ...newButtonsProperties }; // Add default properties at the beginning to be sure they work
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0); // And retrieve
buttonsBar.list.push(newButtonsProperties);
// Update cache with user set tags
doOnce('Update SBD cache', debounce(updateCache, 3000))({ properties: newButtonsProperties });
// Make the user check their tags before use...
if (!sbd.panelProperties.firstPopup[1]) {
	doOnce('findStyleGenresMissingGraphCheck', debounce(findStyleGenresMissingGraphCheck, 500))(newButtonsProperties);
}

// Test tags
testBaseTags(JSON.parse(newButtonsProperties.tags[1]));

/*
	Some button examples for 'search_by_distance.js'. Look at that file to see what they do.
*/
addButton({
	'Search by Distance Customizable': new ThemedButton({ x: 0, y: 0, w: _gr.CalcTextWidth(newButtonsProperties.customName[1], _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 35 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 }, newButtonsProperties.customName[1], function (mask) {
		if (mask === MK_SHIFT) {
			createConfigMenu(this).btn_up(this.currX, this.currY + this.currH);
		} else if (mask === MK_CONTROL) {
			createRecipeMenu(this).btn_up(this.currX, this.currY + this.currH);
		} else if (mask === MK_CONTROL + MK_SHIFT) {
			createThemeMenu(this).btn_up(this.currX, this.currY + this.currH);
		} else {
			if (this.buttonsProperties['customName'][1] === 'Customize!') { // NOSONAR
				let input = '';
				try { input = utils.InputBox(window.ID, 'Button may be configured according to your liking using the menus or the properties panel (look for \'' + this.prefix + '...\').\nCheck tooltip to see how to set presets (recipes and themes).\nPredefined presets have been included but new ones may be easily created on .json using the existing ones as examples.\n\nEnter button name:', window.Name + ': Search by Distance Customizable Button', this.buttonsProperties.customName[1], true); }
				catch (e) { return; }
				if (!input.length) { return; }
				if (this.buttonsProperties.customName[1] !== input) {
					this.buttonsProperties.customName[1] = input;
					overwriteProperties(this.buttonsProperties); // Force overwriting
					this.adjustNameWidth(input);
					const data = JSON.parse(this.buttonsProperties.data[1]);
					if (data.recipe === 'none') {
						window.ShowProperties();
					}
				}
			} else {
				searchByDistance({ properties: this.buttonsProperties, theme: this.buttonsProperties.theme[1], recipe: this.buttonsProperties.recipe[1], parent: this }); // All set according to properties panel!
			}
		}
	}, null, void (0), buttonTooltipSbdCustom, prefix, newButtonsProperties, chars.wand, void (0), void (0),
	{
		'on_notify_data': (parent, name, info) => {
			if (name === 'bio_imgChange' || name === 'biographyTags' || name === 'bio_chkTrackRev' || name === 'xxx-scripts: panel name reply') { return; }
			if (!name.startsWith('Search by Distance')) { return; }
			switch (name) { // NOSONAR
				case 'Search by Distance: share configuration': {
					if (info) {
						if (info.notifyThis && parent.name === info.name) { return; } // Don't apply to same button
						parent.switchHighlight(true);
						const answer = WshShell.Popup('Apply current configuration to highlighted button?\nCheck buttons bar.', 0, window.Name + ': Search by distance', popup.question + popup.yes_no);
						if (answer === popup.yes) {
							parent.buttonsProperties.tags[1] = String(info.tags[1]);
							parent.buttonsProperties.forcedQuery[1] = String(info.forcedQuery[1]);
							parent.buttonsProperties.genreStyleFilterTag[1] = String(info.genreStyleFilterTag[1]);
							parent.buttonsProperties.poolFilteringTag[1] = String(info.poolFilteringTag[1]);
							parent.buttonsProperties.checkDuplicatesByTag[1] = String(info.checkDuplicatesByTag[1]);
							parent.buttonsProperties.smartShuffleTag[1] = String(info.smartShuffleTag[1]);
							overwriteProperties(parent.buttonsProperties);
						}
						parent.switchHighlight(false);
						window.Repaint();
					}
					break;
				}
			}
		}
	},
	(parent) => { // Update tooltip on init
		const properties = parent.buttonsProperties;
		parent.recipe = {
			recipe: properties.recipe[1].length ? processRecipePlaceholder(properties.recipe[1], JSON.parse(properties.tags[1])) : null,
			name: properties.recipe[1] || ''
		};
	},
	{ scriptName: 'Search-by-Distance-SMP', version })
});

// Helper
function buttonTooltipSbdCustom(parent) {
	const properties = parent.buttonsProperties;
	const data = JSON.parse(properties.data[1]);
	const bTooltipInfo = properties.bTooltipInfo[1];
	const recipe = parent.recipe.recipe || {};
	let info = 'Search similar tracks by acoustic-folksonomy models:';
	info += '\nRecipe:\t' + data.recipe;
	info += '\nTheme:\t' + (data.forcedTheme.length ? data.forcedTheme : data.theme);
	info += '\nMethod:\t' + (Object.hasOwn(recipe, 'method') ? recipe.method : properties.method[1]);
	const sort = (
		((Object.hasOwn(recipe, 'bSmartShuffle') ? recipe.bSmartShuffle : properties.bSmartShuffle[1])
			? 'Smart Shuffle'
			: ''
		) || ((Object.hasOwn(recipe, 'bInKeyMixingPlaylist') ? recipe.bInKeyMixingPlaylist : properties.bInKeyMixingPlaylist[1])
			? 'Harmonic Mix'
			: ''
		) || ((Object.hasOwn(recipe, 'bSortRandom') ? recipe.bSortRandom : properties.bSortRandom[1])
			? 'Random'
			: ''
		) || ((Object.hasOwn(recipe, 'bProgressiveListOrder') ? recipe.bProgressiveListOrder : properties.bProgressiveListOrder[1])
			? 'Score'
			: ''
		)) +
		(
			(Object.hasOwn(recipe, 'bProgressiveListCreation') ? recipe.bProgressiveListCreation : properties.bProgressiveListCreation[1])
				? ' - Progressive playlist'
				: ''
		) +
		(
			(Object.hasOwn(recipe, 'artistRegionFilter') ? recipe.artistRegionFilter : properties.artistRegionFilter[1]) !== -1 || (Object.hasOwn(recipe, 'genreStyleRegionFilter') ? recipe.genreStyleRegionFilter : properties.genreStyleRegionFilter[1]) !== -1
				? ' - Cultural filter'
				: ''
		);
	info += sort ? '   ' + _p(sort) : '';
	info += '\nTracks:\t' + properties.playlistLength[1];
	info += '\n-----------------------------------------------------';
	// Modifiers
	const bShift = utils.IsKeyPressed(VK_SHIFT);
	const bControl = utils.IsKeyPressed(VK_CONTROL);
	if (bShift && !bControl || bTooltipInfo) { info += '\n(Shift + L. Click for other config and tools)'; }
	if (!bShift && bControl || bTooltipInfo) { info += '\n(Ctrl + L. Click to set recipe)'; }
	if (bShift && bControl || bTooltipInfo) { info += '\n(Shift + Ctrl + L. Click to set theme)'; }
	return info;
}

function processRecipePlaceholder(recipeFile, tags) {
	let recipe = {};
	if (recipeFile.length) {
		recipe = _isFile(recipeFile)
			? _jsonParseFileCheck(recipeFile, 'Recipe json', 'Search by distance', utf8) || {}
			: _isFile(recipePath + recipeFile)
				? _jsonParseFileCheck(recipePath + recipeFile, 'Recipe json', 'Search by distance', utf8) || {}
				: {};
		if (Object.keys(recipe).length !== 0) {
			const result = testRecipe({ json: recipe, baseTags: tags });
			if (!result.valid) { console.popup(result.report.join('\n\t- '), 'Recipe error'); }
			// Process nested recipes
			if (Object.hasOwn(recipe, 'recipe')) {
				const toAdd = processRecipePlaceholder(recipe.recipe);
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
		} else {
			console.log('Recipe file not found:\n\t', recipeFile); // DEBUG
			fb.ShowPopupMessage('Recipe  file not found:\n' + recipeFile, 'Search by distance');
		}
	}
	return recipe;
}