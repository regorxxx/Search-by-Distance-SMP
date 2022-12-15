'use strict';
//15/12/22

/*
	Just a bar of the same search by distance buttons customizable! So every instance can have its own name and do its own different thing.
*/

include('..\\..\\helpers\\buttons_xxx.js');
include('..\\..\\helpers\\helpers_xxx.js');
include('..\\..\\helpers\\helpers_xxx_foobar.js');
include('..\\..\\helpers\\helpers_xxx_UI.js');

try {window.DefinePanel('Merged SBD Custom Buttons bar', {author:'xxx'});} catch (e) {console.log('Merged SBD Custom Buttons bar loaded.');}  //May be loaded along other buttons

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
	
	for (let i = 0; i < buttonsPath.length; i++) {
		if (_isFile(buttonsPath[i])) {
			include(buttonsPath[i], {always_evaluate: true});
		} else {
			console.log(buttonsPath[i] +' not loaded');
		}
	}
	/* 	
		OR just add them manually:
		include(folders.xxx + 'buttons\\buttons_search_by_tags_combinations.js', {always_evaluate: true});
		...
	*/
	console.log('Buttons loaded: ' + buttonsBar.listKeys.flat(Infinity).join(', '));
}
