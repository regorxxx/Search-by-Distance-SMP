'use strict';
//15/02/22

/* 
	-> EDIT
 */
 
include('..\\..\\helpers\\buttons_xxx.js');
// include('EDIT.js');
include('..\\..\\helpers\\helpers_xxx_properties.js');
var prefix = 'EDIT';
 
try { //May be loaded along other buttons
	window.DefinePanel('EDIT', {author:'xxx'});
	var g_font = _gdiFont('Segoe UI', 12);
	var buttonCoordinates = {x: 0, y: 0, w: 98, h: 22};
	buttonsBar.config.buttonOrientation = 'x';
} catch (e) {
	buttonCoordinates = {x: 0, y: 0, w: buttonsBar.config.buttonOrientation === 'x' ? 98 : buttonCoordinates.w , h: buttonsBar.config.buttonOrientation === 'y' ? 22 : buttonCoordinates.h}; // Reset 
	console.log('Remove EDIT loaded.');
}
prefix = getUniquePrefix(prefix, '_'); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
	EDIT: ['EDIT', 0],
};
// newButtonsProperties = {...defaultProperties, ...newButtonsProperties}; // Add default properties at the beginning to be sure they work 
setProperties(newButtonsProperties, prefix); //This sets all the panel properties at once

// we change the default coordinates here to accommodate text for x orientation. Apply this on vertical as global!
// if (buttonsBar.config.buttonOrientation === 'x') {buttonCoordinates.w += 0;}
// if (buttonsBar.config.buttonOrientation === 'y') {buttonCoordinates.h += 0;}

addButton({
	OneButton: new themedButton(buttonCoordinates, 'EDIT', function () {
		let t0 = Date.now();
		let t1 = 0;
		let [EDIT] = getPropertiesValues(this.buttonsProperties, this.prefix); // This gets all the panel properties at once
		// EDIT();
		t1 = Date.now();
		console.log('Call to EDIT took ' + (t1 - t0) + ' milliseconds.');
	}, null, g_font,'EDIT', prefix, newButtonsProperties),
});