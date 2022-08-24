'use strict';
//24/08/22
/*
	You can merge sets of merged buttons too, mix them with individual buttons files, etc.
	The same than buttons, you can include multiple times the same merged bar.
*/

include('..\\..\\helpers\\buttons_xxx.js');
include('..\\..\\helpers\\helpers_xxx.js');
include('..\\..\\helpers\\helpers_xxx_foobar.js');
include('..\\..\\helpers\\helpers_xxx_UI.js');

try {window.DefinePanel('Merged Buttons bar', {author:'xxx'});} catch (e) {console.log('Merged Buttons loaded.');}  //May be loaded along other buttons

// Global toolbar color
buttonsBar.config.bToolbar = true; // Change this on buttons bars files to set the background color
buttonsBar.config.toolbarColor = RGB(211,218,237);

{	// Buttons
	let buttonsPath = [	 // Add here your buttons path
						folders.xxx + 'buttons\\examples\\_buttons_example_merged.js',
						folders.xxx + 'buttons\\examples\\_buttons_example.js',
						folders.xxx + 'buttons\\examples\\_buttons_example_merged.js',
						];
	for (let i = 0; i < buttonsPath.length; i++) {
		if (utils.IsFile(buttonsPath[i])) {
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
}
