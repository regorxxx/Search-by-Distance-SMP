﻿'use strict';

/*
	Just a bar of the same search by distance buttons customizable! So every instance can have its own name and do its own different thing.
*/

include('..\\..\\helpers\\buttons_xxx.js');
include('..\\..\\helpers\\helpers_xxx.js');
include('..\\..\\helpers\\helpers_xxx_foobar.js');
include('..\\..\\helpers\\helpers_xxx_UI.js');

try { //May be loaded along other buttons
	window.DefinePanel('Merged SBD Custom Buttons bar', {author:'xxx'});
	var g_font = _gdiFont('Segoe UI', 12);
	var buttonCoordinates = {x: 0, y: 0, w: 98, h: 22};
	var buttonOrientation = 'x';
} catch (e) {
	buttonCoordinates = {x: 0, y: 0, w: buttonOrientation === 'x' ? 98 : buttonCoordinates.w , h: buttonOrientation === 'y' ? 22 : buttonCoordinates.h}; // Reset 
	console.log('Merged SBD Custom Buttons bar loaded.');
}

// Global width - Height overrides
buttonCoordinates.w += 0; // Only works for 'y' orientation
buttonCoordinates.h += 0; //For 'x' orientation

// Global toolbar color
bToolbar = true; // Change this on buttons bars files to set the background color
toolbarColor = RGB(211,218,237);


{	// Buttons
	let buttonsPath = [	 // Add here your buttons path
						folders.xxx + 'buttons\\buttons_search_bydistance_customizable.js',
						folders.xxx + 'buttons\\buttons_search_bydistance_customizable.js',
						folders.xxx + 'buttons\\buttons_search_bydistance_customizable.js',
						folders.xxx + 'buttons\\buttons_search_bydistance_customizable.js',
						folders.xxx + 'buttons\\buttons_search_bydistance_customizable.js',
						folders.xxx + 'buttons\\buttons_search_bydistance_customizable.js',
						];
	
	for (let i = 0; i < buttonsPath.length; i++) {
		if ((isCompatible('1.4.0') ? utils.IsFile(buttonsPath[i]) : utils.FileTest(buttonsPath[i], "e"))) {
			include(buttonsPath[i], {always_evaluate: true});
		} else {
			console.log(buttonsPath[i] +' not loaded');
		}
	}
	
	/* 	
		OR just add them manually:
		include(folders.xxx + 'buttons\\buttons_search_same_style.js', {always_evaluate: true});
		...
	*/
}
