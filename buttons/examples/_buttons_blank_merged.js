'use strict';
//17/02/22

/*
	-> EDIT
*/

include('..\\..\\helpers\\buttons_xxx.js');
include('..\\..\\helpers\\helpers_xxx.js');
include('..\\..\\helpers\\helpers_xxx_foobar.js');
include('..\\..\\helpers\\helpers_xxx_UI.js');

try {window.DefinePanel('EDIT', {author:'xxx'});} catch (e) {console.log('EDIT');}  //May be loaded along other buttons

// Global toolbar color
buttonsBar.config.bToolbar = false; // Change this on buttons bars files to set the background color
buttonsBar.config.toolbarColor = RGB(211,218,237);


{	// Buttons
	let buttonsPath = [	 // Add here your buttons path
						folders.xxx + 'buttons\\examples\\_buttons_blank.js',  //+15 w
						folders.xxx + 'buttons\\examples\\_buttons_blank.js'  //+15 w
	];
	for (let i = 0; i < buttonsPath.length; i++) {
		if (utils.IsFile(buttonsPath[i])) {
			include(buttonsPath[i], {always_evaluate: true});
		} else {
			console.log(buttonsPath[i] + ' not loaded');
		}
	}
}
