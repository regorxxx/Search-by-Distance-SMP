'use strict';
//17/02/22

/* 
	Button example. Just configure the -things commented-.
	Look other js buttons files to add things like tooltips/button names changing according to panel properties
	or more complex settings.
	Look at '_buttons_merged.js' to merge different buttons at once with 0 coding.
	
	Note: Within the same file ALL BUTTONS ID's MUST BE DIFFERENT TO WORK:
		var newButtons = {
			BUTTON_IDA: ...,
			BUTTON_IDB: ...,
			...
		};
		
	All buttons have the same structure. The things you need to edit are marked with *
	-(Other scripts included) (*) (optional)
	-Prefix name (*)
	-Try/catch initialization (*) (only panel name)
	-Prefix Unique
	-New Buttons properties (*)
	-(New Buttons width/height) (*) (optional)
	-New Buttons function (*)
	-Check buttons names to fix duplicates on global list
	-Add to global buttons list
	-(Other scripts inline) (*) (optional)
 */

include('..\\..\\helpers\\buttons_xxx.js');
include('..\\..\\helpers\\helpers_xxx_properties.js');
  
// YOUR SCRIPTS
// include('YOURSCRIPT.js');
var prefix = 'YOUR PREFIX'; // -EDIT HERE PROPERTY PANEL PREFIX-
 
// THIS IS STANDARD STRUCTURE FOR ALL BUTTONS
try {
	window.DefinePanel('BUTTON NAME', {author:'xxx'}); // -EDIT HERE BUTTON NAME-
} catch (e) {
	console.log('Remove Duplicates Button loaded.');
}
prefix = getUniquePrefix(prefix, '_'); // Puts new ID before '_'

// YOU ADD THIS PART TO ANY NEW BUTTON IF YOU WANT TO SET VARIABLES AT PROPERTIES PANEL
var newButtonsProperties = { //You can simply add new properties here
	propertyA: ['This is property A', 'A value'],
	propertyB: ['This is property B', 'Hello world'],
};
// newButtonsProperties = {...defaultProperties, ...newButtonsProperties}; // Add default properties (if needed) at the beginning to be sure they work 
setProperties(newButtonsProperties, prefix); //This sets all the panel properties at once

// THIS IS ALSO THE SAME STRUCTURE FOR ALL BUTTONS FILES, YOU JUST CHANGE THE NAMES...
addButton({ // -EDIT You can add here as many buttons as you want-
	OneButton: new themedButton({x: 0, y: 0, w: 98, h: 22}, 'BUTTON NAME 1', function () {  // -EDIT HERE BUTTON NAME-
		let t0 = Date.now();
		let t1 = 0;
		let [textA , textB] = getPropertiesValues(this.buttonsProperties, this.prefix); // This gets all the panel properties at once
																						// Note there would be more if we merged it with defaultProperties
        yourFunctionHereOne(textA); // And uses that as variable for your function
		t1 = Date.now();
		console.log('Call to yourFunctionHere took ' + (t1 - t0) + ' milliseconds.');  // -EDIT HERE CONSOLE OUTPUT-
	}, null, _gdiFont('Segoe UI', 12), 'TOOLTIP TEXT', prefix, newButtonsProperties),  // -EDIT TOOLTIP TEXT-
	
	TwoButton: new themedButton({x: 0, y: 0, w: 98, h: 22}, 'BUTTON NAME 2', function () {  // -EDIT HERE BUTTON NAME-
		let t0 = Date.now();
		let t1 = 0;
		let [textA , textB] = getPropertiesValues(this.buttonsProperties, this.prefix); // This gets all the panel properties at once
																						// Note there would be more if we merged it with defaultProperties
        yourFunctionHereTwo(textB); // And uses that as variable for your function
		t1 = Date.now();
		console.log('Call to yourFunctionHere took ' + (t1 - t0) + ' milliseconds.');  // -EDIT HERE CONSOLE OUTPUT-
	}, null, _gdiFont('Segoe UI', 12), 'TOOLTIP TEXT', prefix, newButtonsProperties),  // -EDIT TOOLTIP TEXT-
});

// AND HERE YOU PUT YOUR SCRIPT...
// OR YOU COULD SIMPLY 'INCLUDE IT' AT THE TOP
function yourFunctionHereOne(text) { // -EDIT HERE WHATEVER YOU WANT TO DO WITH THE BUTTON 1-
	fb.ShowPopupMessage(text,'Button 1 popup');
}

function yourFunctionHereTwo(text) { // -EDIT HERE WHATEVER YOU WANT TO DO WITH THE BUTTON 2-
	fb.ShowPopupMessage(text,'Button 2 popup');
}