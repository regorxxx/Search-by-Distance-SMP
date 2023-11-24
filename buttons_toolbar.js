'use strict';
//24/11/23

/* Playlist Tools: Buttons Toolbar
	Loads any button found on the buttons folder. Just load this file and add your desired buttons via R. Click.
	Compatible with:
		- Search by Distance
		- Playlist Tools
		- Fingerprint Tools
		- ListenBrainz Tools
		...
	
	Loading single buttons scripts in a panel is allowed but not supported.
*/

var bLoadTags = true; // Note this must be added before loading helpers! See buttons_search_by_tags_combinations.js and search_same_by.js

{
	const dependencies = [
		'helpers\\buttons_xxx.js',
		'helpers\\helpers_xxx.js',
		'helpers\\helpers_xxx_foobar.js',
		'helpers\\helpers_xxx_properties.js',
		'helpers\\helpers_xxx_UI.js',
		'helpers\\helpers_xxx_file.js',
		'helpers\\helpers_xxx_input.js'
	];
	let bIncludeRel = true;
	try {include('..\\..\\helpers\\helpers_xxx_dummy.js');} catch(e) {bIncludeRel = false;}
	if (bIncludeRel) {dependencies.forEach((file) => {include('..\\..\\' + file);});}
	else {dependencies.forEach((file) => {include(file);});}
}
{
	const dependencies = [
		'helpers\\buttons_merged_menu.js'
	];
	let bIncludeRel = true;
	try {include('..\\helpers\\buttons_dummy.js');} catch(e) {bIncludeRel = false;}
	if (bIncludeRel) {dependencies.forEach((file) => {include('..\\' + file);});}
	else {dependencies.forEach((file) => {include('buttons\\' + file);});}
}

try {window.DefineScript('Playlist Tools: Buttons Bar', {author:'regorxxx', version, features: {drag_n_drop: false}});} catch (e) {} //May be loaded along other buttons

let barProperties = {
	name:				['Name of config json file', 'buttons_' + randomString(5), {func: isString}],
	toolbarColor: 		['Toolbar color', -1, {func: isInt}],
	textColor:	 		['Buttons\' text color', buttonsBar.config.textColor, {func: isInt}],
	firstPopup:			['Toolbar: Fired once', false, {func: isBoolean}],
	bShowId:			['Show Ids on tooltip', false, {func: isBoolean}],
	bBgButtons:			['Buttons with background', true, {func: isBoolean}],
	orientation:		['Toolbar orientation', 'x', {func: isString}],
	bReflow:			['Reflow according to width / height', false, {func: isBoolean}],
	bAlignSize:			['Align buttons according to size', true, {func: isBoolean}],
	scale:				['UI scale', _scale(0.7, false), {func: (v) => isFloat(v) || isInt(v)}],
	activeColor:		['Buttons\' active icon color', buttonsBar.config.activeColor, {func: isInt}],
	animationColors:	['Buttons\' animation colors', JSON.stringify(buttonsBar.config.animationColors), {func: isJSON}],
	bIconMode:			['Show only button\'s icons', false, {func: isBoolean}],
	bIconModeExpand:	['Expand to full button on hover', false, {func: isBoolean}],
	buttonColor:		['Buttons\' color', -1, {func: isInt}],
	transparency:		['Buttons\' transparency', 0, {func: isInt, range: [[0, 100]]}],
	offset:				['Buttons\' offset', JSON.stringify({button: {x: 0, y: 0}, text: {x: 0, y: 0}, icon: {x: 0, y: 0}}), {func: isJSON}],
	bFullSize:			['Full size buttons', false, {func: isBoolean}],
	hoverColor:			['Buttons\' hover color', buttonsBar.config.hoverColor, {func: isInt}],
	bDynHoverColor:		['Buttons\' hover dynamic color', true, {func: isBoolean}],
	bHoverGrad:			['Buttons\' hover gradient', true, {func: isBoolean}],
	bBorders:			['Buttons\' borders', true, {func: isBoolean}],
	bAutoUpdateCheck:	['Automatically check updates?', globSettings.bAutoUpdateCheck, {func: isBoolean}, globSettings.bAutoUpdateCheck],
	bLoadAsync:			['Asynchronous loading?', true, {func: isBoolean}],
};
Object.keys(barProperties).forEach(p => barProperties[p].push(barProperties[p][1]));
setProperties(barProperties);
barProperties = getPropertiesPairs(barProperties);

// Config at buttons_xxx.js
// Toolbar menu
buttonsBar.menu = () => {return createButtonsMenu(barProperties.name[1]);};
// Global toolbar color
buttonsBar.config.toolbarColor = barProperties.toolbarColor[1];
buttonsBar.config.bToolbar = buttonsBar.config.toolbarColor !== -1 ? true : false; // To set the background color
buttonsBar.config.partAndStateID = barProperties.bBgButtons[1] ? 1 : 6;
buttonsBar.config.textColor = barProperties.textColor[1];
buttonsBar.config.buttonColor = barProperties.buttonColor[1];
buttonsBar.config.hoverColor = barProperties.hoverColor[1];
buttonsBar.config.bDynHoverColor = barProperties.bDynHoverColor[1];
buttonsBar.config.bHoverGrad = barProperties.bHoverGrad[1];
buttonsBar.config.toolbarTransparency = barProperties.transparency[1];
buttonsBar.config.activeColor = barProperties.activeColor[1];
buttonsBar.config.animationColors = JSON.parse(barProperties.animationColors[1]);
buttonsBar.config.bBorders = barProperties.bBorders[1];
// Show Id on tooltips
buttonsBar.config.bShowID = barProperties.bShowId[1];
// Orientation
buttonsBar.config.orientation = barProperties.orientation[1];
// Icon-only mode
buttonsBar.config.bIconMode = barProperties.bIconMode[1];
buttonsBar.config.bIconModeExpand = barProperties.bIconModeExpand[1];
// Reflow
buttonsBar.config.bReflow = barProperties.bReflow[1];
// Align all widths and heights according to orientation
buttonsBar.config.bAlignSize = barProperties.bAlignSize[1];
// Tooltip at empty bar
buttonsBar.config.toolbarTooltip = 'R. Click to configure...\nHold R. Click to move buttons';
// Assign size and pos
buttonsBar.config.scale = barProperties.scale[1];
buttonsBar.config.offset = JSON.parse(barProperties.offset[1]);
buttonsBar.config.bFullSize = barProperties.bFullSize[1];

// First popup
if (!barProperties.firstPopup[1]) {
	buttonsBar.firstPopup = true; // For later use
	const readmePath = folders.xxx + 'helpers\\readme\\toolbar.txt';
	barProperties.firstPopup[1] = true;
	overwriteProperties(barProperties); // Updates panel
	const readme = _open(readmePath, utf8);
	if (readme.length) {fb.ShowPopupMessage(readme, 'Toolbar');}
}

// Load Buttons
function loadButtonsFile(bStartup = false) {
	let names = [];
	const file = folders.data + barProperties.name[1] + '.json';
	const presetPopup = () => {
		if (bStartup && !buttonsBar.firstPopup) {return false;}
		// Show popup with presets
		const presets = [
			{name: 'Playlist Tools', files: 
				['buttons_playlist_tools.js', 'buttons_playlist_tools_submenu_custom.js', 'buttons_playlist_tools_macros.js','buttons_playlist_tools_pool.js']},
			{name: 'Search by Distance', files: 
				['buttons_search_by_distance.js']},
			{name: 'Search by Distance (customizable)', files: 
				['buttons_search_by_distance_customizable.js', 'buttons_search_by_distance_customizable.js', 'buttons_search_by_distance_customizable.js','buttons_search_by_distance_customizable.js']},
			{name: 'Top Tracks', files: 
				['buttons_search_top_tracks.js', 'buttons_search_top_tracks_from_date.js', 'buttons_search_top_tracks_from_date.js']},
			{name: 'Library search', files:
				['buttons_search_by_tags_combinations.js', 'buttons_search_by_tags_queries.js', 'buttons_search_quicksearch.js']},
			{name: 'Playlist manipulation', files: 
				['buttons_playlist_remove_duplicates.js', 'buttons_playlist_filter.js', 'buttons_playlist_filter.js', 'buttons_playlist_history.js']},
			{name: 'Device priority', files: _isFile(folders.xxx + 'buttons\\buttons_others_device_selector.js')
				? ['buttons_others_device_priority.js', 'buttons_others_device_selector.js']
				: ['buttons_others_device_priority.js']
			},
			{name: 'ListenBrainz & Last.fm', files: 
				['buttons_listenbrainz_tools.js', 'buttons_lastfm_tools.js']},
			{name: 'Full (no Search by Distance)', files: 
				['buttons_playlist_tools.js', 'buttons_playlist_tools_submenu_custom.js','buttons_playlist_tools_macros.js', 'buttons_search_by_tags_combinations.js','buttons_playlist_remove_duplicates.js', 'buttons_playlist_filter.js','buttons_search_quicksearch.js']},
			{name: 'Full', files: 
				['buttons_playlist_tools.js', 'buttons_playlist_tools_submenu_custom.js','buttons_search_by_distance_customizable.js', 'buttons_search_by_distance_customizable.js','buttons_playlist_remove_duplicates.js', 'buttons_playlist_filter.js', 'buttons_search_quicksearch.js']},
			{name: 'Blank', files: []}
		].map((preset) => {return (preset.files.every((file) => _isFile(folders.xxx + 'buttons\\' + file)) ? preset : void(0));}).filter(Boolean);
		const input = Input.number('int positive', presets.length, 'Choose a preset (by number) from the following list, to load the toolbar with pre-defined buttons (they may be added/removed at any time later):\n' + presets.map((p, i) => '\t' + _b(i + 1) + ' ' + p.name).join('\n') + '\n\nCanceling will load a blank toolbar by default.', 'Toolbar: preset', 1, [(n) => n > 0 && n <= presets.length]);
		if (input == null) {return false;}
		names = presets[input - 1].files.map((path) => {return path.split('\\').pop();});
		_save(file, JSON.stringify(names, null, '\t'));
	}
	if (!_isFile(file)) {
		presetPopup();
	} else {
		const data = _jsonParseFileCheck(file, 'Buttons bar', window.Name, utf8);
		// Strip full path
		if (data) {names = data.map((path) => {return path.split('\\').pop();});}
		// Old buttons renamed
		[
			{from: 'buttons_lastfm_list.js', to: 'buttons_lastfm_tools.js'}
		].forEach((rename) => {
			const idx = names.indexOf(rename.from);
			while (names.indexOf(rename.from) !== -1) {
				names[idx] = rename.to;
			}
		});
		if (!isArrayEqual(data, names)) {_save(file, JSON.stringify(names, null, '\t'));} // Rewrite file for older versions
		if (!names.length) {presetPopup();}
	}
	buttonsPath = names.map((name) => {return folders.xxx + 'buttons\\' + name;});
	return buttonsPath.length;
}

const includeButton = (() => {
	const bProcessed = new Set();
	return function includeButton(buttonPath) {
		if (_isFile(buttonPath)) {
			include(buttonPath, {always_evaluate: true});
			const newKeys = [];
			Object.keys(buttonsBar.buttons).forEach((key) => {
				if (!bProcessed.has(key)) {
					bProcessed.add(key);
					newKeys.push(key);
				}
			});
			buttonsBar.listKeys.push(newKeys);
			window.Repaint();
		} else {
			console.log(buttonPath + ' not loaded');
		}
	}
})()

function includeButtons() {
	if (buttonsPath.length) {
		for (let i = 0; i < buttonsPath.length; i++) {includeButton(buttonsPath[i]);}
		console.log('Buttons loaded: ' + buttonsBar.listKeys.flat(Infinity).join(', '));
		return true;
	}
	return false;
}

function includeButtonsAsync(timeout = 100) {
	if (buttonsPath.length) {
		return Promise.serial(buttonsPath, includeButton, timeout)
			.then(() => {console.log('Buttons loaded: ' + buttonsBar.listKeys.flat(Infinity).join(', '));})
	}
	return Promise.resolve(false);
}

let buttonsPath = [];
if (barProperties.bLoadAsync[1]) {loadButtonsFile(true) && includeButtonsAsync();}
else {loadButtonsFile(true) && includeButtons()}

addEventListener('on_paint', (gr) => {
	if (!buttonsPath.length) {
		gr.GdiDrawText('L. Click to load a preset / R. Click to add buttons manually', _gdiFont(globFonts.standard.name, _scale(globFonts.standard.size)), 0xFF000000, 0, 0, window.Width, window.Height, DT_VCENTER | DT_CENTER | DT_END_ELLIPSIS | DT_CALCRECT | DT_NOPREFIX); // Font is being cached, no problems here...
	}
});

addEventListener('on_mouse_lbtn_up', (x, y, mask) => {
	!buttonsPath.length && loadButtonsFile() && includeButtons();
	window.Repaint();
});

// Update check
if (barProperties.bAutoUpdateCheck[1]) {
	{
		const dependencies = [
			'helpers\\helpers_xxx_web_update.js',
		];
		let bIncludeRel = true;
		try {include('..\\..\\helpers\\helpers_xxx_dummy.js');} catch(e) {bIncludeRel = false;}
		if (bIncludeRel) {dependencies.forEach((file) => {include('..\\..\\' + file);});}
		else {dependencies.forEach((file) => {include(file);});}
	}
	buttonsBar.getUpdateList().forEach((btn, i) => {
		setTimeout(checkUpdate, 120000 + 60000 * i, {
			...(btn.scriptName	? {scriptName:	btn.scriptName} : {}),
			...(btn.repository	? {repository:	btn.repository} : {}),
			...(btn.version		? {version:		btn.version} : {}),
			bDownload: globSettings.bAutoUpdateDownload, bOpenWeb: globSettings.bAutoUpdateOpenWeb
		});
	})
}