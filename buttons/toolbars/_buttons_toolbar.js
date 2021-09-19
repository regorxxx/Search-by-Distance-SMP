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
try {
	include('..\\..\\helpers\\buttons_xxx.js');
	include('..\\..\\helpers\\helpers_xxx.js');
	include('..\\..\\helpers\\helpers_xxx_foobar.js');
	include('..\\..\\helpers\\helpers_xxx_properties.js');
	include('..\\..\\helpers\\helpers_xxx_UI.js');
	include('..\\..\\helpers\\helpers_xxx_file.js');
	include('..\\..\\helpers\\buttons_merged_menu.js');
} catch (e) {
	include('helpers\\buttons_xxx.js');
	include('helpers\\helpers_xxx.js');
	include('helpers\\helpers_xxx_foobar.js');
	include('helpers\\helpers_xxx_properties.js');
	include('helpers\\helpers_xxx_UI.js');
	include('helpers\\helpers_xxx_file.js');
	include('helpers\\buttons_merged_menu.js');
}

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
	name:			['Name of config json file', 'buttons_' + randomString(5)],
	toolbarColor: 	['Toolbar color', -1],
	firstPopup:		['Toolbar: Fired once', false]
};
// newButtonsProperties = {...defaultProperties, ...newButtonsProperties}; // Add default properties at the beginning to be sure they work 
setProperties(barProperties); //This sets all the panel properties at once
barProperties = getPropertiesPairs(barProperties);

// Toolbar menu
buttonsBar.menu = () => {
	return createButtonsMenu(barProperties.name[1]);
};

// First popup
if (!barProperties.firstPopup[1]) {
	const readmePath = folders.xxx + 'helpers\\readme\\toolbar.txt';
	barProperties.firstPopup[1] = true;
	overwriteProperties(barProperties); // Updates panel
	if ((isCompatible('1.4.0') ? utils.IsFile(readmePath) : utils.FileTest(readmePath, 'e'))) {
		const readme = utils.ReadTextFile(readmePath, 65001);
		if (readme.length) {fb.ShowPopupMessage(readme, 'Toolbar');}
	}
}

// Global toolbar color
toolbarColor = barProperties.toolbarColor[1];
bToolbar = toolbarColor !== -1 ? true : false; // Change this on buttons bars files to set the background color

// Tooltip at empty bar
toolbarTooltip = 'Shift + L. Click to configure...';

// Buttons
const buttonsPathDef = [	 // Add here your buttons path
					folders.xxx + 'buttons\\buttons_search_same_by.js',  //+15 w
					folders.xxx + 'buttons\\buttons_remove_duplicates.js',  //+25 w
					folders.xxx + 'buttons\\buttons_search_bydistance.js',
					folders.xxx + 'buttons\\buttons_search_bydistance_customizable.js',
					folders.xxx + 'buttons\\buttons_playlist_tools.js',
					folders.xxx + 'buttons\\buttons_playlist_history.js',
				];
let buttonsPath = [...buttonsPathDef];

loadButtons();
if (!_isFile()) {
	const names = buttonsPath.map((path) => {return path.split('\\').pop();});
	_save(folders.data + barProperties.name[1] + '.json', JSON.stringify(names, null, 3));
}

for (let i = 0; i < buttonsPath.length; i++) {
	if ((isCompatible('1.4.0') ? utils.IsFile(buttonsPath[i]) : utils.FileTest(buttonsPath[i], "e"))) {
		include(buttonsPath[i], {always_evaluate: true});
	} else {
		console.log(buttonsPath[i] +' not loaded');
	}
}

function loadButtons() {
	if (_isFolder(folders.data)) {
		const data = _jsonParseFile(folders.data + barProperties.name[1] + '.json', convertCharsetToCodepage('UTF-8'));
		if (data) { // TODO: remove splitting after a few releases
			const names = data.map((path) => {return path.split('\\').pop();});
			_save(folders.data + barProperties.name[1] + '.json', JSON.stringify(names, null, 3));
			buttonsPath = names.map((name) => {return folders.xxx + 'buttons\\' + name;});
		}
	}
}