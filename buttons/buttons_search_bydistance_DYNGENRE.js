'use strict';
//15/02/22

include('..\\helpers\\buttons_xxx.js');
include('..\\helpers\\helpers_xxx_properties.js');

try { //May be loaded along other buttons
	window.DefinePanel('Search by Distance Buttons', {author:'xxx'});
	var g_font = _gdiFont('Segoe UI', 12);
	var buttonCoordinates = {x: 0, y: 0, w: 98, h: 22};
} catch (e) {
	buttonCoordinates = {x: 0, y: 0, w: buttonsBar.config.buttonOrientation === 'x' ? 98 : buttonCoordinates.w , h: buttonsBar.config.buttonOrientation === 'y' ? 22 : buttonCoordinates.h}; // Reset 
	console.log('Search by Distance (DYNGENRE) Buttons loaded.');
}
include('..\\main\\search_bydistance.js'); // Load after buttons_xxx.js so properties are only set once
include('..\\helpers\\helpers_xxx_properties.js');
var prefix = 'sbd';
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
};
newButtonsProperties = {...SearchByDistance_properties, ...newButtonsProperties}; // Add default properties at the beginning to be sure they work 
delete newButtonsProperties.genreWeight;
delete newButtonsProperties.styleWeight;
delete newButtonsProperties.moodWeight;
delete newButtonsProperties.keyWeight;
delete newButtonsProperties.dateWeight;
delete newButtonsProperties.bpmWeight;
delete newButtonsProperties.dateRange;
delete newButtonsProperties.bpmRange;
delete newButtonsProperties.probPick;
delete newButtonsProperties.scoreFilter;
delete newButtonsProperties.method;
delete newButtonsProperties.sbd_max_graph_distance;
delete newButtonsProperties.dyngenreWeight;
delete newButtonsProperties.dyngenreRange;
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
{
	const properties = getPropertiesPairs(newButtonsProperties, prefix, 0);
	buttonsBar.list.push(properties);
	// Update cache with user set tags
	doOnce('Update SBD cache', debounce(updateCache, 3000))({properties});
}

// we change the default coordinates here to accommodate text
if (buttonsBar.config.buttonOrientation === 'x') {buttonCoordinates.w += 5;}

/*	
	Some button examples for 'search_bydistance.js'. Look at that file to see what they do. Note you must explicitly pass all arguments to make them work, since it's within buttons framework. If we were calling do_searchby_distance() outside buttons, it would work with default arguments.
*/

addButton({
	NearestTracks: new themedButton(buttonCoordinates, 'Nearest Tracks', function () {
		let t0 = Date.now();
		let t1 = 0;
		const args = {genreWeight: 15, styleWeight: 10, moodWeight: 5, keyWeight: 10, dateWeight: 25, bpmWeight: 5,  dateRange: 15, 
					bpmRange: 25, probPick: 100, scoreFilter: 70, method: 'DYNGENRE', dyngenreWeight: 25, dyngenreRange: 1,
					properties: getPropertiesPairs(this.buttonsProperties, this.prefix, 0)}; // Mix with only nearest tracks
		do_searchby_distance(args); 
		t1 = Date.now();
		console.log('Call to do_searchby_distance NearestTracks took ' + (t1 - t0) + ' milliseconds.');
	}, null, g_font,'Random mix with only nearest tracks', prefix, newButtonsProperties, chars.wand),
	
	SimilarTracks: new themedButton(buttonCoordinates, 'Similar Tracks', function () {
		let t0 = Date.now();
		let t1 = 0;
		const args = {genreWeight: 15, styleWeight: 5, moodWeight: 5, keyWeight: 5, dateWeight: 25, bpmWeight: 5,  dateRange: 15, 
					bpmRange: 25, probPick: 100, scoreFilter: 65, method: 'DYNGENRE', dyngenreWeight: 10, dyngenreRange: 1,
					properties: getPropertiesPairs(this.buttonsProperties, this.prefix, 0)}; // Mix a bit varied on styles/genres most from the same decade
		do_searchby_distance(args);
		t1 = Date.now();
		console.log('Call to do_searchby_distance SimilarTracks took ' + (t1 - t0) + ' milliseconds.');
	}, null, g_font,'Random mix a bit varied on styles (but similar genre), most tracks within a decade', prefix, newButtonsProperties, chars.wand),
	
    SimilarGenres: new themedButton(buttonCoordinates, 'Similar Genres', function () {
		let t0 = Date.now();
		let t1 = 0;
		const args = {genreWeight: 0, styleWeight: 5, moodWeight: 15, keyWeight: 10, dateWeight: 25, bpmWeight: 5,  dateRange: 15, 
					bpmRange: 25, probPick: 100, scoreFilter: 60, method: 'DYNGENRE', dyngenreWeight: 10, dyngenreRange: 2,
					properties: getPropertiesPairs(this.buttonsProperties, this.prefix, 0)}; // Mix even more varied on styles/genres most from the same decade
		do_searchby_distance(args);
		t1 = Date.now();
		console.log('Call to do_searchby_distance SimilarGenres took ' + (t1 - t0) + ' milliseconds.');
	}, null, g_font,'Random mix even more varied on styles/genres, most tracks within a decade', prefix, newButtonsProperties, chars.wand),
	
	SimilarMood: new themedButton(buttonCoordinates, 'Similar Mood', function () {
		let t0 = Date.now();
		let t1 = 0;
		const args = {genreWeight: 0, styleWeight: 5, moodWeight: 15, keyWeight: 10, dateWeight: 0, bpmWeight: 5, dateRange: 100,
					bpmRange: 25, probPick: 100, scoreFilter: 50, method: 'DYNGENRE', dyngenreWeight: 5, dyngenreRange: 4,
					properties: getPropertiesPairs(this.buttonsProperties, this.prefix, 0)}; // Mix with different genres but same mood from any date
		do_searchby_distance(args);
		t1 = Date.now();
		console.log('Call to do_searchby_distance SimilarMood took ' + (t1 - t0) + ' milliseconds.');
	}, null, g_font,'Random mix with different genres but same mood from any date', prefix, newButtonsProperties, chars.wand),
});