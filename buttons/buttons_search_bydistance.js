'use strict';

try { //May be loaded along other buttons
	window.DefinePanel('Search by Distance Buttons', {author:'xxx'});
	include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\buttons_xxx.js');
	var g_font = _gdiFont('Segoe UI', 12);
	var buttonCoordinates = {x: 0, y: 0, w: 98, h: 22};
	var buttonOrientation = 'x';
} catch (e) {
	buttonCoordinates = {x: 0, y: 0, w: buttonOrientation == 'x' ? 98 : buttonCoordinates.w , h: buttonOrientation == 'y' ? 22 : buttonCoordinates.h}; // Reset 
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
if (buttonOrientation == 'x') {buttonCoordinates.w -= 5;}

/*	
	Some button examples for "search_bydistance.js". Look at that file to see what they do. Note you must explicitly pass all arguments to make them work, since it's within buttons framework. If we were calling do_searchby_distance() outside buttons, it would work with default arguments.
*/

var newButtons = {
    NearestTracks: new SimpleButton(calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation == 'x' ? true : false).x, calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation == 'x' ? false : true).y, buttonCoordinates.w, buttonCoordinates.h, "Nearest Tracks", function () {
		let t0 = Date.now();
		let t1 = 0;
		const args = {genreWeight: 15, styleWeight: 10, moodWeight: 5, keyWeight: 10, dateWeight: 25, bpmWeight: 5,  dateRange: 15, 
					bpmRange: 25, probPick: 100, scoreFilter: 70, sbd_max_graph_distance: 50, method: 'GRAPH', 
					properties: getPropertiesPairs(this.buttonsProperties, this.prefix)} // Mix with only nearest tracks
		do_searchby_distance(args); 
		t1 = Date.now();
		console.log("Call to do_searchby_distance NearestTracks took " + (t1 - t0) + " milliseconds.");
	}, null, g_font,'Random mix with only nearest tracks', prefix, newButtonsProperties),
	
	SimilarTracks: new SimpleButton(calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation == 'x' ? true : false).x, calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation == 'x' ? false : true).y, buttonCoordinates.w, buttonCoordinates.h, "Similar Tracks", function () {
		let t0 = Date.now();
		let t1 = 0;
		const args = {genreWeight: 15, styleWeight: 10, moodWeight: 5, keyWeight: 5, dateWeight: 25, bpmWeight: 5,  dateRange: 15, 
					bpmRange: 25, probPick: 100, scoreFilter: 60, sbd_max_graph_distance: 85, method: 'GRAPH', 
					properties: getPropertiesPairs(this.buttonsProperties, this.prefix)} // Mix a bit varied on styles/genres most from the same decade
		do_searchby_distance(args);
		t1 = Date.now();
		console.log("Call to do_searchby_distance SimilarTracks took " + (t1 - t0) + " milliseconds.");
	}, null, g_font,'Random mix a bit varied on styles (but similar genre), most tracks within a decade', prefix, newButtonsProperties),
	
    SimilarGenres: new SimpleButton(calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation == 'x' ? true : false).x, calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation == 'x' ? false : true).y, buttonCoordinates.w, buttonCoordinates.h, "Similar Genres", function () {
		let t0 = Date.now();
		let t1 = 0;
		const args = {genreWeight: 0, styleWeight: 5, moodWeight: 15, keyWeight: 10, dateWeight: 25, bpmWeight: 5,  dateRange: 15, 
					bpmRange: 25, probPick: 100, scoreFilter: 60, sbd_max_graph_distance: 150, method: 'GRAPH', 
					properties: getPropertiesPairs(this.buttonsProperties, this.prefix)} // Mix even more varied on styles/genres most from the same decade
		do_searchby_distance(args);
		t1 = Date.now();
		console.log("Call to do_searchby_distance SimilarGenres took " + (t1 - t0) + " milliseconds.");
	}, null, g_font,'Random mix even more varied on styles/genres, most tracks within a decade', prefix, newButtonsProperties),
	
	SimilarMood: new SimpleButton(calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation == 'x' ? true : false).x, calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation == 'x' ? false : true).y, buttonCoordinates.w, buttonCoordinates.h, "Similar Mood", function () {
		let t0 = Date.now();
		let t1 = 0;
		const args = {genreWeight: 0, styleWeight: 5, moodWeight: 15, keyWeight: 10, dateWeight: 0, bpmWeight: 5, 
					bpmRange: 25, probPick: 100, scoreFilter: 50, sbd_max_graph_distance: 400, method: 'GRAPH', 
					properties: getPropertiesPairs(this.buttonsProperties, this.prefix)} // Mix with different genres but same mood from any date
		do_searchby_distance(args);
		t1 = Date.now();
		console.log("Call to do_searchby_distance SimilarMood took " + (t1 - t0) + " milliseconds.");
	}, null, g_font,'Random mix with different genres but same mood from any date', prefix, newButtonsProperties),
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