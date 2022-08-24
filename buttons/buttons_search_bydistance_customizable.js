'use strict';
//12/08/22

include('..\\helpers\\buttons_xxx.js');
include('..\\helpers\\helpers_xxx_properties.js');

try {window.DefinePanel('Search by Distance Customizable Button', {author:'xxx'});} catch (e) {/* console.log('Search by Distance (CUSTOM) Buttons loaded.'); */} //May be loaded along other buttons

include('..\\main\\search_bydistance.js'); // Load after buttons_xxx.js so properties are only set once
include('..\\helpers\\buttons_sbd_menu_theme.js'); // Button menu
include('..\\helpers\\buttons_sbd_menu_recipe.js'); // Button menu
include('..\\helpers\\buttons_sbd_menu_config.js'); // Button menu
var prefix = 'sbd';
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
	customName:		['Name for the custom UI button', 'Customize!'],
	theme: 			['Path to theme file (instead of using selection)', ''],
	recipe: 		['Path to recipe file (instead of using properties)', ''],
	data: 			['Internal data', JSON.stringify({forcedTheme: '', theme: 'None', recipe: 'None'})],
	bTooltipInfo:	['Show shortcuts on tooltip', true]
};
newButtonsProperties = {...SearchByDistance_properties, ...newButtonsProperties}; // Add default properties at the beginning to be sure they work 
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0); // And retrieve
buttonsBar.list.push(newButtonsProperties);
// Update cache with user set tags
doOnce('Update SBD cache', debounce(updateCache, 3000))({properties: newButtonsProperties});

/*
	Some button examples for 'search_bydistance.js'. Look at that file to see what they do.
*/

addButton({
	'Search by Distance Customizable': new themedButton({x: 0, y: 0, w: _gr.CalcTextWidth(newButtonsProperties.customName[1], _gdiFont('Segoe UI', 12 * buttonsBar.config.scale)) + 30, h: 22}, newButtonsProperties.customName[1], function (mask) {
		if (mask === MK_SHIFT) {
			createThemeMenu(this).btn_up(this.currX, this.currY + this.currH);
		} else if (mask === MK_CONTROL) {
			createRecipeMenu(this).btn_up(this.currX, this.currY + this.currH);
		} else if (mask === MK_CONTROL + MK_SHIFT) {
			createConfigMenu(this).btn_up(this.currX, this.currY + this.currH);
		} else {
			if (this.buttonsProperties['customName'][1] === 'Customize!') {
				let input = '';
				try {input = utils.InputBox(window.ID, 'Button may be configured according to your liking using the menus or the properties panel (look for \'' + this.prefix + '...\').\nCheck tooltip to see how to set presets (recipes and themes).\nPredefined presets have been included but new ones may be easily created on .json using the existing ones as examples.\n\nEnter button name:', window.Name + ': Search by Distance Customizable Button', this.buttonsProperties.customName[1], true);}
				catch(e) {return;}
				if (!input.length) {return;}
				if (this.buttonsProperties.customName[1] !== input) {
					this.buttonsProperties.customName[1] = input;
					overwriteProperties(this.buttonsProperties); // Force overwriting
					this.text = input;
					const data = JSON.parse(this.buttonsProperties.data[1]);
					if (data.recipe === 'none') {
						window.ShowProperties();
					}
				}
			} else {
				do_searchby_distance({properties : this.buttonsProperties, theme: this.buttonsProperties.theme[1], recipe: this.buttonsProperties.recipe[1]}); // All set according to properties panel!
			}
		}
	}, null, void(0), buttonTooltip, prefix, newButtonsProperties, chars.wand)
});

// Helper
function buttonTooltip(parent) {
	const data = JSON.parse(parent.buttonsProperties.data[1]);
	const bTooltipInfo = parent.buttonsProperties.bTooltipInfo[1];
	let info = 'Search similar tracks according to configuration' + '\n-----------------------------------------------------';
	// Modifiers
	const bShift = utils.IsKeyPressed(VK_SHIFT);
	const bControl = utils.IsKeyPressed(VK_CONTROL);
	if (bShift && !bControl || bTooltipInfo) {info += '\n(Shift + L. Click to set theme) ->  ' + (data.forcedTheme.length ? data.forcedTheme : data.theme);}
	else {info += '\nTheme ->  ' + (data.forcedTheme.length ? data.forcedTheme : data.theme);}
	if (!bShift && bControl || bTooltipInfo) {info += '\n(Ctrl + L. Click to set recipe)  ->  ' + data.recipe;} 
	else {info += '\nRecipe  ' + data.recipe;}
	if (bShift && bControl || bTooltipInfo) {info += '\n(Shift + Ctrl + L. Click for other config and tools)';}
	return info;
}