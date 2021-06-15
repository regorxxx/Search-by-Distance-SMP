'use strict';

/*
	This is an example of how merging buttons works. Just include them...
	
	-	Note every button file has a line that adds the buttons from the file to the glonal list, so it always merges the new buttons with the previous ones.
			buttons = {...buttons, ...newButtons};
		
	-	First included will be first (left or top), last ones will be last (right or bottom).
		
	-	You can add copies of the same button just by including them multiple times. As is, without touching anything on the button files.
		All IDs and property names are automatically changed accordingly (with a count). That means, copies of buttons will be differents instances of
		the same button for all purposes (with their own properties).
		
	-	You can change orientation for all buttons just by changing 'x' to 'y'. Width (w) and height (h) can also be set.
		
	-	You can change size for specific buttons too but beware: if changing width on 'y' orientation, then you should just change the global width.
		Otherwise, you will have some buttons with the default width and others will be wider... and that looks really weird on vertical orientation.
		Same applies to height for horizontal orientation, better to apply the same height to all buttons, not specific ones, for 'x' orientation.
		
	-	Instead of adding buttons at the end with include functions, you can add your own paths to the array. If some file doesn't exist, then it just gets
		skipped, instead of throwing and error! This is better than try/catch, since it doesn't omit coding errors while including them...
*/

var bLoadTags = true; // Note this must be added before loading helpers! See buttons_search_same_by.js and search_same_by.js
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\buttons_xxx.js');
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\helpers_xxx.js');
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\helpers_xxx_foobar.js');
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\helpers_xxx_properties.js');
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\helpers_xxx_UI.js');
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\helpers_xxx_file.js');
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\buttons_merged_menu.js');

try { //May be loaded along other buttons
	window.DefinePanel('Merged Buttons bar', {author:'xxx'});
	var g_font = _gdiFont('Segoe UI', 12);
	var buttonCoordinates = {x: 0, y: 0, w: 98, h: 22};
	var buttonOrientation = 'x';
} catch (e) {
	buttonCoordinates = {x: 0, y: 0, w: buttonOrientation === 'x' ? 98 : buttonCoordinates.w , h: buttonOrientation === 'y' ? 22 : buttonCoordinates.h}; // Reset 
	console.log('Merged Buttons loaded.');
}

// Global width - Height overrides
buttonCoordinates.w += 40; // Only works for 'y' orientation
buttonCoordinates.h += 0; //For 'x' orientation

let barProperties = { //You can simply add new properties here
	name: ['Name og config json file', 'buttons_' + randomString(5)],
	toolbarColor: ['Toolbar color', -1],
};
// newButtonsProperties = {...defaultProperties, ...newButtonsProperties}; // Add default properties at the beginning to be sure they work 
setProperties(barProperties); //This sets all the panel properties at once
barProperties = getPropertiesPairs(barProperties);

buttonsBar.menu = () => {
	return createButtonsMenu(barProperties.name[1]);
};

// Global toolbar color
toolbarColor = barProperties.toolbarColor[1];
bToolbar = toolbarColor !== -1 ? true : false; // Change this on buttons bars files to set the background color

// Buttons
let buttonsPath = [	 // Add here your buttons path
					fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\buttons\\buttons_search_same_by.js',  //+15 w
					fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\buttons\\buttons_remove_duplicates.js',  //+25 w
					fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\buttons\\buttons_search_bydistance.js',
					fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\buttons\\buttons_search_bydistance_customizable.js',
					fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\buttons\\buttons_tags_automation.js',
					fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\buttons\\buttons_playlist_tools.js',
				];

loadButtons();

for (let i = 0; i < buttonsPath.length; i++) {
	if ((isCompatible('1.4.0') ? utils.IsFile(buttonsPath[i]) : utils.FileTest(buttonsPath[i], "e"))) {
		include(buttonsPath[i], {always_evaluate: true});
	} else {
		console.log(buttonsPath[i] +' not loaded');
	}
}

function loadButtons() {
	const data = _jsonParseFile(fb.ProfilePath + 'js_data\\' + barProperties.name[1] + '.json');
	if (data) {buttonsPath = data;}
}