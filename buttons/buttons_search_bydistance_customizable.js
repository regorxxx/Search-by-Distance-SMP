'use strict';

include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\buttons_xxx.js');
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\helpers_xxx_properties.js');

try { //May be loaded along other buttons
	window.DefinePanel('Search by Distance Customizable Button', {author:'xxx'});
	var g_font = _gdiFont('Segoe UI', 12);
	var buttonCoordinates = {x: 0, y: 0, w: 98, h: 22};
	var buttonOrientation = 'x';
} catch (e) {
	buttonCoordinates = {x: 0, y: 0, w: buttonOrientation === 'x' ? 98 : buttonCoordinates.w , h: buttonOrientation === 'y' ? 22 : buttonCoordinates.h}; // Reset 
	console.log('Search by Distance Buttons loaded.');
}
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\main\\search_bydistance.js'); // Load after buttons_xxx.js so properties are only set once
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\buttons_sbd_menu_theme.js'); // Button menu
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\buttons_sbd_menu_recipe.js'); // Button menu
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\buttons_sbd_menu_config.js'); // Button menu
var prefix = "sbd_";
prefix = getUniquePrefix(prefix, "_"); // Puts new ID before "_"

var newButtonsProperties = { //You can simply add new properties here
	customName: ['Name for the custom UI button', 'Customize!'],
	theme: 		['Path to theme file (instead of using selection)', ''],
	recipe: 	['Path to recipe file (instead of using properties)', ''],
	data: 		['Internal data', JSON.stringify({tooltip: 'Search according to variables set at properties.\n(Shift + L. Click to set theme)\t -> None\n(Ctrl + L. Click to set recipe)\t -> None\n(Shift + Ctrl + L. Click to set other config)', theme: 'None', recipe: 'None'})],
};
newButtonsProperties = {...SearchByDistance_properties, ...newButtonsProperties}; // Add default properties at the beginning to be sure they work 
setProperties(newButtonsProperties, prefix); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix); // And retrieve

// we change the default coordinates here to accommodate text
if (buttonOrientation === 'x') {buttonCoordinates.w -= 5;}

/*	
	Some button examples for "search_bydistance.js". Look at that file to see what they do.
*/

var newButtons = {
    SimilarUserSet: new SimpleButton(calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation === 'x' ? true : false).x, calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation === 'x' ? false : true).y, buttonCoordinates.w, buttonCoordinates.h, newButtonsProperties.customName[1], function (mask) {
		if (mask === MK_SHIFT) {
			createThemeMenu(this).btn_up(this.x, this.y + this.h);
		} else if (mask === MK_CONTROL) {
			createRecipeMenu(this).btn_up(this.x, this.y + this.h);
		} else if (mask === MK_CONTROL + MK_SHIFT) {
			createConfigMenu(this).btn_up(this.x, this.y + this.h);
		} else {
			let t0 = Date.now();
			let t1 = 0;
			if (this.buttonsProperties['customName'][1] === 'Customize!') {
				const new_name = utils.InputBox(window.ID, 'Enter button name. Then configure properties according to your liking (look for "' + this.prefix + '...").', window.Name + ': Search by Distance Customizable Button');
				if (!new_name.length) {
					return;
				} else {
					this.buttonsProperties.customName[1] = new_name;
					overwriteProperties(this.buttonsProperties); // Force overwriting
					this.text = new_name;
					const data = JSON.parse(this.buttonsProperties.data[1]);
					if (data.recipe === 'none') {
						window.ShowProperties();
					}
				}
			} else {
				do_searchby_distance({properties : this.buttonsProperties, theme: this.buttonsProperties.theme[1], recipe: this.buttonsProperties.recipe[1]}); // All set according to properties panel!
			}
			t1 = Date.now();
			console.log("Call to do_searchby_distance " + this.buttonsProperties.customName[1] + " took " + (t1 - t0) + " milliseconds.");
		}
	}, null, g_font, JSON.parse(newButtonsProperties.data[1]).tooltip, prefix, newButtonsProperties)
};
// Check if the button list already has the same button ID
for (var buttonName in newButtons) {
	if (buttons.hasOwnProperty(buttonName)) {
		// fb.ShowPopupMessage('Duplicated button ID (' + buttonName + ') on ' + window.Name);
		console.log('Duplicated button ID (' + buttonName + ') on ' + window.Name);
		Object.defineProperty(newButtons, buttonName + Object.keys(buttons).length, Object.getOwnPropertyDescriptor(newButtons, buttonName));
		delete newButtons[buttonName];
	}
}
buttons = {...buttons, ...newButtons};