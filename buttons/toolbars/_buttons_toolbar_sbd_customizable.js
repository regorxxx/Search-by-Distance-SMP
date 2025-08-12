'use strict';
//11/08/25

include('..\\..\\helpers\\buttons_xxx.js');
/* global buttonsBar:readable */
include('..\\..\\helpers\\helpers_xxx.js');
/* global folders:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global _isFile:readable */
include('..\\..\\helpers\\helpers_xxx_UI.js');
/* global RGB:readable */

//May be loaded along other buttons
try {window.DefinePanel('Merged SBD Custom Buttons bar', {author:'xxx'});} catch (e) {console.log('Merged SBD Custom Buttons bar loaded.');} // eslint-disable-line no-unused-vars

// Global toolbar color
buttonsBar.config.bToolbar = true; // Change this on buttons bars files to set the background color
buttonsBar.config.toolbarColor = RGB(211,218,237);


{	// Buttons
	let buttonsPath = [	 // Add here your buttons path
		folders.xxx + 'buttons\\buttons_search_by_distance_customizable.js',
		folders.xxx + 'buttons\\buttons_search_by_distance_customizable.js',
		folders.xxx + 'buttons\\buttons_search_by_distance_customizable.js',
		folders.xxx + 'buttons\\buttons_search_by_distance_customizable.js',
		folders.xxx + 'buttons\\buttons_search_by_distance_customizable.js',
		folders.xxx + 'buttons\\buttons_search_by_distance_customizable.js',
	];

	for (const path of buttonsPath) {
		if (_isFile(path)) {
			include(path, {always_evaluate: true});
		} else {
			console.log(path +' not loaded'); // DEBUG
		}
	}
	/*
		OR just add them manually:
		include(folders.xxx + 'buttons\\buttons_search_by_tags_combinations.js', {always_evaluate: true});
		...
	*/
	console.log('Buttons loaded: ' + buttonsBar.listKeys.flat(Infinity).join(', '));
}
