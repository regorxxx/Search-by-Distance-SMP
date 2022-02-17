'use strict';
//17/02/22

/* 
	-> EDIT
 */
 
include('..\\..\\helpers\\buttons_xxx.js');
// include('EDIT.js');
include('..\\..\\helpers\\helpers_xxx_properties.js');
var prefix = 'EDIT';
 
try {window.DefinePanel('EDIT', {author:'xxx'});} catch (e) {console.log('Remove EDIT loaded.');}  //May be loaded along other buttons
prefix = getUniquePrefix(prefix, '_'); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
	EDIT: ['EDIT', 0],
};
// newButtonsProperties = {...defaultProperties, ...newButtonsProperties}; // Add default properties at the beginning to be sure they work 
setProperties(newButtonsProperties, prefix); //This sets all the panel properties at once

addButton({
	OneButton: new themedButton({x: 0, y: 0, w: 98, h: 22}, 'EDIT', function () {
		let t0 = Date.now();
		let t1 = 0;
		let [EDIT] = getPropertiesValues(this.buttonsProperties, this.prefix); // This gets all the panel properties at once
		// EDIT();
		t1 = Date.now();
		console.log('Call to EDIT took ' + (t1 - t0) + ' milliseconds.');
	}, null, _gdiFont('Segoe UI', 12), 'EDIT', prefix, newButtonsProperties),
});