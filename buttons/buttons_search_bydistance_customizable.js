'use strict';
//03/02/22

include('..\\helpers\\buttons_xxx.js');
include('..\\helpers\\helpers_xxx_properties.js');

try { //May be loaded along other buttons
	window.DefinePanel('Search by Distance Customizable Button', {author:'xxx'});
	var g_font = _gdiFont('Segoe UI', 12);
	var buttonCoordinates = {x: 0, y: 0, w: 98, h: 22};
} catch (e) {
	buttonCoordinates = {x: 0, y: 0, w: buttonsBar.config.buttonOrientation === 'x' ? 98 : buttonCoordinates.w, h: buttonsBar.config.buttonOrientation === 'y' ? 22 : buttonCoordinates.h}; // Reset 
	console.log('Search by Distance (CUSTOM) Buttons loaded.');
}
include('..\\main\\search_bydistance.js'); // Load after buttons_xxx.js so properties are only set once
include('..\\helpers\\buttons_sbd_menu_theme.js'); // Button menu
include('..\\helpers\\buttons_sbd_menu_recipe.js'); // Button menu
include('..\\helpers\\buttons_sbd_menu_config.js'); // Button menu
var prefix = 'sbd';
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
	customName: ['Name for the custom UI button', 'Customize!'],
	theme: 		['Path to theme file (instead of using selection)', ''],
	recipe: 	['Path to recipe file (instead of using properties)', ''],
	data: 		['Internal data', JSON.stringify({forcedTheme: '', theme: 'None', recipe: 'None'})],
};
newButtonsProperties = {...SearchByDistance_properties, ...newButtonsProperties}; // Add default properties at the beginning to be sure they work 
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0); // And retrieve
buttonsBar.list.push(newButtonsProperties);
// Update cache with user set tags
doOnce('Update SBD cache', debounce(updateCache, 3000))({properties: newButtonsProperties});
if (buttonsBar.config.buttonOrientation === 'x') {buttonCoordinates.w = _gr.CalcTextWidth(newButtonsProperties.customName[1], g_font) + 50;}

// we change the default coordinates here to accommodate text
if (buttonsBar.config.buttonOrientation === 'x') {buttonCoordinates.w += 5;}

/*	
	Some button examples for 'search_bydistance.js'. Look at that file to see what they do.
*/

var newButtons = {
    SimilarUserSet: new SimpleButton(calcNextButtonCoordinates(buttonCoordinates, void(0), buttonsBar.config.buttonOrientation === 'x' ? true : false).x, calcNextButtonCoordinates(buttonCoordinates, void(0), buttonsBar.config.buttonOrientation === 'x' ? false : true).y, buttonCoordinates.w, buttonCoordinates.h, newButtonsProperties.customName[1], function (mask) {
		if (mask === MK_SHIFT) {
			createThemeMenu(this).btn_up(this.x, this.y + this.h);
		} else if (mask === MK_CONTROL) {
			createRecipeMenu(this).btn_up(this.x, this.y + this.h);
		} else if (mask === MK_CONTROL + MK_SHIFT) {
			createConfigMenu(this).btn_up(this.x, this.y + this.h);
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
}, null, g_font, buttonTooltip, prefix, newButtonsProperties, chars.wand)
};
// Check if the button list already has the same button ID
for (var buttonName in newButtons) {
	if (buttons.hasOwnProperty(buttonName)) {
		// fb.ShowPopupMessage('Duplicated button ID (' + buttonName + ') on ' + window.Name);
		// console.log('Duplicated button ID (' + buttonName + ') on ' + window.Name);
		Object.defineProperty(newButtons, buttonName + Object.keys(buttons).length, Object.getOwnPropertyDescriptor(newButtons, buttonName));
		delete newButtons[buttonName];
	}
}
buttons = {...buttons, ...newButtons};

// Helper
function buttonTooltip(parent) {
	const data = JSON.parse(parent.buttonsProperties.data[1]);
	return ('Search similar tracks according to configuration\n-----------------------------------------------------\n(Shift + L. Click to set theme) ->  ' + (data.forcedTheme.length ? data.forcedTheme : data.theme) + '\n(Ctrl + L. Click to set recipe)  ->  ' + data.recipe + '\n(Shift + Ctrl + L. Click for other config and tools)');
}