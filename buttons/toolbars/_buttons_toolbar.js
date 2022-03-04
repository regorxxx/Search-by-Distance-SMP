'use strict';
//22/02/22

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

{
	const dependencies = [
		'helpers\\buttons_xxx.js',
		'helpers\\helpers_xxx.js',
		'helpers\\helpers_xxx_foobar.js',
		'helpers\\helpers_xxx_properties.js',
		'helpers\\helpers_xxx_UI.js',
		'helpers\\helpers_xxx_file.js',
		'helpers\\buttons_merged_menu.js'];
	let bIncludeRel = true;
	try {include('..\\..\\helpers\\helpers_xxx_dummy.js');} catch(e) {bIncludeRel = false;}
	if (bIncludeRel) {dependencies.forEach((file) => {include('..\\..\\' + file);});}
	else {dependencies.forEach((file) => {include(file);});}
}

try {	window.DefinePanel('Playlist Tools: Buttons Bar', {author:'XXX', version: '3.0.0', features: {drag_n_drop: false}});} catch (e) {console.log('Merged Buttons loaded.');} //May be loaded along other buttons

let barProperties = { //You can simply add new properties here
	name:				['Name of config json file', 'buttons_' + randomString(5)],
	toolbarColor: 		['Toolbar color', -1],
	textColor:	 		['Buttons\' text color', buttonsBar.config.textColor],
	firstPopup:			['Toolbar: Fired once', false],
	bShowId:			['Show Ids on tooltip', false],
	bBgButtons:			['Buttons with background', true],
	orientation:		['Toolbar orientation', 'x'],
	bReflow:			['Reflow according to width / height', false],
	bAlignSize:			['Align buttons according to size', true],
	scale:				['UI scale', _scale(0.7, false)],
};
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
	const readme = _open(readmePath, convertCharsetToCodepage('UTF-8'));
	if (readme.length) {fb.ShowPopupMessage(readme, 'Toolbar');}
}

// Config at buttons_xxx.js
// Global toolbar color
buttonsBar.config.toolbarColor = barProperties.toolbarColor[1];
buttonsBar.config.bToolbar = buttonsBar.config.toolbarColor !== -1 ? true : false; // Change this on buttons bars files to set the background color
buttonsBar.config.textColor = barProperties.textColor[1];
// Show Id on tooltips
buttonsBar.config.bShowID = barProperties.bShowId[1]; // Change this on buttons bars files to set the background color
// Orientation
buttonsBar.config.orientation = barProperties.orientation[1];
// Reflow
buttonsBar.config.bReflow = barProperties.bReflow[1];
// Align all widths and heights according to orientation
buttonsBar.config.bAlignSize = barProperties.bAlignSize[1];
// Tooltip at empty bar
buttonsBar.config.toolbarTooltip = 'R. Click to configure...\nHold R. Click to move buttons';
// Assign size
buttonsBar.config.scale =  barProperties.scale[1];

// Buttons
const buttonsPathDef = [	 // Add here your buttons names
					'buttons_search_same_by.js',
					'buttons_playlist_remove_duplicates.js',
					'buttons_search_bydistance.js',
					'buttons_search_bydistance_customizable.js',
					'buttons_playlist_tools.js',
					'buttons_playlist_history.js',
				].map((name) => {return folders.xxx + 'buttons\\' + name;});
let buttonsPath = [...buttonsPathDef];

loadButtonsFile();
{
	const bProcessed = new Set();
	for (let i = 0; i < buttonsPath.length; i++) {
		if (_isFile(buttonsPath[i])) {
			include(buttonsPath[i], {always_evaluate: true});
			const newKeys = [];
			Object.keys(buttonsBar.buttons).forEach((key) => {
				if (!bProcessed.has(key)) {
					bProcessed.add(key);
					newKeys.push(key);
				}
			});
			buttonsBar.listKeys.push(newKeys);
		} else {
			console.log(buttonsPath[i] +' not loaded');
		}
	}
}

function loadButtonsFile() {
	let names = [];
	const file = folders.data + barProperties.name[1] + '.json';
	if (!_isFile(file)) {
		names = buttonsPath.map((path) => {return path.split('\\').pop();});
		_save(file, JSON.stringify(names, null, '\t'));
	} else {
		const data = _jsonParseFileCheck(file, 'Buttons bar', window.Name, convertCharsetToCodepage('UTF-8'));
		if (data) {names = data.map((path) => {return path.split('\\').pop();});}
		if (!isArrayEqual(data, names)) {_save(file, JSON.stringify(names, null, '\t'));} // Rewrite file for older versions with full paths TODO
	}
	buttonsPath = names.map((name) => {return folders.xxx + 'buttons\\' + name;});
}