'use strict';

try { //May be loaded along other buttons
	window.DefinePanel('Search by Distance Customizable Button', {author:'xxx'});
	include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\buttons_xxx.js');
	var g_font = _gdiFont('Segoe UI', 12);
	var buttonCoordinates = {x: 0, y: 0, w: 98, h: 22};
	var buttonOrientation = 'x';
} catch (e) {
	buttonCoordinates = {x: 0, y: 0, w: buttonOrientation === 'x' ? 98 : buttonCoordinates.w , h: buttonOrientation === 'y' ? 22 : buttonCoordinates.h}; // Reset 
	console.log('Search by Distance Buttons loaded.');
}
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\search_bydistance.js'); // Load after buttons_xxx.js so properties are only set once
var prefix = "sbd_";
prefix = getUniquePrefix(prefix, "_"); // Puts new ID before "_"

var newButtonsProperties = { //You can simply add new properties here
	customName: ['Name for the custom UI button', 'Customize!']
};
newButtonsProperties = {...SearchByDistance_properties, ...newButtonsProperties}; // Add default properties at the beginning to be sure they work 
setProperties(newButtonsProperties, prefix); //This sets all the panel properties at once

// we change the default coordinates here to accommodate text
if (buttonOrientation === 'x') {buttonCoordinates.w -= 5;}

/*	
	Some button examples for "search_bydistance.js". Look at that file to see what they do.
*/

var newButtons = {
    SimilarUserSet: new SimpleButton(calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation === 'x' ? true : false).x, calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation === 'x' ? false : true).y, buttonCoordinates.w, buttonCoordinates.h, getProperties(newButtonsProperties, prefix)['customName'], function () {
		let t0 = Date.now();
		let t1 = 0;
		const properties = getPropertiesPairs(this.buttonsProperties, this.prefix);
		if (properties['customName'][1] === 'Customize!') {
			const new_name = utils.InputBox(window.ID, 'Enter button name. Then configure properties according to your liking (look for "' + this.prefix + '...").', window.Name + ': Search by Distance Customizable Button');
            if (!new_name.length) {
                return;
            } else {
				this.buttonsProperties['customName'][1] = new_name;
				setProperties(this.buttonsProperties, this.prefix, void(0), void(0), true); // Force overwriting
				window.ShowProperties(); // This also forces a reload if you press ok/apply, but pressing cancel doesn't! That would leave the button with the old name... even if the property is already set
				window.Reload(); // Forces redraw with new name
			}
		} else {
			do_searchby_distance({properties}); // All set according to properties panel!
		}
		t1 = Date.now();
		console.log("Call to do_searchby_distance " + getProperties(this.buttonsProperties, this.prefix)['customName'] + " took " + (t1 - t0) + " milliseconds.");
	}, null, g_font,'Search according to user set variables at properties panel', prefix, newButtonsProperties)
};
// Check if the button list already has the same button ID
for (var buttonName in newButtons) {
	if (buttons.hasOwnProperty(buttonName)) {
		// fb.ShowPopupMessage('Duplicated button ID (' + buttonName + ') on ' + window.Name);
		console.log('Duplicated button ID (' + buttonName + ') on ' + window.Name);
		Object.defineProperty(newButtons, buttonName + Object.keys(buttons).length, Object.getOwnPropertyDescriptor(newButtons, buttonName));
		delete newButtons[buttonName];
	}
}
buttons = {...buttons, ...newButtons};