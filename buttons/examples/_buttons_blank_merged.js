'use strict';
//03/02/22

/*
	-> EDIT
*/

include('..\\..\\helpers\\buttons_xxx.js');
include('..\\..\\helpers\\helpers_xxx.js');
include('..\\..\\helpers\\helpers_xxx_foobar.js');
include('..\\..\\helpers\\helpers_xxx_UI.js');

try { //May be loaded along other buttons
	window.DefinePanel('EDIT', {author:'xxx'});
	var g_font = _gdiFont('Segoe UI', 12);
	var buttonCoordinates = {x: 0, y: 0, w: 98, h: 22};
	buttonsBar.config.buttonOrientation = 'x';
} catch (e) {
	buttonCoordinates = {x: 0, y: 0, w: buttonsBar.config.buttonOrientation === 'x' ? 98 : buttonCoordinates.w , h: buttonsBar.config.buttonOrientation === 'y' ? 22 : buttonCoordinates.h}; // Reset 
	console.log('EDIT');
}

// Global width - Height overrides
buttonCoordinates.w += 0; // Only works for 'y' orientation
buttonCoordinates.h += 0; //For 'x' orientation

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
